const express = require('express');
const axios = require('axios');
const dayjs = require('dayjs')
const viewoss_admin = require('../db/view');
const router = express.Router();
const noImgInfo = {
    statusCode: 201,
    outputs: {},
    message: 'no image in this prompt_id',
    backend: "node-zhangluo"
}
const waitingInfo = {
    statusCode: 102,
    outputs: {},
    message: 'Processing image,  Please wait',
    backend: "node-zhangluo"
}

router.get('/', async (req, res, next) => {
    if (!req.query.prompt_id) {
        return res.status(401).send({ status: 401, message: '请输入prompt_id' })
    }
    else if (!req.query.client_id) {
        return res.status(401).send({ status: 401, message: '请输入client_id' })
    }

    /**
     * @desc query db
     */
    const { prompt_id, client_id } = req.query;
    const db_query_res = await viewoss_admin.getOssPhotos(client_id, prompt_id)
    if (db_query_res.is_err) {
        return res.status(500).json({
            statusCode: 500,
            message: "connect db error, please check db connection",
            error: db_query_res.error
        })
    }
    else if (db_query_res.is_fetch) {
        return res.status(200).json({
            statusCode: 200,
            data: db_query_res.data,
            source: 'db'
        })
    }
    else {
        /**
         * @desc 数据库中没有，则去AIGC Server原应用中查询
         * @return resp.data[prompt_id].outputs 
         * @var 工作流中每个结点输出的 images[]
         * @example  { '75': { images: [ [Object] ] } }
         * @warning 正在生成时 resp.data[prompt_id] === undefined
         */
        const imgs_already = []
        axios({ url: `${process.env.AIGC_BASE_URL}/history/${prompt_id}` })
            .then(async (resp) => {
                if (!resp.data[prompt_id] || !resp.data[prompt_id].outputs ||
                    Object.values(resp.data[prompt_id].outputs).length == 0) {
                    return res.status(200).json(waitingInfo)
                }

                const outputs = Object.values(resp.data[prompt_id].outputs)
                outputs.forEach(node => {
                    if (node.images) {
                        for (let i = 0; i < node.images.length; i++) {
                            if (node.images[i].type == "output") {
                                imgs_already.push(node.images[i]);
                            }
                        }
                    }

                });

                if (imgs_already.length == 0) return res.status(200).json(noImgInfo)

                const imgs_online = await handleUpOSS(imgs_already, client_id)
                if (imgs_online.statusCode !== 200) return res.status(500).json(imgs_online)
                if (Object.keys(imgs_online.data).length == 0) return res.status(200).json(noImgInfo)

                const db_set_res = await viewoss_admin.setOssPhotos(client_id, prompt_id, imgs_online.data)
                if (db_set_res.statusCode > 200 && db_set_res.statusCode <= 500) {
                    return res.status(db_set_res.statusCode).json({ message: db_set_res.message })
                }

                return res.status(200).json(imgs_online)
            }).catch(error => {
                console.log(`[${dayjs()}][view fail in aigc_server]`)
                next({
                    message: "Node 请求 AIGC_Server 预览时出错",
                    error
                })
            })
    }

})

module.exports = router;

/**
 * @desc 该任务队列中所生成的图片, 存储到OSS, 返回图片在线地址
 * @param {Array} imgs_already 
 * @return {Array} 图片在线地址
 */
async function handleUpOSS(imgs_already, client_id) {
    const file_names = []
    const oss_map = {}
    for (let i = 0; i < imgs_already.length; i++) {
        imgs_already[i].type == "output" ? file_names.push(imgs_already[i].filename) : null
    }

    return axios(`${process.env.OSS_URL}/SaveImgToOSS`, {
        method: 'post',
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            fileNames: file_names,
            clientId: client_id
        })
    }).then(result => {
        for (let i = 0; i < file_names.length; i++) {
            oss_map[file_names[i]] = result.data.data[i]
        }

        return {
            statusCode: result.data.statusCode,
            data: oss_map,
            source: 'aliyun oss'
        }
    }).catch(error => {
        return {
            statusCode: 500,
            message: '请求OSS在线地址出错, OSS没有成功返回(200)',
            error
        }
    })
}