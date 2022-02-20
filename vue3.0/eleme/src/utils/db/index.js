export const db = {
  setDb (key, value) {
    value = JSON.stringify(value)
    sessionStorage.setItem(key, value);
  },
  getDb (key) {
    return JSON.parse(sessionStorage.getItem(key))
  },
  delDb (key) {
    sessionStorage.removeItem(key);
  },
  cleanDb () {
    sessionStorage.clear();
  },
  removeGetDb (key) {
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key)
    return JSON.parse(value)
  }
}