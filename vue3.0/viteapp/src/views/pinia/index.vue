<template>
  <div>
      pinia
  </div>
</template>

<script>
import { useStore } from '@/pinia/index'
import { storeToRefs } from 'pinia'
import {defineComponent} from 'vue'
export default defineComponent({
    setup(props) {
        const store = useStore()
        console.log(store.name);
        // 直接修改store里得值
        store.name = 'yuandabo'
        console.log(store.name);
        // store.$reset()
        store.$reset()
        console.log(store.name);
        // subscribe 监听
        store.$subscribe((mutation, state) => {
            console.log(mutation, state);
        })
        store.increment('yuandabo_mutation')
        // storeToRefs(store) 保持响应式
        const { name } = storeToRefs(store)
        return {
            name
        }
    }
})
</script>

<style>

</style>