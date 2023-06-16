/*
 * @Description:
 * @version:
 * @Author: 卓文睿
 * @Date: 2022-11-08 11:28:15
 * @LastEditors: yuandabo 540496776@qq.com
 * @LastEditTime: 2023-06-16 15:35:46
 */
const fs = require('fs')
const path = require('path')
 
/**
 * 使用spilt方法实现模糊查询
 * @param  {Array}  list     进行查询的数组
 * @param  {String} keyWord  查询的关键词
 * @return {Array}           查询的结果
 */
 function fuzzyQuery(list, keyWord) {
  let contain = false
  for (var i = 0; i < list.length; i++) {
    let reg = new RegExp(list[i],'i')
    if (reg.test(keyWord)) {
      contain = true
      return contain
    }
  }
  return contain
}
/**
 * 复制文件夹或文件到指定目录
 * @param {String} sourcePath  原始目录
 * @param {String} targetPath  目标目录
 * @param {Array} filterNames  需要过滤的字符串数组
 */
function copyFile(sourcePath, targetPath, filterNames = null) {
  const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true })
  sourceFile.forEach((file) => {
    const newSourcePath = path.resolve(sourcePath, file.name)
    const newTargetPath = path.resolve(targetPath, file.name)
    if (file.isDirectory()) {
      if (!fs.existsSync(newTargetPath)) {
        // 创建文件夹
        fs.mkdirSync(newTargetPath, { recursive: true })
      }
      // isExist(newTargetPath)
      copyFile(newSourcePath, newTargetPath)
    } else {
      (!filterNames || !fuzzyQuery(filterNames, file.name)) && fs.copyFileSync(newSourcePath, newTargetPath)
    }
  })
}
function delDir(path) {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    // files.forEach((file, index) => {
    files.forEach((file) => {
      let curPath = path + '/' + file
      //判断是否是文件夹
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath) //递归删除文件夹
      } else {
        //是文件的话说明是最后一层不需要递归
        fs.existsSync(curPath) && fs.unlinkSync(curPath) //删除文件
      }
    })
    fs.rmdirSync(path)
  }
  return true
}
module.exports = {
  copyFile: copyFile,
  delDir: delDir
}