<!--
 * @Author: your name
 * @Date: 2021-01-05 16:21:00
 * @LastEditTime: 2021-01-05 16:37:22
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\d2-admin-elemeManage\src\views\demo\finishing\index.vue
-->
<template>
  <d2-container>
    <yb-table class
              :tableData="tableData"
              :tableHeaderData="tableHeaderData"
              :showMod="false"
              @del="del"></yb-table>
    <el-pagination @size-change="handleSizeChange"
                   @current-change="handleCurrentChange"
                   :current-page="currentPage"
                   :page-sizes="[10, 20, 30, 40]"
                   :page-size="pageSize"
                   layout="total, sizes, prev, pager, next, jumper"
                   :total="total"></el-pagination>
  </d2-container>
</template>

<script>
import ybTable from '@/components/ybtable/index'
import { getFinishOrder, delOrder } from '@/api/index'
export default {
  name: 'finishing',
  components: {
    'yb-table': ybTable
  },
  data () {
    return {
      tableData: null,
      tableHeaderData: [
        { prop: 'id', label: '订单号', width: '', hidden: false },
        // { prop: 'name', label: '订单名称', width: '', hidden: false },
        { prop: 'price', label: '订单总价格', width: '', hidden: false },
        { prop: 'content', label: '订单内容', width: '', hidden: false },
        { prop: 'state', label: '订单状态', width: '', hidden: false },
        { prop: 'phoneNum', label: '电话', width: '', hidden: false },
        { prop: 'payState', label: '支付情况', width: '100', hidden: false }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  created () {
    this.getFinishOrder()
  },
  methods: {
    handleCurrentChange (currentPage) {
      // eslint-disable-next-line no-console
      console.log(currentPage, 'handleCurrentChange')
      this.currentPage = currentPage
      this.getFinishOrder()
    },
    handleSizeChange (pageSize) {
      // eslint-disable-next-line no-console
      console.log(pageSize, 'pagesize')
      this.pageSize = pageSize
      this.getFinishOrder()
    },
    async getFinishOrder () {
      const data = await getFinishOrder(
        { pageSize: this.pageSize, page: this.currentPage }
      )
      if (data.code === '200') {
        this.tableData = this.initTableHear(data.data)
        this.total = data.total
      }
    },
    initTableHear (data) {
      data.forEach((item) => {
        item.content = ''
        const selects = JSON.parse(item.selects)
        selects.forEach(value => {
          item.content += value.name + value.count + '份'
        })
      });
      // eslint-disable-next-line no-console
      // console.log(data)
      return data
    },
    del (id) {
      // console.log(id)
      this.delOrder(id)
    },
    // 删除商品
    async delOrder (id) {
      const data = await delOrder({ id })
      if (data.code === '200') {
        this.$message({
          message: '删除成功',
          type: 'success'
        })
        this.getFinishOrder()
      }
    },
  },
}
</script>

<style>
</style>