/**
 * @add req.body["workflow_obj"]
 */

const fs = require('fs')
const path = require('path')

const workflow_handler = (req, res, next) => {
    const { prompt } = req.body

    let workflow_obj = undefined
    let workflow_revise_config = undefined
    try {
        const workflow_json = fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`))
        workflow_obj = JSON.parse(workflow_json.toString())

        const workflow_config_json = fs.readFileSync(path.resolve(__dirname, '../configs/workflow_config.json'))
        workflow_revise_config = JSON.parse(workflow_config_json.toString())
    } catch (err) {
        return res.status(400).send({ message: '未找到对应的工作流, 请检查prompt是否正确' })
    }

    const current_workflow_revise_config = workflow_revise_config[prompt]
    if (!current_workflow_revise_config) {
        return res.status(400).send({ message: '未找到对应的工作流修改配置, 请检查workflow_config是否添加此工作流' })
    }

    handleReviseWorkflow(workflow_obj, current_workflow_revise_config, req.body)

    req.body['workflow_obj'] = workflow_obj
    next()
}

module.exports = workflow_handler


/**
 * @desc 修正工作流
 * @param {Object} workflow_obj 工作流信息对象
 * @param {Object} current_workflow_revise_config 工作流修改配置 结点索引(Key) - 结点字段和参数字段(value)
 * @param {Object} data_source 
 * @returns 返回修正后的工作流信息对象
 */
function handleReviseWorkflow(workflow_obj, current_workflow_revise_config, data_source) {
    const need_revise_node_index_list = Object.keys(current_workflow_revise_config)
    need_revise_node_index_list.forEach((node_index) => {
        const node_input_obj = workflow_obj[node_index]['inputs']
        const field_list = current_workflow_revise_config[node_index]

        field_list.forEach((field_info) => {
            node_input_obj[field_info.workflow_field] = data_source[field_info.param_field]
        })

    })

    return workflow_obj
}
