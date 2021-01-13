<template>
  <div>
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        v-for="(item,index) in breadData"
        :key="index"
        :to="item.path"
      >{{item.text}}</el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  name: "ybbreadcrumb",
  props: {
    breadData: {
      type: Array,
      default: function () {
        return [
          { path: '/first/index', text: '首页' },
          { path: '/first/finishing', text: '已上菜' },
          { path: '/first/del', text: '删除菜品' }
        ]
      }
    }
  },
  methods: {
    routeTo(path) {
      this.$router.replace(path)
    }
  },
}
</script>

<style>
.el-breadcrumb__separator {
  color: #000;
}
.el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: #303133;
  font-weight: 700;
}
</style>