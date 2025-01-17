// @flow
import getActiveImage from "./get-active-image"
import {produce} from "immer"

export default (state, action) => {
  const {currentImageIndex} =
    getActiveImage(state)

  if (action.type === "IMAGE_LOADED") {
    return produce(state, s => {
      s.images[currentImageIndex].pixelSize = {
        w: action.metadata.naturalWidth,
        h: action.metadata.naturalHeight,
      }
    });
  }
  return state
}
