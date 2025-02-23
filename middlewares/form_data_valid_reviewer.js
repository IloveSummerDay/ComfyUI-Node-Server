/**
 * @add req.body["fieldname"]
 * @add req.body["file_image_list"]
 */

const allowed_mime_types = ['image/jpeg', 'image/png']

const form_data_valid_reviewer = (req, res, next) => {
    const { prompt, client, ai_sever_host, ai_sever_port } = req.body

    if (!prompt) {
        return res.status(400).send({ message: '请输入prompt' })
    }
    if (!client) {
        return res.status(400).send({ message: '请输入client' })
    }
    if (!ai_sever_host) {
        return res.status(400).send({ message: '请输入ai_sever_host' })
    }
    if (!ai_sever_port) {
        return res.status(400).send({ message: '请输入ai_sever_port' })
    }

    let file_image_list = integrateRequestImageFile(req.files)
    file_image_list.forEach((image_info) => {
        const { fieldname, originalname, mimetype } = image_info

        if (allowed_mime_types.includes(mimetype) == false) {
            return res.status(400).send({
                message: '目前仅支持图片类型 jpeg/png, 请按要求上传',
            })
        } else {
            req.body[fieldname] = originalname
        }
    })

    req.body['file_image_list'] = file_image_list

    next()
}

module.exports = form_data_valid_reviewer

function integrateRequestImageFile(files) {
    let total_image_list = []
    Object.keys(files).forEach((key) => {
        const file_image_list = files[key]
        total_image_list = [...total_image_list, ...file_image_list]
    })

    return total_image_list
}
