/**
 * @bug 当出现 Unexpected field 时，multer中间件无法解析，报错
 */

const multer = require('multer')

const multer_field = [
    { name: 'main_image', maxCount: 1 },
    { name: 'bg_image', maxCount: 1 },
    { name: 'reference_image_1', maxCount: 1 },
    { name: 'reference_image_2', maxCount: 1 },
    { name: 'reference_image_3', maxCount: 1 },
    { name: 'reference_image_4', maxCount: 1 },
    { name: 'reference_image_5', maxCount: 1 },
]

const multer_inst = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 10 },
    fields: multer_field,
})

module.exports = multer_inst.fields(multer_field)
