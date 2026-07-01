// @flow

import {useEffect, useImperativeHandle, useReducer} from "react"
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
  images,
  selectedImage = images && images.length > 0 ? 0 : undefined,
  selectedTool = "select",
  regionClsList = [],
  regionColorList = [],
  preselectCls = null,
  enabledRegionProps = ["class", "name"],
  movementLocked = false,
  userReducer,
  ref
}) => {
  if (typeof selectedImage === "string") {
    selectedImage = (images || []).findIndex((img) => img.src === selectedImage)
    if (selectedImage === -1) selectedImage = undefined
  }
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
      regionClsList,
      regionColorList,
      preselectCls,
      history: [],
      enabledRegionProps,
      selectedImage,
      images,
    }, _ => _)
  )

  useImperativeHandle(
    ref,
    () => ({
      getState: () => produce(state, (s) => {delete s.history}),
    }),
    [state]
  )

  useEffect(() => {
    if (selectedImage === undefined) return
    dispatchToReducer({
      type: "SELECT_IMAGE",
      imageIndex: selectedImage,
      image: state.images[selectedImage]
    })
  }, [selectedImage, state.images])

  if (!images)
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
  images: PropTypes.array,
  selectedImage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selectedTool: PropTypes.string,
  regionClsList: PropTypes.arrayOf(PropTypes.string),
  regionColorList: PropTypes.arrayOf(PropTypes.string),
  preselectCls: PropTypes.string,
  enabledRegionProps: PropTypes.arrayOf(PropTypes.string),
  movementLocked: PropTypes.bool,
  userReducer: PropTypes.func,
  ref: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
}

export default Annotator
