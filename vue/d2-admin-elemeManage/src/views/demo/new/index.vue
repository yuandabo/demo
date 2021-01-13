<template>
  <d2-container class="new">
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
                   :on-success="photoSuccess"
                   :before-upload="beforeAvatarUpload"
                   :multiple="false">
          <img v-if="form.image"
               :src="form.image"
               class="avatar" />
          <i v-else
             class="el-icon-plus avatar-uploader-icon"></i>
          <div slot="tip"
               class="el-upload__tip">只能上传jpg文件，且不超过2M</div>
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
                   @click="addGood">立即创建</el-button>
        <el-button>取消</el-button>
      </el-form-item>
    </el-form>
  </d2-container>
</template>

<script>
import { addGood, getType } from '@/api/index/index'
export default {
  name: 'new',
  data () {
    return {
      form: {
        name: '',
        price: '',
        description: '',
        info: '',
        // image: null,
        type_id: ''
      },
      typeList: null
    }
  },
  created () {
    this.$nextTick(() => {
      this.getType()
    })
  },
  methods: {
    beforeAvatarUpload (file) {
      // eslint-disable-next-line no-console
      console.log(file)
      const isJPG = file.type === 'image/jpeg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 格式!');
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
      }
      return isJPG && isLt2M;
    },
    photoSuccess (res) {
      this.$set(this.form, 'image', res.url)
    },
    // 
    async addGood () {
      // eslint-disable-next-line no-console
      console.log(this.form)
      const data = await addGood(this.form)
      if (data.code === '200') {
        this.$message({
          message: '添加成功',
          type: 'success'
        })
        this.$router.push('/first/del')
      }
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
.avatar-uploader-icon {
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