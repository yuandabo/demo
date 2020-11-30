/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-11-30 16:16:49
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\Todolist.js
 */
import React, { Component } from "react";
import { Button, Input, List } from "antd";
// import {DELETE_LIST,ADD_LIST,CHANGE_INPUT} from './store/actionTypes'
import { changeInputAction, addListAction, delListAction, getMockData } from './store/actionCreator'
import "antd/dist/antd.css";
import './main.css'
import store from "./store";
class Todolist extends Component {
  constructor(props) {
    super(props);
    this.state = store.getState();
    this.changeInputValue = this.changeInputValue.bind(this);
    this.addList = this.addList.bind(this)
    this.storeChange = this.storeChange.bind(this)
    store.subscribe(this.storeChange)
  }
  componentDidMount () {
    console.log(store.getState());
    const action = getMockData()
    store.dispatch(action)
  }
  render () {
    return (
      <div>
        <Input placeholder="Basic usage" onChange={this.changeInputValue} />
        <Button onClick={this.addList}>增加</Button>
        <List
          bordered
          dataSource={this.state.list}
          renderItem={(item, index) => <List.Item onClick={this.decreaceList.bind(this, index)}>{item.value}</List.Item>}
        />
        <div>axios:{this.state.mockData.id}</div>
      </div>
    );
  }
  changeInputValue (e) {
    const value = e.target.value;
    const action = changeInputAction(value)
    store.dispatch(action);
  }
  addList () {
    const action = addListAction()
    store.dispatch(action);
  }
  storeChange () {
    this.setState(store.getState())
  }
  decreaceList (index) {
    console.log(index)
    const action = delListAction(index)
    store.dispatch(action)
  }
}

export default Todolist;
