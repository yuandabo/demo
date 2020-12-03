/*
 * @Author: your name
 * @Date: 2020-11-28 16:03:17
 * @LastEditTime: 2020-11-30 16:15:03
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\store\actionCreator.js
 */
import { DELETE_LIST, ADD_LIST, CHANGE_INPUT, CHANGE_MOCKDATA } from './actionTypes'
import { getMock } from '../api'

export const changeInputAction = (value) => ({
  type: CHANGE_INPUT,
  value
})

export const addListAction = () => ({
  type: ADD_LIST
})

export const delListAction = (value) => ({
  type: DELETE_LIST,
  index: value
})

export const receiveTodos = data => ({
  type: CHANGE_MOCKDATA,
  data
});

export const getMockData = () => (dispatch) => (
  getMock()
    .then(res => {
      console.log('res', res)
      const action = receiveTodos(res.data)
      dispatch(action)
    })
)

export const getMyListAction = () =>({
  type:'GET_MYLIST'
})