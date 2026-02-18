import { grey } from "@mui/material/colors"

export default {
  container: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",
    height: "100%",
    maxHeight: "100vh",
    backgroundColor: "#fff",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
  },
  headerTitle: {
    fontWeight: "bold",
    color: grey[700],
    paddingLeft: 16,
  },
}
