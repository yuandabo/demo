<template>
  <div class="breadcrumb-warp max-height">
    <a-breadcrumb :routes="routes">
      <template #itemRender="{ route, routes, paths }">
        <span v-if="routes.indexOf(route) === routes.length - 1">
          {{ route.breadcrumbName }}
        </span>
        <router-link v-else :to="`${basePath}/${paths.join('/')}`">
          {{ route.breadcrumbName }}
        </router-link>
      </template>
    </a-breadcrumb>
  </div>
</template>
<script>
import { defineComponent, ref } from 'vue';
import { Breadcrumb } from 'ant-design-vue';
export default defineComponent({
  setup() {
    const routes = ref([
      {
        path: 'index',
        breadcrumbName: 'home',
      },
      {
        path: 'first',
        breadcrumbName: 'first',
        children: [
          {
            path: '/general',
            breadcrumbName: 'General',
          },
          {
            path: '/layout',
            breadcrumbName: 'Layout',
          },
          {
            path: '/navigation',
            breadcrumbName: 'Navigation',
          },
        ],
      },
      {
        path: 'second',
        breadcrumbName: 'second',
      },
    ]);
    return {
      basePath: '/components/breadcrumb',
      routes,
    };
  },
  components: {
    [Breadcrumb.name]: Breadcrumb
  }
});
</script>

<style lang="scss" scoped>
.breadcrumb-warp{
    display: flex;
    align-items: center;
    padding: 0 20px;
}
</style>