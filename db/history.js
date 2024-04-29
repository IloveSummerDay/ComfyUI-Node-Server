/**
 * @desc 从数据库中获取 用户个人 所有生成图的oss_url, 若没有则保存到数据库中
 * @var schema 代表数据库中的一个特定部分或命名空间，如表、视图、存储过程等。
 * - 默认情况下，schema 的概念与数据库的名称相同.
 * - 在某些情况下，它可以代表数据库中的一个特定部分或命名空间.
 */

const mysqlx = require('@mysql/xdevapi');
const config = {
    user: process.env.MYSQL_USER,
    host: process.env.MYSQL_URL,
    port: process.env.MYSQL_PORT,
    password: process.env.MYSQL_PASSzWORD
}
// const dbTable = 'photos'
const dbTable = process.env.MYSQL_TABLE

async function getOssPhotos(client) {
    return mysqlx.getSession(config)
        .then(async (session) => {
            const table = session.getSchema(process.env.MYSQL_DATABASE).getTable(dbTable);
            return table.select(['client', 'prompt', 'filename', 'oss_url'])
                .where('client = :client')
                .bind('client', client)
                .execute()
                .then(res => {
                    return res.fetchAll()
                })
                .then((res) => {
                    let ossDataMap = {}
                    if (res.length > 0) {
                        res.map((item) => {
                            ossDataMap[item[2]] = item[3]
                        })
                    }
                    return ossDataMap
                }).then((res) => {
                    session.close();
                    return {
                        isFetch: Object.keys(res).length == 0 ? false : true,
                        data: res
                    }
                })
        }).catch((error) => {
            // 连接 db 失败
            return {
                isFetch: false,
                data: {},
                error
            }
        })


}

// 设置client prompt filename oss_url
async function deleteOssPhotos(client, prompt, imgs_map) {
    return mysqlx.getSession(config).then(async (session) => {
        // console.log('===insert oss connect db success===');
        const table = session.getSchema(process.env.MYSQL_DATABASE).getTable(dbTable);

        /**
         * @desc 循环插入数据
         * - 由于在 MySQL 文档中没有找到一次性插入不确定数的多条数据，所以使用 Promise.all 实现并行控制
         */
        const insertPromises = []
        Object.keys(imgs_map).map((filename) => {
            const insertPromise = table.insert(['client', 'prompt', 'filename', 'oss_url'])
                .values([client, prompt, filename, imgs_map[filename]])
                .execute()
            insertPromises.push(insertPromise)
        })

        return await Promise.all(insertPromises).then(() => {
            session.close();
            return {
                statusCode: 200,
                message: 'oss insert success',
            }
        }, (err) => {
            session.close();
            return {
                statusCode: 201,
                message: 'oss insert fail, try again',
            }
        })

    }).catch((error) => {
        return {
            statusCode: 500,
            message: 'oss insert connect fail',
        }
    })
}




module.exports = { getOssPhotos, deleteOssPhotos }