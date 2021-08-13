import CryptoJS from 'crypto-js'

type KEY_TYPE = {
  key: string,
  iv: string
}
// AES加解密key
export const AES_CRYPT: Record<string, KEY_TYPE> = {
  USER: {
    key: '9876543210fedcba',
    iv: '1dd89`X3nVfmchm?'
  },
  TOKEN: {
    key: '1234567890abcdef',
    iv: '1dd89`X3nVfmchm?'
  }
}

/**
 * AES加密
 * @param {String} str 待加密字符
 * @param {String} type 加密类型(可能对应不同key)
 * @returns {String}
 */
export function aesEncrypt (str: string, type = 'TOKEN'): string {
  const key = CryptoJS.enc.Latin1.parse(AES_CRYPT[type].key)
  const iv = CryptoJS.enc.Latin1.parse(AES_CRYPT[type].iv)

  return CryptoJS.AES.encrypt(str, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7 // 后台用的是pad.Pkcs5,前台对应为Pkcs7
  }).toString()
}

/**
 * AES解密
 * @param {String} encrypted 已加密字符
 * @param {String} type 解密类型(可能对应不同key)
 * @returns {String}
 */
export function aesDecrypt (encrypted: string, type = 'TOKEN'): string {
  const key = CryptoJS.enc.Latin1.parse(AES_CRYPT[type].key)
  const iv = CryptoJS.enc.Latin1.parse(AES_CRYPT[type].iv)

  return CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString(CryptoJS.enc.Utf8)
}

/**
 * 加扰算法
 *
 * @param {String} str 明文
 * @param {Number} n   指定的二维数组的列数
 * @return  加扰后的密文
 */
export function jiaRao (str: string, n = 7): string {
  let len, d, i, j
  const temp = []
  const miwen = []
  len = str.length
  if ((d = len % n) !== 0) {
    len = len + n - d
  }
  const m = len / n
  for (i = 0; i < m; i++) {
    for (j = 0; j < n; j++) {
      if (i * n + j < str.length) {
        temp[i + m * j] = str[i * n + j]
      } else {
        temp[i + m * j] = ' '
      }
    }
  }
  while (temp[len - 1] === ' ') {
    len--
  }
  for (i = 0; i < len; i++) {
    miwen[i] = temp[i]
  }
  return miwen.join('')
}

/**
 * 解扰算法
 *
 * @param {String} miwen 混淆后的密文
 * @param {Number} n     指定的二维数组的列数
 * @return 明文
 */
export function jieRao (miwen: string, n = 7): string {
  let len, d, i, j
  const temp = []
  const str = []
  len = miwen.length
  if ((d = len % n) !== 0) {
    len = len + n - d
  }
  const m = len / n
  for (i = 0; i < n; i++) {
    for (j = 0; j < m; j++) {
      if (i * m + j < miwen.length) {
        temp[i + j * n] = miwen[i * m + j]
      } else {
        temp[i + n * j] = ' '
      }
    }
  }
  while (temp[len - 1] === ' ') {
    len--
  }
  for (i = 0; i < len; i++) {
    str[i] = temp[i]
  }
  return str.join('')
}
