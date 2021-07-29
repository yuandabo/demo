var http = require('http')
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '123456',
    database: 'eleme'
});

connection.connect();


var server = http.createServer()
var origin = null;
var obj = null;
var count = 0;
var price = 0;
var selects = 0;
var name = '';
var foodCount = 0
var insertSql = 0
server.on("request", (req, res) => {
    // console.log(req.headers)
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ' * ',
        'set-cookie': 'name=value'
    });
    req.on('data', (data) => {
        //监听数据变化
        // console.log(Buffer.isBuffer(data.data))
        origin = req.headers.origin
        if (origin === 'http://localhost:8080') {
            // console.log(origin)
            count += 1;
            obj = JSON.parse(data)
            console.log(obj)
            price = obj.price
            selects = obj.selects
            for (const select of selects) {
                name += select.name + ','
                console.log(name)
                foodCount += select.count + ','
            }
            insertSql = name + ';' + foodCount
            //SQL操作
            var addSql = 'INSERT INTO user(id,price,selects) VALUES(?,?,?)';
            var addSqlParams = [count, price, insertSql];
            //增
            connection.query(addSql, addSqlParams, function (err, result) {
                if (err) {
                    console.log('[INSERT ERROR] - ', err.message);
                    return;
                }

                console.log('--------------------------INSERT----------------------------');
                //console.log('INSERT ID:',result.insertId);        
                console.log('INSERT ID:', result);
                console.log('-----------------------------------------------------------------\n\n');
            });

        }
    })
    if (req.method === 'GET') {
        console.log('get')
        //SQL
        var sql = 'SELECT * FROM user';
        //查
        connection.query(sql, function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                return;
            }

            console.log('--------------------------SELECT----------------------------');
            console.log(result);
            res.end(JSON.stringify(result))
            console.log('------------------------------------------------------------\n\n');
        });
    }
})

server.listen(1337, '127.0.0.1', () => {
    console.log('服务启动')
})