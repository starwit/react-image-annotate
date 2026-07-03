import {useRef, useState} from "react"
import Annotator from "../Annotator"
import styles from "./styles"

export default () => {
  const [movementLocked, setMovementLocked] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const annotatorRef = useRef(null)

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
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
      <div style={styles.annotatorContainer}>
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
                <div style={styles.overlay}>
                  <span style={styles.overlayLabel}>
                    natural {naturalWidth}×{naturalHeight}px / on screen{" "}
                    {Math.round(width)}×{Math.round(height)}px
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
