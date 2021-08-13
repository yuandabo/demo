export const login = (params) => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (result) => {
        resolve(result)
      },
      fail: (err) => {
        reject(err)
      },
      complete: () => {
      }
    })
  })
}

export const requestPayment = (params) => {
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      ...params,
      success(result) {
        resolve(result)
      },
      fail: (err) => {
        reject(err)
      },
    })
  })
}

/**
 *  promise 形式  showToast
 * @param {object} param0 参数
 */
export const showToast=({title})=>{
  return new Promise((resolve,reject)=>{
    wx.showToast({
      title: title,
      icon: 'none',
      success :(res) =>{
        resolve(res);
      },
      fail:(err)=>{
        reject(err);
      }
    })
  })
}