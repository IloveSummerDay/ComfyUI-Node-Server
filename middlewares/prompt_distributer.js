const dayjs = require('dayjs')
const axios = require('axios')

const prompt_distributer = (req, res) => {
    axios({
        url: `http://${req.body.ai_sever_host}:${req.body.ai_sever_port}/prompt`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            client: req.body.client,
            prompt: req.body.workflow_obj,
        }),
    })
        .then((response) => {
            return res.status(200).send(response.data)
        })
        .catch(() => {
            console.warn(`[${dayjs()}][prompt fail]`)
            res.status(502).json({
                message: '派发任务失败, 请检查算力端服务是否开启',
            })
        })
}

module.exports = prompt_distributer
