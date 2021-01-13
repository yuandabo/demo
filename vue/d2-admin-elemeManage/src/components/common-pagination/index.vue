<!--
 * @Author: your name
 * @Date: 2021-01-05 16:39:19
 * @LastEditTime: 2021-01-05 16:42:21
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\d2-admin-elemeManage\src\components\yb-pagination\index.vue
-->
<template>
  <el-pagination @size-change="handleSizeChange"
                 @current-change="handleCurrentChange"
                 :current-page="currentPage"
                 :page-sizes="pageSizes"
                 :page-size="pageSize"
                 layout="total, sizes, prev, pager, next, jumper"
                 :total="total"></el-pagination>
</template>

<script>
export default {
  props: {
    pageSize: {
      default: 10
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 30, 40]
    },
    currentPage: {
      default: 1
    },
    total: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {

    }
  },
  methods: {
    handleCurrentChange () {
      this.$emit('handleCurrentChange')
    },
    handleSizeChange () {
      this.$emit('handleSizeChange')
    }
  },
}
</script>

<style>
</style>