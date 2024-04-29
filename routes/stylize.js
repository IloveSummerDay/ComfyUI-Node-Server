const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const allowedMimeTypes = ['image/jpeg', 'image/png'];

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 10 } });
const router = express.Router();

router.post('/', upload.single('image'), (req, res, next) => {
    // req.file.buffer  <--- A Buffer of the entire file
    // console.log('///1 req', req.body, req.file);
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send({
            statusCode: 400,
            message: '目前仅支持图片类型 jpeg/png'
        });
    }
    // 检查图片是否上传
    if (!req.file) return res.status(401).send({ statusCode: 401, message: '请上传图片' })
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
        res.status(500).json({
            statusCode: 500,
            message: '文件下载失败, 请检查算力端服务是否开启'
        })
        // res.sendStatus(err.response.status)
    })
}, (req, res) => {
    // console.log('///2 stylize', req.body, req.file);
    const { prompt, client } = req.body;
    const { originalname } = req.file
    let workflowOBJ
    try {
        const workflowJSON = fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`))
        workflowOBJ = JSON.parse(workflowJSON.toString())
    } catch (error) {
        return res.status(402).send({ status: 402, message: '未找到对应的工作流, 请检查prompt是否正确' })
    }
    try {
        const loadImageNodeIndex = handleSearchLoadImageNode(workflowOBJ)
        // console.log('///loadImageNodeIndex', loadImageNodeIndex);
        workflowOBJ[loadImageNodeIndex]["inputs"]['image'] = originalname // hash_image_name
        // console.log("workflowOBJ[loadImageNodeIndex]", workflowOBJ[loadImageNodeIndex]);
    } catch (error) {
        return res.status(403).send({ status: 403, message: '未找到LoadImage节点, 请检查算力端提供的工作流是否正确' })
    }

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
    }).then(resp => {
        console.log('///派发任务成功');
        return res.status(200).send(resp.data)
    }).catch(error => {
        console.log('///派发任务失败');
        res.status(500).json({
            statusCode: 500,
            message: '派发任务失败, 请检查算力端服务是否开启'
        })

    });
})


function handleSearchLoadImageNode(workflowOBJ) {
    // console.log(Object.keys(workflowOBJ));
    for (let i = 0; i < Object.keys(workflowOBJ).length; i++) {
        const node = workflowOBJ[Object.keys(workflowOBJ)[i]]
        if (node.class_type == "LoadImage") {
            // console.log(node);
            return Object.keys(workflowOBJ)[i]
        }
    }
}


module.exports = router;