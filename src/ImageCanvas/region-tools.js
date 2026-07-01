export const getEnclosingBox = (region) => {
  switch (region.type) {
    case "polygon": {
      const box = {
        x: region.points[0][0],
        y: region.points[0][1],
        w: 0,
        h: 0,
      }
      return box
    }
    case "line": {
      return {x: region.x1, y: region.y1, w: 0, h: 0}
    }
    default: {
      return {x: 0, y: 0, w: 0, h: 0}
    }
  }
}
