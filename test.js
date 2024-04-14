// const axios = require('axios');
// const FormData = require("form-data");
// const fs = require("fs");

// let formData = new FormData(); // 当前为空
// formData.append('image', fs.readFileSync('./uploads/temp.jpg'));
// formData.append('prompt', 'InsSnow');
// formData.append('client', 'client_id_argv');
// axios.post('http://localhost:8388/stylize', formData.getBuffer(), {
//     headers: {
//         ...formData.getHeaders()
//     }
//     // url: 'http://10.1.251.11:8388/stylize',
// }).then(res => {
//     console.log('/////');
// });