import {DELETE_LIST,ADD_LIST,CHANGE_INPUT} from './actionTypes'

export const changeInputAction = (value) => ({
    type:CHANGE_INPUT,
    value
})

export const addListAction = () => ({
    type:ADD_LIST
})

export const delListAction = (value) => ({
    type:DELETE_LIST,
    index:value
})