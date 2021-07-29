module.exports = app => {
    const userData = require('../../plugins/handle')
    // 获取所有信息queryAllList
    app.get('/admin/get/all', async (req, res) => {
        userData.queryAllList(req, res)
        // res.send(req.body)
    })
    // 获取全部商品接口
    app.get('/admin/get/good', async (req, res) => {
        userData.queryAllFood(req, res)
        // res.send(req.body)
    })
    // 新增商品接口
    app.post('/admin/add/good', async (req, res) => {
        userData.addGood(req, res)
        // res.send(req.body)
    })
    const multer = require('multer')
    const upload = multer({
        dest: __dirname + '/../../uploads'
    })
    // 上传商品图像
    app.post('/admin/upload', upload.single('file'), async (req, res) => {
        const file = req.file
        file.url = `http://127.0.0.1:3001/uploads/${file.filename}`
        res.send(file)
    })

    // 删除商品接口
    app.post('/admin/del/good', async (req, res) => {
        userData.deleteFood(req, res)
        // res.send(req.body)
    })
    // 用Id获取商品接口
    app.post('/admin/getById/good', async (req, res) => {
        userData.queryByIdFood(req, res)
        // res.send(req.body)
    })
    // 用Id获取商品接口
    app.post('/admin/mod/good', async (req, res) => {
        userData.updateFood(req, res)
        // res.send(req.body)
    })
    // 用Name查询商品接口
    app.post('/admin/queryFoodByName/good', async (req, res) => {
        userData.queryFoodByName(req, res)
        // res.send(req.body)
    })
    // 新增type接口
    app.post('/admin/add/type', async (req, res) => {
        userData.addType(req, res)
        // res.send(req.body)
    })
    // 获取type接口
    app.get('/admin/get/type', async (req, res) => {
        userData.queryAllType(req, res)
        // res.send(req.body)
    })
    // 删除type接口
    app.post('/admin/del/type', async (req, res) => {
        userData.deleteType(req, res)
        // res.send(req.body)
    })
    // 获取typebyid
    app.post('/admin/getById/type', async (req, res) => {
        userData.queryByIdType(req, res)
        // res.send(req.body)
    })
    // 修改typebyid
    app.post('/admin/modById/type', async (req, res) => {
        userData.updateType(req, res)
        // res.send(req.body)
    })
    // 获取店铺信息
    app.post('/admin/get/seller', async (req, res) => {
        userData.queryByIdSeller(req, res)
        // res.send(req.body)
    })
    // 修改店铺信息
    app.post('/admin/mod/seller', async (req, res) => {
        userData.updateSeller(req, res)
        // res.send(req.body)
    })
    // 获取所有订单信息接口
    app.get('/admin/get/allOrder', async (req, res) => {
        userData.queryAll(req, res)
        // res.send(req.body)
    })
    // 根据id删除订单接口
    app.post('/admin/del/order', async (req, res) => {
        userData.delete(req, res)
        // res.send(req.body)
    })
    // 查询已上菜订单接口
    app.post('/admin/getByStateFini/order', async (req, res) => {
        userData.queryByStateFin(req, res)
        // res.send(req.body)
    })
    // 查询未上菜订单接口
    app.post('/admin/getByStateCook/order', async (req, res) => {
        userData.queryByStateCook(req, res)
        // res.send(req.body)
    })
    // 修改订单状态接口
    app.post('/admin/updateState/order', async (req, res) => {
        userData.updateState(req, res)
        // res.send(req.body)
    })
    // 修改订单状态接口
    app.post('/admin/updatePayState/order', async (req, res) => {
        userData.updatePayState(req, res)
        // res.send(req.body)
    })
    // 根据phoneNum订单状态接口
    app.post('/admin/queryByPhoneNum/order', async (req, res) => {
        userData.queryByPhoneNum(req, res)
        // res.send(req.body)
    })


}