// @flow

import React, {useEffect, useReducer} from "react"
import {produce} from "immer"

import MainLayout from "../MainLayout"
import SettingsProvider from "../SettingsProvider"
import combineReducers from "./reducers/combine-reducers.js"
import generalReducer from "./reducers/general-reducer.js"
import getFromLocalStorage from "../utils/get-from-local-storage"
import historyHandler from "./reducers/history-handler.js"
import imageReducer from "./reducers/image-reducer.js"
import useEventCallback from "use-event-callback"
import PropTypes from "prop-types"
import noopReducer from "./reducers/noop-reducer.js"
import {useTranslation} from "react-i18next"


export const Annotator = ({
  images,
  allowedArea,
  selectedImage = images && images.length > 0 ? 0 : undefined,
  showPointDistances,
  pointDistancePrecision,
  showTags = getFromLocalStorage("showTags", true),
  enabledTools = [],
  selectedTool = "select",
  regionTagList = [],
  regionClsList = [],
  regionColorList = [],
  preselectCls = null,
  imageTagList = [],
  imageClsList = [],
  taskDescription = "",
  RegionEditLabel,
  onExit,
  onNextImage,
  onPrevImage,
  keypointDefinitions,
  hideHeader,
  hideHeaderText,
  hideNext,
  hidePrev,
  hideClone,
  hideSettings,
  hideSave,
  enabledRegionProps = ["class", "name"],
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
      showTags,
      allowedArea,
      showPointDistances,
      pointDistancePrecision,
      selectedTool,
      mode: null,
      taskDescription,
      showMask: true,
      labelImages: imageClsList.length > 0 || imageTagList.length > 0,
      regionClsList,
      regionColorList,
      preselectCls,
      regionTagList,
      imageClsList,
      imageTagList,
      enabledTools,
      history: [],
      keypointDefinitions,
      enabledRegionProps,
      ...({
          selectedImage,
          images,
          selectedImageFrameTime:
            images && images.length > 0 ? images[0].frameTime : undefined
        })
    }, _ => _)
  )

  const dispatch = useEventCallback((action) => {
    if (action.type === "HEADER_BUTTON_CLICKED") {
      if (["Exit", "Done", "Save", "Complete"].includes(action.buttonName)) {
        return onExit(produce(state, s => {delete s.history}))
      } else if (action.buttonName === "Next" && onNextImage) {
        return onNextImage(produce(state, s => {delete s.history}))
      } else if (action.buttonName === "Prev" && onPrevImage) {
        return onPrevImage(produce(state, s => {delete s.history}))
      }
    }
    dispatchToReducer(action)
  })

  const onRegionClassAdded = useEventCallback((cls) => {
    dispatchToReducer({
      type: "ON_CLS_ADDED",
      cls: cls
    })
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
        RegionEditLabel={RegionEditLabel}
        alwaysShowNextButton={Boolean(onNextImage)}
        alwaysShowPrevButton={Boolean(onPrevImage)}
        state={state}
        dispatch={dispatch}
        onRegionClassAdded={onRegionClassAdded}
        hideHeader={hideHeader}
        hideHeaderText={hideHeaderText}
        hideNext={hideNext}
        hidePrev={hidePrev}
        hideClone={hideClone}
        hideSettings={hideSettings}
        hideSave={hideSave}
        enabledRegionProps={enabledRegionProps}
      />
    </SettingsProvider>
  )
}

Annotator.propTypes = {
  images: PropTypes.array,
  allowedArea: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    w: PropTypes.number.isRequired,
    h: PropTypes.number.isRequired
  }),
  selectedImage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showPointDistances: PropTypes.bool,
  pointDistancePrecision: PropTypes.number,
  showTags: PropTypes.bool,
  enabledTools: PropTypes.arrayOf(PropTypes.string),
  selectedTool: PropTypes.string,
  regionTagList: PropTypes.arrayOf(PropTypes.string),
  regionClsList: PropTypes.arrayOf(PropTypes.string),
  regionColorList: PropTypes.arrayOf(PropTypes.string),
  preselectCls: PropTypes.string,
  imageTagList: PropTypes.arrayOf(PropTypes.string),
  imageClsList: PropTypes.arrayOf(PropTypes.string),
  taskDescription: PropTypes.string,
  RegionEditLabel: PropTypes.node,
  onExit: PropTypes.func.isRequired,
  onNextImage: PropTypes.func,
  onPrevImage: PropTypes.func,
  keypointDefinitions: PropTypes.object,
  hideHeader: PropTypes.bool,
  hideHeaderText: PropTypes.bool,
  hideNext: PropTypes.bool,
  hidePrev: PropTypes.bool,
  hideClone: PropTypes.bool,
  hideSettings: PropTypes.bool,
  hideSave: PropTypes.bool,
  enabledRegionProps: PropTypes.arrayOf(PropTypes.string),
  userReducer: PropTypes.func
}

export default Annotator
