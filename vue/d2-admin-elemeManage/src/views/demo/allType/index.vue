<!--
 * @Author: your name
 * @Date: 2021-01-05 16:21:00
 * @LastEditTime: 2021-01-05 16:37:12
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\d2-admin-elemeManage\src\views\demo\allType\index.vue
-->
<template>
  <d2-container>
    <ybtable ref="table"
             class
             :tableData="tableData"
             :tableHeaderData="tableHeaderData"
             @modify="modify"
             @del="del"></ybtable>
  </d2-container>
</template>

<script>
import ybtable from '@/components/ybtable'
import { getType, delType } from '@/api/index'
export default {
  name: 'allType',
  components: {
    ybtable
  },
  data () {
    return {
      tableData: null,
      tableHeaderData: [
        { prop: 'id', label: 'id', width: '', hidden: false },
        { prop: 'name', label: '分类名称', width: '', hidden: false },
      ]
    }
  },
  created () {
    this.getType()
  },
  methods: {
    async getType () {
      const data = await getType()
      if (data.code === '200') {
        this.tableData = data.data
        // eslint-disable-next-line no-console
        console.log(this.tableData)
      }
    },
    // 删除商品
    async delType (id) {
      const data = await delType({ id })
      if (data.code === '200') {
        this.getType()
      }
    },
    modify (id) {
      // eslint-disable-next-line no-console
      console.log(id)
      this.$router.push({ path: '/first/modType', query: { id } })
    },
    del (id) {
      this.delType(id)
    }
  },
}
</script>

<style>
</style>