<!--
 * @Author: your name
 * @Date: 2021-01-05 16:21:00
 * @LastEditTime: 2021-01-05 17:25:13
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\d2-admin-elemeManage\src\views\demo\modType\index.vue
-->
<template>
  <d2-container class="mod">
    <el-form ref="form"
             :model="form"
             label-width="150px">
      <el-form-item label="商品名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary"
                   @click="modGood">立即修改</el-button>
        <el-button @click="cancer">取消</el-button>
      </el-form-item>
    </el-form>
  </d2-container>
</template>

<script>
import { getTypeById, modTypeById } from '@/api/index/index'
export default {
  name: 'modType',
  data () {
    return {
      form: {
        name: ''
      }
    }
  },
  created () {
    this.$nextTick(() => {
      this.getTypeById()
    })
  },
  methods: {
    async getTypeById () {
      const id = this.$route.query.id
      // eslint-disable-next-line no-console
      console.log(id)
      const data = await getTypeById({ id })
      if (data.code === '200') {
        this.form = data.data[0]
      }
    },
    async modGood () {
      const data = await modTypeById({
        name: this.form.name,
        id: this.$route.query.id,
      })
      if (data.code === '200') {
        this.$message({
          message: '删除成功',
          type: 'success'
        })
        this.getTypeById()
        this.$router.go(-1)
      }
    },
    cancer () {
      this.$router.go(-1)
    }
  },
}
</script>

<style lang="scss" scoped>
</style>