import {useRef, useState} from "react"
import Annotator from "../Annotator"

export default () => {
  const [movementLocked, setMovementLocked] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const annotatorRef = useRef(null)

  return (
    <div style={{display: "flex", flexDirection: "column", height: "100vh"}}>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 8,
          alignItems: "center",
          borderBottom: "1px solid #ccc",
        }}
      >
        <button onClick={() => setMovementLocked((locked) => !locked)}>
          {movementLocked ? "Unlock movement" : "Lock movement"}
        </button>
        <button onClick={() => console.log(annotatorRef.current?.getRegions())}>
          Log state
        </button>
        <button onClick={() => setShowOverlay((shown) => !shown)}>
          {showOverlay ? "Hide overlay" : "Show overlay"}
        </button>
      </div>
      <div style={{flex: 1, minHeight: 0, position: "relative"}}>
        <Annotator
          classifications={[
            {cls: "linecrossing", displayName: "Line Crossing", color: "#00da86", tool: "create-line"},
            {cls: "areaoccpancy", displayName: "Area Occupancy", color: "#1e87e9", tool: "create-polygon"},
          ]}
          image={{
            src: "https://images.unsplash.com/photo-1567563549378-81212b9631e4?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            name: "intersection",
          }}
          enabledRegionProps={["name", "line-direction"]}
          ref={annotatorRef}
          movementLocked={movementLocked}
          renderImageOverlay={
            showOverlay
              ? ({naturalWidth, naturalHeight, width, height}) => (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    border: "2px solid #ff00ff",
                    backgroundColor: "rgba(255, 0, 255, 0.15)",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }}
                >
                  <span
                    style={{
                      margin: 4,
                      padding: "2px 6px",
                      font: "12px monospace",
                      color: "#fff",
                      backgroundColor: "rgba(255, 0, 255, 0.75)",
                    }}
                  >
                    overlay {naturalWidth}×{naturalHeight}px natural /{" "}
                    {Math.round(width)}×{Math.round(height)}px on screen
                  </span>
                </div>
              )
              : undefined
          }
        />
      </div>
    </div>
  )
}
