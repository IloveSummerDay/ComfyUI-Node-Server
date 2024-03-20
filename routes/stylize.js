const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv').config({ path: './.env' });
const allowedMimeTypes = ['image/jpeg', 'image/png'];

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.post('/', upload.single('image'), (req, res, next) => {
    // req.file.buffer  <--- A Buffer of the entire file
    // console.log('///1', req.body, req.file);
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send('目前仅支持图片类型 jpeg/png');
    }
    fs.writeFileSync(path.join(__dirname, '../uploads', 'temp.' + req.file.originalname.split('.')[1]), req.file.buffer);
    let imgFormData = new FormData()
    imgFormData.append("image", fs.createReadStream(path.join(__dirname, '../uploads',
        'temp.' + req.file.originalname.split('.')[1])), { filename: req.file.originalname, contentType: req.file.mimetype })

    axios({
        url: `${process.env.AIGC_BASE_URL}/upload/image`,
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data: imgFormData
    }).then(resp => {
        console.log('///文件下载成功');
        next()

    }).catch(err => {
        console.log('///文件下载失败');
        res.sendStatus(err.response.status)
    })
}, (req, res) => {
    // console.log('///2 stylize', req.body, req.file);
    const { prompt, client } = req.body;
    const { originalname } = req.file
    const workflowJSON = fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`))
    const workflowOBJ = JSON.parse(workflowJSON.toString())
    workflowOBJ["13"]["inputs"]['image'] = originalname // hash_image_name

    const aigc_prompt = {
        client: client,
        prompt: workflowOBJ,
    }
    axios({
        url: `${process.env.AIGC_BASE_URL}/prompt`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(aigc_prompt)
    })
        .then(resp => {
            console.log('///派发任务成功');
            res.status(200).send(resp.data)
        })
        .catch(error => {
            console.log('///派发任务失败');
            res.status(400).send('服务器执行过程中出错')
        });
})




module.exports = router;