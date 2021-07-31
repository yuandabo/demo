<template>
  <el-dropdown
    trigger="click"
    placement="bottom-start"
    @command="handleCommand"
  >
    <span class="airport-btn">
      {{ label }}
      <i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown" class="app-select-popper dropdown-menu">
      <div class="inputWarp">
        <el-input
          v-model="searchValue"
          size="mini"
          maxlength="4"
          prefix-icon="el-icon-search"
          class="airport-input"
          placeholder="输入三字码/四字码搜索"
        ></el-input>
      </div>
      <el-dropdown-item
        v-for="item of list"
        :key="item.id"
        class="airport-item"
        :class="firstOpen ? 'f-close' : 'f-open'"
        :command="item.aptIcao"
      >
        <div class="airport-code">
          {{ `${item.aptIcao} / ${item.aptIata}` }}
        </div>
        <div class="airport-name">{{ item.aptName }}</div>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script lang="ts">
/**
 * 机场选择框
 * 因为机场选择框比较特殊所以单独封装为一个组件
 */
import { Component, Vue, Watch, Prop, Model } from 'vue-property-decorator'
import { Dropdown, DropdownMenu, DropdownItem, Input } from 'element-ui'
interface Airport {
  name: string
  id: string
  aptIcao: string
  aptIata: string
  aptName: string
}
@Component({
  name: 'AirportSelect',
  components: {
    [Input.name]: Input,
    [Dropdown.name]: Dropdown,
    [DropdownMenu.name]: DropdownMenu,
    [DropdownItem.name]: DropdownItem
  }
})
export default class extends Vue {
  @Prop() airports!: Airport[]
  @Model('change', { type: String }) value!: string
  private label = '请选择'
  private searchValue = ''
  private list: Airport[] = []
  // 是否为第一次打开下拉框
  firstOpen = false

  @Watch('airports', { deep: true, immediate: true })
  onAirport (value: Airport[]): void {
    this.list = value
  }

  @Watch('searchValue')
  onSearchValue (value: string): void {
    const uperValue = value.toUpperCase() // 后台字段为大写字母
    this.firstOpen = true
    // 用户输入三字码、四字码搜索
    const airportList: Airport[] = this.airports || []
    this.list = airportList.filter(
      (it: Airport) =>
        it.aptIcao.indexOf(uperValue) !== -1 || it.aptIata.indexOf(uperValue) !== -1
    )
  }

  handleCommand (command: string): void {
    this.label = command
    this.$emit('change', command)
  }
}
</script>
<style lang="scss">
.airport-input {
  width: calc(100% - 20px);
  margin: 5px auto;
  display: block;
  .el-input__inner {
    background-color: $module-bg;
    border-radius: 14px;
    border: none;
    color: $default-font-color;
  }
}
.airport-item {
  color: white;
  height: 46px;
  position: relative;
  z-index: 100;
  &:first-child{
    margin-top: 38px;
  }
}
.f-open:not(:nth-last-child(2)):after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  height: 1px;
  width: calc(100% - 20px);
  background-color: $default-line-color;
}
.f-close:not(:last-child):after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  height: 1px;
  width: calc(100% - 20px);
  background-color: $default-line-color;
}
</style>
<style scoped lang="scss">
.airport-btn {
  background-color: $default-btn-bg;
  // cursor: pointer;
  color: #fafcfc;
  border: none;
  border-radius: 6px;
  width: 46px;
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  font-size: $sm-font-size;
  outline: none;
}
.airport-code {
  font-size: 12px;
  line-height: 1;
  padding-top: 8px;
}
.airport-name {
  font-size: 12px;
  line-height: 1.6;
  color: #cdcdcd;
}
.el-icon--right {
  position: absolute;
  top: 8px;
  right: 5px;
}
.dropdown-menu{
  margin: 0;
  padding: 0;
  max-height: 50vh;
  overflow: auto;
  transform: rotate(0deg);
}
</style>
