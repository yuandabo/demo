import React, { Component } from "react";
import { Button, Input, List,Typography } from "antd";
import "antd/dist/antd.css";
import store from './store'
class Todolist extends Component {
    constructor(props){
        super(props)
        this.state = store.getState()
    }
  state = {};
  componentDidMount(){
      console.log(store.getState())
  }
  render() {
    return (
      <div>
        <Input placeholder="Basic usage" />
        <Button>增加</Button>
        <List
          header={<div>Header</div>}
          footer={<div>Footer</div>}
          bordered
          dataSource={this.state.list}
          renderItem={(item) => (
            <List.Item>
              <Typography.Text mark>[ITEM]</Typography.Text> {item}
            </List.Item>
          )}
        />
      </div>
    );
  }
  
}

export default Todolist;
