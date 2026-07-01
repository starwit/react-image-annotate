import {useRef, useState} from "react"
import {examples} from "./Examples.jsx"
import Annotator from "../Annotator"

export default () => {
  const annotatorProps = examples["Constrained Tools"]();
  const [movementLocked, setMovementLocked] = useState(false)
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
      </div>
      <div style={{flex: 1, minHeight: 0, position: "relative"}}>
        <Annotator
          {...(annotatorProps)}
          ref={annotatorRef}
          movementLocked={movementLocked}
        />
      </div>
    </div>
  )
}
