declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'element-ui/lib/locale/lang/*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const elementLocale: any
}

declare module 'reda-ui' {
  import RedaUI from 'reda-ui'
  export default RedaUI
}

interface Window {
  globalConfig: Record<string, string | number | boolean>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkit: any
  JsTranferIOS: JsTranferIOSType
}
