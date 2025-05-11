/**
 * @module 工作流处理模块
 * @add req.body["workflow_obj"]
 */

const fs = require('fs')
const path = require('path')
const workflow_revise_config = require('../configs/workflow_config.json')

const workflow_handler = (req, res, next) => {
    const { prompt } = req.body

    let workflow_obj = undefined
    try {
        const workflow_json = fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`))
        workflow_obj = JSON.parse(workflow_json.toString())
    } catch (err) {
        return res.status(400).send({ message: '未找到对应的工作流, 请检查prompt是否正确' })
    }

    const current_workflow_revise_config = workflow_revise_config[prompt]
    if (!current_workflow_revise_config) {
        return res.status(500).send({ message: '未找到对应的工作流修改配置, 请检查workflow_config是否添加此工作流' })
    }

    try {
        const current_workflow_modify_node_config = current_workflow_revise_config['modify_node']
        handleReviseWorkflow(workflow_obj, current_workflow_modify_node_config, req.body)
    } catch (error) {
        return res.status(500).send({ message: '修改工作流失败, 请检查workflow_config是否正确配置此工作流修改项' })
    }

    req.body['workflow_obj'] = workflow_obj
    next()
}

module.exports = workflow_handler

/**
 * @desc 修正工作流
 * @param {Object} workflow_obj 工作流信息对象
 * @param {Object} workflow_modify_node_config 工作流修改配置 结点索引(Key) - 结点字段和参数字段(value)
 * @param {Object} data_source
 * @returns 返回修正后的工作流信息对象
 */
function handleReviseWorkflow(workflow_obj, workflow_modify_node_config, data_source) {
    const need_revise_node_index_list = Object.keys(workflow_modify_node_config)
    need_revise_node_index_list.forEach((node_index) => {
        const node_input_obj = workflow_obj[node_index]['inputs']
        const field_list = workflow_modify_node_config[node_index]

        field_list.forEach((field_info) => {
            const value = data_source[field_info.param_field]
            if (value) {
                node_input_obj[field_info.workflow_field] = value
            }
        })
    })

    return workflow_obj
}
