const express = require('express');
const axios = require('axios');
const router = express.Router();

router.delete('/', (req, res) => {
    const { prompt_id, client_id } = req.query;
    // console.log('/////get_image_info', prompt_id, client_id);

    axios({ url: `${process.env.OSS_URL}/ClearHistoryImg?clientId=${client_id}`, method: 'delete' }).then((resp) => {
        console.log('/////删除用户OSS桶成功');
        res.status(200).json(resp.data) // return if del success
    }).catch((err) => {
        console.log('/////删除用户OSS桶失败');
        res.sendStatus(500).json({ error_info: 'Failed to delete images' });
    })
})

module.exports = router;

