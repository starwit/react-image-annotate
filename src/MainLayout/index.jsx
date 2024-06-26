// @flow

import React, { useCallback, useRef } from "react"
import { createTheme, ThemeProvider } from "@mui/material/styles"

import ClassSelectionMenu from "../ClassSelectionMenu"
import DebugBox from "../DebugSidebarBox"
import HistorySidebarBox from "../HistorySidebarBox"
import ImageCanvas from "../ImageCanvas"
import RegionSelector from "../RegionSelectorSidebarBox"
import TagsSidebarBox from "../TagsSidebarBox"
import Workspace from "../workspace/Workspace"
import getActiveImage from "../Annotator/reducers/get-active-image"
import iconDictionary from "./icon-dictionary"
import styles from "./styles"
import { useDispatchHotkeyHandlers } from "../ShortcutsManager"
import useEventCallback from "use-event-callback"
import { useKey } from "react-use"
import { useSettings } from "../SettingsProvider"
import { withHotKeys } from "react-hotkeys"
import { Save } from "@mui/icons-material"


const emptyArr = []
const theme = createTheme()

const HotkeyDiv = withHotKeys(({ hotKeys, children, divRef, ...props }) => (
  <div {...{ ...hotKeys, ...props }} ref={divRef}>
    {children}
  </div>
))

export const MainLayout = ({
  state,
  dispatch,
  RegionEditLabel,
  onRegionClassAdded,
  hideHeader,
  hideHeaderText,
  hideNext = false,
  hidePrev = false,
  hideClone = false,
  hideSettings = false,
  hideSave = false,
  enabledRegionProps,
}) => {
  const settings = useSettings()

  const memoizedActionFns = useRef({})
  const action = (type, ...params) => {
    const fnKey = `${type}(${params.join(",")})`
    if (memoizedActionFns.current[fnKey])
      return memoizedActionFns.current[fnKey]

    const fn = (...args) =>
      params.length > 0
        ? dispatch(
          ({
            type,
            ...params.reduce(
              (acc, p, i) => (((acc[p] = args[i]), acc)), {})
          })
        )
        : dispatch({ type, ...args[0] })
    memoizedActionFns.current[fnKey] = fn
    return fn
  }

  const { currentImageIndex, activeImage } = getActiveImage(state)
  let nextImage
  if (currentImageIndex !== null) {
    nextImage = state.images[currentImageIndex + 1]
  }

  useKey("Escape", () => dispatch({ type: "CANCEL" }))

  const innerContainerRef = useRef()
  const hotkeyHandlers = useDispatchHotkeyHandlers({ dispatch })


  const refocusOnMouseEvent = useCallback((e) => {
    if (!innerContainerRef.current) return
    if (innerContainerRef.current.contains(document.activeElement)) return
    if (innerContainerRef.current.contains(e.target)) {
      innerContainerRef.current.focus()
      e.target.focus()
    }
  }, [])

  const canvas = (
    <ImageCanvas
      {...settings}
      showCrosshairs={
        settings.showCrosshairs &&
        !["select", "pan", "zoom"].includes(state.selectedTool)
      }
      key={state.selectedImage}
      showMask={state.showMask}
      fullImageSegmentationMode={false}
      showTags={state.showTags}
      allowedArea={state.allowedArea}
      modifyingAllowedArea={state.selectedTool === "modify-allowed-area"}
      regionClsList={state.regionClsList}
      regionTagList={state.regionTagList}
      regions={activeImage.regions || []}
      realSize={activeImage ? activeImage.realSize : undefined}
      imageSrc={activeImage.src}
      pointDistancePrecision={state.pointDistancePrecision}
      createWithPrimary={state.selectedTool.includes("create")}
      dragWithPrimary={state.selectedTool === "pan"}
      zoomWithPrimary={state.selectedTool === "zoom"}
      showPointDistances={state.showPointDistances}
      keypointDefinitions={state.keypointDefinitions}
      onMouseMove={action("MOUSE_MOVE")}
      onMouseDown={action("MOUSE_DOWN")}
      onMouseUp={action("MOUSE_UP")}
      onChangeRegion={action("CHANGE_REGION", "region")}
      onBeginRegionEdit={action("OPEN_REGION_EDITOR", "region")}
      onCloseRegionEdit={action("CLOSE_REGION_EDITOR", "region")}
      onDeleteRegion={action("DELETE_REGION", "region")}
      onBeginBoxTransform={action("BEGIN_BOX_TRANSFORM", "box", "directions")}
      onBeginMoveLinePoint={action(
        "BEGIN_MOVE_LINE_POINT",
        "line",
        "pointIdx"
      )}
      onBeginMovePolygonPoint={action(
        "BEGIN_MOVE_POLYGON_POINT",
        "polygon",
        "pointIndex"
      )}
      onBeginMoveKeypoint={action(
        "BEGIN_MOVE_KEYPOINT",
        "region",
        "keypointId"
      )}
      onAddPolygonPoint={action(
        "ADD_POLYGON_POINT",
        "polygon",
        "point",
        "pointIndex"
      )}
      onSelectRegion={action("SELECT_REGION", "region")}
      onBeginMovePoint={action("BEGIN_MOVE_POINT", "point")}
      onImageLoaded={action("IMAGE_LOADED", "image")}
      RegionEditLabel={RegionEditLabel}
      onImageLoadedDispatch={action("IMAGE_LOADED", "metadata")}
      onRegionClassAdded={onRegionClassAdded}
      enabledRegionProps={enabledRegionProps}
    />
  )
  const onClickHeaderItem = useEventCallback((item) => {
    dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
  })
  const debugModeOn = Boolean(window.localStorage.$ANNOTATE_DEBUG_MODE && state)
  const nextImageHasRegions =
    !nextImage || (nextImage.regions && nextImage.regions.length > 0)

  return (
    <ThemeProvider theme={theme}>
      <HotkeyDiv
        tabIndex={-1}
        divRef={innerContainerRef}
        onMouseDown={refocusOnMouseEvent}
        onMouseOver={refocusOnMouseEvent}
        allowChanges
        handlers={hotkeyHandlers}
        style={styles.container}
      >
        <Workspace
          iconDictionary={iconDictionary}
          hideHeader={hideHeader}
          hideHeaderText={hideHeaderText}
          headerLeftSide={[
            activeImage ? (
              <div key="activeImage" style={styles.headerTitle}>{activeImage.name}</div>
            ) : null,
          ].filter(Boolean)}
          headerItems={[
            !hidePrev && { name: "Prev" },
            !hideNext && { name: "Next" },
            !hideClone &&
            !nextImageHasRegions &&
            activeImage.regions && { name: "Clone" },
            !hideSettings && { name: "Settings" },
            !hideSave && { name: "Save", icon: <Save /> },
          ].filter(Boolean)}
          onClickHeaderItem={onClickHeaderItem}
          rightSidebarItems={[
            debugModeOn && (
              <DebugBox state={debugModeOn} lastAction={state.lastAction} key="DebugBox" />
            ),
            state.regionClsList && (
              <ClassSelectionMenu
                key="ClassSelectionMenu"
                selectedCls={state.selectedCls}
                preselectCls={state.preselectCls}
                regionClsList={state.regionClsList}
                regionColorList={state.regionColorList}
                onSelectCls={action("SELECT_CLASSIFICATION", "cls")}
              />
            ),
            state.labelImages && (
              <TagsSidebarBox
              />
            ),
            // (state.images?.length || 0) > 1 && (
            //   <ImageSelector
            //     onSelect={action("SELECT_REGION", "region")}
            //     images={state.images}
            //   />
            // ),
            <RegionSelector
              key={"activeImage" + activeImage.id}
              regions={activeImage ? activeImage.regions : emptyArr}
              onSelectRegion={action("SELECT_REGION", "region")}
              onDeleteRegion={action("DELETE_REGION", "region")}
              onChangeRegion={action("CHANGE_REGION", "region")}
            />,
            <HistorySidebarBox
              key="HistorySideBox"
              history={state.history}
              onRestoreHistory={action("RESTORE_HISTORY")}
            />,
          ].filter(Boolean)}
        >
          {canvas}
        </Workspace>
      </HotkeyDiv>
    </ThemeProvider>
  )
}

export default MainLayout
