import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react"
import {Matrix} from "transformation-matrix-js"
import Crosshairs from "../Crosshairs"
import {createTheme, ThemeProvider} from "@mui/material/styles"
import styles from "./styles"
import PreventScrollToParents from "../PreventScrollToParents"
import useWindowSize from "../hooks/use-window-size.js"
import useMouse from "./use-mouse"
import useProjectRegionBox from "./use-project-box"
import {useRafState} from "react-use"
import RegionTags from "../RegionTags"
import RegionSelectAndTransformBoxes from "../RegionSelectAndTransformBoxes"
import ImageCanvasBackground from "../ImageCanvasBackground/index.jsx"
import useEventCallback from "use-event-callback"
import RegionShapes from "../RegionShapes"
import useWasdMode from "./use-wasd-mode"
import PropTypes from 'prop-types'

const theme = createTheme()

const getDefaultMat = () => Matrix.from(1, 0, 0, 1, -10, -10)

export const ImageCanvas = ({
  regions,
  imageSrc,
  onMouseMove = (p) => null,
  onMouseDown = (p) => null,
  onMouseUp = (p) => null,
  dragWithPrimary = false,
  zoomWithPrimary = false,
  createWithPrimary = false,
  regionClsList,
  showCrosshairs,
  onImageLoadedDispatch,
  onChangeRegion,
  onBeginRegionEdit,
  onCloseRegionEdit,
  onBeginMoveLinePoint,
  onBeginMovePolygonPoint,
  onAddPolygonPoint,
  onSelectRegion,
  onDeleteRegion,
  enabledRegionProps
}) => {
  const canvasEl = useRef(null)
  const layoutParams = useRef({})
  const [dragging, changeDragging] = useRafState(false)
  const [zoomStart, changeZoomStart] = useRafState(null)
  const [zoomEnd, changeZoomEnd] = useRafState(null)
  const [mat, changeMat] = useRafState(getDefaultMat())
  const windowSize = useWindowSize()

  const getLatestMat = useEventCallback(() => mat)
  useWasdMode({getLatestMat, changeMat})

  const {mouseEvents, mousePosition} = useMouse({
    canvasEl,
    dragging,
    mat,
    layoutParams,
    changeMat,
    zoomStart,
    zoomEnd,
    changeZoomStart,
    changeZoomEnd,
    changeDragging,
    zoomWithPrimary,
    dragWithPrimary,
    onMouseMove,
    onMouseDown,
    onMouseUp
  })

  useLayoutEffect(() => changeMat(mat.clone()), [windowSize])

  const projectRegionBox = useProjectRegionBox({layoutParams, mat})

  const [imageDimensions, changeImageDimensions] = useState()
  const imageLoaded = Boolean(imageDimensions && imageDimensions.naturalWidth)

  const onImageLoaded = useEventCallback(
    ({naturalWidth, naturalHeight, duration}) => {
      const dims = {naturalWidth, naturalHeight, duration}
      if (onImageLoadedDispatch) onImageLoadedDispatch(dims)
      changeImageDimensions(dims)
      // Redundant update to fix rerendering issues
      setTimeout(() => changeImageDimensions(dims), 10)
    }
  )

  const canvas = canvasEl.current
  if (canvas && imageLoaded) {
    const {clientWidth, clientHeight} = canvas

    const fitScale = Math.max(
      imageDimensions.naturalWidth / (clientWidth - 20),
      imageDimensions.naturalHeight / (clientHeight - 20)
    )

    const [iw, ih] = [
      imageDimensions.naturalWidth / fitScale,
      imageDimensions.naturalHeight / fitScale
    ]

    layoutParams.current = {
      iw,
      ih,
      fitScale,
      canvasWidth: clientWidth,
      canvasHeight: clientHeight
    }
  }

  useEffect(() => {
    if (!imageLoaded) return
    changeMat(getDefaultMat())
    // eslint-disable-next-line
  }, [imageLoaded])

  useLayoutEffect(() => {
    if (!imageDimensions) return
    const {clientWidth, clientHeight} = canvas
    canvas.width = clientWidth
    canvas.height = clientHeight
    const context = canvas.getContext("2d")
    context.save()
    context.transform(...mat.clone().inverse().toArray())
    context.restore()
  })

  const {iw, ih} = layoutParams.current

  let zoomBox =
    !zoomStart || !zoomEnd
      ? null
      : {
        ...mat.clone().inverse().applyToPoint(zoomStart.x, zoomStart.y),
        w: (zoomEnd.x - zoomStart.x) / mat.a,
        h: (zoomEnd.y - zoomStart.y) / mat.d
      }
  if (zoomBox) {
    if (zoomBox.w < 0) {
      zoomBox.x += zoomBox.w
      zoomBox.w *= -1
    }
    if (zoomBox.h < 0) {
      zoomBox.y += zoomBox.h
      zoomBox.h *= -1
    }
  }

  const imagePosition = {
    topLeft: mat.clone().inverse().applyToPoint(0, 0),
    bottomRight: mat.clone().inverse().applyToPoint(iw, ih)
  }

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          width: "100%",
          height: "100%",
          maxHeight: "calc(100vh - 68px)",
          position: "relative",
          overflow: "hidden",
          cursor: createWithPrimary
            ? "crosshair"
            : dragging
              ? "grabbing"
              : dragWithPrimary
                ? "grab"
                : zoomWithPrimary
                  ? mat.a < 1
                    ? "zoom-out"
                    : "zoom-in"
                  : undefined
        }}
      >
        {showCrosshairs && (
          <Crosshairs key="crossHairs" mousePosition={mousePosition} />
        )}
        {imageLoaded && !dragging && (
          <RegionSelectAndTransformBoxes
            key="regionSelectAndTransformBoxes"
            regions={regions}
            mouseEvents={mouseEvents}
            projectRegionBox={projectRegionBox}
            dragWithPrimary={dragWithPrimary}
            createWithPrimary={createWithPrimary}
            zoomWithPrimary={zoomWithPrimary}
            onSelectRegion={onSelectRegion}
            layoutParams={layoutParams}
            mat={mat}
            onBeginMoveLinePoint={onBeginMoveLinePoint}
            onBeginMovePolygonPoint={onBeginMovePolygonPoint}
            onAddPolygonPoint={onAddPolygonPoint}
          />
        )}
        {imageLoaded && !dragging && (
          <PreventScrollToParents key="regionTags">
            <RegionTags
              regions={regions}
              projectRegionBox={projectRegionBox}
              mouseEvents={mouseEvents}
              regionClsList={regionClsList}
              onBeginRegionEdit={onBeginRegionEdit}
              onChangeRegion={onChangeRegion}
              onCloseRegionEdit={onCloseRegionEdit}
              onDeleteRegion={onDeleteRegion}
              layoutParams={layoutParams}
              imageSrc={imageSrc}
              enabledRegionProps={enabledRegionProps}
            />
          </PreventScrollToParents>
        )}

        {zoomWithPrimary && zoomBox !== null && (
          <div
            key="zoomBox"
            style={{
              position: "absolute",
              zIndex: 1,
              border: "1px solid #fff",
              pointerEvents: "none",
              left: zoomBox.x,
              top: zoomBox.y,
              width: zoomBox.w,
              height: zoomBox.h
            }}
          />
        )}
        <PreventScrollToParents
          style={{width: "100%", height: "100%"}}
          {...mouseEvents}
        >
          <>
            <canvas
              style={{opacity: 0.25, ...styles.canvas}}
              ref={canvasEl}
            />
            <RegionShapes
              mat={mat}
              imagePosition={imagePosition}
              regions={regions}
            />
            <ImageCanvasBackground
              imagePosition={imagePosition}
              mouseEvents={mouseEvents}
              onLoad={onImageLoaded}
              imageSrc={imageSrc}
              useCrossOrigin={false}
            />
          </>
        </PreventScrollToParents>
        <div style={styles.zoomIndicator}>
          {((1 / mat.a) * 100).toFixed(0)}%
        </div>
      </div>
    </ThemeProvider>
  )
}

ImageCanvas.propTypes = {
  regions: PropTypes.arrayOf(PropTypes.object).isRequired,
  imageSrc: PropTypes.string,
  onMouseMove: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  dragWithPrimary: PropTypes.bool,
  zoomWithPrimary: PropTypes.bool,
  createWithPrimary: PropTypes.bool,
  showCrosshairs: PropTypes.bool,
  regionClsList: PropTypes.arrayOf(PropTypes.string),
  enabledRegionProps: PropTypes.arrayOf(PropTypes.string),
  onChangeRegion: PropTypes.func.isRequired,
  onBeginRegionEdit: PropTypes.func.isRequired,
  onCloseRegionEdit: PropTypes.func.isRequired,
  onDeleteRegion: PropTypes.func.isRequired,
  onBeginMoveLinePoint: PropTypes.func.isRequired,
  onBeginMovePolygonPoint: PropTypes.func.isRequired,
  onAddPolygonPoint: PropTypes.func.isRequired,
  onSelectRegion: PropTypes.func.isRequired,
  onImageLoadedDispatch: PropTypes.func.isRequired,
}

export default ImageCanvas
