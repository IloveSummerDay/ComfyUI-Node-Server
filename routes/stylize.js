/**
 * @author zhangluo
 * @useage 派发风格化图像绘图任务
 * @application AIGC校园照相机
 */

const fs = require('fs')
const path = require('path')
const express = require('express')
const formDataBodyParser = require('../middlewares/form_data_body_parser')
const formDataValidReviewer = require('../middlewares/form_data_valid_reviewer')
const promptImageUploader = require('../middlewares/prompt_image_uploader')
const workflowHandler = require('../middlewares/workflow_handler')
const promptDistributer = require('../middlewares/prompt_distributer')

const router = express.Router()
router.use(formDataBodyParser)
router.use(formDataValidReviewer)

router.use((req, res, next) => {
    if (req.body.file_image_list.length == 0) {
        return res.status(400).send({ message: '请上传至少一张风格化图片' })
    }

    if (req.body.prompt == 'PortraitStylizationWithBackground') {
        const random_bg_image = Math.round(Math.random()) + 1
        const bg_image_buffer = fs.readFileSync(path.resolve(__dirname, `../public/cuz_bg_${random_bg_image}.jpg`))

        const bg_image = {
            buffer: bg_image_buffer,
            originalname: `cuz_bg_${random_bg_image}.jpg`,
            mimetype: 'image/jpeg',
        }

        req.body.file_image_list.push(bg_image)
        req.body['bg_image'] = bg_image.originalname
    } else if (req.body.prompt == 'pulid') {
        req.body['seed'] = Math.floor(Math.random() * 1000000)
    }

    next()
})

router.use(promptImageUploader)
router.use(workflowHandler)
router.use(promptDistributer)

module.exports = router
