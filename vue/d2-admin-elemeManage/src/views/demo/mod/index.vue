<template>
  <d2-container class="mod">
    <el-form ref="form"
             :model="form"
             label-width="150px">
      <el-form-item label="商品名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="商品价格">
        <el-input v-model="form.price"></el-input>
      </el-form-item>
      <el-form-item label="商品描述">
        <el-input v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item label="商品信息">
        <el-input v-model="form.info"></el-input>
      </el-form-item>
      <el-form-item label="商品图片">
        <el-upload class="avatar-uploader"
                   action="http://127.0.0.1:3001/admin/upload"
                   :show-file-list="false"
                   :on-success="photoSuccess">
          <img v-if="form.image"
               :src="form.image"
               class="avatar" />
          <i v-else
             class="el-image-plus avatar-uploader-image"></i>
        </el-upload>
      </el-form-item>
      <el-form-item label="请选择商品类型">
        <el-select v-model="form.type_id"
                   placeholder="请选择商品类型">
          <el-option :label="item.name"
                     v-for="(item,index) in typeList"
                     :key="index"
                     :value="item.id"></el-option>
        </el-select>
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
import { getGoodById, modGoodById, getType } from '@/api/index/index'
export default {
  name: 'mod',
  data () {
    return {
      form: {
        name: '',
        price: '',
        description: '',
        info: '',
        image: null,
        type_id: ''
      },
      typeList: null
    }
  },
  created () {
    this.$nextTick(() => {
      this.getGoodById()
      this.getType()
    })
  },
  methods: {
    photoSuccess (res) {
      this.$set(this.form, 'image', res.url)
    },
    async getGoodById () {
      const id = this.$route.query.id
      // eslint-disable-next-line no-console
      console.log(id)
      const data = await getGoodById({ id })
      if (data.code === '200') {
        this.form = data.data[0]
      }
    },
    async modGood () {
      const data = await modGoodById({
        ...this.form,
        id: this.$route.query.id,
      })
      if (data.code === '200') {
        this.$message({
          message: '修改成功',
          type: 'success'
        })
        this.getGoodById()
      }
    },
    cancer () {
      this.$router.go(-1)
    },
    // 获取分类
    async getType () {
      const data = await getType()
      if (data.code === '200') {
        this.typeList = data.data
      }
    }
  },
}
</script>

<style lang="scss" scoped>
</style>
<style>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-image {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
