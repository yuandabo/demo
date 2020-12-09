/*
 * @Author: your name
 * @Date: 2020-12-09 17:06:56
 * @LastEditTime: 2020-12-09 17:15:26
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\react-router\router-demo1\src\AppRouters.js
 */
import React from 'react'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import Bar from './Pages/Bar'
import Todolist from './Pages/Todolist.js'
import Index from './Pages/Index.js'
// function Index() {
//   return <h2>JSPang.com</h2>;
// }

// function List() {
//   return <h2>List-Page</h2>;
// }
// function Bar() {
//   return <h2>Bar</h2>;
// }

function AppRouter () {
  return (
    <Router>
      <ul>
        <li><Link to="/">首页</Link></li>
        <li><Link to="/list">list</Link></li>
        <li><Link to="/Bar">Bar</Link></li>
      </ul>
      <Route path="/" exact component={Index}></Route>
      <Route path="/list/:id" component={Todolist}></Route>
      <Route path="/Bar" exact component={Bar}></Route>
    </Router>
  )
}

export default AppRouter