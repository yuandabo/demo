<template>
  <d2-container>
    <div class="del">
      <el-input v-model="foodName"
                placeholder="请输入商品名称"
                @change="change"></el-input>
    </div>
    <ybtable ref="table"
             class
             :tableData="tableData"
             :tableHeaderData="tableHeaderData"
             @modify="modify"
             @del="del"></ybtable>
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
import ybtable from '@/components/ybtable'
import { getGood, delGood, queryFoodByName } from '@/api/index'
export default {
  name: 'delGood',
  components: {
    ybtable
  },
  data () {
    return {
      tableData: null,
      tableHeaderData: [
        { prop: 'id', label: 'id', width: '50', hidden: false },
        { prop: 'name', label: '商品名称', width: '150', hidden: false },
        { prop: 'price', label: '商品价格', width: '50', hidden: false },
        // { prop: 'oldPrice', label: '商品历史价格', width: '150', hidden: true },
        { prop: 'description', label: '商品描述', width: '', hidden: false },
        { prop: 'info', label: '商品信息', width: '200', hidden: false },
        // { prop: 'icon', label: '商品icon', width: '', hidden: true },
        { prop: 'image', label: '商品图片地址', width: '', hidden: false },
      ],
      foodName: '',
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  created () {
    this.getGood()
  },
  methods: {
    handleCurrentChange (currentPage) {
      // eslint-disable-next-line no-console
      console.log(currentPage, 'handleCurrentChange')
      this.currentPage = currentPage
      this.getGood()
    },
    handleSizeChange (pageSize) {
      // eslint-disable-next-line no-console
      console.log(pageSize, 'pagesize')
      this.pageSize = pageSize
      this.getGood()
    },
    change () {
      if (this.foodName === '') {
        this.getGood()
      } else {
        this.queryFoodByName()
      }
    },
    //
    async queryFoodByName () {
      const data = await queryFoodByName({ foodName: this.foodName })
      if (data.code === '200') {
        this.tableData = data.data
        this.total = data.total
      }
    },
    async getGood () {
      const data = await getGood({ pageSize: this.pageSize, page: this.currentPage })
      if (data.code === '200') {
        this.tableData = data.data
        this.total = data.total
        // eslint-disable-next-line no-console
        // console.log(this.tableData)
      }
    },
    // 删除商品
    async delGood (id) {
      const data = await delGood({ id })
      if (data.code === '200') {
        this.$message({
          message: '删除成功',
          type: 'success'
        })
        this.getGood()
      }
    },
    modify (id) {
      // eslint-disable-next-line no-console
      console.log(id)
      this.$router.push({ path: '/first/mod', query: { id } })
    },
    del (id) {
      this.delGood(id)
    }
  },
}
</script>

<style>
.del .el-input__inner {
  margin: 0 0 20px 0;
  width: 20% !important;
}
</style>