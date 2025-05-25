/**
 * @author zhangluo
 * @useage 派发绘图任务
 * @application 普通的前端绘图应用
 */

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
    if (req.body.prompt == '3d_image') {
        req.body['seed'] = Math.floor(Math.random() * 1000000)
    }

    next()
})

router.use(promptImageUploader)
router.use(workflowHandler)
router.use(promptDistributer)

module.exports = router
