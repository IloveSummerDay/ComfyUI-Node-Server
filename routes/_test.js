const express = require('express')
const router = express.Router()
const ossadmin = require('../db/view')

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: '测试成功',
        method: 'GET',
    })
})

router.get('/getossINDB', async (req, res, next) => {
    try {
        const dbres = await ossadmin.getOssPhotos(req.body.client, req.body.prompt)
        res.json(dbres)
    } catch (error) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: 'get oss addr in db error',
            error,
        })
    }
})

router.get('/setossINDB', async (req, res, next) => {
    try {
        const dbres = await ossadmin.setOssPhotos(req.body.client, req.body.prompt, req.body.oss_url, req.body.filename)
        res.json(dbres)
    } catch (error) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: 'set oss addr in db error',
            error,
        })
    }
})

module.exports = router
