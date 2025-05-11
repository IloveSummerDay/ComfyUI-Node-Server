const axios = require('axios')
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    try {
        const { ai_sever_host, ai_sever_port, prompt_id } = req.query

        if (!ai_sever_host || !ai_sever_port || !prompt_id) {
            return res.status(400).json({ message: '获取任务队列状态失败, 请检查请求参数是否正确' })
        }

        axios({ url: `http://${ai_sever_host}:${ai_sever_port}/queue` }).then(async (response) => {
            const { queue_running, queue_pending } = response.data
            for (const running of queue_running) {
                const running_prompt_id = running[1]
                if (prompt_id === running_prompt_id) {
                    return res.status(200).json({ status: 'running' })
                }
            }

            let pendings = 1
            for (const pending of queue_pending) {
                const pending_prompt_id = pending[1]
                if (prompt_id === pending_prompt_id) {
                    return res.status(200).json({ status: 'pending', pendings })
                }
                pendings = pendings + 1
            }

            return res.status(200).json({ status: 'finish' })
        }).catch(() => {
            return res.status(502).json({ message: '获取任务队列状态失败, 请检查算力端服务是否正常或请求参数是否正确' })
        })
    } catch (error) {
        return res.status(500).json({ message: '获取任务队列状态失败, 请检查算力端服务是否正常' })
    }
})

module.exports = router
