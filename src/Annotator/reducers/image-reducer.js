// @flow
import {produce} from "immer"

export default (state, action) => {
  if (action.type === "IMAGE_LOADED") {
    return produce(state, s => {
      s.image.pixelSize = {
        w: action.metadata.naturalWidth,
        h: action.metadata.naturalHeight,
      }
    });
  }
  return state
}
