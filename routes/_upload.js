const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        let startTime = new Date().getTime();
        const url = new URL(`${process.env.AIGC_BASE_URL}/upload/image`);
        const [contentType, contentLength] = [req.headers['content-type'], req.headers['content-length']];
        const options = {
            protocol: url.protocol,
            method: 'post',
            host: url.hostname,
            path: url.pathname,
            timeout: 5000,
            headers: {
                'Content-Type': contentType,
                'Content-Length': contentLength,
            }
        };
        if (url.port) options.port = url.port;
        if (url.search) options.path = options.path + url.search;
        const httpClient = (url.protocol || 'https').includes('https') ? https : http;

        const result = await new Promise((resolve, reject) => {
            let request = httpClient.request(options, function (resp) {
                let str = '';
                resp.on('data', function (buffer) {
                    str += buffer;
                });
                resp.on('end', () => {
                    try {
                        const result = JSON.parse(str.toString())
                        console.log('上传文件返回的结果:', result);
                        console.log('数据上传完毕,耗时(毫秒):', new Date().getTime() - startTime);
                        resolve(result);
                    } catch (e) {
                        return reject(e);
                    }
                });
                resp.on('error', (err) => {
                    return reject(err);
                });
            });
            request.on('error', (err) => {
                console.error('原始请求出错:', err);
                return reject(err);
            });

            req.on('end', () => {
                console.log('数据接收完毕,耗时（毫秒）:', new Date().getTime() - startTime);
            });

            req.pipe(request);
        });
        let endTime = new Date().getTime();
        console.log('上传文件成功，总用时:', endTime - startTime, 'ms');

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json(JSON.stringify(err));
    }
});

module.exports = router