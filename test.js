const axios = require('axios');
const FormData = require("form-data");
const fs = require("fs");

let formData = new FormData(); // 当前为空
formData.append('image', fs.readFileSync('./uploads/temp.jpg'), { contentType: 'image/jpeg' });
formData.append('prompt', 'workflow_api-snow');
formData.append('client', 'client_id_argv');
axios({
    headers: {
        'Content-Type': 'multipart/form-data'
    },
    method: 'POST',
    // url: 'http://10.1.251.11:8388/stylize',
    url: 'http://localhost:8388/stylize',
    data: formData,
}).then(res => {
    console.log(res.data);
});