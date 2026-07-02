// @flow
import {produce} from "immer"
import {saveToHistory} from "./history-handler.js"
import colors from "../../colors"
import i18next from "i18next"

const getRandomId = () => Math.random().toString().split(".")[1]

// Resolve the color for a classification by its technical `cls`. Falls back to
// the default color palette when no explicit color is configured.
const getClsColor = (classifications, cls) => {
  const index = (classifications || []).findIndex((c) => c.cls === cls)
  if (index === -1) return null
  return classifications[index].color || colors[index % colors.length]
}

export default (state, action) => {
  // Throttle certain actions
  if (action.type === "MOUSE_MOVE") {
    if (Date.now() - ((state).lastMouseMoveCall || 0) < 16) return state
    state = produce(state, s => {s.lastMouseMoveCall = Date.now()})
  }
  if (!action.type.includes("MOUSE")) {
    state = produce(state, s => {s.lastAction = action})
  }

  const activeImage = state.image

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
      return produce(state, s => {s.image.regions[regionIndex] = {
        ...region,
        ...obj,
      }})
    } else {
      // delete region
      const regions = activeImage.regions
      return produce(
        state,
        s => {s.image.regions = (regions || []).filter((r) => r.id !== region.id)}
      )
    }
  }

  const closeEditors = (state) => {
    if (!activeImage) return state
    return produce(
      state,
      s => {s.image.regions = (activeImage.regions || []).map((r) => ({
        ...r,
        editingLabels: false,
      }))}
    )
  }

  switch (action.type) {
    case "@@INIT": {
      return state
    }
    case "SELECT_CLASSIFICATION": {
      const classification = (state.classifications || []).find(
        (c) => c.cls === action.cls
      )
      return produce(state, s => {
        s.selectedCls = action.cls
        // A classification may declare the tool to activate on selection.
        if (classification?.tool) s.selectedTool = classification.tool
      })
    }
    case "CHANGE_REGION": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      const oldRegion = activeImage.regions[regionIndex]
      if (oldRegion.cls !== action.region.cls) {
        state = saveToHistory(state, "Change Region Classification")
        const clsColor = getClsColor(state.classifications, action.region.cls)
        if (clsColor !== null) {
          state = produce(state, s => {s.selectedCls = action.region.cls})
          action.region.color = clsColor
        }
      }
      return produce(
        state,
        s => {s.image.regions[regionIndex] = action.region}
      )
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
      return produce(state, s => {s.image.regions = regions})
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
            open: false,
          }),
          s => {s.mode = {mode: "CLOSE_POLYGON", regionId: polygon.id}}
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
    case "ADD_POLYGON_POINT": {
      const {polygon, point, pointIndex} = action
      const regionIndex = getRegionIndex(polygon)
      if (regionIndex === null) return state
      const points = [...polygon.points]
      points.splice(pointIndex, 0, point)
      return produce(state, s => {s.image.regions[regionIndex] = {
        ...polygon,
        points,
      }})
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
            s => {s.image.regions[regionIndex].points[pointIndex] = [x, y]}
          )
        }
        case "DRAW_POLYGON": {
          const {regionId} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          return produce(
            state,
            s => {s.image.regions[regionIndex].points[(region).points.length - 1] = [x, y]}
          )
        }
        case "DRAW_LINE": {
          const {regionId} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          return produce(state, s => {s.image.regions[regionIndex] = {
            ...region,
            x2: x,
            y2: y,
          }})
        }
        case "MOVE_LINE_POINT": {
          const {regionId, pointIdx} = state.mode
          const [region, regionIndex] = getRegion(regionId)
          if (!region) return produce(state, s => {s.mode = null})
          if (pointIdx === 0) return produce(state, s => {s.image.regions[regionIndex] = {
            ...region,
            x1: x,
            y1: y,
          }})
          if (pointIdx === 1) return produce(state, s => {s.image.regions[regionIndex] = {
            ...region,
            x2: x,
            y2: y,
          }})
          return state
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
              s => {s.image.regions[regionIndex] =
                {...polygon, points: polygon.points.concat([[x, y]])}
              }
            )
          }
          case "DRAW_LINE": {
            const [line, regionIndex] = getRegion(state.mode.regionId)
            if (!line) break
            produce(state, s => {s.image.regions[regionIndex] = {
              ...line,
              x2: x,
              y2: y,
            }})
            return produce(state, s => {s.mode = null})
          }
          default:
            break
        }
      }

      let newRegion
      let defaultRegionCls = state.selectedCls,
        defaultRegionColor = "#ff0000"

      const clsColor = getClsColor(state.classifications, defaultRegionCls)
      if (clsColor !== null) {
        defaultRegionColor = clsColor
      }

      switch (state.selectedTool) {
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
        default:
          break
      }

      const regions = [...(activeImage.regions || [])]
        .map((r) =>
          produce(r, d => {
            d.editingLabels = false
            d.highlighted = false
          })
        )
        .concat(newRegion ? [newRegion] : [])

      return produce(state, s => {s.image.regions = regions})
    }
    case "MOUSE_UP": {
      const {x, y} = action

      if (!state.mode) return state
      state = produce(state, s => {s.mouseDownAt = null})
      switch (state.mode.mode) {
        case "MOVE_POLYGON_POINT": {
          return {...state, mode: null}
        }
        case "MOVE_LINE_POINT":
        case "CLOSE_POLYGON": {
          return produce(
            modifyRegion(state.mode.regionId, { editingLabels: true }),
            s => {s.mode = null}
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
      return produce(state, s => {s.image.regions = newRegions})
    }
    case "CLOSE_REGION_EDITOR": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      if (action.region?.name == null || action.region?.name == "") {
        return produce(state, s => {s.image.regions[regionIndex] = {
          ...(activeImage.regions || [])[regionIndex],
          falseInput: true,
        }})
      }
      return produce(state, s => {s.image.regions[regionIndex] = {
        ...(activeImage.regions || [])[regionIndex],
        editingLabels: false,
        falseInput: false,
      }})
    }
    case "DELETE_REGION": {
      const regionIndex = getRegionIndex(action.region)
      if (regionIndex === null) return state
      return produce(
        state,
        s => {s.image.regions =
          (activeImage.regions || []).filter((r) => r.id !== action.region.id)
        }
      )
    }
    case "DELETE_SELECTED_REGION": {
      return produce(
        state,
        s => {s.image.regions =
          (activeImage.regions || []).filter((r) => !r.highlighted)
        }
      )
    }
    case "SELECT_TOOL": {
      state = produce(state, s => {s.mode = null})
      return produce(state, s => {s.selectedTool = action.selectedTool})
    }
    case "CANCEL": {
      const {mode} = state
      if (mode) {
        switch (mode.mode) {
          case "DRAW_LINE":
          case "DRAW_POLYGON": {
            const {regionId} = mode
            return modifyRegion(regionId, null)
          }
          case "MOVE_POLYGON_POINT": {
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
          s => {s.image.regions = regions.map((r) => (
            {
            ...r,
            name: r.name || r.id,
            editingLabels: false,
          }))}
        )
      } else if (regions) {
        return produce(
          state,
          s => {s.image.regions = regions.map((r) => ({
            ...r,
            highlighted: false,
          }))}
        )
      }
      break
    }
    default:
      break
  }
  return state
}
