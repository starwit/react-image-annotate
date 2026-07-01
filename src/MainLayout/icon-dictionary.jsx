// @flow

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faChartLine,
  faDrawPolygon,
  faHandPaper,
  faMousePointer,
  faSearch,
} from "@fortawesome/free-solid-svg-icons"

const faStyle = { marginTop: 4, width: 16, height: 16, marginBottom: 4 }

export const iconDictionary = {
  select: () => (
    <FontAwesomeIcon
      style={faStyle}
      size="xs"
      fixedWidth
      icon={faMousePointer}
    />
  ),
  pan: () => (
    <FontAwesomeIcon style={faStyle} size="xs" fixedWidth icon={faHandPaper} />
  ),
  zoom: () => (
    <FontAwesomeIcon style={faStyle} size="xs" fixedWidth icon={faSearch} />
  ),
  "create-polygon": () => (
    <FontAwesomeIcon
      style={faStyle}
      size="xs"
      fixedWidth
      icon={faDrawPolygon}
    />
  ),
  "create-line": () => (
    <FontAwesomeIcon style={faStyle} size="xs" fixedWidth icon={faChartLine} />
  ),
}

export default iconDictionary
