const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', (req, res) => {
    const { prompt_id, client_id } = req.query;
    let imgs_online

    axios(`${process.env.OSS_URL}/GetHistoryImg?clientId=${client_id}`).then((resp) => {
        imgs_online = resp.data
        /**
         * @desc limit http urls sums 10
         */
        const limit = 5

        // const imgUris = imgs_online.imgUris.slice(0, limit)
        const imgUris = imgs_online.imgUris.reverse() // 按照最新图时间顺序

        console.log('///获取用户OSS成功');
        res.status(200).json({
            code: 200,
            imgUris,
            message: imgs_online.message
        }) // return all oss images of the client
    }).catch((err) => {
        console.log('///获取用户OSS失败');
        res.status(500).json({ error_info: 'Failed to fetch images' });
    })
})

module.exports = router;

