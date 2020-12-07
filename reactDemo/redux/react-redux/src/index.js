import React from "react";
import ReactDOM from 'react-dom'
import Todolist from "./Todolist";
import { Provider } from 'react-redux'
import store from './store'

const rootElement = document.getElementById('root')
ReactDOM.render(
  <Provider store={store}>
    <Todolist />
  </Provider>,
  rootElement
)