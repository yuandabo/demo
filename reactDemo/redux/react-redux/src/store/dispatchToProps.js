/*
 * @Author: your name
 * @Date: 2020-12-07 15:43:00
 * @LastEditTime: 2020-12-07 16:46:09
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\store\dispatchToProps.js
 */
// import store from "./index";
import { changeInputAction, addListAction, delListAction } from './actionCreator'
export const dispatchToProps = (dispatch) => {
  return {
    inputChange (e) {
      const value = e.target.value;
      const action = changeInputAction(value)
      dispatch(action)
    },
    addList () {
      const action = addListAction()
      dispatch(action)
    },
    decreaceList (index) {
      const action = delListAction(index)
      dispatch(action)
    }
  }
}

export const stateToProps = (state) => {
  return {
    inputValue: state.inputValue,
    list: state.list
  }
}