<template>
  <div class="max-height">
    <a-layout id="components-layout-demo-responsive" class="max-height">
      <a-layout-sider
        breakpoint="lg"
        collapsed-width="0"
        @collapse="onCollapse"
        @breakpoint="onBreakpoint"
      >
        <div class="logo" />
        <a-menu
          v-model:selectedKeys="selectedKeys2"
          v-model:openKeys="openKeys"
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
        >
          <a-sub-menu :key="sub.key" v-for="sub in submenu">
            <template #title>
              <span>
                <user-outlined />
                {{sub.label}}
              </span>
            </template>
            <a-menu-item v-for="item in sub.menuItems" :key="item.key" @click="routeTo(item)">{{item.label}}</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="pr" :style="{ background: '#fff', padding: 0 }" >
          <breadbrumb></breadbrumb>
          <UserOutlined class="userIcon" :width="30" :height="30"/>
        </a-layout-header>
        <a-layout-content :style="{ margin: '24px 16px 0' }">
          <div
            class="max-height"
            :style="{ padding: '24px', background: '#fff', minHeight: '360px' }"
          >
            <router-view></router-view>
          </div>
        </a-layout-content>
        <a-layout-footer style="textalign: center">
          vue3 demo ©2021 Created by yuandabo
        </a-layout-footer>
      </a-layout>
    </a-layout>
  </div>
</template>
<script>
import breadbrumb from '../components/breadbrumb/index.vue'
import { UserOutlined, LaptopOutlined, NotificationOutlined } from '@ant-design/icons-vue';
import { defineComponent, ref, watch } from 'vue';
import { submenu } from './index'
export default defineComponent({
  components: {
    breadbrumb,
    UserOutlined,
    LaptopOutlined,
    NotificationOutlined,
  },
  setup() {
    const selectedKeys2 = ref(['1']) 
    const collapsed = ref(false)
    const openKeys = ref(['sub1'])
    watch(() => selectedKeys2.value, (val) => {
      console.log(typeof val, val[0]);
    })
    return {
      selectedKeys2,
      collapsed,
      openKeys,
      submenu
    }
  },
  methods: {
    onCollapse(collapsed, type) {
      console.log(collapsed, type);
    },
    onBreakpoint(broken) {
      console.log(broken);
    },
    routeTo(item) {
      this.$router.push(item.routePath)
    }
  },
});
</script>

<style>
#components-layout-demo-responsive .logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
}
</style>

<style lang="scss" scoped>
.userIcon{
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}
</style>
