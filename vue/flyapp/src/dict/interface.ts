/*
  模块映射字典
*/
export type MODULEIDLISTTYPE = {
  MANAGE: {
    HOME: string
    COMMONAPP: string
  }
  PERSONAL: {
    HOME: string
    COMMONAPP: string
  }
}

// 模块类型
export const MODULEIDLIST = ():MODULEIDLISTTYPE => ({
  MANAGE: {
    HOME: 'app_manage:home',
    COMMONAPP: 'app_manage:commonApplication'
  },
  PERSONAL: {
    HOME: 'app_personal:home',
    COMMONAPP: 'app_personal:commonApplication'
  }
})
