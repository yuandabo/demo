var express = require('express')
var app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/eventdemo', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");//项目上线后改成页面的地址
    res.send('hello world')
})

app.listen(1234, () => console.log(`Example app listening on port ${1234}!`))