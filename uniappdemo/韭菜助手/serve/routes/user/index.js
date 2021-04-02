module.exports = app => {
    app.post('/user/order/save', async (req, res) => {
        const userData = require('../../plugins/handle')
        userData.add(req, res)
        // res.send(req.body)
    })
    app.post('/user/order/queryById', async (req, res) => {
        const userData = require('../../plugins/handle')
        userData.queryById(req, res)
        // res.send(req.body)
    })
}