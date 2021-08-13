<template>
  <div class="divider" :style="getDirection">
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
type DividerType = {
  height ?: string
  borderRight ?: string
  borderBottom ?: string
  margin ?: string
  background? :string
}
@Component({
  name: 'Divider'
})
export default class extends Vue {
  @Prop({ default: 'bottom' }) readonly direction: string | undefined
  @Prop({ default: 'solid' }) readonly borderStyle: string | undefined
  @Prop() readonly margin: string | undefined
  /**
   * @description:
   * @param {*}
   * @return {*}
   */
  private get getDirection () : DividerType {
    if (this.direction === 'column') {
      return {
        height: '90%',
        borderRight: '2px dashed #FFFFFF',
        margin: this.margin || '0 10px',
        background: 'transparent'
      }
    }
    return {
      height: '2px',
      margin: this.margin || '10px 0'
    }
  }
}
</script>

<style lang="scss" scoped>
.divider {
  display: block;
  opacity: 0.1;
  background: #FFFFFF;
}
</style>
