## 程序设计原则

-   DBController 只关注于数据库 sql 操作
-   Aliyun-OSS 只用于获取图片的在线地址

## 检查可用算力服务器

1. 检查 host 是否对外开放
2. 检查 host 对应的 comfy ui port 是否对外开放
3. 返回可用算力服务器连接状态

## 实时进度

1. 客户端建立 ws 并轮询 GET /queue, 返回 Comfy 当前运行任务是否为当前下发任务
2. 若是, 则取消轮询, 获取 progress 生成进度；若不是, 返回任务前方排队数
3. 轮询应该放在客户端, 不应该放在服务端

## 数据库设计

1. 每个前端应用分别拥有自己的数据库
2. 在数据库中, 一定存在两张结构相同的 data table: **photos**, **users**
3. 数据库有自己的行为时, 在自己的类中实现

## 数据库管理多态

由于此中间件服务会为后续多个前端应用服务, 每个前端应用的数据库管理并不完全一致, 所以有以下设计:

1. 每个前端应用的数据库管理由一个 dbController 操作
2. 一个 js 文件即是一个 dbController
3. 存在一个顶层的 dbControllerMap 对前端应用和数据库管理做映射

    ```js
    // db_controller_map.js
    db_controller_map = {
        style: new StyleDBController(),
        logo: new LogoDBController(),
    }
    ```

4. 前端调用特定接口时需要额外传递一个参数`frontend`, 以表明调用接口的是哪个前端应用, 从而使用正确的 dbController 进行数据库操作

## 注意

-   Multer 会添加一个 body 对象 以及 file 或 files 对象 到 express 的 request 对象中。 body 对象包含表单的文本域信息，file 或 files 对象包含对象表单上传的文件信息。

-   form-data 传递数据时，数据以键值对的形式发送，所有值都被视为字符串

# TODO

-   multer 中间件使用 [fileFilter 函数](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md#filefilter)来控制什么文件可以上传以及什么文件应该跳过，以实现前端传递 file 类型的参数检查

## docker deploy

### DOCKER MYSQL:LATEST

docker run --name mysql \
-dp 8488:3306 8588:33060 \
--mount type=volume,src=AIpack,target=/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=800630_mysql \
mysql:latest

### DOCKER NODE:21.2.0 Bridge

docker run -dp 8388:8388 \
--name node \
-w /app \
--mount type=bind,src=/node/server/,target=/app \
--mount type=bind,src=/node/logs,target=/logs \
node:21.2.0 \
/bin/bash -c "npm install && node /app/index.js && npm run dev-pack-local"

### DOCKER NODE:21.2.0 HOST

docker run -d \
--name node \
--network host \
-w /app \
--mount type=bind,src=/node/server/,target=/app \
--mount type=bind,src=/node/logs,target=/logs \
node:21.2.0 \
/bin/bash -c "npm install && node /app/index.js && npm run dev-pack-local"

### test

http://101.37.30.39:8388/test
/bin/bash -c "npm install "
/bin/bash -c "npm install && node /app/index.js"

docker run -d --name mysql \
--network container:node \
--mount type=volume,src=AIpack,target=/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=800630_mysql \
mysql:latest
