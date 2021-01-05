import service from '../axios'

let request = service

const $http = (url, data) => {
  return request({
    url,
    data,
    method: 'post'
  })
}

const $get = (url, params) => {
  return request({
    url,
    params,
    method: 'get'
  })
}
// 新增商品
export const addGood = data => {
  return $http('/admin/add/good', data)
}

// 查询所有商品
export const getGood = params => {
  return $get('/admin/get/good', params)
}

// 删除商品
export const delGood = data => {
  return $http('/admin/del/good', data)
}

// 根据id查询商品

export const getGoodById = data => {
  return $http('/admin/getById/good', data)
}

// 根据id修改商品

export const modGoodById = data => {
  return $http('/admin/mod/good', data)
}

// 根据name查询商品
export const queryFoodByName = data => {
  return $http('/admin/queryFoodByName/good', data)
}

// 新增商品分类

export const newType = data => {
  return $http('/admin/add/type', data)
}

// 获取所有分类

export const getType = params => {
  return $get('/admin/get/type', params)
}

// 删除指定id分类
export const delType = data => {
  return $http('/admin/del/type', data)
}

// id获取分类信息
export const getTypeById = data => {
  return $http('/admin/getById/type', data)
}

// id修改分类信息
export const modTypeById = data => {
  return $http('/admin/modById/type', data)
}

// 获取店铺信息
export const queryByIdSeller = data => {
  return $http('/admin/get/seller', data)
}

// 修改店铺信息
export const modByIdSeller = data => {
  return $http('/admin/mod/seller', data)
}

// 查询所有订单
export const getAllOrder = params => {
  return $get('/admin/get/allOrder', params)
}

// 修改店铺信息
export const delOrder = data => {
  return $http('/admin/del/order', data)
}

// 获取未完成订单
export const getCookOrder = data => {
  return $http('/admin/getByStateCook/order', data)
}

// 获取已完成订单
export const getFinishOrder = data => {
  return $http('/admin/getByStateFini/order', data)
}

// 修改订单状态
export const updateState = data => {
  return $http('/admin/updateState/order', data)
}
// 修改订单状态
export const updatePayState = data => {
  return $http('/admin/updatePayState/order', data)
}
// phoneNum查询订单订单状态
export const queryByPhoneNum = (data) => {
  return $http('/admin/queryByPhoneNum/order', data)
}