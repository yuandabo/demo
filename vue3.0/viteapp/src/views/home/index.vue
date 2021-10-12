<template>
  <div>
      parent: {{ pageTitle }} ---  {{foo}} --- computed值： {{ fooComputed }}
      <a-button @click="addFoo">点击测试 foo 响应式</a-button>
      <child :name="name" v-model:pageTitle="pageTitle"></child>
      全局变量 -- author: {{ author }}
      <scriptSetup :foo="foo" ref="scriptSetup"></scriptSetup>
  </div>
</template>

<script>
import child from '@/components/child/index.vue'
import scriptSetup from '@/components/scriptSetup/index.vue'
import { Button } from 'ant-design-vue'
import { reactive, readonly, isProxy, toRefs, computed, watchEffect, watch, provide, inject, onMounted, getCurrentInstance } from 'vue'
import { useFeatureX } from './hook'
export default {
    name: 'home',
    components: {
      child,
      scriptSetup,
      [Button.name]: Button
    },
    setup(props, context) {
      const original = reactive({
        name: 'yuandabo',
        pageTitle: 'old pageTitle'
      })
      const { foo } = useFeatureX()  // return Refs 防止结构让 foo 失去响应式
      // const copy = readonly(original)
      // console.log(isProxy(copy), isProxy(original), isProxy({name: '123'}), isProxy(readonly({name: '123'})))
      const fooComputed = computed(() => foo.value + 1)
      
      watchEffect(() => {
        console.log('watchEffect', foo.value);
      })

      // 监听单个 ref 的更新
      watch(foo, (val) => {
        console.log('watch', val);
      })

      // 监听多个 ref 的更新
      watch([foo, original], ([a,b]) => {
        console.log('watchmulti', a, b);
      })

      // provide
      provide('myname', 'yuandabo')

      // 取全局变量
      const { proxy } = getCurrentInstance()
      const author = proxy.$author

      console.log('refs', getCurrentInstance().refs.scriptSetup);

      return {
        foo,
        ...toRefs(original),  // ... 会让 reactive 失去响应式
        fooComputed,
        author
      }
    },
    data() {
      return {
      }
    },
    methods: {
      addFoo() {
        this.foo++
      }
    },
}
</script>

<style>

</style>