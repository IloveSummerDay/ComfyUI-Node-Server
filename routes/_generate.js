/**
 * @author zhangluo
 * @useage 智能包装生成接口
 * @desc AI跑图只需传入工作流和用户名即可派发绘图任务, 所以此接口处理了工作流中多入参情况(多图片、多文本)
 * @desc 前端只需要调用此接口, 使用 FormData 封装 product、工作流所需参数、数据库所需参数即可实现多产品线公用一套接口进行跑图
 * @desc 此公用性接口依赖于一下4个变量实现, 后期维护只需要修改 models.js 即可
 * @var req.modelArgsToValueMap // 结点._meta.title : 此结点实际对应参数值
 * @var req.modelArgsToTypeMap // 结点._meta.title : 此结点入参字段
 * @var req.temp_imageVarToModelArgsMap
 * @var req.temp_modelArgsToTextVarMap
 */
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')
const path = require('path')
const router = express.Router()
const allowedMimeTypes = ['image/jpeg', 'image/png']
const models = require('../models')

const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 100 } }) // 100M

router.post(
    '/',
    upload.fields(models.multerField),
    (req, res, next) => {
        try {
            models.products.includes(req.query.product)
                ? null
                : (() => {
                      throw new Error()
                  })()
            req.modelArgsToValueMap = []
            req.temp_imageVarToModelArgsMap = undefined
            req.temp_modelArgsToTextVarMap = undefined
            req.modelArgsToTypeMap = undefined
            models.products.map((product) => {
                if (product == req.query.product) {
                    req.temp_imageVarToModelArgsMap = models[`${product}_ImageVarToModelArgs`] ? models[`${product}_ImageVarToModelArgs`] : undefined
                    req.temp_modelArgsToTextVarMap = models[`${product}_ModelArgsToTextVarArgs`] ? models[`${product}_ModelArgsToTextVarArgs`] : undefined
                    req.modelArgsToTypeMap = models[`${product}_ModelArgsToTypeArgs`] ? models[`${product}_ModelArgsToTypeArgs`] : undefined
                }
            })

            next()
        } catch (error) {
            return res.status(400).send({
                api: req.originalUrl,
                method: req.method,
                message: 'product参数未找到或输入有误',
            })
        }
    },

    async (req, res, next) => {
        try {
            const wPromises = []
            const uploadImgsName = []
            if (req.temp_modelArgsToTextVarMap) {
                req.temp_modelArgsToTextVarMap.map((modelArg) => {
                    req.modelArgsToValueMap.push({
                        key: modelArg.key,
                        value: Number(req.body[modelArg.value]) ? Number(req.body[modelArg.value]) : req.body[modelArg.value],
                    })
                })
            }

            /**
             * @desc download image
             * @question 我将图片下载到模型服务的 inputs 文件夹中, 是否可以省略手动上传图片的步骤
             */
            Object.keys(req.files).map((name) => {
                req.files[name].map((file) => {
                    if (!allowedMimeTypes.includes(file.mimetype)) {
                        return res.status(400).send({
                            api: req.originalUrl,
                            method: req.method,
                            message: '目前仅支持图片类型 jpeg/png',
                        })
                    }

                    req.temp_imageVarToModelArgsMap.map((imageVar) => {
                        if (name == imageVar.key) {
                            req.modelArgsToValueMap.push({
                                key: imageVar.value,
                                value: file.originalname,
                            })
                        }
                    })

                    const writePromise = new Promise((resolve, reject) => {
                        fs.writeFile(path.resolve(__dirname, '../uploads', file.originalname), file.buffer, (err) => {
                            if (err) return reject(false)
                            resolve(true)
                        })
                    })
                    wPromises.push(writePromise)
                    uploadImgsName.push(file.originalname)
                })
            })

            if (uploadImgsName.length == 0) {
                console.warn(`[${dayjs()}][no file upload]`)
                next()
            } else
                await Promise.all(wPromises)
                    .then(() => {
                        console.warn(`[${dayjs()}][all file write local]`)
                    })
                    .catch((error) => {
                        return res.status(500).send({
                            api: req.originalUrl,
                            method: req.method,
                            message: 'Node服务器文件写入过程中存在错误, 请重试',
                        })
                    })

            /**
             * @desc download image request body
             * - FormData中存在相同key值的字段, 可以实现多文件同key上传。
             * - FormData 对象内部会使用某种机制来区分具有相同名称的多个字段。
             * @desc 虽然理论是这样, 但是 ComfyUI 提供的接口只能一张一张的接收, 所以只能采用轮传图片的方案
             * @desc ComfyUI接口缺陷：
             * - 单张接受图片；
             * - 重命图片后缀+1进行存储
             */
            uploadImgsName.map(async (name, index) => {
                let imgsFormData = new FormData()
                imgsFormData.append('image', fs.createReadStream(path.join(__dirname, '../uploads', name)))
                await axios({
                    url: `http://${req.body.ai_sever_host}:${req.body.ai_sever_port}/upload/image`,
                    method: 'post',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    data: imgsFormData,
                })
                    .then((resp) => {
                        index == uploadImgsName.length - 1 ? next() : null
                    })
                    .catch((err) => {
                        console.warn(`[${dayjs()}][AI Server image download fail]`)
                        next({
                            api: req.originalUrl,
                            method: req.method,
                            message: '算力服务端文件下载失败, 请重试',
                        })
                    })
            })
        } catch (error) {
            next({
                api: req.originalUrl,
                method: req.method,
                message: 'Node服务器下载文件中间件执行过程中存在错误',
                error,
            })
        }
    },
    (req, res, next) => {
        try {
            const { prompt, client } = req.body

            const oldWorkflowOBJ = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../workflows/${prompt}.json`)).toString())
            const newWorkFlowOBJ = prompt == 't2i' ? oldWorkflowOBJ : handleReplaceNode(oldWorkflowOBJ, req.modelArgsToValueMap, req.modelArgsToTypeMap)

            axios({
                url: `http://${req.body.ai_sever_host}:${req.body.ai_sever_port}/prompt`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify({
                    client: client,
                    prompt: newWorkFlowOBJ,
                }),
            })
                .then((resp) => {
                    const res_data = resp.data

                    if (Object.keys(res_data.node_errors).length == 0) return res.status(200).send(resp.data)
                    else {
                        const new_node_errors = {}
                        Object.keys(res_data.node_errors).map((node) => {
                            const errors = []
                            res_data.node_errors[node].errors.map((err, index) => {
                                const errTypes = {
                                    type: res_data.node_errors[node].errors[index].type,
                                    message: res_data.node_errors[node].errors[index].message,
                                    extra_info: {
                                        input_name: res_data.node_errors[node].errors[index].extra_info.input_name,
                                        received_value: res_data.node_errors[node].errors[index].extra_info.received_value,
                                    },
                                }
                                errors.push(errTypes)
                            })
                            new_node_errors[node] = { errors, class_type: node.class_type }
                        })
                        return res.status(200).json({
                            api: req.originalUrl,
                            method: req.method,
                            message: '派发任务成功, 但工作流结点有错误信息可能会导致出图失败',
                            prompt_id: res_data.prompt_id,
                            number: res_data.number,
                            node_errors: new_node_errors,
                        })
                    }
                })
                .catch((error) => {
                    console.warn(`[${dayjs()}][prompt fail]`)
                    return res.status(500).send({
                        api: req.originalUrl,
                        method: req.method,
                        message: '派发任务失败, 请确认算力端服务启动后重试',
                    })
                })
        } catch (error) {
            next({
                api: req.originalUrl,
                method: req.method,
                message: 'Node服务器派发绘图任务中间件执行过程中存在错误',
                error,
            })
        }
    }
)

function handleReplaceNode(workflowOBJ, modelArgsToValueMap, modelArgsToTypeMap) {
    for (let i = 0; i < Object.keys(workflowOBJ).length; i++) {
        const node = workflowOBJ[Object.keys(workflowOBJ)[i]]
        modelArgsToTypeMap.map((arg, index) => {
            if (node._meta.title == arg.key && modelArgsToValueMap[index] && modelArgsToValueMap[index].value) {
                node.inputs[arg.value] = modelArgsToValueMap[index].value
            }
        })
    }

    return workflowOBJ
}

module.exports = router
