import {useRef, useState} from "react"
import {produce} from "immer"
import Annotator from "../Annotator"

const userReducer = (state, action) => {
  switch (action.type) {
    case "SELECT_CLASSIFICATION": {
      switch (action.cls) {
        case "linecrossing": {
          return produce(state, s => {s.selectedTool = "create-line"})
        }
        case "areaoccpancy": {
          return produce(state, s => {s.selectedTool = "create-polygon"})
        }
      }
    }
  }

  return state;
};

export default () => {
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
          classifications={[
            {cls: "linecrossing", displayName: "Line Crossing", color: "#00da86"},
            {cls: "areaoccpancy", displayName: "Area Occupancy", color: "#1e87e9"},
          ]}
          image={{
            src: "https://images.unsplash.com/photo-1567563549378-81212b9631e4?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            name: "intersection",
          }}
          userReducer={userReducer}
          enabledRegionProps={["name", "line-direction"]}
          ref={annotatorRef}
          movementLocked={movementLocked}
        />
      </div>
    </div>
  )
}
