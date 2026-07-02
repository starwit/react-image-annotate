// @flow

import {useImperativeHandle, useReducer} from "react"
import {produce} from "immer"

import MainLayout from "../MainLayout"
import SettingsProvider from "../SettingsProvider"
import combineReducers from "./reducers/combine-reducers.js"
import generalReducer from "./reducers/general-reducer.js"
import historyHandler from "./reducers/history-handler.js"
import imageReducer from "./reducers/image-reducer.js"
import PropTypes from "prop-types"
import noopReducer from "./reducers/noop-reducer.js"
import {useTranslation} from "react-i18next"


export const Annotator = ({
  image,
  selectedTool = "select",
  classifications = [],
  preselectCls = null,
  enabledRegionProps = ["class", "name"],
  movementLocked = false,
  userReducer,
  ref
}) => {
  const {t} = useTranslation();
  const [state, dispatchToReducer] = useReducer(
    historyHandler(
      combineReducers(
        imageReducer,
        generalReducer,
        userReducer === undefined ? noopReducer : userReducer
      )
    ),
    produce({
      selectedTool,
      mode: null,
      classifications,
      preselectCls,
      history: [],
      enabledRegionProps,
      image,
    }, _ => _)
  )

  useImperativeHandle(
    ref,
    () => ({
      getRegions: () => state.image?.regions ?? [],
    }),
    [state]
  )

  if (!image)
    return t("error.image")

  return (
    <SettingsProvider>
      <MainLayout
        state={state}
        dispatch={dispatchToReducer}
        enabledRegionProps={enabledRegionProps}
        movementLocked={movementLocked}
      />
    </SettingsProvider>
  )
}

Annotator.propTypes = {
  image: PropTypes.object,
  selectedTool: PropTypes.string,
  classifications: PropTypes.arrayOf(
    PropTypes.shape({
      cls: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      color: PropTypes.string,
      tool: PropTypes.string,
    })
  ),
  preselectCls: PropTypes.string,
  enabledRegionProps: PropTypes.arrayOf(PropTypes.string),
  movementLocked: PropTypes.bool,
  userReducer: PropTypes.func,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
}

export default Annotator
