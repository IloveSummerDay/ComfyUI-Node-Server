const WebSocket = require('ws')
const url = require('url')
const workflow_config = require('./configs/workflow_config.json')

function createWebSocketServer(server) {
    const ws = new WebSocket.Server({ server })

    ws.on('connection', (client_socket, req) => {
        const parsed_url = url.parse(req.url, true)
        const query = parsed_url.query
        const { ai_sever_host, ai_sever_port, client_id, prompt, prompt_id } = query

        let current_progress = 0
        let max_progress = 0
        try {
            max_progress = workflow_config[prompt]['max_progress']
        } catch (error) {
            client_socket.close(
                400,
                JSON.stringify({
                    message: 'prompt输入有误或缺失，请检查workflow_config是否添加对应工作流',
                })
            )
        }

        const comfy_socket = new WebSocket(`ws://${ai_sever_host}:${ai_sever_port}/ws?clientId=${client_id}`)
        comfy_socket.on('message', (message) => {
            try {
                const utf8_message = message.toString('utf8')
                const is_json = isJson(utf8_message)
                if (!is_json) return

                const json_message = JSON.parse(utf8_message)
                const type = json_message.type

                if (type == 'executing') {
                    const data = json_message.data
                    if (!data.node) {
                        client_socket.send(
                            JSON.stringify({
                                type: 'finish',
                            })
                        )
                    }
                } else if (type == 'progress' && prompt_id == json_message.data.prompt_id) {
                    current_progress = current_progress + 1
                    client_socket.send(
                        JSON.stringify({
                            type,
                            value: current_progress,
                            max: max_progress,
                        })
                    )
                }
            } catch (error) {
                client_socket.close(
                    400,
                    JSON.stringify({
                        message: '后端服务与算力服务间websocket通信中断',
                    })
                )
            }
        })

        client_socket.on('close', () => {
            comfy_socket.close()
        })
    })
}

function isJson(message) {
    if (typeof message !== 'string' || message.trim() === '') {
        return false // 空字符串或非字符串类型直接返回 false
    }
    try {
        JSON.parse(message)
        return true
    } catch (error) {
        return false
    }
}

module.exports = createWebSocketServer
