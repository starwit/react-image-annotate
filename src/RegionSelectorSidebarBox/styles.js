import { blue, grey } from "@mui/material/colors"

export default {
  container: {
    fontSize: 11,
    fontWeight: "bold",
    color: grey[700],
    "& .icon": {
      marginTop: 4,
      width: 16,
      height: 16,
    },
    "& .icon2": {
      opacity: 0.5,
      width: 16,
      height: 16,
      transition: "200ms opacity",
      "&:hover": {
        cursor: "pointer",
        opacity: 1,
      },
    },
  },
  buttonRow: {
    display: "flex",
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderBottom: `1px solid ${grey[200]}`,
    "& .batchButton": {
      flex: 1,
      fontSize: 11,
      fontWeight: "bold",
      color: grey[700],
      textTransform: "none",
      minWidth: 0,
      "& .MuiButton-startIcon > svg": {
        width: 16,
        height: 16,
      },
    },
  },
  row: {
    padding: 4,
    cursor: "pointer",
    "&.header:hover": {
      backgroundColor: "#fff",
    },
    "&.highlighted": {
      backgroundColor: blue[100],
    },
    "&:hover": {
      backgroundColor: blue[50],
      color: grey[800],
    },
  },
  chip: {
    display: "flex",
    flexDirection: "row",
    padding: 2,
    borderRadius: 2,
    paddingLeft: 4,
    paddingRight: 4,
    alignItems: "center",
    "& .color": {
      borderRadius: 5,
      width: 10,
      height: 10,
      marginRight: 4,
    },
    "& .text": {},
  },
}
