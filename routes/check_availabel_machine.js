const express = require('express')
const net = require('net')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const router = express.Router()

router.get('/', (req, res, next) => {
    let host_info_list = []
    try {
        const ai_sever_provider_config_json = fs.readFileSync(path.resolve(__dirname, '../configs/ai_sever_provider_config.json'))
        const ai_sever_provider_config = JSON.parse(ai_sever_provider_config_json.toString())
        host_info_list = Object.values(ai_sever_provider_config)
    } catch (err) {
        return res.status(500).send({ message: '读取ai_sever_provider_config配置文件失败, 请再试一次' })
    }

    const promise_list = []
    host_info_list.forEach((host_info) => {
        promise_list.push(
            new Promise((resolve) => {
                axios({
                    url: `http://${host_info.host}:${host_info.port}/system_stats`,
                    timeout: 3000,
                })
                    .then(() => {
                        resolve({
                            alive: true,
                            ...host_info,
                        })
                    })
                    .catch(() => {
                        resolve({
                            alive: false,
                            ...host_info,
                        })
                    })
            })
        )
    })

    Promise.all(promise_list)
        .then((response) => {
            res.status(200).json({
                data: response,
            })
        })
        .catch(() => {
            res.status(500).json({
                message: '服务器遇到了一个意外的情况，无法完成对请求的处理',
            })
        })
})

module.exports = router
