<template>
  <div class="no-data" :style="styleProp" v-show="loading">
    暂无相关数据~
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
@Component({
  name: 'No-data'
})
export default class extends Vue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   @Prop({ default: () => ({}) }) readonly styleProp!: any
   @Prop({ default: false }) readonly loading!: boolean
}
</script>

<style lang="scss" scoped>
.no-data {
  height: 20vh;
  line-height: 20vh;
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  color: #EEF0F5;
}
</style>
