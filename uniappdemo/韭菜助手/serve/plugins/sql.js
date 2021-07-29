// SQL语句封裝
const user = {
    insert: 'INSERT INTO user(price,selects,state,phoneNum,payState) VALUES(?,?,?,?,?)',
    update: 'UPDATE user SET name=?, age=? WHERE id=?',
    delete: 'DELETE FROM user WHERE id=?',
    updateState: 'UPDATE user SET state=? WHERE id=?',
    updatePayState: 'UPDATE user SET payState=? WHERE id=?',
    queryById: 'SELECT * FROM user WHERE id=?',
    queryByStateFin: 'SELECT * FROM user WHERE state=? order by id desc limit ?,?',
    queryOrderTotalByStateFin: `SELECT count(1) as total FROM user WHERE state=?`,
    queryAll: `SELECT * FROM user order by id desc limit ?,?`,
    queryOrderTotal: `SELECT count(1) as total FROM user`,
    queryByPhoneNum: `SELECT * FROM user WHERE phoneNum LIKE '?%' order by id desc limit ?,?`,
    queryOrderTotalByPhoneNum: `SELECT count(1) as total FROM user WHERE phoneNum LIKE '?%'`,
    // food
    insertFood: 'INSERT INTO food(name,price,description,info,image,type_id) VALUES(?,?,?,?,?,?)',
    updateFood: 'UPDATE food SET name=?, price=?, description=?, info=?, image=?, type_id=? WHERE id=?',
    deleteFood: 'DELETE FROM food WHERE id=?',
    queryByIdFood: 'SELECT * FROM food WHERE id=?',
    queryByTypeIdFood: 'SELECT * FROM food WHERE type_id=?',
    queryAllFood: `SELECT * FROM food order by id desc limit ?,?`,
    queryTotal: `SELECT count(1) as total FROM food`,
    queryFoodByName: `SELECT * FROM food WHERE name LIKE ? order by id desc limit ?,?`,
    queryFoodByNameTotal: `SELECT count(1) as total FROM food WHERE name LIKE ?`,
    // ratings
    insertRatings: 'INSERT INTO ratings(price,selects) VALUES(?,?)',
    updateRatings: 'UPDATE ratings SET name=?, age=? WHERE id=?',
    deleteRatings: 'DELETE FROM ratings WHERE id=?',
    queryByIdRatings: 'SELECT * FROM ratings WHERE id=?',
    queryAllRatings: `SELECT * FROM ratings`,
    // seller 
    // insertSeller: 'INSERT INTO seller(price,selects) VALUES(?,?)',
    updateSeller: 'UPDATE seller SET name=?, description=?, deliveryTime=?, score=?, serviceScore=?, rankRate=?, minPrice=?, deliveryPrice=?, ratingCount=?, sellCount=?, bulletin=?, avatar=? WHERE id=?',
    // deleteSeller: 'DELETE FROM seller WHERE id=?',
    queryByIdSeller: 'SELECT * FROM seller WHERE id=?',
    // queryAllSeller: `SELECT * FROM seller`,
    // type 
    insertType: 'INSERT INTO type(name) VALUES(?)',
    updateType: 'UPDATE type SET name=? WHERE id=?',
    deleteType: 'DELETE FROM type WHERE id=?',
    queryByIdType: 'SELECT * FROM type WHERE id=?',
    queryAllType: `SELECT * FROM type`,
};
module.exports = user