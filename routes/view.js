const express = require('express')
const axios = require('axios')
const dayjs = require('dayjs')
const dbController = require('../db/db_controller')

const router = express.Router()

router.get('/', async (req, res, next) => {
    const { prompt_id, client_id, ai_sever_host, ai_sever_port } = req.query

    try {
        const db_query_list = await dbController.getOssPhotoList(client_id, prompt_id)
        if (db_query_list.length > 0) {
            return res.status(200).json({
                data: db_query_list,
                source: 'db',
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: '数据库请求失败，请检查数据库连接状态',
        })
    }

    /**
     * @desc 数据库中没有，则去AIGC Server应用中查询
     * @return response.data[prompt_id].outputs
     * @var 工作流中每个结点输出的 images[]
     * @example  { '75': { images: [ [Object] ] } }
     * @warning 正在生成时 response.data[prompt_id] === undefined
     */
    axios({ url: `http://${ai_sever_host}:${ai_sever_port}/history/${prompt_id}` })
        .then(async (response) => {
            if (!response.data[prompt_id] || !response.data[prompt_id].outputs || Object.values(response.data[prompt_id].outputs).length == 0) {
                return res.status(200).json({
                    data: [],
                    message: '图片生成中，请等待',
                })
            }

            const output_image_list = []
            const outputs = Object.values(response.data[prompt_id].outputs)
            outputs.forEach((node) => {
                if (node.images) {
                    for (let i = 0; i < node.images.length; i++) {
                        if (node.images[i].type == 'output') {
                            output_image_list.push(node.images[i])
                        }
                    }
                }
            })

            try {
                const oss_image_list = await handleUpOSS(output_image_list, client_id)
                const db_insert_success = await dbController.insertOssPhoto(client_id, prompt_id, oss_image_list)

                return res.status(200).json({ data: oss_image_list, source: 'aliyun oss' })
            } catch (error) {
                res.status(502).json({
                    message: '上传OSS图片在线地址或插入数据库操作出错',
                })
            }
        })
        .catch(() => {
            console.warn(`[${dayjs()}][view fail in aigc_server]`)
            res.status(502).json({
                message: 'Node 请求 AIGC_Server 预览时出错',
            })
        })
})

module.exports = router

/**
 * @desc 该任务队列中所生成的图片, 存储到OSS, 返回图片在线地址
 * @param {Array} output_image_list 待上传oss的图片列表
 * @param {String} client_id 用户名
 * @return {Promise} 在线图片信息列表
 */
async function handleUpOSS(output_image_list, client_id) {
    if (output_image_list.length == 0) {
        return
    }

    const file_name_list = []
    for (let i = 0; i < output_image_list.length; i++) {
        if (output_image_list[i].type == 'output') {
            file_name_list.push(output_image_list[i].filename)
        }
    }

    return new Promise((resolve, reject) => {
        axios({
            url: `${process.env.OSS_URL}/SaveImgToOSS`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                fileNames: file_name_list,
                clientId: client_id,
            }),
        })
            .then((result) => {
                const image_list = []
                for (let i = 0; i < file_name_list.length; i++) {
                    let image_info = {}
                    image_info['filename'] = file_name_list[i]
                    image_info['oss_url'] = result.data.data[i]

                    image_list.push(image_info)
                }

                resolve(image_list)
            })
            .catch(() => {
                reject()
            })
    })
}
