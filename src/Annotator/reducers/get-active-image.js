export default (state) => {
  let currentImageIndex = null,
    pathToActiveImage,
    activeImage
    currentImageIndex = state.selectedImage
    if (currentImageIndex === -1) {
      currentImageIndex = null
      activeImage = null
    } else {
      activeImage = state.images[currentImageIndex]
    }
  return { currentImageIndex, pathToActiveImage, activeImage }
}
