const express = require('express');
const axios = require('axios');
const ossadmin = require('../db/oss');
const router = express.Router();
const noImgInfo = {
    statusCode: 201,
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

router.get('/', async (req, res, next) => {
    const { prompt_id, client_id } = req.query;
    let imgs_already = []
    /**
     * @desc 查询数据库
     * - 若没有，则请求 oss接口且存储在数据库
     * - 若有，则直接使用数据库查询结果
     */
    const db_queryRes = await ossadmin.getOssPhotos(client_id, prompt_id)
    // return res.json({ "数据库查询结果": db_queryRes })
    if (db_queryRes.isFetch && Object.keys(db_queryRes).length > 0) {
        return res.status(200).json({
            statusCode: 200,
            data: db_queryRes.data,
            message: null,
            source: 'db'
        })
    }
    else if (!db_queryRes.isFetch && Object.keys(db_queryRes).length == 0) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: "数据库oss查询失败，请检查数据库连接",
            error: db_queryRes.error
        })
    }
    /**
     * @returns resp.data[prompt_id].outputs 
     * @desc 工作流中每个结点输出的 images[]
     * @example  { '75': { images: [ [Object] ] } }
     * @warning 正在生成时 resp.data[prompt_id] === undefined
     */
    return axios({ url: `${process.env.AIGC_BASE_URL}/history/${prompt_id}` })
        .then(async (resp) => {
            // return res.json(resp.data[prompt_id])

            if (!resp.data[prompt_id] || !resp.data[prompt_id].outputs ||
                Object.values(resp.data[prompt_id].outputs).length == 0) {
                return res.status(200).json(waitingInfo)
            }
            // return res.json(resp.data[prompt_id].outputs)

            // 获取 type="output" 的所有图片
            const outputs = Object.values(resp.data[prompt_id].outputs)
            outputs.forEach(node => {
                if (!node.images) return
                for (let i = 0; i < node.images.length; i++) {
                    if (node.images[i].type == "output") {
                        imgs_already.push(node.images[i]);
                    }
                }
            });
            if (imgs_already.length == 0) return res.status(200).json(noImgInfo)
            // return res.json({ "此次任务生成图列表": imgs_already })

            // OSS 上传
            const imgs_online = await handleUpOSS(imgs_already, client_id)
            if (imgs_online.statusCode !== 200) return res.status(500).json(imgs_online)
            // return res.json(imgs_online)

            // 使用OSS成功结果 存储到数据库 更新表
            // imgs_online.data - filename(key) : oss_url(value)
            const db_setRes = await ossadmin.setOssPhotos(client_id, prompt_id, imgs_online.data)
            if (db_setRes.statusCode > 200 && db_setRes.statusCode <= 500) {
                return res.status(db_setRes.statusCode).json({ message: db_setRes.message })
            }
            // return res.json({ "数据库插入结果": db_setRes })

            // 返回结果 return oss images of the client in this prompt
            if (Object.keys(imgs_online.data).length == 0) {
                return res.status(200).json(noImgInfo)
            } else { console.log('///// 预览图片成功'); return res.status(200).json(imgs_online) }
        }).catch(error => {
            next({
                ...errInfo,
                api: req.originalUrl,
                method: req.method,
                message: "服务器处理预览请求的接口出错，/view接口整体有误，需联系后端人员谨慎查找!",
                error
            })
        })
})
module.exports = router;

/**
 * @desc 该任务队列中所生成的图片，存储到OSS，返回图片在线地址
 * @param {Array} imgs_already 
 * @return {Array} 图片在线地址
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
    // console.log("OSS result: \n", result.data);

    if (result.data.statusCode !== 200) return { ...errInfo, ...result.data, message: '服务器请求OSS存储出错' }
    for (let i = 0; i < fileNames.length; i++) {
        ossMap[fileNames[i]] = result.data.data[i]
    }

    return {
        statusCode: result.data.statusCode,
        data: ossMap,
        message: result.data.message,
        source: 'aliyun oss'
    }

}