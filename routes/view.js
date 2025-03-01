const express = require('express')
const axios = require('axios')
const dayjs = require('dayjs')
const db_controller_map = require('../db/db_controller_map')

const router = express.Router()
router.get('/', async (req, res) => {
    const { prompt_id, client_id, ai_sever_host, ai_sever_port, frontend } = req.query

    try {
        const db_query_list = await db_controller_map[frontend].getOssPhotoList(client_id, prompt_id)
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
            const output_list = Object.values(response.data[prompt_id].outputs)
            const output_image_list = handleComfyHistoryRawOutput(output_list)
            if (output_image_list.length == 0) {
                return res.status(200).json({ data: [] })
            }

            try {
                const oss_image_list = await handleUpOSS(output_image_list, ai_sever_host, ai_sever_port)
                db_controller_map[frontend].insertOssPhoto(client_id, prompt_id, oss_image_list)
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
 * @param {String} ai_server_host 生成图的绘图任务对应的算力服务器地址
 * @param {String} ai_server_port 生成图的绘图任务对应的算力服务器端口
 * @return {Promise} 在线图片信息列表
 */
async function handleUpOSS(output_image_list, ai_server_host, ai_server_port) {
    const file_name_list = []
    for (let i = 0; i < output_image_list.length; i++) {
        if (output_image_list[i].type == 'output') {
            file_name_list.push(output_image_list[i].filename)
        }
    }

    return new Promise((resolve, reject) => {
        axios({
            url: `${process.env.OSS_URL}/SaveImgToOSS`, // save-oss
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                fileNames: file_name_list, // dotnet-oss-arg need delete
                clientId: 'cuz', // dotnet-oss-arg need delete

                // go-oss
                // file_name_list,
                // ai_server_host,
                // ai_server_port,
            }),
        })
            .then((result) => {
                // dotnet-oss
                const image_list = []
                for (let i = 0; i < file_name_list.length; i++) {
                    let image_info = {}
                    image_info['filename'] = file_name_list[i]
                    image_info['oss_url'] = result.data.data[i]

                    image_list.push(image_info)
                }

                resolve(image_list)
                //

                // go-oss
                // resolve(result.data)
            })
            .catch(() => {
                reject()
            })
    })
}

/**
 * @desc 处理Comfy history返回的原生output list, 获得待上传OSS的图片信息列表
 * @param {Array} output_list Comfy history返回的原生output list
 * @return {Array} 图片信息列表
 */
function handleComfyHistoryRawOutput(output_list) {
    const output_image_list = []
    output_list.forEach((node) => {
        if (node.images) {
            for (let i = 0; i < node.images.length; i++) {
                if (node.images[i].type == 'output') {
                    output_image_list.push(node.images[i])
                }
            }
        }
    })

    return output_image_list
}
