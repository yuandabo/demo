export function canvasWM ({
  container = document.body,
  width = '270px',
  height = '250px',
  textAlign = 'left',
  textBaseline = 'middle',
  font = '16px PingFangSC-Medium',
  fillStyle = 'rgba(155, 182, 220, 0.5)',
  content = '请勿外传',
  rotate = -40,
  zIndex = -1
} = {}) {
  // const args = arguments[0]
  const canvas = document.createElement('canvas')

  canvas.setAttribute('width', width)
  canvas.setAttribute('height', height)
  const ctx:any = canvas.getContext('2d')

  ctx.textAlign = textAlign
  ctx.textBaseline = textBaseline
  ctx.font = font
  ctx.fillStyle = fillStyle
  ctx.rotate(Math.PI / 180 * rotate)
  ctx.fillText(content, 0, parseFloat(height) / 2)

  const base64Url = canvas.toDataURL()
  const __wm = document.querySelector('.__wm') // 监听水印的变化，避免重复生成

  const watermarkDiv = __wm || document.createElement('div')
  const styleStr = `
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
          z-index:${zIndex};
          pointer-events:none;
          background-repeat:repeat;
          background-image:url('${base64Url}');
          transform: rotate(30deg);`

  watermarkDiv.setAttribute('style', styleStr)
  watermarkDiv.classList.add('__wm')

  // 第一次则生成水印
  if (!__wm) {
    container.style.position = 'relative'
    container.insertBefore(watermarkDiv, container.firstChild)
  }

  // 监听dom结构，发生变化则重新生成，防止人为关闭 (有bug暂不启用)
  // const MutationObserver = window.MutationObserver || window.WebKitMutationObserver
  // if (MutationObserver) {
  //   let mo = new MutationObserver(function () {
  //     const __wm = document.querySelector('.__wm')
  //     // 只在__wm元素变动才重新调用 canvasWM
  //     if ((__wm && __wm.getAttribute('style') !== styleStr) || !__wm) {
  //       // console.log('MutationObserver')
  //       // 避免一直触发
  //       mo.disconnect()
  //       mo = null
  //       canvasWM(JSON.parse(JSON.stringify(args)))
  //     }
  //   })

  //   mo.observe(container, {
  //     attributes: true,
  //     subtree: true,
  //     childList: true
  //   })
  // }
}

// 为了兼容不同的环境
// if (typeof module !== 'undefined' && module.exports) { // CMD
//   module.exports = canvasWM
// } else if (typeof define === 'function' && define.amd) { // AMD
//   define(function () {
//     return canvasWM
//   })
// } else {
//   window.canvasWM = canvasWM
// }
