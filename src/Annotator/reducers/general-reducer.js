// @flow
import {moveRegion} from "../../ImageCanvas/region-tools.js"
import {produce} from "immer"
import isEqual from "lodash/isEqual"
import get from "lodash/get"
import set from "lodash/set"
import getActiveImage from "./get-active-image"
import {saveToHistory} from "./history-handler.js"
import colors from "../../colors"
import fixTwisted from "./fix-twisted"
import convertExpandingLineToPolygon from "./convert-expanding-line-to-polygon"
import clamp from "../../utils/clamp.js"
import getLandmarksWithTransform from "../../utils/get-landmarks-with-transform"
import setInLocalStorage from "../../utils/set-in-local-storage"
import i18next from "i18next"

const getRandomId = () => Math.random().toString().split(".")[1]

export default (state, action) => {
  if (
    state.allowedArea &&
    state.selectedTool !== "modify-allowed-area" &&
    ["MOUSE_DOWN", "MOUSE_UP", "MOUSE_MOVE"].includes(action.type)
  ) {
    const aa = state.allowedArea
    action.x = clamp(action.x, aa.x, aa.x + aa.w)
    action.y = clamp(action.y, aa.y, aa.y + aa.h)
  }

  if (action.type === "ON_CLS_ADDED" && action.cls && action.cls !== "") {
    const oldRegionClsList = state.regionClsList
    const newState = {
      ...state,
      regionClsList: oldRegionClsList.concat(action.cls),
    }
    return newState
  }

  // Throttle certain actions
  if (action.type === "MOUSE_MOVE") {
    if (Date.now() - ((state).lastMouseMoveCall || 0) < 16) return state
    state = produce(state, s => {s.lastMouseMoveCall = Date.now()})
  }
  if (!action.type.includes("MOUSE")) {
    state = produce(state, s => {s.lastAction = action})
  }

  const {currentImageIndex, pathToActiveImage, activeImage} =
    getActiveImage(state)

  const getRegionIndex = (region) => {
    const regionId =
      typeof region === "string" || typeof region === "number"
        ? region
        : region.id
    if (!activeImage) return null
    const regionIndex = (activeImage.regions || []).findIndex(
      (r) => r.id === regionId
    )
    return regionIndex === -1 ? null : regionIndex
  }
  const getRegion = (regionId) => {
    if (!activeImage) return null
    const regionIndex = getRegionIndex(regionId)
    if (regionIndex === null) return [null, null]
    const region = activeImage.regions[regionIndex]
    return [region, regionIndex]
  }
  const modifyRegion = (regionId, obj) => {
    const [region, regionIndex] = getRegion(regionId)
    if (!region) return state
    if (obj !== null) {
      return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
        ...region,
        ...obj,
      })})
    } else {
      // delete region
      const regions = activeImage.regions
      return produce(
        state,
        s => set(
          s, 
          [...pathToActiveImage, "regions"],
          (regions || []).filter((r) => r.id !== region.id)
        )
      )
    }
  }

  const closeEditors = (state) => {
    if (currentImageIndex === null) return state
    return produce(
      state,
      s => {set(s,
        [...pathToActiveImage, "regions"],
        (activeImage.regions || []).map((r) => ({
          ...r,
          editingLabels: false,
        }))
      )}
    )
  }

  const setNewImage = (img, index) => {
    let {frameTime} = typeof img === "object" ? img : {src: img}
    return produce(
      state,
      s => {
        s.selectedImage = index
        s.selectedImageFrameTime = frameTime
      }
    )
  }

  switch (action.type) {
    case "@@INIT": {
      return state
    }
    case "SELECT_IMAGE": {
      return setNewImage(action.image, action.imageIndex)
    }
    case "SELECT_CLASSIFICATION": {
      return produce(state, s => {s.selectedCls = action.cls})
    }
    case "CHANGE_REGION": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const oldRegion = activeImage.regions[regionIndex]
      if (oldRegion.cls !== action.region.cls) {
        state = saveToHistory(state, "Change Region Classification")
        const clsIndex = state.regionClsList.indexOf(action.region.cls)
        if (clsIndex !== -1) {
          state = produce(state, s => {s.selectedCls = action.region.cls})
          action.region.color = clsIndex < state.regionColorList.length ? state.regionColorList[clsIndex] : colors[clsIndex % colors.length]
        }
      }
      if (!isEqual(oldRegion.tags, action.region.tags)) {
        state = saveToHistory(state, "Change Region Tags")
      }
      if (!isEqual(oldRegion.comment, action.region.comment)) {
        state = saveToHistory(state, "Change Region Comment")
      }
      return produce(
        state,
        s => {set(s,
          [...pathToActiveImage, "regions", regionIndex],
          action.region
        )}
      )
    }
    case "CHANGE_IMAGE": {
      if (!activeImage) return state
      const {delta} = action
      for (const key of Object.keys(delta)) {
        if (key === "cls") saveToHistory(state, "Change Image Class")
        if (key === "tags") saveToHistory(state, "Change Image Tags")
        state = produce(state, s => {set(s, [...pathToActiveImage, key], delta[key])})
      }
      return state
    }
    case "SELECT_REGION": {
      const {region} = action
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const regions = [...(activeImage.regions || [])].map((r) => ({
        ...r,
        highlighted: r.id === region.id,
        editingLabels: r.id === region.id,
      }))
      return produce(state, s => {set(s, [...pathToActiveImage, "regions"], regions)})
    }
    case "BEGIN_MOVE_POINT": {
      state = closeEditors(state)
      return produce(state, s => {s.mode = {
        mode: "MOVE_REGION",
        regionId: action.point.id,
      }})
    }
    case "BEGIN_BOX_TRANSFORM": {
      const {box, directions} = action
      state = closeEditors(state)
      if (directions[0] === 0 && directions[1] === 0) {
        return produce(state, s => {s.mode = {mode: "MOVE_REGION", regionId: box.id}})
      } else {
        return produce(state, s => {s.mode = {
          mode: "RESIZE_BOX",
          regionId: box.id,
          freedom: directions,
          original: {x: box.x, y: box.y, w: box.w, h: box.h},
        }})
      }
    }
    case "BEGIN_MOVE_LINE_POINT": {
      const {line, pointIdx} = action
      state = closeEditors(state)
      return produce(state, s => {s.mode = {mode: "MOVE_LINE_POINT", regionId: line.id, pointIdx}})
    }
    case "BEGIN_MOVE_POLYGON_POINT": {
      const {polygon, pointIndex} = action
      state = closeEditors(state)
      if (
        state.mode &&
        state.mode.mode === "DRAW_POLYGON" &&
        pointIndex === 0
      ) {
        return produce(
          modifyRegion(polygon, {
            points: polygon.points.slice(0, -1),
            editingLabels: true,
            open: false,
          }),
          s => {s.mode = null}
        )
      } else {
        state = saveToHistory(state, i18next.t("move.polypoint"))
      }
      return produce(state, s => {s.mode = {
        mode: "MOVE_POLYGON_POINT",
        regionId: polygon.id,
        pointIndex,
      }})
    }
    case "BEGIN_MOVE_KEYPOINT": {
      const {region, keypointId} = action
      state = closeEditors(state)
      state = saveToHistory(state, "Move Keypoint")
      return produce(state, s => {s.mode = {
        mode: "MOVE_KEYPOINT",
        regionId: region.id,
        keypointId,
      }})
    }
    case "ADD_POLYGON_POINT": {
      const {polygon, point, pointIndex} = action
      const regionIndex = getRegionIndex(polygon)
      if (regionIndex === null) return state
      const points = [...polygon.points]
      points.splice(pointIndex, 0, point)
      return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
        ...polygon,
        points,
      })})
    }
    case "MOUSE_MOVE": {
      const {x, y} = action

      if (!state.mode) return state
      if (!activeImage) return state
      switch (state.mode.mode) {
        case "MOVE_POLYGON_POINT": {
          const {pointIndex, regionId} = state.mode
          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          return produce(
            state,
            s => {set(s, [
                ...pathToActiveImage,
                "regions",
                regionIndex,
                "points",
                pointIndex,
              ],
              [x, y]
            )}
          )
        }
        case "MOVE_KEYPOINT": {
          const {keypointId, regionId} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (regionIndex === null) return state
          return produce(
            state,
            s => {set(s, [
                ...pathToActiveImage,
                "regions",
                regionIndex,
                "points",
                keypointId,
              ],
              {...(region).points[keypointId], x, y}
            )}
          )
        }
        case "MOVE_REGION": {
          const {regionId} = state.mode
          if (regionId === "$$allowed_area") {
            const {
              allowedArea: {w, h},
            } = state
            return produce(state, s => {s.allowedArea = {
              x: x - w / 2,
              y: y - h / 2,
              w,
              h,
            }})
          }
          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          return produce(
            state,
            s => {set(s,
              [...pathToActiveImage, "regions", regionIndex],
              moveRegion(activeImage.regions[regionIndex], x, y)
            )}
          )
        }
        case "RESIZE_BOX": {
          const {
            regionId,
            freedom: [xFree, yFree],
            original: {x: ox, y: oy, w: ow, h: oh},
          } = state.mode

          const dx = xFree === 0 ? ox : xFree === -1 ? Math.min(ox + ow, x) : ox
          const dw =
            xFree === 0
              ? ow
              : xFree === -1
                ? ow + (ox - dx)
                : Math.max(0, ow + (x - ox - ow))
          const dy = yFree === 0 ? oy : yFree === -1 ? Math.min(oy + oh, y) : oy
          const dh =
            yFree === 0
              ? oh
              : yFree === -1
                ? oh + (oy - dy)
                : Math.max(0, oh + (y - oy - oh))

          // determine if we should switch the freedom
          if (dw <= 0.001) {
            state = produce(state, s => {s.mode.freedom = [xFree * -1, yFree]})
          }
          if (dh <= 0.001) {
            state = produce(state, s => {s.mode.freedom = [xFree, yFree * -1]})
          }

          if (regionId === "$$allowed_area") {
            return produce(state, s => {s.allowedArea = {
              x: dx,
              w: dw,
              y: dy,
              h: dh,
            }})
          }

          const regionIndex = getRegionIndex(regionId)
          if (regionIndex === null) return state
          const box = activeImage.regions[regionIndex]

          return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
            ...box,
            x: dx,
            w: dw,
            y: dy,
            h: dh,
          })})
        }
        case "RESIZE_KEYPOINTS": {
          const {regionId, landmarks, centerX, centerY} = state.mode
          const distFromCenter = Math.sqrt(
            (centerX - x) ** 2 + (centerY - y) ** 2
          )
          const scale = distFromCenter / 0.15
          return modifyRegion(regionId, {
            points: getLandmarksWithTransform({
              landmarks,
              center: {x: centerX, y: centerY},
              scale,
            }),
          })
        }
        case "DRAW_POLYGON": {
          const {regionId} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          return produce(
            state,
            s => {set(s, [
                ...pathToActiveImage,
                "regions",
                regionIndex,
                "points",
                (region).points.length - 1,
              ],
              [x, y]
            )}
          )
        }
        case "DRAW_LINE": {
          const {regionId} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
            ...region,
            x2: x,
            y2: y,
          })})
        }
        case "MOVE_LINE_POINT": {
          const {regionId, pointIdx} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          if (pointIdx === 0) return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
            ...region,
            x1: x,
            y1: y,
          })})
          if (pointIdx === 1) return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
            ...region,
            x2: x,
            y2: y,
          })})
        }
        case "DRAW_EXPANDING_LINE": {
          const {regionId} = state.mode
          const [expandingLine, regionIndex] = getRegion(regionId)
          if (!expandingLine) return state
          const isMouseDown = Boolean(state.mouseDownAt)
          if (isMouseDown) {
            // If the mouse is down, set width/angle
            const lastPoint = expandingLine.points.slice(-1)[0]
            const mouseDistFromLastPoint = Math.sqrt(
              (lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2
            )
            if (mouseDistFromLastPoint < 0.002 && !lastPoint.width) return state

            const newState = produce(
              state,
              s => {set(s, 
                [...pathToActiveImage, "regions", regionIndex, "points"],
                expandingLine.points.slice(0, -1).concat([
                  {
                    ...lastPoint,
                    width: mouseDistFromLastPoint * 2,
                    angle: Math.atan2(lastPoint.x - x, lastPoint.y - y),
                  },
                ])
              )}
            )
            return newState
          } else {
            // If mouse is up, move the next candidate point
            return produce(
              state,
              s => {set(s,
                [...pathToActiveImage, "regions", regionIndex],
                {
                  ...expandingLine,
                  candidatePoint: {x, y},
                }
              )}
            )
          }

        }
        case "SET_EXPANDING_LINE_WIDTH": {
          const {regionId} = state.mode;
          const [expandingLine, regionIndex] = getRegion(regionId);
          if (!expandingLine) {
            return state;
          }
          const lastPoint = expandingLine.points.slice(-1)[0];
          return produce(
            state,
            s => {set(s, 
              [...pathToActiveImage, "regions", regionIndex, "expandingWidth"],
              Math.sqrt((lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2)
            )}
          )
        }
        default:
          return state
      }
    }
    case "MOUSE_DOWN": {
      if (!activeImage) return state
      const {x, y} = action

      state = produce(state, s => {s.mouseDownAt = {x, y}})

      if (state.mode) {
        switch (state.mode.mode) {
          case "DRAW_POLYGON": {
            const [polygon, regionIndex] = getRegion(state.mode.regionId)
            if (!polygon) break
            return produce(
              state,
              s => {set(s, 
                [...pathToActiveImage, "regions", regionIndex],
                {...polygon, points: polygon.points.concat([[x, y]])}
              )}
            )
          }
          case "DRAW_LINE": {
            const [line, regionIndex] = getRegion(state.mode.regionId)
            if (!line) break
            produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
              ...line,
              x2: x,
              y2: y,
            })})
            return produce(state, s => {s.mode = null})
          }
          case "DRAW_EXPANDING_LINE": {
            const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
            if (!expandingLine) break
            const lastPoint = expandingLine.points.slice(-1)[0]
            if (
              expandingLine.points.length > 1 &&
              Math.sqrt((lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2) < 0.002
            ) {
              if (!lastPoint.width) {
                return produce(state, s => {s.mode = {
                  mode: "SET_EXPANDING_LINE_WIDTH",
                  regionId: state.mode.regionId,
                }})
              } else {
                return produce(state, s => {
                  set(s, 
                    [...pathToActiveImage, "regions", regionIndex],
                    convertExpandingLineToPolygon(expandingLine)
                  )
                  s.mode = null
                })
              }
            }

            // Create new point
            return produce(
              state,
              s => {set(s, 
                [...pathToActiveImage, "regions", regionIndex, "points"],
                expandingLine.points.concat([{x, y, angle: null, width: null}])
              )}
            )
          }
          case "SET_EXPANDING_LINE_WIDTH": {
            const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
            if (!expandingLine) break
            const {expandingWidth} = expandingLine
            return produce(state, s => {
              set(s,
                [...pathToActiveImage, "regions", regionIndex],
                convertExpandingLineToPolygon({
                  ...expandingLine,
                  points: expandingLine.points.map((p) =>
                    p.width ? p : {...p, width: expandingWidth}
                  ),
                  expandingWidth: undefined,
                })
              )
              s.mode = null
            })
          }
          default:
            break
        }
      }

      let newRegion
      let defaultRegionCls = state.selectedCls,
        defaultRegionColor = "#ff0000"

      const clsIndex = (state.regionClsList || []).indexOf(defaultRegionCls)
      if (clsIndex !== -1) {
        defaultRegionColor = clsIndex < state.regionColorList.length ? state.regionColorList[clsIndex] : colors[clsIndex % colors.length]
      }

      switch (state.selectedTool) {
        case "create-point": {
          state = saveToHistory(state, "Create Point")
          newRegion = {
            type: "point",
            x,
            y,
            highlighted: true,
            editingLabels: true,
            color: defaultRegionColor,
            id: getRandomId(),
            cls: defaultRegionCls,
          }
          break
        }
        case "create-box": {
          state = saveToHistory(state, "Create Box")
          newRegion = {
            type: "box",
            x: x,
            y: y,
            w: 0,
            h: 0,
            highlighted: true,
            editingLabels: false,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
          }
          state = produce(state, s => {s.mode = {
            mode: "RESIZE_BOX",
            editLabelEditorAfter: true,
            regionId: newRegion.id,
            freedom: [1, 1],
            original: {x, y, w: newRegion.w, h: newRegion.h},
            isNew: true,
          }})
          break
        }
        case "create-polygon": {
          if (state.mode && state.mode.mode === "DRAW_POLYGON") break
          state = saveToHistory(state, i18next.t("create.polygon"))
          newRegion = {
            type: "polygon",
            points: [
              [x, y],
              [x, y],
            ],
            open: true,
            highlighted: true,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
          }
          state = produce(state, s => {s.mode = {
            mode: "DRAW_POLYGON",
            regionId: newRegion.id,
          }})
          break
        }
        case "create-expanding-line": {
          state = saveToHistory(state, "Create Expanding Line")
          newRegion = {
            type: "expanding-line",
            unfinished: true,
            points: [{x, y, angle: null, width: null}],
            open: true,
            highlighted: true,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
          }
          state = produce(state, s => {s.mode = {
            mode: "DRAW_EXPANDING_LINE",
            regionId: newRegion.id,
          }})
          break
        }
        case "create-line": {
          if (state.mode && state.mode.mode === "DRAW_LINE") break
          state = saveToHistory(state, i18next.t("create.line"))
          newRegion = {
            type: "line",
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            highlighted: true,
            editingLabels: false,
            color: defaultRegionColor,
            cls: defaultRegionCls,
            id: getRandomId(),
          }
          state = produce(state, s => {s.mode = {
            mode: "DRAW_LINE",
            regionId: newRegion.id,
          }})
          break
        }
        case "create-keypoints": {
          state = saveToHistory(state, "Create Keypoints")
          const [[keypointsDefinitionId, {landmarks}]] =
            (Object.entries(state.keypointDefinitions))

          newRegion = {
            type: "keypoints",
            keypointsDefinitionId,
            points: getLandmarksWithTransform({
              landmarks,
              center: {x, y},
              scale: 1,
            }),
            highlighted: true,
            editingLabels: false,
            id: getRandomId(),
          }
          state = produce(state, s => {s.mode = {
            mode: "RESIZE_KEYPOINTS",
            landmarks,
            centerX: x,
            centerY: y,
            regionId: newRegion.id,
            isNew: true,
          }})
          break
        }
        default:
          break
      }

      const regions = [...(get(state, pathToActiveImage).regions || [])]
        .map((r) =>
          produce(r, d => {
            d.editingLabels = false
            d.highlighted = false
          })
        )
        .concat(newRegion ? [newRegion] : [])

      return produce(state, s => {set(s, [...pathToActiveImage, "regions"], regions)})
    }
    case "MOUSE_UP": {
      const {x, y} = action

      const {mouseDownAt = {x, y}} = state
      if (!state.mode) return state
      state = produce(state, s => {s.mouseDownAt = null})
      switch (state.mode.mode) {
        case "RESIZE_BOX": {
          if (state.mode.isNew) {
            if (
              Math.abs(state.mode.original.x - x) < 0.002 ||
              Math.abs(state.mode.original.y - y) < 0.002
            ) {
              return produce(
                modifyRegion(state.mode.regionId, null),
                s => {s.mode = null}
              )
            }
          }
          if (state.mode.editLabelEditorAfter) {
            return {
              ...modifyRegion(state.mode.regionId, {editingLabels: true}),
              mode: null,
            }
          }
          return {...state, mode: null}
        }
        case "MOVE_REGION": {
          return {...state, mode: null}
        }
        case "RESIZE_KEYPOINTS": {
          return {...state, mode: null}
        }
        case "MOVE_POLYGON_POINT": {
          return {...state, mode: null}
        }
        case "MOVE_KEYPOINT": {
          return {...state, mode: null}
        }
        case "CREATE_POINT_LINE": {
          return state
        }
        case "MOVE_LINE_POINT": {
          return produce(
            modifyRegion(state.mode.regionId, { editingLabels: true }),
            s => {s.mode = null}
          )
        }
        case "DRAW_EXPANDING_LINE": {
          const [expandingLine, regionIndex] = getRegion(state.mode.regionId)
          if (!expandingLine) return state
          let newExpandingLine = expandingLine
          const lastPoint =
            expandingLine.points.length !== 0
              ? expandingLine.points.slice(-1)[0]
              : mouseDownAt
          const mouseDistFromLastPoint = Math.sqrt(
            (lastPoint.x - x) ** 2 + (lastPoint.y - y) ** 2
          )
          if (mouseDistFromLastPoint > 0.002) {
            // The user is drawing has drawn the width for the last point
            const newPoints = [...expandingLine.points]
            for (let i = 0; i < newPoints.length - 1; i++) {
              if (newPoints[i].width) continue
              newPoints[i] = {
                ...newPoints[i],
                width: lastPoint.width,
              }
            }
            newExpandingLine = produce(
              expandingLine,
              s => {s.points = fixTwisted(newPoints)}
            )
          } else {
            return state
          }
          return produce(
            state,
            s => {set(s, 
              [...pathToActiveImage, "regions", regionIndex],
              newExpandingLine
            )}
          )
        }
        default:
          return state
      }
    }
    case "OPEN_REGION_EDITOR": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const newRegions = produce(
        activeImage.regions.map((r) => ({
          ...r,
          highlighted: false,
          editingLabels: false,
        })),
        s => {s[regionIndex] = {
          ...(activeImage.regions || [])[regionIndex],
          highlighted: true,
          editingLabels: true,
        }}
      )
      return produce(state, s => {set(s, [...pathToActiveImage, "regions"], newRegions)})
    }
    case "CLOSE_REGION_EDITOR": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      if (action.region?.name == null || action.region?.name == "") {
        return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
          ...(activeImage.regions || [])[regionIndex],
          falseInput: true,
        })})
      }
      return produce(state, s => {set(s, [...pathToActiveImage, "regions", regionIndex], {
        ...(activeImage.regions || [])[regionIndex],
        editingLabels: false,
        falseInput: false,
      })})
    }
    case "DELETE_REGION": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      return produce(
        state,
        s => {set(s, 
          [...pathToActiveImage, "regions"],
          (activeImage.regions || []).filter((r) => r.id !== action.region.id)
        )}
      )
    }
    case "DELETE_SELECTED_REGION": {
      return produce(
        state,
        s => {set(s, 
          [...pathToActiveImage, "regions"],
          (activeImage.regions || []).filter((r) => !r.highlighted)
        )}
      )
    }
    case "HEADER_BUTTON_CLICKED": {
      const buttonName = action.buttonName.toLowerCase()
      switch (buttonName) {
        case "prev": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === 0) return state
          return setNewImage(
            state.images[currentImageIndex - 1],
            currentImageIndex - 1
          )
        }
        case "next": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === state.images.length - 1) return state
          return setNewImage(
            state.images[currentImageIndex + 1],
            currentImageIndex + 1
          )
        }
        case "clone": {
          if (currentImageIndex === null) return state
          if (currentImageIndex === state.images.length - 1) return state
          return produce(
            setNewImage(
              state.images[currentImageIndex + 1],
              currentImageIndex + 1
            ),
            s => {set(s, 
              ["images", currentImageIndex + 1, "regions"],
              activeImage.regions
            )}
          )
        }
        case "settings": {
          return produce(state, s => {s.settingsOpen = !state.settingsOpen})
        }
        case "help": {
          return state
        }
        case "hotkeys": {
          return state
        }
        case "exit":
        case "done": {
          return state
        }
        default:
          return state
      }
    }
    case "SELECT_TOOL": {
      if (action.selectedTool === "show-tags") {
        setInLocalStorage("showTags", !state.showTags)
        return produce(state, s => {s.showTags = !state.showTags})
      } else if (action.selectedTool === "show-mask") {
        return produce(state, s => {s.showMask = !state.showMask})
      }
      if (action.selectedTool === "modify-allowed-area" && !state.allowedArea) {
        state = produce(state, s => {s.allowedArea = {x: 0, y: 0, w: 1, h: 1}})
      }
      state = produce(state, s => {s.mode = null})
      return produce(state, s => {s.selectedTool = action.selectedTool})
    }
    case "CANCEL": {
      const {mode} = state
      if (mode) {
        switch (mode.mode) {
          case "DRAW_LINE":
          case "DRAW_EXPANDING_LINE":
          case "SET_EXPANDING_LINE_WIDTH":
          case "DRAW_POLYGON": {
            const {regionId} = mode
            return modifyRegion(regionId, null)
          }
          case "MOVE_POLYGON_POINT":
          case "RESIZE_BOX":
          case "MOVE_REGION": {
            return produce(state, s => {s.mode = null})
          }
          default:
            return state
        }
      }
      // Close any open boxes
      const regions = activeImage.regions
      if (regions && regions.some((r) => r.editingLabels)) {
        return produce(
          state,
          s => {set(s, 
            [...pathToActiveImage, "regions"],
            regions.map((r) => (
              {
              ...r,
              name: r.name || r.id,
              editingLabels: false,
            }))
          )}
        )
      } else if (regions) {
        return produce(
          state,
          s => {set(s, 
            [...pathToActiveImage, "regions"],
            regions.map((r) => ({
              ...r,
              highlighted: false,
            }))
          )}
        )
      }
      break
    }
    default:
      break
  }
  return state
}
