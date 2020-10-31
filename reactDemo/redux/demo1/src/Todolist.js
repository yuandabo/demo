import React, { Component } from "react";
import { Button, Input, List } from "antd";
import "antd/dist/antd.css";
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
  componentDidMount() {
    console.log(store.getState());
  }
  render() {
    return (
      <div>
        <Input placeholder="Basic usage" onChange={this.changeInputValue} />
        <Button onClick={this.addList}>增加</Button>
        <List
          bordered
          dataSource={this.state.list}
          renderItem={(item) => <List.Item>{item.value}</List.Item>}
        />
      </div>
    );
  }
  changeInputValue(e) {
    const value = e.target.value;
    const action = {
      type: "changeInput",
      value: value,
    };
    store.dispatch(action);
  }
  addList() {
    console.log("dd");
    const action = {
      type: "addList",
      // value:value
    };
    store.dispatch(action);
  }
  storeChange(){
    this.setState(store.getState())
  }
}

export default Todolist;
