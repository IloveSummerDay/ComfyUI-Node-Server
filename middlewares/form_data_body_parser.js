/**
 * @attention 当出现 Unexpected field 时，multer中间件无法解析
 * @add req["body"]
 * @add req["body"]["client"]
 * @add req["body"]["prompt"]
 * @add req["files"]
 */

const multer = require('multer')

const multer_field = [{ name: 'main_image', maxCount: 1 }]

const multer_inst = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 10 },
    fields: multer_field,
})

module.exports = multer_inst.fields(multer_field)
