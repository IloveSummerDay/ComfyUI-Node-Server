const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const CORS = require('cors')
const axios = require('axios')
const fs = require('fs')

// router
const uploadRouter = require('./routes/upload');
const downloadRouter = require('./routes/download');
const getossRouter = require('./routes/getoss');
const viewRouter = require('./routes/view');
const deleteossRouter = require('./routes/deleteoss');
const stylizeRouter = require('./routes/stylize');
// init config
dotenv.config({ path: './.env' });
const app = express();
const port = process.env.PORT;
const AIGCSever = process.env.AIGC_BASE_URL;

// middware
app.use(CORS())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// upload + prompt
app.use('/stylize', stylizeRouter)

// 文件中转服务 - 流式数据传输
app.use('/upload', uploadRouter)

// 文件下载服务
app.use('/download', downloadRouter)

app.use('/view', viewRouter) // 预览图片
app.use('/getoss', getossRouter) // 获取用户所有的OSS图片在线地址
app.use('/deleteoss', deleteossRouter) // 删除某个用户OSS上的图片


// 派发绘图任务
app.post('/prompt', (req, res) => {
    const { prompt, client, image } = req.body;
    console.log('/////prompt_info', prompt, client, image);
    const workflowJSON = fs.readFileSync(path.resolve(__dirname, `./workflows/${prompt}.json`))
    const workflowOBJ = JSON.parse(workflowJSON.toString())
    workflowOBJ["13"]["inputs"]['image'] = image // hash_image_name

    const aigc_prompt = {
        client_id: client,
        prompt: workflowOBJ,
    }
    axios({
        url: `${AIGCSever}/prompt`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(aigc_prompt)
    }).then(resp => {
        res.status(200).send(resp.data)
    }).catch(error => {
        res.sendStatus(error.status)
    });
})


// 正在进行的任务队列数
app.get('/queues', (req, res) => {
    axios(`${AIGCSever}/prompt`).then(resp => {
        // console.log('/////getTasksQueue', resp.data);
        res.status(200).json({
            message: '获取任务队列成功',
            ...resp.data
        })
    })
})


// 测试
app.get('/test', (req, res) => {
    axios(`${AIGCSever}/${'system_stats'}`, {
        method: 'GET',
    }).then(resp => {
        res.status(200).json({
            message: '测试成功',
        })
    })

})

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

