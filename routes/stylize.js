/**
 * @author zhangluo
 * @useage 风格化图像生成接口
 */
const express = require('express')
const axios = require('axios')
const dayjs = require('dayjs')
const FormData = require('form-data')
const fs = require('fs')
const multer = require('multer')
const path = require('path')

const allowed_mime_types = ['image/jpeg', 'image/png']

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 10 },
    fields: [
        { name: 'stylized_image', maxCount: 1 },
        { name: 'bg_image', maxCount: 1 },
    ],
})
const router = express.Router()

router.post(
    '/',
    upload.fields([{ name: 'stylized_image' }, { name: 'bg_image' }]),
    (req, res, next) => {
        let images_list = []
        Object.keys(req.files).forEach((key) => {
            const image_list = req.files[key]
            if (key == 'stylized_image' && image_list.length == 0) return res.status(401).send({ statusCode: 401, message: '请上传风格化必需图片' })
            if ((key == 'stylized_image' || key == 'bg_image') && image_list.length >= 1) {
                req[key] = image_list[0]
            }
            images_list = [...images_list, ...image_list]
        })

        images_list.forEach((image) => {
            if (!allowed_mime_types.includes(image.mimetype)) {
                return res.status(400).send({
                    statusCode: 400,
                    message: '目前仅支持图片类型 jpeg/png',
                })
            }
        })

        uploadImageToServer(images_list)
            .then((resp) => {
                req.images_list = images_list
                next()
            })
            .catch((err) => {
                console.log(`[${dayjs()}][file download fail in AIGC server]`)
                res.status(err.response.status).json({
                    code: err.code,
                    statusCode: err.response.status,
                    statusText: err.response.statusText,
                    url: err.response.config.url,
                    message: '文件下载失败, 请检查算力端服务是否正常',
                })
            })
    },
    (req, res) => {
        if (!req.body.prompt) {
            return res.status(401).send({ status: 401, message: '请输入prompt' })
        } else if (!req.body.client) {
            return res.status(401).send({ status: 401, message: '请输入client' })
        }

        const { client, prompt } = req.body
        let workflow_obj = undefined
        try {
            const workflow_json = fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`))
            workflow_obj = JSON.parse(workflow_json.toString())
        } catch (err) {
            return res.status(404).send({ status: 404, path: err.path, message: '未找到对应的工作流, 请检查prompt是否正确' })
        }

        if (prompt !== 'PortraitStylizationWithBackground') {
            const originalname = req.images_list[0].originalname
            try {
                const load_image_node_index = handleSearchLoadImageNode(workflow_obj)
                if (load_image_node_index.length > 0) {
                    load_image_node_index.forEach((index) => {
                        workflow_obj[index]['inputs']['image'] = originalname
                    })
                }
            } catch (err) {
                return res.status(404).send({ status: 404, message: '未找到LoadImage节点, 请检查算力端提供的工作流是否正确' })
            }
        } else if (req.images_list.length == 2 && prompt == 'PortraitStylizationWithBackground') {
            const stylized_image_originalname = req.images_list[0].originalname
            const bg_image_originalname = req.images_list[1].originalname
            try {
                const load_image_node_index = handleSearchLoadImageNode(workflow_obj)
                if (load_image_node_index.length > 0) {
                    load_image_node_index.forEach((index) => {
                        if (index == '17') {
                            workflow_obj[index]['inputs']['image'] = stylized_image_originalname
                        } else if (index == '131') {
                            workflow_obj[index]['inputs']['image'] = bg_image_originalname
                        }
                    })
                }
            } catch (err) {
                return res.status(404).send({ status: 404, message: '未找到LoadImage节点, 请检查算力端提供的工作流是否正确' })
            }
        }

        const aigc_prompt = {
            client: client,
            prompt: workflow_obj,
        }
        axios({
            url: `${process.env.AIGC_BASE_URL}/prompt`,
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(aigc_prompt),
        })
            .then((resp) => {
                return res.status(200).send(resp.data)
            })
            .catch((err) => {
                console.log(`[${dayjs()}][prompt fail]`)
                res.status(500).json({
                    statusCode: 500,
                    message: '派发任务失败, 请检查算力端服务是否开启',
                })
            })
    }
)

function handleSearchLoadImageNode(workflow_obj) {
    const workflow_node_index_list = Object.keys(workflow_obj)
    const load_image_node_index_list = []
    for (let i = 0; i < workflow_node_index_list.length; i++) {
        const node = workflow_obj[workflow_node_index_list[i]]
        if (node.class_type == 'LoadImage') {
            load_image_node_index_list.push(workflow_node_index_list[i])
        }
    }

    return load_image_node_index_list
}

async function uploadImageToServer(images_list) {
    const promises = []
    images_list.map((image) => {
        const img_form_data = new FormData()
        if (Buffer.isBuffer(image.buffer)) {
            img_form_data.append(`image`, image.buffer, { filename: image.originalname, contentType: image.mimetype })
            const promise = axios({
                url: `${process.env.AIGC_BASE_URL}/upload/image`,
                method: 'post',
                headers: img_form_data.getHeaders(),
                data: img_form_data,
            })
            promises.push(promise)
        }
    })
    return Promise.all(promises)
}

module.exports = router
