const WebSocket = require('ws')
const url = require('url')

function createWebSocket(server) {
    const ws = new WebSocket.Server({ server })

    ws.on('connection', (client_socket, req) => {
        const parsed_url = url.parse(req.url, true)
        const query = parsed_url.query
        const { ai_sever_host, ai_sever_port, client_id } = query

        const comfy_socket = new WebSocket(`ws://${ai_sever_host}:${ai_sever_port}/ws?clientId=${client_id}`)

        comfy_socket.on('message', (message) => {
            const json_message = JSON.parse(message.toString('utf8'))
            const type = json_message.type
            const data = json_message.data

            if (type === 'progress') {
                client_socket.send(
                    JSON.stringify({
                        type: 'progress',
                        value: data.value,
                        max: data.max,
                        prompt_id: data.prompt_id,
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
