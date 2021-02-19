export default {
  methods: {
    /**
     * 获取小数点后数字数量，整数返回0
     * @param {*} val 需要处理的数字
     */
    getAfterDotNums (val) {
      const hasDot = String(val).indexOf('.') !== -1
      if (hasDot) {
        return String(val).substring(String(val).indexOf('.') + 1).length
      } else {
        return 0
      }
    },
    /**
     * 步长控制器
     * @param {*} id 需要修改方案条目
     * @param {*} numberSize 步长器，现只支持加减算法，传入1为加1，-1为减一
     */
    stepperChange ({ id }, numberSize = 1) {
      const goods = this.goods
      let quantities
      // id
      for (let i = 0, length = goods.length; i < length; i++) {
        const item = goods[i]
        for (let j = 0, length2 = item['foods'].length; j < length2; j++) {
          const foods = item['foods'][j]
          if (foods['id'] === id && foods.hasOwnProperty('count')) {
            const count = foods.count
            // 获取计算值小数点后的位数长度，乘以10的长度次方，解决浮点数运算问题
            // const length = this.getAfterDotNums(count)
            // const POW = Math.pow(10, length)
            // 加法运算
            quantities = count + numberSize
            if (quantities > 9999) {
              this.$toast('数量最为多9999')
            } else if (quantities < 0) {
              this.$toast('数量不能少于0')
            } else {
              // 标记与回显
              foods.count = quantities
              // this.editProduct({ id, quantities })
            }
            break
          }
        }
      }
    }

  }
}
