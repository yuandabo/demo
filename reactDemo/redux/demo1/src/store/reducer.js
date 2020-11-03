
import {DELETE_LIST,ADD_LIST,CHANGE_INPUT} from './actionTypes'
const defaultStore = {
  inputValue: "",
  list: [
    { id: 1, value: "1" },
    { id: 3, value: "2" },
    { id: 3, value: "3" },
  ],
};
// eslint-disable-next-line import/no-anonymous-default-export
export default (state = defaultStore, action) => {
  console.log(state, action);
  const { type, value } = action;
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
  if(type===DELETE_LIST){
    const newState = JSON.parse(JSON.stringify(state));
    newState.list=  newState.list.filter((v,index)=>{return index!==action.index})
    // newState.inputValue = "";
    console.log(newState);
    return newState;
  }
  return state;
};
