/**
 * @author zhangluo
 * @useage 风格化图像生成接口
 * @application AIGC校园照相机
 */

const express = require('express')
const formDataBodyParser = require('../middlewares/form_data_body_parser')
const formDataValidReviewer = require('../middlewares/form_data_valid_reviewer')
const promptImageUploader = require('../middlewares/prompt_image_uploader')
const workflowHandler = require('../middlewares/workflow_handler')
const promptDistributer = require('../middlewares/prompt_distributer')

const router = express.Router()
router.use(formDataBodyParser())
router.use(formDataValidReviewer)
router.use(promptImageUploader)
router.use(workflowHandler)
router.use(promptDistributer)

module.exports = router
