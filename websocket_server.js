const WebSocket = require('ws')
const url = require('url')
const workflow_config = require('./configs/workflow_config.json')

function createWebSocket(server) {
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
            const json_message = JSON.parse(message.toString('utf8'))
            const type = json_message.type
            const data = json_message.data

            if (type == 'executing') {
                if (!data.node) {
                    client_socket.send(
                        JSON.stringify({
                            type: 'finish',
                        })
                    )
                }
            }

            if (type == 'progress' && prompt_id == data.prompt_id) {
                current_progress = current_progress + 1
                client_socket.send(
                    JSON.stringify({
                        type,
                        value: current_progress,
                        max: max_progress,
                    })
                )
            }
        })

        client_socket.on('close', () => {
            comfy_socket.close()
        })
    })
}

module.exports = createWebSocket
