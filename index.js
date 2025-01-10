require('@dotenvx/dotenvx').config()

const testRouter = require('./routes/_test')
const historyRouter = require('./routes/history')
const viewRouter = require('./routes/view')
const stylizeRouter = require('./routes/stylize')
const checkMachineRouter = require('./routes/check_availabel_machine')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const dayjs = require('dayjs')

const app = express()

// global middware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// api router
app.use('/check-availabel-machine', checkMachineRouter)
app.use('/stylize', stylizeRouter)
app.use('/view', viewRouter)
app.use('/history', historyRouter)
app.use('/test', testRouter)

/**
 * @desc 兜底的全局错误处理中间件
 * @var url: req.url
 * @var method: req.method,
 * @var error: 原始错误对象的 message (具体错误信息)
 */
app.use((error, req, res, next) => {
    console.warn(`[${dayjs()}][global error handler]`)
    res.status(500).send({
        ...error,
        _desc: '这是一个全局兜底的错误处理中间件，发生未知错误',
    })
})

app.listen(8388, () => {
    console.warn(`Server is running on port 8388`)
})
