const mysql = require('mysql2');

async function setPosters(...posteRecord) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_URL,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        password: process.env.MYSQL_PASSWORD,
        port: process.env.MYSQL_PORT

    });

    // SQL预处理
    // execute 将在内部调用 prepare 和 query
    connection.execute(
        ' INSERT INTO users (client, oss_url) VALUES (? , ? ) ',
        [posteRecord.client, posteRecord.oss_url],
        function (err, results, fields) {
            console.log("results", results); // 结果集
            console.log("fields", fields); // 额外的元数据（如果有的话）
        }
    );
}
async function getPosters() {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_URL,
        user: process.env.MYSQL_USER,
        database: process.env.MYSQL_DATABASE,
        password: process.env.MYSQL_PASSWORD,
        port: process.env.MYSQL_PORT

    });
    // SQL预处理
    // execute 将在内部调用 prepare 和 query
    connection.execute(
        'SELECT * FROM `users` WHERE `client` = ? ',
        ['zl'],
        function (err, results, fields) {
            console.log("results", results); // 结果集
            console.log("fields", fields); // 额外的元数据（如果有的话）
        }
    );
}

module.exports = { getUsers, setUsers }