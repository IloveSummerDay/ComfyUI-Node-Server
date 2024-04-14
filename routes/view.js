const express = require('express');
const axios = require('axios');
const router = express.Router();
const noImgInfo = {
    statusCode: 200,
    outputs: {},
    message: '此次任务无产图',
    backend: "node-zl"
}
const waitingInfo = {
    statusCode: 400,
    outputs: {},
    message: '目前图片生成中，请稍侯',
    backend: "node-zl"
}
const errInfo = {
    statusCode: 500,
    message: "服务器内部错误",
    backend: "node-zl"
}

router.get('/', (req, res) => {
    // try {
    const { prompt_id, client_id } = req.query;
    let imgs_already = []
    axios({ url: `${process.env.AIGC_BASE_URL}/history/${prompt_id}` }).then(async (resp) => {
        /**
         * @returns resp.data[prompt_id].outputs 
         * @desc 工作流中每个结点输出的 images[]
         * @example  { '75': { images: [ [Object] ] } }
         * @warning 正在生成时 resp.data[prompt_id] === undefined
         */
        // return res.json(resp.data[prompt_id])
        if (!resp.data[prompt_id] || !resp.data[prompt_id].outputs) {
            return res.status(200).json(waitingInfo)
        }
        // return res.json(resp.data[prompt_id].outputs)
        const outputs = Object.values(resp.data[prompt_id].outputs).length == 0 ? (() => { res.status(200).json(waitingInfo); return })() : Object.values(resp.data[prompt_id].outputs)

        outputs.forEach(node => {
            if (!node.images) return
            for (let i = 0; i < node.images.length; i++) {
                if (node.images[i].type == "output") {
                    imgs_already.push(node.images[i]);
                }
            }
        });

        imgs_already.length == 0 ? (() => { return res.status(200).json(noImgInfo) })() : null
        // return res.json({ "此次任务生成图列表": imgs_already })
        const imgs_online = await handleUpOSS(imgs_already, client_id)
        if (imgs_online.statusCode !== 200) return res.status(500).json(imgs_online)
        // return res.json(imgs_online)
        // return oss images of the client in this prompt
        Object.keys(imgs_online.data).length == 0 ? (() => { return res.status(200).json(noImgInfo) })() :
            (() => { res.status(200).json(imgs_online); console.log('///// 预览图片成功'); })()
    }).catch(err => {
        res.status(500).json({ ...errInfo, message: "服务器处理预览请求出错，/view接口整体有误，需谨慎查找!" })
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
        /**
         * @var imgs_already[i].type
         * @desc 生成过程中产出的图片类型 output || temp 
         */
        imgs_already[i].type == "output" ? fileNames.push(imgs_already[i].filename) : null
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
    // console.log("OSS result: ", result.data);

    if (result.data.statusCode !== 200) return { ...errInfo, ...result.data, message: '服务器请求OSS存储出错' }
    for (let i = 0; i < fileNames.length; i++) {
        ossMap[fileNames[i]] = result.data.data[i]
    }

    return {
        statusCode: result.data.statusCode,
        data: ossMap,
        message: result.data.message,
    }

}