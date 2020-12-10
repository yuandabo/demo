/* eslint-disable no-undef */
/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-12-10 14:02:56
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\Todolist.js
 */
import React from "react";
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'

function List1 () {
  return (
    <div>List1</div>
  )
}
function List2 () {
  return (
    <div>List2</div>
  )
}
function List3 () {
  return (
    <div>List3</div>
  )
}


const Todolist = () => {

  return (
    <Router>
      <div>
        <ul>
          <li><Link to="/Bar/list1">List1</Link></li>
          <li><Link to="/Bar/list2">List2</Link></li>
          <li><Link to="/Bar/list3">List3</Link></li>
        </ul>
        <div>
          <Route path="/Bar/list1" exact component={List1}></Route>
          <Route path="/Bar/list2" exact component={List2}></Route>
          <Route path="/Bar/list3" exact component={List3}></Route>
        </div>
      </div>
    </Router>
  );
}

export default Todolist;