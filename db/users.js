/**
 * @desc user.js
 * @var schema 代表数据库中的一个特定部分或命名空间，如表、视图、存储过程等。
 * - 默认情况下，schema 的概念与数据库的名称相同.
 * - 在某些情况下，它可以代表数据库中的一个特定部分或命名空间.
 */
const mysqlx = require('@mysql/xdevapi');
const registeredInfo = {
    statusCode: 201,
    message: '该用户已存在'
}
const registereSuccessInfo = {
    statusCode: 200,
    message: '注册成功'
}
const loginInErrorInfo = {
    statusCode: 201,
    message: '用户名或密码错误'
}
const loginInSuccessInfo = {
    statusCode: 200,
    message: '登录成功'
}
const connectErrorInfo = {
    statusCode: 500,
    message: '数据库AIpack users连接失败'
}
const config = {
    user: process.env.MYSQL_USER,
    host: process.env.MYSQL_URL,
    port: process.env.MYSQL_PORT,
    password: process.env.MYSQL_PASSWORD
}
const dbTable = 'users'

// 注册
async function setUsers(client, pw) {
    return mysqlx.getSession(config).then(async (session) => {
        // console.log('///查询中', process.en`v.MYSQL_DATABASE, dbTable);

        let resInfo
        const table = session.getSchema(process.env.MYSQL_DATABASE).getTable(dbTable);
        return table.select(['client'])
            .where('client = :client')
            .bind('client', client)
            .execute()
            .then(res => {
                return res.fetchAll()
            })
            .then((res) => {
                // console.log(res, res.length);
                if (res.length > 0) {
                    resInfo = registeredInfo
                }
                else {
                    // possible err: Duplicate entry 'client_test' for key 'users.PRIMARY
                    return table.insert(['client', 'pw'])
                        .values([client, pw])
                        // .values([client, pw]) // 插入多条数据
                        // .values([client, pw])
                        .execute()
                        .then(() => {
                            resInfo = registereSuccessInfo
                        })
                }
            })
            // // 查看全部用户信息
            // .then(() => {
            //     return table.select(['client', 'pw'])
            //         .where('client like :client && pw like :pw')
            //         .bind('client', `client%`)
            //         .bind('pw', `pw%`)
            //         .execute()
            // })
            // .then(res => {
            //     // console.log("res.fetchAll()", res.fetchAll());
            // })
            .then(() => {
                session.close();
                return resInfo
            });
    }).catch(error => {
        return connectErrorInfo
    })


}

// 登录
async function getUsers(client, pw) {
    return mysqlx.getSession(config).then(async (session) => {
        let resInfo
        const table = session.getSchema(process.env.MYSQL_DATABASE).getTable(dbTable);
        return table.select(['client'])
            .where('client = :client and pw = :pw')
            .bind('client', client)
            .bind('pw', pw)
            .execute()
            .then(res => {
                return res.fetchAll()
            })
            .then((res) => {
                // console.log(res, res.length);
                if (res.length > 0) {
                    resInfo = loginInSuccessInfo
                }
                else {
                    resInfo = loginInErrorInfo
                }
            })
            .then(() => {
                session.close();
                return resInfo
            });
    }).catch(error => {
        return connectErrorInfo
    })
}

module.exports = { getUsers, setUsers }