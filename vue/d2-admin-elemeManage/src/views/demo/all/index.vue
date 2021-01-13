<template>
  <d2-container class="all">
    <template slot="header">
      <el-row :gutter="20"
              type="flex"
              align="middle">
        <el-col :span="4">
          <el-input v-model="inputPhoneNum"
                    placeholder="请输入电话"
                    @change="change"></el-input>
        </el-col>
        <el-col :span="4">
          <el-switch v-model="switchStatus"
                     active-text="仅未上菜"
                     inactive-text="查看全部">
          </el-switch>
        </el-col>
        <el-col :span="6">
          <el-button type="primary"
                     round>搜索</el-button>
        </el-col>
      </el-row>
    </template>
    <yb-table class
              :tableData="tableData"
              :tableHeaderData="tableHeaderData"
              :showMod="false"
              :showPay="true"
              @del="del"
              @payState="payState" />
    <template slot="footer">
      <common-pagination @size-change="handleSizeChange"
                         @current-change="handleCurrentChange" />
    </template>
  </d2-container>
</template>

<script>
import mixins from '../mixins'
import ybTable from '@/components/ybtable/index'
import { getAllOrder, delOrder, queryByPhoneNum, updatePayState } from '@/api/index'
export default {
  name: 'all',
  mixins: [mixins],
  components: {
    'yb-table': ybTable
  },
  data () {
    return {
      tableData: null,
      tableHeaderData: [
        { prop: 'id', label: '订单号', width: '70', hidden: false },
        // { prop: 'name', label: '订单名称', width: '', hidden: false },
        { prop: 'price', label: '订单总价格', width: '100', hidden: false },
        { prop: 'content', label: '订单内容', hidden: false },
        { prop: 'state', label: '订单状态', width: '80', hidden: false },
        { prop: 'phoneNum', label: '电话', width: '150', hidden: false },
        { prop: 'payState', label: '支付情况', width: '100', hidden: false }
      ],
      inputPhoneNum: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      switchStatus: 0
    }
  },
  created () {
    this.getAllOrder()
  },
  methods: {
    payState (id) {
      updatePayState({ id })
        .then(res => {
          if (res.code === '200') {
            this.getAllOrder()
          }
        })
    },
    handleCurrentChange (currentPage) {
      // eslint-disable-next-line no-console
      console.log(currentPage, 'handleCurrentChange')
      this.currentPage = currentPage
      this.getAllOrder()
    },
    handleSizeChange (pageSize) {
      // eslint-disable-next-line no-console
      console.log(pageSize, 'pagesize')
      this.pageSize = pageSize
      this.getAllOrder()
    },
    change () {
      if (this.inputPhoneNum === '') {
        this.getAllOrder()
      } else {
        this.queryByPhoneNum()
      }
    },
    //
    async queryByPhoneNum () {
      const data = await queryByPhoneNum({ phoneNum: this.inputPhoneNum, pageSize: this.pageSize, page: this.currentPage })
      // eslint-disable-next-line no-console
      console.log(data)
      if (data.code === '200') {
        this.tableData = this.initTableHear(data.data)
        this.total = data.total
      } else {
        this.tableData = []
      }
    },
    //
    //
    async getAllOrder () {
      const data = await getAllOrder({ pageSize: this.pageSize, page: this.currentPage })
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
        this.getAllOrder()
      }
    },
  },
}
</script>

<style>
</style>