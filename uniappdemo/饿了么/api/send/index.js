import service from '../axios'

let request = service

const $http = (url, data) => {
  console.log(url)
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

// 保存订单
export const saveOrder = data => {
  return $http('/user/order/save', data)
}

// 初始化接口
export const getAll = params => {
  return $get('/admin/get/all', params)
}

// 获取订单状态
export const queryById = data => {
  return $http('/user/order/queryById', data)
}