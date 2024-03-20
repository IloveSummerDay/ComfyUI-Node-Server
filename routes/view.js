const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv').config({ path: './.env' });
const router = express.Router();
const AIGCSever = process.env.AIGC_BASE_URL;

router.get('/', (req, res) => {
    const { prompt_id, client_id } = req.query;
    let imgs_already = []

    axios({ url: `${AIGCSever}/history/${prompt_id}` }).then(async (resp) => {
        const outputs = Object.values(resp.data[prompt_id].outputs).length == 0 ? res.status(200).json({
            statusCode: 400,
            data: {},
            message: "目前图片生成中，请稍侯",
        }) : Object.values(resp.data[prompt_id].outputs)

        outputs.forEach(node => {
            for (let i = 0; i < node.images.length; i++) {
                imgs_already.push(node.images[i])
            }
        });
        // console.log('///此次任务生成图列表', imgs_already);
        const imgs_online = await handleUpOSS(imgs_already, client_id)
        res.status(200).json(imgs_online) // return oss images of the client in this prompt
    }).catch((err) => {
        res.status(200).json({
            statusCode: 400,
            data: {},
            message: "目前图片生成中，请稍侯",
        })
    })
})
module.exports = router;

/**
 * 
 * @param {Array} imgs_already 
 * @return {Array} 图片在线地址
 * @desc 该任务队列中所生成的图片，存储到OSS后，返回图片在线地址
 */
async function handleUpOSS(imgs_already, client_id) {
    let fileNames = []
    let ossMap = {}
    for (let i = 0; i < imgs_already.length; i++) {
        fileNames.push(imgs_already[i].filename)
    }
    const result = await axios(`${process.env.OSS_URL}/SaveImgToOSS`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            fileNames: fileNames,
            clientId: client_id
        })
    })
    for (let i = 0; i < fileNames.length; i++) {
        ossMap[fileNames[i]] = result.data.data[i]
    }

    return {
        statusCode: result.data.statusCode,
        data: ossMap,
        message: result.data.message,
    }

}