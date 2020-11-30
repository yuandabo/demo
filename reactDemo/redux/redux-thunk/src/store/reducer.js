/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-11-30 16:13:28
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\store\reducer.js
 */

import { DELETE_LIST, ADD_LIST, CHANGE_INPUT, CHANGE_MOCKDATA } from './actionTypes'
const defaultStore = {
  inputValue: "",
  list: [
    { id: 1, value: "1" },
    { id: 3, value: "2" },
    { id: 3, value: "3" },
  ],
  mockData: ''
};
// eslint-disable-next-line import/no-anonymous-default-export
export default (state = defaultStore, action) => {
  console.log(state, action);
  const { type, value, data } = action;
  if (type === CHANGE_INPUT) {
    const newState = JSON.parse(JSON.stringify(state));
    newState.inputValue = value;
    return newState;
  }
  if (type === ADD_LIST) {
    const newState = JSON.parse(JSON.stringify(state));
    newState.list.push({
      id: newState.list.length + 1,
      value: newState.inputValue,
    });
    newState.inputValue = "";
    console.log(newState);
    return newState;
  }
  if (type === DELETE_LIST) {
    const newState = JSON.parse(JSON.stringify(state));
    newState.list = newState.list.filter((v, index) => { return index !== action.index })
    // newState.inputValue = "";
    console.log(newState);
    return newState;
  }
  if (type === CHANGE_MOCKDATA) {
    const newState = JSON.parse(JSON.stringify(state));
    newState.mockData = data
    return newState;
  }
  return state;
};
