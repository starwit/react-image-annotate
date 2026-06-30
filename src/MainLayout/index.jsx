// @flow

import { useCallback, useRef } from "react"
import { createTheme, ThemeProvider } from "@mui/material/styles"

import ClassSelectionMenu from "../ClassSelectionMenu"
import DebugBox from "../DebugSidebarBox"
import HistorySidebarBox from "../HistorySidebarBox"
import ImageCanvas from "../ImageCanvas"
import RegionSelector from "../RegionSelectorSidebarBox"
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
  hideHeader,
  hideHeaderText,
  hideSave = false,
  enabledRegionProps,
  movementLocked = false,
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

  const { activeImage } = getActiveImage(state)

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
      regionClsList={state.regionClsList}
      regions={activeImage.regions || []}
      imageSrc={activeImage.src}
      createWithPrimary={state.selectedTool.includes("create")}
      dragWithPrimary={state.selectedTool === "pan"}
      zoomWithPrimary={state.selectedTool === "zoom"}
      movementLocked={movementLocked}
      onMouseMove={action("MOUSE_MOVE")}
      onMouseDown={action("MOUSE_DOWN")}
      onMouseUp={action("MOUSE_UP")}
      onChangeRegion={action("CHANGE_REGION", "region")}
      onBeginRegionEdit={action("OPEN_REGION_EDITOR", "region")}
      onCloseRegionEdit={action("CLOSE_REGION_EDITOR", "region")}
      onDeleteRegion={action("DELETE_REGION", "region")}
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
      onAddPolygonPoint={action(
        "ADD_POLYGON_POINT",
        "polygon",
        "point",
        "pointIndex"
      )}
      onSelectRegion={action("SELECT_REGION", "region")}
      onImageLoadedDispatch={action("IMAGE_LOADED", "metadata")}
      enabledRegionProps={enabledRegionProps}
    />
  )
  const onClickHeaderItem = useEventCallback((item) => {
    dispatch({ type: "HEADER_BUTTON_CLICKED", buttonName: item.name })
  })
  const debugModeOn = Boolean(window.localStorage.$ANNOTATE_DEBUG_MODE && state)

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
