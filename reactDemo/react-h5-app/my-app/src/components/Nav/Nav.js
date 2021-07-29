import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import { PageHeader } from 'antd'
import './Nav.scss'
// import {connect} from 'react-redux'
// import {} from '@actions/xxx'

// @connect((storeState)=>({}))

export default class Nav extends Component {
  static defaultProps={
  }

  static propTypes = {
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {}

  // #region vscode 1.17的收缩代码块功能  业务代码


  // #endregion

  render() {
    return (
       <PageHeader
        className=""
        onBack={() => null}
        title={this.props.title}
      />
    )
  }
}
