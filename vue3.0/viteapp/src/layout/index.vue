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
        <a-menu theme="dark" mode="inline" :default-selected-keys="['4']">
          <a-menu-item key="1">
            <a-icon type="user" />
            <span class="nav-text">nav 1</span>
          </a-menu-item>
          <a-menu-item key="2">
            <a-icon type="video-camera" />
            <span class="nav-text">nav 2</span>
          </a-menu-item>
          <a-menu-item key="3">
            <a-icon type="upload" />
            <span class="nav-text">nav 3</span>
          </a-menu-item>
          <a-menu-item key="4">
            <a-icon type="user" />
            <span class="nav-text">nav 4</span>
          </a-menu-item>
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
import {  UserOutlined } from '@ant-design/icons-vue';
export default {
  components: {
    breadbrumb,
    UserOutlined
  },
  methods: {
    onCollapse(collapsed, type) {
      console.log(collapsed, type);
    },
    onBreakpoint(broken) {
      console.log(broken);
    },
  },
};
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
