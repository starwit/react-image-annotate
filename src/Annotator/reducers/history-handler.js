// @flow

import {produce} from "immer"

import moment from "moment"

const typesToSaveWithHistory = {
  BEGIN_BOX_TRANSFORM: "Transform/Move Box",
  BEGIN_MOVE_POINT: "Move Point",
  DELETE_REGION: "Delete Region",
}

export const saveToHistory = (state, name) =>
  produce(state, s => {
    s.history = [
      {
        time: moment().toDate(),
        state: produce(state, s => {delete s.history}),
        name,
      },
    ].concat((s.history || []).slice(0, 9))
  })

export default (reducer) => {
  return (state, action) => {
    const prevState = state
    const nextState = reducer(state, action)

    if (action.type === "RESTORE_HISTORY") {
      if (state.history.length > 0) {
        return produce(
          nextState.history[0].state,
          s => {s.history = nextState.history.slice(1)}
        )
      }
    } else {
      if (
        prevState !== nextState &&
        Object.keys(typesToSaveWithHistory).includes(action.type)
      ) {
        return produce(
          nextState,
          s => {
            s.history = [
              {
                time: moment().toDate(),
                state: produce(prevState, ps => {delete ps.history}),
                name: typesToSaveWithHistory[action.type] || action.type,
              },
            ]
              .concat(nextState.history || [])
              .slice(0, 9)
          })
      }
    }

    return nextState
  }
}
