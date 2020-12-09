import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [
        { cid: 123, title: '个人博客-1' },
        { cid: 456, title: '个人博客-2' },
        { cid: 789, title: '个人博客-3' },
      ]
    }
  }
  render() {
    return (
      <ul>
        {
          this.state.list.map(v=>{
            return (
              <li key={v.cid}><Link to={'/list/'+v.cid}>{v.title}</Link></li>
            )
          })
        }
      </ul>
    );
  }
}

export default Index;