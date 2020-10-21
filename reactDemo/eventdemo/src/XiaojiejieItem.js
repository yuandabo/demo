import React, { Component } from 'react';
import PropTypes from 'prop-types';

class XiaojiejieItem extends Component {
    // eslint-disable-next-line
    constructor(props) {
        super(props)
    }
    // state = {  }
    render() {
        return (
            <li  key={this.props.content.value + this.props.itemIndex} 
            onClick={this.handleClick.bind(this)}
            >{this.props.content.value}<button onClick={this.handleClick.bind(this)}>删除我</button></li>
        )
    }
    handleClick() {
        this.props.delItem(this.props.itemIndex)
    }
}
XiaojiejieItem.propTypes ={
    content:PropTypes.object.isRequired,
    itemIndex:PropTypes.number.isRequired
}
XiaojiejieItem.defaultProps={
    content:{},
    itemIndex:0
}
export default XiaojiejieItem;