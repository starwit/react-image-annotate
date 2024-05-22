// @flow weak

import React, {useMemo, useRef, useState} from "react"
import {createTheme, styled, ThemeProvider} from "@mui/material/styles"
import useEventCallback from "use-event-callback"
import {useSettings} from "../SettingsProvider"
import {useTranslation} from "react-i18next";

const theme = createTheme()

const StyledImage = styled("img")(({theme}) => ({
  zIndex: 0,
  position: "absolute",
}))

const Error = styled("div")(({theme}) => ({
  zIndex: 0,
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  backgroundColor: "rgba(255,0,0,0.2)",
  color: "#ff0000",
  fontWeight: "bold",
  whiteSpace: "pre-wrap",
  padding: 50,
}))

export default ({
  imagePosition,
  mouseEvents,
  imageSrc,
  onLoad,
  useCrossOrigin = false,
}) => {
  const imageRef = useRef()
  const [error, setError] = useState()

  const onImageLoaded = useEventCallback((event) => {
    const imageElm = event.currentTarget
    if (onLoad)
      onLoad({
        naturalWidth: imageElm.naturalWidth,
        naturalHeight: imageElm.naturalHeight,
        imageElm,
      })
  })

  const {t} = useTranslation();

  const onImageError = useEventCallback((event) => {
    setError(
      (t("error.image"))
    )
  })

  const stylePosition = useMemo(() => {
    let width = imagePosition.bottomRight.x - imagePosition.topLeft.x
    let height = imagePosition.bottomRight.y - imagePosition.topLeft.y
    return {
      imageRendering: "pixelated",
      left: imagePosition.topLeft.x,
      top: imagePosition.topLeft.y,
      width: isNaN(width) ? 0 : width,
      height: isNaN(height) ? 0 : height,
    }
  }, [
    imagePosition.topLeft.x,
    imagePosition.topLeft.y,
    imagePosition.bottomRight.x,
    imagePosition.bottomRight.y,
  ])

  if (!imageSrc)
    return <Error>No imageSrc provided</Error>

  if (error) return <Error>{error}</Error>

  return (
    <ThemeProvider theme={theme}>
        <StyledImage
          {...mouseEvents}
          src={imageSrc}
          ref={imageRef}
          style={stylePosition}
          onLoad={onImageLoaded}
          onError={onImageError}
          crossOrigin={useCrossOrigin ? "anonymous" : undefined}
        />
    </ThemeProvider>
  )
}
