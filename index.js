require('@dotenvx/dotenvx').config()

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

// router
const testRouter = require('./routes/_test')
const historyRouter = require('./routes/history')
const viewRouter = require('./routes/view')
const stylizeRouter = require('./routes/stylize')
const generateRouter = require('./routes/generate')
const useradminRouter = require('./routes/useradmin')
const app = express()

// middware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 用户管理
app.use('/', useradminRouter)

// upload + prompt
app.use('/stylize', stylizeRouter)

app.use('/view', viewRouter) // 预览图片
app.use('/history', historyRouter) // 获取/删除用户所有生成图片的历史记录
app.use('/generate', generateRouter) // 生成海报

// TEST
app.use('/test', testRouter)



/**
 * @desc 兜底的全局错误处理中间件
 * @error_format 错误对象结构 (带*为产生错误的接口中向 next({ ...*, error }) 传入的对象必须携带的属性)
 * @var api: req.url
 * @var method: req.method,
 * @var message: '针对专门错误的描述信息',
 * @var error: 原始错误对象的 message (具体错误信息)
 * @var err.error 原始错误对象
 * @var _desc: '这是一个全局兜底的错误处理中间件 - START'
 */
app.use((err, req, res, next) => {
    res.status(500).send({
        ...err,
        _sys_error: err.error ? err.error.message : '',
        _desc: '这是一个全局兜底的错误处理中间件，发生未知错误',
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
