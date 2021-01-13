<template>
  <div class="table">
    <el-table highlight-current-row
              :border="true"
              :stripe="true"
              :data="tableData"
              style="width: 100%"
              :height="height">
      <!-- <el-table-column fixed="right" label="操作" width="150">
        <template slot-scope="scope">
          <div v-if="scope.row.prop === 'payState'">{{scope.row.payState===0?'未支付':'已支付'}}</div>
        </template>
      </el-table-column>-->
      <el-table-column v-for="(item,index) in tableHeaderData"
                       :key="index"
                       :prop="item.prop"
                       :label="item.label"
                       :width="item.width"
                       :v-show="!item.hidden"
                       align="center"
                       header-align="center"
                       :show-overflow-tooltip="true"></el-table-column>
      <el-table-column fixed="right"
                       label="操作"
                       width="150">
        <template slot-scope="scope">
          <el-button @click="modState(scope.row)"
                     type="text"
                     size="small"
                     v-if="showFinish">已上菜</el-button>
          <el-button @click="modify(scope.row)"
                     type="text"
                     size="small"
                     v-if="showMod">编辑</el-button>
          <el-button @click="pay(scope.row)"
                     type="text"
                     size="small"
                     v-if="showPay">已支付</el-button>
          <el-button @click="del(scope.row)"
                     type="text"
                     size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'ybtable',
  props: {
    tableData: {
      type: Array,
      default: function () {
        return [{
          date: '2016-05-02',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        }, {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1517 弄'
        }, {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1519 弄'
        }, {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1516 弄'
        }]
      }
    },
    tableHeaderData: {
      type: Array,
      default: function () {
        return [
          { prop: 'date', label: '日期', width: '', hidden: false },
          { prop: 'name', label: '姓名', width: '', hidden: false },
          { prop: 'address', label: '地址', width: '', hidden: false }
        ]
      }
    },
    showMod: {
      type: Boolean,
      default: true
    },
    showFinish: {
      type: Boolean,
      default: false
    },
    showPay: {
      type: Boolean,
      default: false
    },
    height: {
      type: Number,
      default: 570
    }
  },
  data () {
    return {

    }
  },
  methods: {
    modify (row) {
      this.$emit('modify', row.id)
    },
    del (row) {
      this.$confirm('确定删除？', '提醒', {
        distinguishCancelAndClose: true,
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      })
        .then(() => {
          this.$emit('del', row.id)
        })
        .catch()
    },
    modState (row) {
      // eslint-disable-next-line no-console
      console.log(row)
      this.$confirm('确定上菜了嘛？', '提醒', {
        distinguishCancelAndClose: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
        .then(() => {
          this.$emit('modState', row.id)
        })
        .catch()
    },
    pay (row) {
      this.$confirm('确定上菜了嘛？', '提醒', {
        distinguishCancelAndClose: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
        .then(() => {
          this.$emit('payState', row.id)
        })
        .catch()
    }
  },
}
</script>

<style lang="scss" scoped>
// .table {
//   /deep/.el-table th {
//     background: #f5f7fa;
//   }
// }
</style>