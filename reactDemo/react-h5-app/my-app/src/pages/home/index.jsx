import React, { Component } from 'react'
import { PageHeader } from 'antd'

export default class App extends Component {
  // 初始化页面常量 绑定事件方法
  constructor(props, context) {
    super(props)
  }

  // 组件已经加载到dom中
  componentDidMount () {
    this.init()
  }

  componentWillReceiveProps (nextProps) {

  }

  init () {
  }

  render () {
    return (
      <PageHeader
        className=""
        onBack={() => null}
        title="Title"
        subTitle="This is a subtitle"
      />
    )
  }
}
