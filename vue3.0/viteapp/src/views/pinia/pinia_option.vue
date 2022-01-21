<template>
  <div>
      pinia_option
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useStore } from '@/pinia/index'

export default {
    data() {
        return {
            count: 2
        }
    },
    computed: {
        ...mapState(useStore, ['name']),
        ...mapState(useStore, {
            myOwnName: 'name',
            // you can also write a function that gets access to the store
            double: store => store.count * 2,
            // it can have access to `this` but it won't be typed correctly...
            magicValue(store) {
                return store.count + this.count + this.double
            }
        })
    },
    created() {
        console.log(this.name, this.magicValue); 
    }
}
</script>

<style>

</style>