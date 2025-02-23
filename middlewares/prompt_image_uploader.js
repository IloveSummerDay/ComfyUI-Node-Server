const dayjs = require('dayjs')
const FormData = require('form-data')
const axios = require('axios')

const prompt_image_uploader = (req, res, next) => {
    const promises = []
    req.body.file_image_list.map((image) => {
        if (Buffer.isBuffer(image.buffer)) {
            const image_form_data = new FormData()
            image_form_data.append('image', image.buffer, { filename: image.originalname, contentType: image.mimetype })

            const promise = axios({
                url: `http://${req.body.ai_sever_host}:${req.body.ai_sever_port}/upload/image`,
                method: 'post',
                headers: image_form_data.getHeaders(),
                data: image_form_data,
            })

            promises.push(promise)
        }
    })

    Promise.all(promises)
        .then(() => {
            next()
        })
        .catch((err) => {
            console.warn(`[${dayjs()}][file download fail in AIGC server]`)
            return res.status(502).json({
                code: err.code,
                message: '文件下载失败, 请检查算力端服务是否正常',
            })
        })
}

module.exports = prompt_image_uploader
