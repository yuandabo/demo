import React, { Component } from 'react'
import Nav from '@components/Nav/Nav'

export default class Home extends Component {
  // 初始化页面常量 绑定事件方法
  constructor(props, context) {
    super(props)
    this.state = {
      
    }
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
      <Nav
          title='首页'
      />
    )
  }
}
