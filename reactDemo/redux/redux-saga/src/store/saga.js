import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import { receiveTodos } from './actionCreator'
import { getMock } from '../api/index'
import ColumnGroup from 'antd/lib/table/ColumnGroup';
import { GET_MYLIST } from './actionTypes'

// worker Saga: will be fired on USER_FETCH_REQUESTED actions
// function* fetchUser(action) {
//    try {
//       const user = yield call(getMock, action.payload.userId);
//       yield put({type: "USER_FETCH_SUCCEEDED", user: user});
//    } catch (e) {
//       yield put({type: "USER_FETCH_FAILED", message: e.message});
//    }
// }

/*
  Starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action.
  Allows concurrent fetches of user.
*/
function* mySaga() {
    console.log('mysaga')
    yield takeEvery(GET_MYLIST, getList)
}

function* getList() {
    yield getMock()
        .then(res => {
            console.log('res', res)
            const action = receiveTodos(res.data)
            put(action)
        })
}
/*
  Alternatively you may use takeLatest.

  Does not allow concurrent fetches of user. If "USER_FETCH_REQUESTED" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.
*/
// function* mySaga() {
//     yield takeLatest("USER_FETCH_REQUESTED", fetchUser);
// }

export default mySaga;