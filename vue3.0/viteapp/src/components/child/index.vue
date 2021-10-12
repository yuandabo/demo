<!--  vue 3 父子传值 -->
<template>
  <div>
      child {{ name }} - {{ pageTitle }}
      <a-button @click="buttonClickHandle">
          点我修改 pageTitle
      </a-button>
  </div>
</template>

<script>
import  { onMounted, inject } from 'vue'
import { Button } from 'ant-design-vue'
export default {
    setup(props) {
        onMounted(() => {
            console.log('mouted', props);
        })
        console.log('inject', inject('myname'));
    },
    components: {
        [Button.name]: Button
    },
    props: {
        name: {
            type: String,
            default: ''
        },
        pageTitle: {
            type: String,
            default: ''
        }
    },
    methods: {
        buttonClickHandle () {
            console.log('buttonClickHandle');
            this.$emit('update:pageTitle', 'new pageTitle')
        }
    },
}
</script>

<style>

</style>