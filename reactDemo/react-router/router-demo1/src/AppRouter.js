/*
 * @Author: your name
 * @Date: 2020-12-09 17:06:56
 * @LastEditTime: 2020-12-09 17:15:26
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\react-router\router-demo1\src\AppRouters.js
 */
import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router'
import Bar from '../Pages/Bar'
import Todolist from '../Pages/Todolist'
import Index from '../Pages/index'

function AppRouter () {
  return (
    <Router>
      <ul>
        <li><link to="/">首页</link></li>
        <li><link to="/list"></link></li>
        <li><link to="/Bar"></link></li>
      </ul>
      <Route path="/" exact component={Index}></Route>
      <Route path="/list" exact component={Todolist}></Route>
      <Route path="/Bar" exact component={Bar}></Route>
    </Router>
  )
}

export default AppRouter