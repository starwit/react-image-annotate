// @flow

import React, {memo} from "react"
import {createTheme, ThemeProvider} from "@mui/material/styles"
import SidebarBox from "../workspace/SidebarBox"

const theme = createTheme()
export const SidebarBoxContainer = ({
  icon,
  title,
  children,
  noScroll,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <SidebarBox icon={icon} title={title} noScroll={noScroll}>
        {children}
      </SidebarBox>
    </ThemeProvider>
  )
}

export default memo(
  SidebarBoxContainer,
  (prev, next) => prev.title === next.title && prev.children === next.children
)
