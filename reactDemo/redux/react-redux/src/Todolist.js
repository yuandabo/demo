/* eslint-disable no-undef */
/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-12-07 16:53:01
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\Todolist.js
 */
import React from "react";
import { connect } from 'react-redux'
import { Button, Input, List } from "antd";
import "antd/dist/antd.css";
import './main.css'
import { dispatchToProps, stateToProps } from './store/dispatchToProps'


const Todolist = (props) => {
  let { addList, inputChange, list } = props
  return (
    <div>
      <Input placeholder="Basic usage" onChange={inputChange} />
      <Button onClick={addList}>增加</Button>
      <List
        bordered
        dataSource={list}
        renderItem={(item, index) => <List.Item >{item.value}</List.Item>}
      />
      {/* <div>axios:{mockData.id}</div> */}
    </div>
  );
}

export default connect(stateToProps, dispatchToProps)(Todolist);