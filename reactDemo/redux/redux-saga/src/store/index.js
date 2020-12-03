/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-11-28 16:14:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \redux-thunk\src\store\index.js
 */
import { createStore, applyMiddleware } from "redux"
import reducer from "./reducer"
import createSagaMiddleware from "redux-saga"
import mySaga from './saga'
const sagaMiddleware = createSagaMiddleware()
const store = createStore(reducer, applyMiddleware(sagaMiddleware))
sagaMiddleware.run(mySaga)
export default store
