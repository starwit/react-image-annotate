import React, { useMemo } from "react"
import { createTheme, styled, ThemeProvider } from "@mui/material/styles"

const theme = createTheme()
const Container = styled("div")(({ theme }) => ({
  width: 300,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  flexShrink: 0,
  backgroundColor: "#fff",
  position: "relative",
}))

const InnerContent = styled("div")(({ theme }) => ({
  width: 300,
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0,
}))

export const RightSidebar = ({ children, height }) => {
  const containerStyle = useMemo(() => ({ height: height || "100%" }), [height])

  return (
    <ThemeProvider theme={theme}>
      <Container style={containerStyle}>
        <InnerContent>{children}</InnerContent>
      </Container>
    </ThemeProvider>
  )
}

export default RightSidebar
