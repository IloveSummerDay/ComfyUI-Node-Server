const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: '测试成功',
        method: 'GET',
    })

})
router.post('/', (req, res, next) => {
    try {
        req.query.test ?
            res.status(200).json({
                message: '测试成功',
                method: 'POST',
                test: req.query.test
            }) : res.status(200).json({
                message: '测试成功',
                method: 'POST',
                test: "无"
            })
    } catch (error) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: 'POST 测试接口失败，请查看具体 error 字段信息',
            error,
        })
    }

})

module.exports = router;