/* eslint-disable no-undef */
/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-12-09 17:04:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\Todolist.js
 */
import React, { Component } from "react";

class Todolist extends Component {
  constructor(props) {
    super(props)
    this.state = {
      id:''
    }
  }
  render() {
   return <div>
      Todolist{this.state.id}
    </div>
  }
  componentDidMount(){
    console.log(this.props)
    let tempId = this.props.match.params.id
    this.setState({id:tempId})
  }
}

export default Todolist;