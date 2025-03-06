/**
 * @author zhangluo
 * @useage 派发 logo 绘图任务
 * @application logo应用
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
    const { logoname } = req.body
    if (!logoname) {
        next()
    } else {
        const logo_buffer = fs.readFileSync(path.resolve(__dirname, `../public/${logoname}`))
        const logo = {
            buffer: logo_buffer,
            originalname: logoname,
            mimetype: 'image/png',
        }

        req.body.file_image_list.push(logo)
        req.body['logo'] = logo.originalname
        next()
    }
})

router.use(promptImageUploader)
router.use(workflowHandler)
router.use(promptDistributer)

module.exports = router
