const mysql = require('mysql')
// myqsql配置文件
const mysqlconfig = require('./mysql.js')
// 连接池配置
var poolextend = require('./poolextend');
// 引入sql
var sql = require('./sql');
// 引入json模块
var json = require('./json');
// 使用连接池，提升性能
var pool = mysql.createPool(poolextend({}, mysqlconfig));

var userData = {
  total: 0,
  add: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      // var param = req.query || req.params;
      var param = req.body;
      const payState = '未支付'
      // console.log(param.selects)
      connection.query(sql.insert, [param.price, param.selects, param.state = '未上菜', param.phoneNum, payState], function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result) {
          console.log(result.insertId)
          var _result = result;
          result = {
            result: 'add',
            data: _result.insertId
          }
        }
        // 以json形式，把操作结果返回给前台页面
        json(res, result);
        // 释放连接 
        connection.release();
      });
    });
  },
  delete: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      var id = req.body.id;
      connection.query(sql.delete, id, function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result.affectedRows > 0) {
          result = 'delete';
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  update: function (req, res, next) {
    var param = req.body;
    if (param.name == null || param.age == null || param.id == null) {
      json(res, undefined);
      return;
    }
    pool.getConnection(function (err, connection) {
      connection.query(sql.update, [param.name, param.age, +param.id], function (err, result) {
        if (result.affectedRows > 0) {
          result = 'update'
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  updateState: function (req, res, next) {
    var param = req.body;
    // if (param.name == null || param.age == null || param.id == null) {
    //     json(res, undefined);
    //     return;
    // }
    pool.getConnection(function (err, connection) {
      connection.query(sql.updateState, ['已上菜', param.id], function (err, result) {
        if (result.affectedRows > 0) {
          result = 'update'
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  updatePayState: function (req, res, next) {
    var param = req.body;
    // if (param.name == null || param.age == null || param.id == null) {
    //     json(res, undefined);
    //     return;
    // }
    pool.getConnection(function (err, connection) {
      connection.query(sql.updatePayState, ['已支付', param.id], function (err, result) {
        if (result.affectedRows > 0) {
          result = 'update'
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  queryById: function (req, res, next) {
    var id = +req.body.id;
    pool.getConnection(function (err, connection) {
      connection.query(sql.queryById, id, function (err, result) {
        if (result != '') {
          var _result = result;
          console.log(result)
          result = {
            result: 'select',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  queryByStateFin: function (req, res, next) {
    // var state = req.body.state;
    console.log(req.body, 'queryByStateFin')
    var _this = this
    var pageSize = +req.body.pageSize || 20;
    var page = +req.body.page || 1;
    var nowTotal = (page - 1) * pageSize
    // var phoneNum = +req.body.phoneNum;
    this.queryOrderTotalByStateFin('已上菜').then(response => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryByStateFin, ['已上菜', nowTotal, pageSize], function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result != '') {
            var _result = result;
            result = {
              result: 'selectall',
              data: _result
            }
          } else {
            result = undefined;
          }
          json(res, result, _this.total);
          connection.release();
        });
      });
    })
  },
  queryOrderTotalByStateFin (state) {
    var _this = this
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryOrderTotalByStateFin, state, function (err, result) {
          console.log(result[0].total)
          _this.total = result[0].total
          connection.release();
          resolve(result[0].total)
        });
      });
    })
  },
  queryByStateCook: function (req, res, next) {
    // var state = req.body.state;
    console.log(req.body, 'queryByStateFin')
    var _this = this
    var pageSize = +req.body.pageSize || 20;
    var page = +req.body.page || 1;
    var nowTotal = (page - 1) * pageSize
    this.queryOrderTotalByStateFin('未上菜')
      .then(response => {
        pool.getConnection(function (err, connection) {
          connection.query(sql.queryByStateFin, ['未上菜', nowTotal, pageSize], function (err, result) {
            if (result != '') {
              var _result = result;
              result = {
                result: 'selectall',
                data: _result
              }
            } else {
              result = undefined;
            }
            json(res, result, _this.total);
            connection.release();
          });
        });
      })
  },
  queryAll: function (req, res, next) {
    var _this = this
    console.log(req.query)
    var pageSize = +req.query.pageSize || 20;
    var page = +req.query.page || 1;
    var nowTotal = (page - 1) * pageSize
    this.queryOrderTotal().then(response => {
      // console.log(response)
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryAll, [nowTotal, pageSize], function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result != '') {
            var _result = result;
            result = {
              result: 'selectall',
              data: _result
            }
          } else {
            result = undefined;
          }
          json(res, result, _this.total);
          connection.release();
        });
      });
    })
    // pool.getConnection(function (err, connection) {
    //     connection.query(sql.queryAll, [nowTotal, pageSize], function (err, result) {
    //         if (result != '') {
    //             var _result = result;
    //             result = {
    //                 result: 'selectall',
    //                 data: _result
    //             }
    //         } else {
    //             result = undefined;
    //         }
    //         json(res, result, _this.total);
    //         connection.release();
    //     });
    // });
  },
  queryTotal (req, res, next) {
    var _this = this
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryTotal, function (err, result) {
          console.log(result[0].total)
          _this.total = result[0].total
          connection.release();
          resolve(result[0].total)
        });
      });
    })
  },
  queryOrderTotal (req, res, next) {
    var _this = this
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryOrderTotal, function (err, result) {
          console.log(result[0].total)
          _this.total = result[0].total
          connection.release();
          resolve(result[0].total)
        });
      });
    })
  },
  queryOrderTotalByPhoneNum (phoneNum) {
    var _this = this
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryOrderTotalByPhoneNum, phoneNum, function (err, result) {
          console.log(result[0].total)
          _this.total = result[0].total
          connection.release();
          resolve(result[0].total)
        });
      });
    })
  },
  queryByPhoneNum: function (req, res, next) {
    console.log(req.body, 'queryByPhoneNum')
    var _this = this
    var pageSize = +req.body.pageSize || 20;
    var page = +req.body.page || 1;
    var nowTotal = (page - 1) * pageSize
    var phoneNum = +req.body.phoneNum;
    this.queryOrderTotalByPhoneNum(phoneNum).then(response => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryByPhoneNum, [phoneNum, nowTotal, pageSize], function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result != '') {
            var _result = result;
            result = {
              result: 'selectall',
              data: _result
            }
          } else {
            result = undefined;
          }
          json(res, result, _this.total);
          connection.release();
        });
      });
    })
  },
  // good
  addGood: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      // var param = req.query || req.params;
      var param = req.body;
      console.log(param)
      connection.query(sql.insertFood, [param.name, param.price, param.description, param.info, param.image, param.type_id], function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result) {
          result = 'add'
        }
        // 以json形式，把操作结果返回给前台页面
        json(res, result);
        // 释放连接 
        connection.release();
      });
    });
  },
  queryAllFood: function (req, res, next) {
    var _this = this
    console.log(req.query)
    var pageSize = +req.query.pageSize || 20;
    var page = +req.query.page || 1;
    var nowTotal = (page - 1) * pageSize
    // const total = this.queryTotal()
    this.queryTotal().then(response => {
      console.log(response)
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryAllFood, [nowTotal, pageSize], function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result != '') {
            var _result = result;
            result = {
              result: 'selectall',
              data: _result
            }
          } else {
            result = undefined;
          }
          json(res, result, _this.total);
          connection.release();
        });
      });
    })
    // console.log(this.total)

  },
  deleteFood: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      var id = req.body.id;
      connection.query(sql.deleteFood, id, function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result.affectedRows > 0) {
          result = 'delete';
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  queryByIdFood: function (req, res, next) {
    var id = +req.body.id;
    pool.getConnection(function (err, connection) {
      connection.query(sql.queryByIdFood, id, function (err, result) {
        if (result != '') {
          var _result = result;
          result = {
            result: 'select',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  updateFood: function (req, res, next) {
    var param = req.body;
    // if (param.name == null || param.age == null || param.id == null) {
    //     json(res, undefined);
    //     return;
    // }
    pool.getConnection(function (err, connection) {
      connection.query(sql.updateFood, [param.name, param.price, param.description, param.info, param.image, param.type_id, +param.id], function (err, result) {
        if (result.affectedRows > 0) {
          result = 'update'
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  queryFoodByName: function (req, res, next) {
    var _this = this
    var pageSize = +req.body.pageSize || 20;
    var page = +req.body.page || 1;
    var nowTotal = (page - 1) * pageSize
    // var phoneNum = +req.body.phoneNum;
    const foodName = '%' + req.body.foodName + '%';
    this.queryFoodByNameTotal(foodName).then(response => {
      pool.getConnection(function (err, connection) {
        connection.query(sql.queryFoodByName, [foodName, nowTotal, pageSize], function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result != '') {
            var _result = result;
            result = {
              result: 'selectall',
              data: _result
            }
          } else {
            result = undefined;
          }
          json(res, result, _this.total);
          connection.release();
        });
      });
    })
  },
  queryFoodByNameTotal (name) {
    var _this = this
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          console.log(err)
        }
        connection.query(sql.queryFoodByNameTotal, [name], function (err, result) {
          if (err) {
            console.log(err)
          }
          console.log(result[0].total)
          _this.total = result[0].total
          connection.release();
          resolve(result[0].total)
        });
      });
    })
  },
  // type 
  addType: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      // var param = req.query || req.params;
      var param = req.body;
      // console.log(param.selects)
      connection.query(sql.insertType, [param.name], function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result) {
          result = 'add'
        }
        // 以json形式，把操作结果返回给前台页面
        json(res, result);
        // 释放连接 
        connection.release();
      });
    });
  },
  queryAllType: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      connection.query(sql.queryAllType, function (err, result) {
        if (result != '') {
          var _result = result;
          result = {
            result: 'selectall',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  deleteType: function (req, res, next) {
    pool.getConnection(function (err, connection) {
      var id = req.body.id;
      connection.query(sql.deleteType, id, function (err, result) {
        console.log(result)
        if (err) {
          console.log(err)
        }
        if (result.affectedRows > 0) {
          result = 'delete';
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  queryByIdType: function (req, res, next) {
    var id = +req.body.id;
    pool.getConnection(function (err, connection) {
      connection.query(sql.queryByIdType, id, function (err, result) {
        if (result != '') {
          var _result = result;
          result = {
            result: 'select',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  updateType: function (req, res, next) {
    var param = req.body;
    // if (param.name == null || param.age == null || param.id == null) {
    //     json(res, undefined);
    //     return;
    // }
    console.log(param)
    pool.getConnection(function (err, connection) {
      connection.query(sql.updateType, [param.name, +param.id], function (err, result) {
        if (err) {
          console.log(err)
        }
        if (result.affectedRows > 0) {
          result = 'update'
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  // seller
  queryByIdSeller: function (req, res, next) {
    var id = 1
    pool.getConnection(function (err, connection) {
      connection.query(sql.queryByIdSeller, id, function (err, result) {
        if (result != '') {
          var _result = result;
          result = {
            result: 'select',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  updateSeller: function (req, res, next) {
    var param = req.body;
    // if (param.name == null || param.age == null || param.id == null) {
    //     json(res, undefined);
    //     return;
    // }
    const id = 1
    pool.getConnection(function (err, connection) {
      connection.query(sql.updateSeller, [
        param.name,
        param.description,
        param.deliveryTime,
        param.score,
        param.serviceScore,
        param.rankRate,
        param.minPrice,
        param.deliveryPrice,
        param.ratingCount,
        param.sellCount,
        param.bulletin,
        param.avatar,
        +id
      ],
        function (err, result) {
          if (err) {
            console.log(err)
          }
          if (result.affectedRows > 0) {
            result = 'update'
          } else {
            result = undefined;
          }
          json(res, result);
          connection.release();
        });
    });
  },
  // all
  queryAllList: async function (req, res, next) {
    let obj = {}
    await pool.getConnection(function (err, connection) {
      const id = 1
      connection.query(sql.queryByIdSeller, id, function (err, result) {
        obj.seller = result[0]
        if (result != '') {
          var _result = result;
          result = {
            result: 'selectall',
            data: _result
          }
        } else {
          result = undefined;
        }
        // json(res, result);
        // console.log(result)
        connection.release();
      });
    });
    await pool.getConnection(function (err, connection) {
      connection.query(sql.queryAllType, async function (err, result) {
        // console.log(typeList)
        let typeList = []

        for (let i = 0; i < result.length; i++) {
          const id = result[i].id
          const flagObj = result[i]
          await a(flagObj, id)
        }

        function a (flagObj, id) {
          return new Promise(resolve => {
            connection.query(sql.queryByTypeIdFood, id, function (err, result) {
              // if(err)
              Object.defineProperty(flagObj, 'foods', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: result
              })
              typeList.push(flagObj)
              // console.log(typeList)
              resolve()
            })
          })
        }

        obj.goods = typeList
        if (result != '') {
          var _result = obj;
          result = {
            result: 'selectall',
            data: _result
          }
        } else {
          result = undefined;
        }
        json(res, result);
        connection.release();
      });
    });
  },
  getmock: function (req, res, next) {
    json(res, { id: 213 })
  }
};
module.exports = userData;