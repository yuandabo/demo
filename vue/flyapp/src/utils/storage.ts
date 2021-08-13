const sidebarStatusKey = 'sidebar_status'
export const getSidebarStatus: () => (string | undefined | null) =
  () => Storage.get(sidebarStatusKey)
export const setSidebarStatus: (sidebarStatus: string) => void =
  (sidebarStatus: string) => Storage.set(sidebarStatusKey, sidebarStatus)

const languageKey = 'language'
export const getLanguage: () => (string | undefined | null) =
  () => Storage.get(languageKey)
export const setLanguage: (language: string) => void =
  (language: string) => Storage.set(languageKey, language)

const sizeKey = 'size'
export const getSize: () => (string | undefined | null) =
  () => Storage.get(sizeKey)
export const setSize: (size: string) => void =
  (size: string) => Storage.set(sizeKey, size)

const tokenKey = 'access_token'
export const getToken: () => (string | undefined | null) =
  () => Storage.get(tokenKey)
export const setToken: (token: string) => void =
  (token: string) => Storage.set(tokenKey, token)
export const removeToken: () => void =
  () => Storage.remove(tokenKey)

/**
 * 存储实现，可修改成cookie等其它存储方式
 */
const Storage = {
  get (key: string) {
    return localStorage.getItem(key)
  },
  set (key: string, value: string) {
    return localStorage.setItem(key, value)
  },
  remove (key: string) {
    return localStorage.removeItem(key)
  }
}
