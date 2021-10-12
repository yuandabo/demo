export default {
    namespaced: true,
    state: () => ({
        userInfo: null
    }),
    mutations: {
        SET_USERINFO: (state, userInfo) => {
            state.userInfo = userInfo
        }
    }
}