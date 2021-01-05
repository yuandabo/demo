<template>
  <d2-container>
    <!-- <el-input v-model="inputPhoneNum" placeholder="请输入电话" @change="queryByPhoneNum"></el-input> -->
    <yb-table class
              :height="620"
              :tableData="tableData"
              :tableHeaderData="tableHeaderData"
              :showMod="false"
              :showFinish="true"
              @del="del"
              @modState="modState"></yb-table>
    <template slot="footer">
      <el-pagination @size-change="handleSizeChange"
                     @current-change="handleCurrentChange"
                     :current-page="currentPage"
                     :page-sizes="[10, 20, 30, 40]"
                     :page-size="pageSize"
                     layout="total, sizes, prev, pager, next, jumper"
                     :total="total"></el-pagination>
    </template>
  </d2-container>
</template>

<script>
import ybTable from '@/components/ybtable/index'
import { getCookOrder, delOrder, updateState } from '@/api/index'
export default {
  name: 'cooking',
  components: {
    'yb-table': ybTable
  },
  data () {
    return {
      tableData: null,
      tableHeaderData: [
        { prop: 'id', label: '订单号', width: '70', hidden: false },
        // { prop: 'name', label: '订单名称', width: '', hidden: false },
        { prop: 'price', label: '订单总价格', width: '120', hidden: false },
        { prop: 'content', label: '订单内容', width: '', hidden: false },
        { prop: 'state', label: '订单状态', width: '120', hidden: false },
        { prop: 'phoneNum', label: '电话', width: '120', hidden: false },
        { prop: 'payState', label: '支付情况', width: '100', hidden: false }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  created () {
    this.getCookOrder()
    // setInterval(() => {
    //   this.getCookOrder()
    // }, 2000)
  },
  methods: {
    handleCurrentChange (currentPage) {
      // eslint-disable-next-line no-console
      console.log(currentPage, 'handleCurrentChange')
      this.currentPage = currentPage
      this.getCookOrder()
    },
    handleSizeChange (pageSize) {
      // eslint-disable-next-line no-console
      console.log(pageSize, 'pagesize')
      this.pageSize = pageSize
      this.getCookOrder()
    },
    async getCookOrder () {
      const data = await getCookOrder({ pageSize: this.pageSize, page: this.currentPage })
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
          item.content += value.name + '：' + value.count + '份,'
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
        this.getCookOrder()
      }
    },
    // 更改状态
    async modState (id) {
      const data = await updateState({ id })
      if (data.code === '200') {
        this.$message({
          message: '修改成功',
          type: 'success'
        })
        this.getCookOrder()
      }
    }
  },
}
</script>

<style>
</style>