<template>
  <d2-container class="mod">
    <el-form ref="form"
             :model="form"
             label-width="150px">
      <el-form-item label="店铺名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="店铺介绍">
        <el-input v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item label="平均上菜时间">
        <el-input v-model="form.deliveryTime"></el-input>
      </el-form-item>
      <el-form-item label="最低消费">
        <el-input v-model="form.minPrice"></el-input>
      </el-form-item>
      <el-form-item label="餐具费">
        <el-input v-model="form.deliveryPrice"></el-input>
      </el-form-item>
      <el-form-item label="店铺文化">
        <el-input v-model="form.bulletin"
                  type="textarea"></el-input>
      </el-form-item>
      <el-form-item label="商品图片">
        <el-upload class="avatar-uploader"
                   action="http://127.0.0.1:3001/admin/upload"
                   :show-file-list="false"
                   :on-success="photoSuccess"
                   :before-upload="beforeAvatarUpload"
                   :multiple="false">
          <img v-if="form.avatar"
               :src="form.avatar"
               class="avatar" />
          <i v-else
             class="el-image-plus avatar-uploader-image"></i>
          <div slot="tip"
               class="el-upload__tip">只能上传jpg文件，且不超过2M</div>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button type="primary"
                   @click="modByIdSeller">立即修改</el-button>
        <!-- <el-button @click="cancer">取消</el-button> -->
      </el-form-item>
    </el-form>
  </d2-container>
</template>

<script>
import { queryByIdSeller, modByIdSeller } from '@/api/index/index'
export default {
  name: 'mod',
  data () {
    return {
      form: {
        name: '',
        description: '',
        deliveryTime: '',
        bulletin: '',
        avatar: null,
        minPrice: '',
        deliveryPrice: '',
        // image: null,
      },
    }
  },
  created () {
    this.$nextTick(() => {
      this.queryByIdSeller()
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
      this.$set(this.form, 'avatar', res.url)
    },
    async queryByIdSeller () {
      const id = this.$route.query.id
      const data = await queryByIdSeller({ id })
      if (data.code === '200') {
        this.form = data.data[0]
      }
    },
    async modByIdSeller () {
      const data = await modByIdSeller({
        ...this.form,
        // id: this.$route.query.id,
      })
      if (data.code === '200') {
        this.$message({
          message: '修改成功',
          type: 'success'
        })
        this.queryByIdSeller()
      }
    }
  },
}
</script>

<style lang="scss" scoped>
</style>