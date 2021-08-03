const defaultConfigure = {
  header: {'content-type':'application/json'},
  method: 'GET',
  dataType: 'json',
  responseType: 'text',
}
export const request = (params) => 
  new Promise((resolve, reject) => {
    wx.request({
      ...Object.assign(defaultConfigure, params),
      success: (result)=>{
        resolve(result)
      },
      fail: (err)=>{
        reject(err)
      },
      complete: ()=>{}
    });
  })
