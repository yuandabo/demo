/*
  本地储存表结构
  @params codes:[]   // 自选code集合
  about：{
    code:{
      hasHowMuchMoney:'',
      mark:'',
      date:''
    }
  }
*/
// console.log(this)
// //  设置缓存
// export const setDb = (key, value) => {
//   this.uni.setStorageSync(key, value)
// }
// //  取缓存
// export const getDb = (key) => {
//   return  this.uni.getStorageSync(key)
// }
// // 存储mark
// export const setMarkIntoDb = (code, mark) => {
//   const obj = getDb(code)
//   obj[code].mark = mark
//   setDb(code, obj)
// }
// // 存储mark
// export const getMarkIntoDb = (code) => {
//   const obj = getDb(code)
//   return obj[code].mark
// }