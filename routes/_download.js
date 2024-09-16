const express = require('express');
const FormData = require('form-data');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios')
const path = require('path');
const router = express.Router();

const allowedMimeTypes = ['image/jpeg', 'image/png'];
const AIGCSever = process.env.AIGC_BASE_URL;
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/', upload.single('image'), (req, res, next) => {
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send('目前仅支持图片类型 jpeg/png');
    }
    fs.writeFileSync(path.join(__dirname, '../uploads', 'temp.' + req.file.originalname.split('.')[1]), req.file.buffer);
    let imgFormData = new FormData()
    imgFormData.append("image", fs.createReadStream(path.join(__dirname, '../uploads', 'temp.' + req.file.originalname.split('.')[1])), { filename: req.file.originalname })

    axios({
        url: `${AIGCSever}/upload/image`,
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data: imgFormData
    }).then(resp => {
        next()
    }).catch(err => {
        res.sendStatus(err.response.status)
    })

});

module.exports = router