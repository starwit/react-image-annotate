export default {
  container: {display: "flex", flexDirection: "column", height: "100vh"},
  toolbar: {
    display: "flex",
    gap: 8,
    padding: 8,
    alignItems: "center",
    borderBottom: "1px solid #ccc",
  },
  annotatorContainer: {flex: 1, minHeight: 0, position: "relative"},
  overlay: {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    border: "2px solid #ff00ff",
    backgroundColor: "rgba(255, 0, 255, 0.15)",
  },
  overlayLabel: {
    display: "inline-block",
    margin: 4,
    padding: "2px 6px",
    font: "12px monospace",
    color: "#fff",
    backgroundColor: "rgba(255, 0, 255, 0.75)",
  },
}
