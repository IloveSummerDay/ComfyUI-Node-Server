const express = require('express')
const router = express.Router()

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: '测试成功',
        method: req.method,
    })
})

module.exports = router
