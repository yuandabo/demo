/*
 * @Author: your name
 * @Date: 2020-12-09 17:03:34
 * @LastEditTime: 2020-12-10 14:00:53
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\react-router\router-demo1\Pages\bar.js
 */
import React from "react";
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'

function Bar1 () {
  return (
    <div>Bar1</div>
  )
}
function Bar2 () {
  return (
    <div>Bar2</div>
  )
}
function Bar3 () {
  return (
    <div>Bar3</div>
  )
}

const Bar = () => {

  return (
    <Router>
      <div>
        <ul>
          <li><Link to="/Bar/bar1">bar1</Link></li>
          <li><Link to="/Bar/bar2">bar2</Link></li>
          <li><Link to="/Bar/bar3">bar3</Link></li>
        </ul>
        <div>
          <Route path="/Bar/bar1" exact component={Bar1}></Route>
          <Route path="/Bar/bar2" exact component={Bar2}></Route>
          <Route path="/Bar/bar3" exact component={Bar3}></Route>
        </div>
      </div>
    </Router>
  );
}

export default Bar;