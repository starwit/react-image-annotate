// @flow

import {useEffect, useReducer} from "react"
import {produce} from "immer"

import MainLayout from "../MainLayout"
import SettingsProvider from "../SettingsProvider"
import combineReducers from "./reducers/combine-reducers.js"
import generalReducer from "./reducers/general-reducer.js"
import historyHandler from "./reducers/history-handler.js"
import imageReducer from "./reducers/image-reducer.js"
import useEventCallback from "use-event-callback"
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
  onExit,
  hideHeader,
  hideHeaderText,
  hideSave,
  enabledRegionProps = ["class", "name"],
  movementLocked = false,
  userReducer
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

  const dispatch = useEventCallback((action) => {
    if (action.type === "HEADER_BUTTON_CLICKED") {
      if (["Exit", "Done", "Save", "Complete"].includes(action.buttonName)) {
        return onExit(produce(state, s => {delete s.history}))
      }
    }
    dispatchToReducer(action)
  })

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
        dispatch={dispatch}
        hideHeader={hideHeader}
        hideHeaderText={hideHeaderText}
        hideSave={hideSave}
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
  onExit: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  hideHeaderText: PropTypes.bool,
  hideSave: PropTypes.bool,
  enabledRegionProps: PropTypes.arrayOf(PropTypes.string),
  movementLocked: PropTypes.bool,
  userReducer: PropTypes.func
}

export default Annotator
