import React, { Component, Fragment } from 'react'
import './main.css'
import XiaojiejieItem from './XiaojiejieItem'
class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      itemList: [{ value: '吃快餐' }, { value: '吃点餐' }, { value: '吃中式餐' }]
    }
  }
  render() {
    return (
      <Fragment>
        <input className="input" value={this.state.value} onChange={this.inputClick.bind(this)} />
        <button onClick={this.addItem.bind(this)}>添加</button>
        <ul>
          {
            this.state.itemList.map((v, index) => {
              return (
                <XiaojiejieItem key={index+v.value} content={v} itemIndex={index} delItem={this.delItem.bind(this)}></XiaojiejieItem>
              )
            })
          }
        </ul>
      </Fragment>
    )

  }
  inputClick(e) {
    this.setState({
      value: e.target.value
    })
  }
  addItem() {
    console.log(this.state)
    this.setState({
      itemList: [...this.state.itemList, { value: this.state.value }],
      value: ''
    })
  }
  delItem(itemIndex) {
    const list = this.state.itemList.filter((v,index) => {
      return index !== itemIndex
    })
    this.setState({
      itemList: list
    })
  }
}

export default App