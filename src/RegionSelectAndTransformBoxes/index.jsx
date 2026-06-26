import React, { Fragment, memo } from "react"
import { createTheme, styled, ThemeProvider } from "@mui/material/styles"
import PreventScrollToParents from "../PreventScrollToParents"

const theme = createTheme()
const TransformGrabber = styled("div")(({ theme }) => ({
  width: 14,
  height: 14,
  zIndex: 2,
  border: "2px solid #FFF",
  position: "absolute",
  boxSizing: "border-box"
}))

const arePropsEqual = (prev, next) => {
  return (
    prev.region === next.region &&
    prev.dragWithPrimary === next.dragWithPrimary &&
    prev.createWithPrimary === next.createWithPrimary &&
    prev.zoomWithPrimary === next.zoomWithPrimary &&
    prev.mat === next.mat
  )
}

export const RegionSelectAndTransformBox = memo(
  ({
    region: r,
    mouseEvents,
    projectRegionBox,
    dragWithPrimary,
    zoomWithPrimary,
    layoutParams,
    mat,
    onBeginMoveLinePoint,
    onBeginMovePolygonPoint,
    onAddPolygonPoint,
  }) => {
    const { iw, ih } = layoutParams.current
    return (
      <ThemeProvider theme={theme}>
        <Fragment>
          <PreventScrollToParents>
            {r.type === "line" &&
              !dragWithPrimary &&
              !zoomWithPrimary &&
              !r.locked &&
              r.highlighted &&
              [[r.x1, r.y1], [r.x2, r.y2]].map(([px, py], i) => {
                const proj = mat
                  .clone()
                  .inverse()
                  .applyToPoint(px * iw, py * ih)
                return (
                  <TransformGrabber
                    key={i}
                    {...mouseEvents}
                    onMouseDown={(e) => {
                      if (e.button === 0)
                        return onBeginMoveLinePoint(r, i)
                      mouseEvents.onMouseDown(e)
                    }}
                    style={{
                      cursor: "move",
                      zIndex: 10,
                      left: proj.x - 6,
                      top: proj.y - 6,
                    }}
                  />
                )
              })}
            {r.type === "polygon" &&
              !dragWithPrimary &&
              !zoomWithPrimary &&
              !r.locked &&
              r.highlighted &&
              r.points.map(([px, py], i) => {
                const proj = mat
                  .clone()
                  .inverse()
                  .applyToPoint(px * iw, py * ih)
                return (
                  <TransformGrabber
                    key={i}
                    {...mouseEvents}
                    onMouseDown={(e) => {
                      if (e.button === 0 && (!r.open || i === 0))
                        return onBeginMovePolygonPoint(r, i)
                      mouseEvents.onMouseDown(e)
                    }}
                    style={{
                      cursor: !r.open
                        ? "move"
                        : i === 0
                        ? "pointer"
                        : undefined,
                      zIndex: 10,
                      pointerEvents:
                        r.open && i === r.points.length - 1
                          ? "none"
                          : undefined,
                      left: proj.x - 7,
                      top: proj.y - 7,
                    }}
                  />
                )
              })}
            {r.type === "polygon" &&
              r.highlighted &&
              !dragWithPrimary &&
              !zoomWithPrimary &&
              !r.locked &&
              !r.open &&
              r.points.length > 1 &&
              r.points
                .map((p1, i) => [p1, r.points[(i + 1) % r.points.length]])
                .map(([p1, p2]) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2])
                .map((pa, i) => {
                  const proj = mat
                    .clone()
                    .inverse()
                    .applyToPoint(pa[0] * iw, pa[1] * ih)
                  return (
                    <TransformGrabber
                      key={i}
                      {...mouseEvents}
                      onMouseDown={(e) => {
                        if (e.button === 0)
                          return onAddPolygonPoint(r, pa, i + 1)
                        mouseEvents.onMouseDown(e)
                      }}
                      style={{
                        cursor: "copy",
                        zIndex: 10,
                        left: proj.x - 7,
                        top: proj.y - 7,
                        border: "2px dotted #fff",
                        opacity: 0.5,
                      }}
                    />
                  )
                })}
          </PreventScrollToParents>
        </Fragment>
      </ThemeProvider>
    )
  },
  arePropsEqual
)

export const RegionSelectAndTransformBoxes = memo(
  (props) => {
    return props.regions
      .filter((r) => r.visible || r.visible === undefined)
      .filter((r) => !r.locked)
      .map((r, i) => {
        return <RegionSelectAndTransformBox key={r.id} {...props} region={r} />
      })
  },
  (n, p) => n.regions === p.regions && n.mat === p.mat
)

export default RegionSelectAndTransformBoxes
