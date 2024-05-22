import { getIn } from "seamless-immutable"

export default (state) => {
  let currentImageIndex = null,
    pathToActiveImage,
    activeImage
    currentImageIndex = state.selectedImage
    if (currentImageIndex === -1) {
      currentImageIndex = null
      activeImage = null
    } else {
      pathToActiveImage = ["images", currentImageIndex]
      activeImage = getIn(state, pathToActiveImage)
    }
  return { currentImageIndex, pathToActiveImage, activeImage }
}
