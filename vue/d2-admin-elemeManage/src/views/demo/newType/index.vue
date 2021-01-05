<template>
  <d2-container class="newType">
    <el-form ref="form"
             :model="form"
             label-width="150px">
      <el-form-item label="分类名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary"
                   @click="newType">立即创建</el-button>
        <el-button>取消</el-button>
      </el-form-item>
    </el-form>
  </d2-container>
</template>

<script>
import { newType } from '@/api/index/index'
export default {
  name: 'newType',
  data () {
    return {
      form: {
        name: ''
      }
    }
  },
  methods: {
    async newType () {
      // eslint-disable-next-line no-console
      console.log(this.form)
      const data = await newType({ name: this.form.name })
      if (data.code === '200') {
        this.$message({
          message: '新建分类成功',
          type: 'success'
        })
        this.$router.push('/first/allType')
      }
    }
  },
}
</script>

<style lang="scss" scoped>
</style>