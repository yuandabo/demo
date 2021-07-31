<!-- 常用应用模块 -->
<template>
  <div>
    <div class="common-apps">
      <transition-group
        name="fade"
        tag="div"
        class="const-wrap"
        :style="appListConst.length > 5 ? '' : 'justify-content: space-around;'"
      >
        <div
          v-for="(item, index) in getAppListConst"
          :key="item.moduleId || index"
          :style="{marginTop : index > 4 ? '30px' : '10px'}"
          class="one-app"
          @click="() => jumpCommonApp(item)"
        >
          <el-image :src="item.iconUrl" fit="cover" class="app-icon">
            <div slot="placeholder" class="image-slot" />
            <div slot="error" class="image-slot">加载失败</div>
          </el-image>
          <div class="app-name">{{ item.name }}</div>
        </div>
        <div class="one-app" v-if="appList.length > 10" @click="expandApp">
          <el-image :src="expandAppIcon" fit="cover" class="app-icon">
            <div slot="placeholder" class="image-slot" />
            <div slot="error" class="image-slot">加载失败</div>
          </el-image>
          <div class="app-name">全部应用</div>
        </div>
      </transition-group>
      <el-dialog title="全部应用" :visible.sync="allDialogShow" fullscreen>
        <div class="const-wrap">
          <div
            v-for="item in getAppList"
            :key="item.moduleId"
            class="one-app"
            @click="() => jumpCommonApp(item)"
          >
            <el-image :src="item.iconUrl" fit="cover" class="app-icon">
              <div slot="placeholder" class="image-slot" />
              <div slot="error" class="image-slot">加载失败</div>
            </el-image>
            <div class="app-name">{{ item.name }}</div>
          </div>
        </div>
      </el-dialog>
    </div>
    <Divider :margin="'0'" v-if="!loading"></Divider>
    <slot name="former"></slot>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Image, Collapse, CollapseItem, Dialog } from 'element-ui'
import { appPost } from '@/request/index'
import { HOME } from '@/request/urls'
import { APP_MODULE_INFO_ITEM } from '@/utils/types'
import Divider from '@/components/Divider/index.vue'
import { MODULEIDLIST } from '@/dict/interface'
import { MODULEINFO } from '@/dict/home'
import { getUserTypeCode } from '@/env'
@Component({
  name: 'CommonApps',
  components: {
    Divider,
    [Image.name]: Image,
    [Collapse.name]: Collapse,
    [CollapseItem.name]: CollapseItem,
    [Dialog.name]: Dialog
  }
})
export default class extends Vue {
  private loading = false
  private appListConst: APP_MODULE_INFO_ITEM[] = [] // 被截取的列表，长度最多为9
  private expandAppIcon = require('@/assets/image/expand-app.png')
  private allDialogShow = false
  private appList: APP_MODULE_INFO_ITEM[] = [] // 后端传入的列表，需筛选

  private get getAppList () {
    return this.appList
  }

  private get getAppListConst () {
    return this.appListConst
  }

  private get showMask (): boolean {
    return this.appListConst.length > 0
  }

  mounted (): void {
    this.loading = true
    this.getHomeModuleInfo().then(() => {
      if (this.appList.length && this.appList.length === 10) {
        this.appListConst = this.appList.slice(0, 10)
      } else {
        this.appListConst = this.appList.slice(0, 9)
      }
    })
  }

  private getHomeModuleInfo () {
    const userCode = getUserTypeCode()
    const list = MODULEIDLIST()
    return appPost(HOME.MODULE_INFO, {
      moduleId: list[userCode as 'MANAGE' | 'PERSONAL'].COMMONAPP
    })
      .then((res: unknown) => {
        // console.log('CommonApps', res)
        this.appList = res as APP_MODULE_INFO_ITEM[]
      })
      .finally(() => {
        this.loading = false
      })
  }

  private expandApp () {
    this.allDialogShow = true
  }

  private jumpCommonApp (app: APP_MODULE_INFO_ITEM) {
    if (app.moduleId) {
      this.$router
        .push({
          name: MODULEINFO()[app.moduleId],
          params: { moduleId: app.moduleId }
        })
        .then(() => {
          if (this.allDialogShow) this.allDialogShow = false
        })
    }
  }
}
</script>
<style lang="scss" scoped>
.common-apps {
  min-height: 120px;
  padding: 18px 70px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  .const-wrap,
  .collapse-wrap {
    display: flex;
    flex-wrap: wrap;
  }
  .one-app {
    // 一行最多5个
    margin: 10px 10px;
    min-width: calc(20% - 20px);
    text-align: center;
    .app-icon {
      width: 69px;
      height: 69px;
      border-radius: 30px;
      overflow: hidden;
    }
    .app-name {
      margin-top: 12px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 1px;
    }
  }
  .el-dialog__wrapper {
    & ::v-deep .el-dialog__header {
      padding: 35px 60px 10px;
    }
  }
}
</style>
