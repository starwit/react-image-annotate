import {useState} from "react"
import {examples} from "./Examples.jsx"
import Annotator from "../Annotator"

export default () => {
  const annotatorProps = examples["Constrained Tools"]();
  const [movementLocked, setMovementLocked] = useState(false)

  return (
    <>
      <button
        onClick={() => setMovementLocked((locked) => !locked)}
        style={{
          position: "fixed",
          top: 8,
          right: 80,
          zIndex: 10000,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        {movementLocked ? "Unlock movement" : "Lock movement"}
      </button>
      <Annotator
        {...(annotatorProps)}
        movementLocked={movementLocked}
        onExit={(output) => {
          console.log(output)
        }}
      />
    </>
  )
}
