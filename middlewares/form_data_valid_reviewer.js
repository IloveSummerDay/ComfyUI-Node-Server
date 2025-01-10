const allowed_mime_types = ['image/jpeg', 'image/png']

const form_data_valid_reviewer = (req, res, next) => {
    let file_image_list = []
    if (req.body.enable_upload_image == 'true') {
        file_image_list = integrateRequestImageFile(req.files)

        if (file_image_list.length == 0) {
            return res.status(400).send({ message: '请上传至少一张风格化图片' })
        }

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

    }
    req['file_image_list'] = file_image_list

    const { prompt, client } = req.body
    if (!prompt) {
        return res.status(400).send({ message: '请输入prompt' })
    }
    if (!client) {
        return res.status(400).send({ message: '请输入client' })
    }

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
