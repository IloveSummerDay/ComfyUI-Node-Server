const express = require('express')
const dbController = require('../db/db_controller')
const router = express.Router()

router.get('/get-all', async (req, res) => {
    const { client_id, limit } = req.query

    if (!client_id) {
        res.status(400).send({ message: '请输入client_id' })
    }

    dbController
        .getAllOssPhotoList(client_id, limit)
        .then((db_query_list) => {
            return res.status(200).json({
                data: db_query_list,
            })
        })
        .catch(() => {
            return res.status(502).json({
                message: 'Select all数据库操作失败, 请检查数据库连接状态',
            })
        })
})

router.get('/get-one-prompt', async (req, res) => {
    const { client_id, prompt_id, limit } = req.query

    if (!client_id) {
        res.status(400).send({ message: '请输入client_id' })
    }

    if (!prompt_id) {
        res.status(400).send({ message: '请输入prompt_id' })
    }

    dbController
        .getOssPhotoList(client_id, prompt_id, limit)
        .then((db_query_list) => {
            return res.status(200).json({
                data: db_query_list,
            })
        })
        .catch(() => {
            return res.status(502).json({
                message: 'Select one数据库操作失败, 请检查数据库连接状态',
            })
        })
})

/**
 * @desc 从数据库中删除用户单个或多个生成图片记录
 * @attention 删除操作时, oss存在限制, 只能一次删除用户所有的历史记录, 需等待后续沟通解决
 */
router.delete('/delete', async (req, res) => {
    const { client_id, filename_list } = req.body

    try {
        const delete_item_count = await dbController.deleteOssPhoto(client_id, filename_list)
        return res.status(200).json({
            data: delete_item_count,
        })
    } catch (error) {
        return res.status(502).json({
            message: 'Delete数据库操作失败, 请检查数据库连接状态',
        })
    }
})

module.exports = router
