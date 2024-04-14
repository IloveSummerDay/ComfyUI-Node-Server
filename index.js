const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors')
const axios = require('axios')
const fs = require('fs')

// router
const testRouter = require('./routes/test');
const uploadRouter = require('./routes/upload');
const downloadRouter = require('./routes/download');
const getossRouter = require('./routes/getoss');
const viewRouter = require('./routes/view');
const deleteossRouter = require('./routes/deleteoss');
const stylizeRouter = require('./routes/stylize');
const generateRouter = require('./routes/generate');
// init config
const app = express();
const port = process.env.PORT;

// middware
app.use(cors({
    origin: '*'
}))
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
app.use('/generate', generateRouter) // 生成海报

// TEST
app.use('/test', testRouter)


/**
 * @desc 兜底的全局错误处理中间件
 * @error_format 错误对象结构 (带*为产生错误的接口中向 next({ ...*, error }) 传入的对象必须携带的属性)
 * - *api: req.url 
 * - *method: req.method,
 * - *message: '针对专门错误的描述信息',
 * - error: 原始错误对象的 message (具体错误信息)
 * - _desc: '这是一个全局兜底的错误处理中间件 - START'
 */
app.use((err, req, res, next) => {
    /**
     * @var err.error 原始错误对象
     */
    res.status(500).send({
        ...err,
        error: err.error.message, // 覆盖 err 里的 error 原始对象。使用原始 error 对象的 message 查看具体错误信息
        _desc: '这是一个全局兜底的错误处理中间件 - END'
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// // 派发绘图任务
// app.post('/prompt', (req, res) => {
//     const { prompt, client, image } = req.body;
//     console.log('/////prompt_info', prompt, client, image);
//     const workflowJSON = fs.readFileSync(path.resolve(__dirname, `./workflows/${prompt}.json`))
//     const workflowOBJ = JSON.parse(workflowJSON.toString())
//     workflowOBJ["13"]["inputs"]['image'] = image // hash_image_name

//     const aigc_prompt = {
//         client_id: client,
//         prompt: workflowOBJ,
//     }
//     axios({
//         url: `${AIGCSever}/prompt`,
//         method: 'post',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         data: JSON.stringify(aigc_prompt)
//     }).then(resp => {
//         res.status(200).send(resp.data)
//     }).catch(error => {
//         res.sendStatus(error.status)
//     });
// })


// 正在进行的任务队列数
// app.get('/queues', (req, res) => {
//     axios(`${AIGCSever}/prompt`).then(resp => {
//         // console.log('/////getTasksQueue', resp.data);
//         res.status(200).json({
//             message: '获取任务队列成功',
//             ...resp.data
//         })
//     })
// })

