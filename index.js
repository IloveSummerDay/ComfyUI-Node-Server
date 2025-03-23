require('@dotenvx/dotenvx').config()

const http = require('http')
const expressApp = require('./express_server')
const createWebSocket = require('./websocket_server')

const server = http.createServer(expressApp)
createWebSocket(server)

server.listen(process.env.WEB_PORT, () => {
    console.log(`Express 和 WebSocket 服务器已启动，监听端口 ${process.env.WEB_PORT}`)
})
