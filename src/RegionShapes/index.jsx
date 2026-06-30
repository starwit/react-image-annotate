// @flow

import {memo} from "react"
import colorAlpha from "color-alpha"

const RegionComponents = {
  line: memo(({region, iw, ih}) => {
    return (
      <g transform={`translate(${region.x1 * iw} ${region.y1 * ih})`}>
        <path
          id={region.id}
          strokeWidth={3}
          d={`M0,0 L${(region.x2 - region.x1) * iw},${(region.y2 - region.y1) * ih}`}
          stroke={colorAlpha(region.color, 0.9)}
          fill={colorAlpha(region.color, 0.25)}
        />
        <text stroke={region.color} fill={region.color}>
          <textPath href={`#${region.id}`} startOffset="50%" textAnchor="middle">
            <tspan x="0" dy="-0.4em">IN</tspan>
            <tspan x="0" dy="1.5em">OUT</tspan>
          </textPath>
        </text>
      </g>
  )}),
  polygon: memo(({region, iw, ih}) => {
    const Component = region.open ? "polyline" : "polygon"
    return (
      <Component
        points={region.points
          .map(([x, y]) => [x * iw, y * ih])
          .map((a) => a.join(" "))
          .join(" ")}
        strokeWidth={2}
        stroke={colorAlpha(region.color, 0.75)}
        fill={colorAlpha(region.color, 0.25)}
      />
    )
  }),
}

export const WrappedRegionList = memo(
  ({regions, iw, ih}) => {
    return regions
      .filter((r) => r.visible !== false)
      .map((r, i) => {
        const Component = RegionComponents[r.type]
        return (
          <Component
            key={i}
            region={r}
            iw={iw}
            ih={ih}
          />
        )
      })
  },
  (n, p) => n.regions === p.regions && n.iw === p.iw && n.ih === p.ih
)

export const RegionShapes = ({
  imagePosition,
  regions = [],
}) => {
  const iw = imagePosition.bottomRight.x - imagePosition.topLeft.x
  const ih = imagePosition.bottomRight.y - imagePosition.topLeft.y
  if (isNaN(iw) || isNaN(ih)) return null
  return (
    <svg
      width={iw}
      height={ih}
      style={{
        position: "absolute",
        zIndex: 2,
        left: imagePosition.topLeft.x,
        top: imagePosition.topLeft.y,
        pointerEvents: "none",
        width: iw,
        height: ih,
      }}
    >
      <WrappedRegionList
        key="wrapped-region-list"
        regions={regions}
        iw={iw}
        ih={ih}
      />
    </svg>
  )
}

export default RegionShapes
