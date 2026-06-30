// @flow weak

import Paper from "@mui/material/Paper"
import RegionLabel from "../RegionLabel"
import LockIcon from "@mui/icons-material/Lock"

const copyWithout = (obj, ...args) => {
  const newObj = {...obj}
  for (const arg of args) {
    delete newObj[arg]
  }
  return newObj
}

export const RegionTags = ({
  regions,
  projectRegionBox,
  mouseEvents,
  regionClsList,
  onBeginRegionEdit,
  onChangeRegion,
  onCloseRegionEdit,
  onDeleteRegion,
  layoutParams,
  imageSrc,
  enabledRegionProps,
}) => {
  return regions
    .filter((r) => r.visible || r.visible === undefined)
    .map((region) => {
      const pbox = projectRegionBox(region)
      const margin = 8
      const labelBoxWidth = region.editingLabels && !region.locked ? 340 : 160
      const labelBoxHeight =
        region.editingLabels && !region.locked ? 200 : 50
      const displayOnTop = pbox.y > labelBoxHeight
      const canvasWidth = layoutParams?.current?.canvasWidth
      const overflowsRight = canvasWidth && pbox.x + labelBoxWidth > canvasWidth

      const coords = displayOnTop
        ? {
          left: pbox.x,
          top: pbox.y - margin / 2,
        }
        : {left: pbox.x, top: pbox.y + pbox.h + margin / 2}
      if (region.locked) {
        return (
          <div
            key={region.id}
            style={{
              position: "absolute",
              ...coords,
              zIndex: 10 + (region.editingLabels ? 5 : 0),
            }}
          >
            <Paper
              style={{
                position: "absolute",
                left: 0,
                ...(displayOnTop ? {bottom: 0} : {top: 0}),
                zIndex: 10,
                backgroundColor: "#fff",
                borderRadius: 4,
                padding: 2,
                paddingBottom: 0,
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              <LockIcon style={{width: 16, height: 16, color: "#333"}} />
            </Paper>
          </div>
        )
      }
      if(region.minimized){
        return (null)
      }
      return (
        <div
          key={region.id}
          style={{
            position: "absolute",
            ...coords,
            zIndex: 10 + (region.editingLabels ? 5 : 0),
          }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
          onMouseEnter={(e) => {
            if (region.editingLabels) {
              mouseEvents.onMouseUp(e)
              e.button = 1
              mouseEvents.onMouseUp(e)
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              ...(overflowsRight ? {right: 0} : {left: 0}),
              ...(displayOnTop ? {bottom: 0} : {top: 0}),
            }}
            {...(!region.editingLabels
              ? copyWithout(mouseEvents, "onMouseDown", "onMouseUp")
              : {})}
          >
            <RegionLabel
              allowedClasses={regionClsList}
              onOpen={onBeginRegionEdit}
              onChange={onChangeRegion}
              onClose={onCloseRegionEdit}
              onDelete={onDeleteRegion}
              editing={region.editingLabels}
              region={region}
              regions={regions}
              imageSrc={imageSrc}
              enabledProperties={enabledRegionProps}
            />
          </div>
        </div>
      )
    })
}

export default RegionTags
