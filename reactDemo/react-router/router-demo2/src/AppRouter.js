/*
 * @Author: your name
 * @Date: 2020-12-09 17:06:56
 * @LastEditTime: 2020-12-10 12:00:12
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\react-router\router-demo1\src\AppRouters.js
 */
import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import Bar from './Pages/Bar'
import Todolist from './Pages/Todolist'
import Index from './Pages/Index'
import './main.css'
function AppRouter () {
  return (
    <Router>
      <div className="flex">
        <ul>
          <li><Link to="/">首页</Link></li>
          <li><Link to="/list">list</Link></li>
          <li><Link to="/Bar">Bar</Link></li>
        </ul>
        <div>
          <Route path="/" exact component={Index}></Route>
          <Route path="/list" exact component={Todolist}></Route>
          <Route path="/Bar" exact component={Bar}></Route>
        </div>
      </div>
    </Router>
  )
}

export default AppRouter