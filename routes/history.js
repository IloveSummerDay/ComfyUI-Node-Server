const express = require('express')
const axios = require('axios')
const historyoss_admin = require('../db/history')
const router = express.Router()

/**
 * @desc 从数据库中获取 用户个人 所有生成图的历史记录
 */
router.get('/get', async (req, res) => {
    const { prompt_id, client_id } = req.query

    /**
     * @res db_queryRes.data
     * - 保证查询结果顺序 时间近 -> 时间远
     * - 可以限制查询历史记录数量 limit=5
     */
    const db_queryRes = await historyoss_admin.getOssPhotos(client_id)
    // return res.json({ "数据库查询结果": db_queryRes })

    if (db_queryRes.isFetch && Object.keys(db_queryRes).length > 0) {
        return res.status(200).json({
            statusCode: 200,
            data: db_queryRes.data,
            message: null,
            source: 'db',
        })
    } else if (!db_queryRes.isFetch && Object.keys(db_queryRes).length == 0) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: '数据库oss查询失败, 请检查数据库连接',
            error: db_queryRes.error,
        })
    }
})

/**
 * @desc 从数据库中删除 用户个人 单次生成图的历史记录
 * @attention 删除操作时, oss存在限制, 只能一次删除用户所有的历史记录, 需等待后续沟通解决
 */
router.delete('/delete', async (req, res) => {})

module.exports = router
