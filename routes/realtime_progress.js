const url = require('url')
const WebSocket = require('ws')
const express = require('express')
const workflow_config = require('../configs/workflow_config.json')
const router = express.Router()

const HEARTBEAT_INTERVAL = 3000 // 定义心跳间隔时间

router.get('/test', (req, res) => {
    const sse_header = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream', // 必须设置为 text/event-stream
        'Cache-Control': 'no-cache', // 禁止缓存
        Connection: 'keep-alive', // 保持连接
    }

    res.writeHead(200, sse_header)

    setInterval(() => {
        const message = JSON.stringify({ time: new Date().toISOString() })
        res.write(`data: ${message}\n\n`)
    }, 1000)
})

router.get('/', (req, res) => {
    const parsed_url = url.parse(req.url, true)
    const query = parsed_url.query
    const { ai_server_host, ai_server_port, client_id, prompt, prompt_id } = query

    let current_progress = 0
    let max_progress = 0

    try {
        max_progress = workflow_config[prompt].max_progress
    } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        return res.end(
            JSON.stringify({
                message: 'prompt输入有误或缺失，请检查workflow_config是否添加对应工作流',
            })
        )
    }

    // SSE响应头
    const sse_header = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream', // 必须设置为 text/event-stream
        'Cache-Control': 'no-cache', // 禁止缓存
        Connection: 'keep-alive', // 保持连接
    }

    res.writeHead(200, sse_header)

    let is_response_closed = false // 用于标记响应是否已经关闭

    const comfy_socket = new WebSocket(`ws://${ai_server_host}:${ai_server_port}/ws?clientId=${client_id}`)
    comfy_socket.on('message', (message) => {
        if (is_response_closed) return

        try {
            const utf8_message = message.toString('utf8')
            const is_json = isJson(utf8_message)
            if (!is_json) return

            const json_message = JSON.parse(utf8_message)
            const type = json_message.type

            if (type === 'executing') {
                const data = json_message.data
                if (!data.node) {
                    res.write(`data: ${JSON.stringify({ type: 'finish' })}\n\n`)
                    res.end()
                    is_response_closed = true
                }
            } else if (type === 'progress' && prompt_id === json_message.data.prompt_id) {
                current_progress += 1

                res.write(
                    `data: ${JSON.stringify({
                        type,
                        value: current_progress,
                        max: max_progress,
                    })}\n\n`
                )
            }
        } catch (error) {
            res.write(
                `data: ${JSON.stringify({
                    message: '后端服务与算力服务间WebSocket通信中断',
                })}\n\n`
            )
            res.end()
            is_response_closed = true
        }
    })

    const heartbeatInterval = setInterval(() => {
        if (!is_response_closed) {
            res.write(`data: \n\n`) // 发送空数据作为心跳
        }
    }, HEARTBEAT_INTERVAL)

    // 客户端关闭SSE连接时，关闭WebSocket连接
    req.on('close', () => {
        clearInterval(heartbeatInterval)
        comfy_socket.close()
    })

    // comfy WebSocket关闭时，关闭SSE连接
    comfy_socket.on('close', () => {
        if (!is_response_closed) {
            res.write(
                `data: ${JSON.stringify({
                    message: '算力服务主动关闭WebSocket',
                })}\n\n`
            )
            res.end()
            is_response_closed = true
        }
    })
})

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

module.exports = router
