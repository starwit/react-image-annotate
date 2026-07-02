// @flow weak
import { getEnclosingBox } from "./region-tools.js"

export default ({ layoutParams, mat }) => {
  // NOTE: this callback is invoked synchronously during render (e.g. by
  // RegionTags), so it must close over the current `mat`. Do not wrap it in
  // useEventCallback — that defers the ref update to a layout effect, leaving
  // the projection one render behind and causing region tags to lag when the
  // matrix changes in a single discrete step (e.g. toggling movementLocked).
  return (r) => {
    const { iw, ih } = layoutParams.current
    const bbox = getEnclosingBox(r)
    const margin = r.type === "point" ? 15 : 2
    const cbox = {
      x: bbox.x * iw - margin,
      y: bbox.y * ih - margin,
      w: bbox.w * iw + margin * 2,
      h: bbox.h * ih + margin * 2,
    }
    const pbox = {
      ...mat.clone().inverse().applyToPoint(cbox.x, cbox.y),
      w: cbox.w / mat.a,
      h: cbox.h / mat.d,
    }
    return pbox
  }
}
