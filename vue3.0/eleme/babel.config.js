const prodPlugin = []
if (process.env.NODE_ENV === 'production') {
  // 如果是生产环境，则自动清理掉打印的日志，但保留error 与 warn
  prodPlugin.push([
    'transform-remove-console',
    {
      exclude: ['error', 'warn']
    }
  ])
}
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    ['import', {
      libraryName: 'vant',
      libraryDirectory: 'es',
      style: true
    }, 'vant'],
    ...prodPlugin
  ]
}
