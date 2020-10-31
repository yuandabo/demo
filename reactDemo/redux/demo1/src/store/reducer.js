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
  if (type === "changeInput") {
    const newState = JSON.parse(JSON.stringify(state));
    newState.inputValue = value;
    return newState;
  }
  if (type === "addList") {
    const newState = JSON.parse(JSON.stringify(state));
    newState.list.push({
      id: newState.list.length + 1,
      value: newState.inputValue,
    });
    newState.inputValue = "";
    console.log(newState);
    return newState;
  }
  return state;
};
