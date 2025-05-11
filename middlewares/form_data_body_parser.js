/**
 * @module 请求体解析模块
 * @attention 当出现 Unexpected field 时，multer中间件无法解析
 * @add req["body"]
 * @add req["body"]["client"]
 * @add req["body"]["prompt"]
 * @add req["files"]
 */

const multer = require('multer')
const multer_field_config = require('../configs/multer_field_config.json')

const multer_field = multer_field_config.multer_field
const multer_inst = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 10 },
    fields: multer_field,
})

module.exports = multer_inst.fields(multer_field)
