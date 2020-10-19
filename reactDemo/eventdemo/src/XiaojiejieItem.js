import React, { Component } from 'react';

class XiaojiejieItem extends Component {
    constructor(props) {
        super(props)
    }
    // state = {  }
    render() {
        return (
            <li  key={this.props.content.value + this.props.itemIndex} onClick={this.handleClick.bind(this)}>{this.props.content.value}<button onClick={this.handleClick.bind(this)}>删除我</button></li>
        )
    }
    handleClick() {
        this.props.delItem(this.props.itemIndex)
    }
}

export default XiaojiejieItem;