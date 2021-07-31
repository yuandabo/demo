/* eslint-disable */
export function cleanArray (actual: any[]): any[] {
  const newArray = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i])
    }
  }
  return newArray
}
// url处理
export function param (json: any): string {
  if (!json) return ''
  return cleanArray(Object.keys(json).map(key => {
    if (json[key] === undefined) return ''
    return encodeURIComponent(key) + '=' +
      encodeURIComponent(json[key])
  })).join('&')
}

// 获得当前月份有多少天
export function getDays (time: any): number {
  // 构造当前日期对象
  const date = new Date(time)
  // 获取年份
  const year = date.getFullYear()
  // 获取当前月份
  const mouth = date.getMonth() + 1
  // 定义当月的天数；
  let days
  // 当月份为二月时，根据闰年还是非闰年判断天数
  if (mouth === 2) {
    days = year % 4 === 0 ? 29 : 28
  } else if (mouth === 1 || mouth === 3 || mouth === 5 || mouth === 7 || mouth === 8 || mouth === 10 || mouth === 12) {
    // 月份为：1,3,5,7,8,10,12 时，为大月.则天数为31；
    days = 31
  } else {
    // 其他月份，天数为：30.
    days = 30
  }
  return days
}

export function param2Obj (url: string) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  return JSON.parse('{"' + decodeURIComponent(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
}

// 时间戳格式化
export function parseTime (time:any, format = '{y}-{m}-{d} {h}:{i}:{s}'): string {
  if (arguments.length === 0) {
    return ''
  }
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string') {
      // 兼容IE，safari
      time = time.replace(/-/g, '/')
    }
    if (('' + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  return format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key].toString()
    if (key === 'a') return ['一', '二', '三', '四', '五', '六', '日'][parseInt(value) - 1]
    if (result.length > 0 && parseInt(value) < 10) {
      value = '0' + value.toString()
    }
    return value || '0'
  })
}

/**
 * @desc 遍历源数据，匹配与value数据，并返回其属性值
 * @param [srcArray] - 目标数组
 * @param [sValue] - 匹配条件
 * @param [sValueField] - key属性名
 * @param [sTextField] - 返回的属性名
 * @returns {string}
 */
export function getTextByValueField (srcArray: any[], sValue: any, sValueField = 'value', sTextField = 'text'): string {
  const result = srcArray.find(curr => curr[sValueField] === sValue + '')
  return result ? result[sTextField] : ''
}
/**
 * @desc 根据传入的key，将ArrayObject数据组成一个单个格式的数组
 * @param [srcArray] - 目标数组
 * @param [sKey] - object对象的某个属性名
 * @returns {Array}
 */
export function aoTransformToArray (srcArray: any[], sKey: string): string {
  if (!sKey) {
    throw new Error('[aoTransformToArray] require sKey parameter')
  }
  return srcArray.reduce((acc, cur) => {
    acc.push(cur[sKey])
    return acc
  }, [])
}
/**
 * @desc 转换成树形结构
 * @param data
 * @param key
 * @param parentKey
 * @param childKey
 * @returns {Array}
 */
export function arrayTransformToTree (data: any[], key = 'id', parentKey = 'parentId', childKey = 'children', parentNameKey = 'name'): any {
  const tree = []
  const tmp: Record<string, any> = {}
  for (let i = 0; i < data.length; i++) {
    tmp[data[i][key]] = data[i]
  }
  for (let i = 0; i < data.length; i++) {
    if (tmp[data[i][parentKey]] && data[i][key] !== data[i][parentKey]) {
      if (!tmp[data[i][parentKey]][childKey]) {
        tmp[data[i][parentKey]][childKey] = []
      }
      if (tmp[data[i][parentKey]][parentNameKey]) {
        data[i].parentName = tmp[data[i][parentKey]][parentNameKey]
      }
      tmp[data[i][parentKey]][childKey].push(data[i])
    } else {
      tree.push(data[i])
    }
  }
  return tree
}

// 滚动到指定位置
export function scrollTo (element: Element, to: number, duration: number): void {
  if (duration <= 0) return
  const difference = to - element.scrollTop
  const perTick = difference / duration * 10
  setTimeout(() => {
    element.scrollTop = element.scrollTop + perTick
    if (element.scrollTop === to) return
    scrollTo(element, to, duration - 10)
  }, 10)
}

export function objectMerge (target: any, source: any) {
  if (typeof target !== 'object') {
    target = {}
  }
  if (Array.isArray(source)) {
    return source.slice()
  }
  for (const property in source) {
    if (Object.hasOwnProperty.call(target, property)) {
      const sourceProperty = source[property]
      if (typeof sourceProperty === 'object') {
        target[property] = objectMerge(target[property], sourceProperty)
        continue
      }
      target[property] = sourceProperty
    }
  }
  return target
}

export function deepClone (source: any) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments')
  }
  const targetObj: Record<string, any> = source.constructor === Array ? [] : {}
  for (const keys in source) {
    if (Object.hasOwnProperty.call(source, keys)) {
      if (source[keys] && typeof source[keys] === 'object') {
        targetObj[keys] = source[keys].constructor === Array ? [] : {}
        targetObj[keys] = deepClone(source[keys])
      } else {
        targetObj[keys] = source[keys]
      }
    }
  }
  return targetObj
}

// export function debounce(func, wait, immediate) {
//   let timeout, args, context, timestamp, result

//   const later = function() {
//     // 据上一次触发时间间隔
//     const last = +new Date() - timestamp
//     // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
//     if (last < wait && last > 0) {
//       timeout = setTimeout(later, wait - last)
//     } else {
//       timeout = null
//       // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
//       if (!immediate) {
//         result = func.apply(context, args)
//         if (!timeout) context = args = null
//       }
//     }
//   }
//   return function(...args) {
//     context = this
//     timestamp = +new Date()
//     const callNow = immediate && !timeout
//     // 如果延时不存在，重新设定延时
//     if (!timeout) timeout = setTimeout(later, wait)
//     if (callNow) {
//       result = func.apply(context, args)
//       context = args = null
//     }
//     return result
//   }
// }

export function arrSort (array: any[]) {
  const len = array.length
  let d
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len; j++) {
      if (Number(array[i].replace(/[^0-9|\\.]+/g, '')) < Number(array[j].replace(/[^0-9|\\.]+/g, ''))) {
        d = array[j]
        array[j] = array[i]
        array[i] = d
      }
    }
  }
  return array
}

export function generateStr (num = 5): string {
  function getCharCode (): number {
    const charCode = Math.ceil(Math.random() * 74 + 48)
    if ((charCode >= 58 && charCode <= 64) || (charCode >= 91 && charCode <= 96)) {
      return getCharCode()
    } else {
      return charCode
    }
  }
  let str = ''
  for (let i = 0; i < num; i++) {
    str += String.fromCharCode(getCharCode())
  }
  return str
}
