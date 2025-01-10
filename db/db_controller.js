const mysqlx = require('@mysql/xdevapi')
const moment = require('moment')

class DBController {
    constructor() {
        this.dbconfig = {
            user: process.env.MYSQL_USER,
            host: process.env.MYSQL_URL,
            port: process.env.MYSQL_PORT,
            password: process.env.MYSQL_PASSWORD,
        }
    }

    /**
     * @desc 获取用户在某次绘图任务中产生的全部图片列表
     * @param {String} client 用户名
     * @param {String} prompt 绘图任务ID
     * @param {Number} limit (optional) 图片列表长度限制，未指定时返回全部图片列表
     * @returns {Promise} 在线图片信息列表
     */
    async getOssPhotoList(client, prompt, limit) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const query = session
                        .getSchema(process.env.MYSQL_DATABASE)
                        .getTable('photos')
                        .select(['client', 'prompt', 'filename', 'oss_url'])
                        .where('client = :client and prompt = :prompt')
                        .bind('client', client)
                        .bind('prompt', prompt)
                        .orderBy('created_at DESC')

                    if (limit) {
                        query.limit(limit)
                    }

                    return query
                        .execute()
                        .then((res) => {
                            return res.fetchAll()
                        })
                        .then((query_info_list) => {
                            const oss_photo_list = []
                            query_info_list.forEach((query_info) => {
                                oss_photo_list.push({
                                    filename: query_info[2],
                                    oss_url: query_info[3],
                                })
                            })

                            session.close()
                            resolve(oss_photo_list)
                        })
                })
                .catch(() => {
                    reject()
                })
        })
    }

    /**
     * @desc 获取用户AIGC生成的全部图片列表
     * @param {String} client 用户名
     * @param {Number} limit (optional) 图片列表长度限制，未指定时返回全部图片列表
     * @returns {Promise} 在线图片信息列表
     */
    async getAllOssPhotoList(client, limit) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const query = session
                        .getSchema(process.env.MYSQL_DATABASE)
                        .getTable('photos')
                        .select(['client', 'prompt', 'filename', 'oss_url'])
                        .where('client = :client')
                        .bind('client', client)
                        .orderBy('created_at DESC')

                    if (limit) {
                        query.limit(limit)
                    }

                    return query
                        .execute()
                        .then((res) => {
                            return res.fetchAll()
                        })
                        .then((query_info_list) => {
                            const oss_photo_list = []
                            query_info_list.forEach((query_info) => {
                                oss_photo_list.push({
                                    filename: query_info[2],
                                    oss_url: query_info[3],
                                })
                            })

                            session.close()
                            resolve(oss_photo_list)
                        })
                })
                .catch(() => {
                    reject()
                })
        })
    }

    /**
     * @desc 在photo表中插入一条或多条包含在线图片地址信息的记录
     * @param {String} client 用户名
     * @param {String} prompt 绘图任务ID
     * @param {Array} oss_image_list 此次绘图任务产生的在线图片信息列表
     * @returns {Promise} Boolen value
     */
    async insertOssPhoto(client, prompt, oss_image_list) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const table = session.getSchema(process.env.MYSQL_DATABASE).getTable('photos')

                    /**
                     * @desc 循环插入数据
                     * 由于在 MySQL 文档中没有找到一次性插入不确定数的多条数据，所以使用 Promise.all 实现并行控制
                     */
                    const insert_promise_list = []
                    oss_image_list.forEach((image_info) => {
                        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss')
                        const insert_promise = table
                            .insert(['client', 'prompt', 'filename', 'oss_url', 'created_at'])
                            .values([client, prompt, image_info.filename, image_info.oss_url, timestamp])
                            .execute()
                        insert_promise_list.push(insert_promise)
                    })

                    return await Promise.all(insert_promise_list).then(
                        () => {
                            session.close()
                            resolve(true)
                        },
                        () => {
                            session.close()
                            reject()
                        }
                    )
                })
                .catch(() => {
                    reject()
                })
        })
    }

    /**
     *
     * @desc 在photo表中删除一条或多条包含在线图片地址信息的记录
     * @param {String} client 用户名
     * @param {Array<String>} filename_list 需要删除图片的文件名列表
     * @returns {Promise} 删除图片记录数量
     */
    async deleteOssPhoto(client, filename_list) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const table = session.getSchema(process.env.MYSQL_DATABASE).getTable('photos')

                    const delete_promise_list = []
                    filename_list.forEach((filename) => {
                        const delete_promise = table.delete().where('client = :client AND filename = :filename').bind('client', client).bind('filename', filename).execute()
                        delete_promise_list.push(delete_promise)
                    })

                    return await Promise.all(delete_promise_list).then(
                        () => {
                            session.close()
                            resolve(filename_list.length)
                        },
                        () => {
                            session.close()
                            reject()
                        }
                    )
                })
                .catch(() => {
                    reject()
                })
        })
    }

    /**
     * @desc 查询数据库users表中该用户是否存在
     * @param {String} client 用户名
     * @returns {Promise} Boolen value
     */
    async findUser(client) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const table = session.getSchema(process.env.MYSQL_DATABASE).getTable('users')
                    return table
                        .select(['client'])
                        .where('client = :client')
                        .bind('client', client)
                        .execute()
                        .then((res) => {
                            return res.fetchAll()
                        })
                        .then((res) => {
                            session.close()
                            resolve(res.length > 0)
                        })
                        .catch(() => {
                            reject()
                        })
                })
                .catch(() => {
                    reject()
                })
        })
    }

    /**
     * @desc 注册用户名、密码
     * @param {String} client 用户名
     * @param {String} pw 密码
     * @returns {Promise} Boolen value
     */
    async insertUser(client, pw) {
        return new Promise((resolve, reject) => {
            mysqlx
                .getSession(this.dbconfig)
                .then(async (session) => {
                    const table = session.getSchema(process.env.MYSQL_DATABASE).getTable('users')
                    return table
                        .insert(['client', 'pw'])
                        .values([client, pw])
                        .execute()
                        .then(() => {
                            session.close()
                            resolve(true)
                        })
                        .catch(() => {
                            reject()
                        })
                })
                .catch(() => {
                    reject()
                })
        })
    }
}

module.exports = new DBController()
