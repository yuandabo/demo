export const db = {
    setDb(key, value) {
        sessionStorage.setItem(key, value);
    },
    getDb(key) {
        return sessionStorage.getItem(key);
    },
    delDb(key) {
        sessionStorage.removeItem(key);
    },
    cleanDb() {
        sessionStorage.clear();
    },
    removeGetDb(key) {
        const value = sessionStorage.getItem(key);
        sessionStorage.removeItem(key)
        return value
    }
}