# 程序设计原则

-   DBController 只关注于数据库 sql 操作
-   Aliyun-OSS 只用于获取图片的在线地址

# 注意

-   Multer 会添加一个 body 对象 以及 file 或 files 对象 到 express 的 request 对象中。 body 对象包含表单的文本域信息，file 或 files 对象包含对象表单上传的文件信息。

-   form-data 传递数据时，数据以键值对的形式发送，所有值都被视为字符串

# TODO

-   multer 中间件使用 [fileFilter 函数](https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md#filefilter)来控制什么文件可以上传以及什么文件应该跳过，以实现前端传递 file 类型的参数检查
