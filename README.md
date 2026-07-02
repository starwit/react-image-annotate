# React Image Annotate

## Features

- Simple input/output format
- Polygon and Line Annotation
- Zooming, Scaling, Panning (can be locked via `movementLocked`)
- Cursor Crosshair

![Screenshot of Annotator](https://user-images.githubusercontent.com/1910070/51199716-83c72080-18c5-11e9-837c-c3a89c8caef4.png)

## Usage

`npm install @starwit/react-image-annotate`

```javascript
import React, { useRef } from "react";
import ReactImageAnnotate from "@starwit/react-image-annotate";

const App = () => {
  const annotatorRef = useRef(null);

  return (
    <>
      <button onClick={() => console.log(annotatorRef.current?.getRegions())}>
        Log state
      </button>
      <ReactImageAnnotate
        ref={annotatorRef}
        classifications={[
          {cls: "alpha", displayName: "Alpha", color: "#00da86"},
          {cls: "beta", displayName: "Beta", color: "#1e87e9"},
          {cls: "charlie", displayName: "Charlie"},
          {cls: "delta", displayName: "Delta"},
        ]}
        image={{
          src: "https://placekitten.com/408/287",
          name: "Image 1",
          regions: []
        }}
      />
    </>
  );
};

export default App;

```

### Retrieving the annotation state

The annotator does not render a header or expose a save/exit callback. Instead,
pass a `ref` and call `getRegions()` to read the current annotations whenever you
need them, e.g. from your own toolbar button. It returns the list of drawn
regions:

```javascript
const regions = annotatorRef.current.getRegions();
// regions: Array<Region> — the polygons/lines drawn on the image
```

To get the proper fonts, make sure to import the Inter UI or Roboto font, the
following line added to a css file should suffice.

```css
@import url("https://rsms.me/inter/inter.css");
```

## Props

All of the following properties can be defined on the Annotator...

| Prop                 | Type (\* = required)         | Description                                                                                                | Default            |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------ |
| `image`              | `Image` \*                   | The image to annotate.                                                                                     |                    |
| `selectedTool`       | `string`                     | Initially selected tool. e.g. "select", "pan", "zoom", "create-polygon", "create-line".                   | `"select"`         |
| `classifications`    | `Array<Classification>`      | Allowed classifications (mutually exclusive) for regions. Each is `{ cls, displayName?, color? }`, where `cls` is the technical identifier (source of truth, e.g. for DB references), `displayName` is the human-readable label shown in the UI (falls back to `cls`), and `color` is optional (default palette is used otherwise). |          |
| `preselectCls`       | `string`                     | `cls` that should be preselected when creating a new region.                                              |                    |
| `ref`                | `Ref`                        | Ref exposing `getRegions()`, which returns the current array of regions. See "Retrieving the annotation state" above. |          |
| `enabledRegionProps` | `Array<string>`              | Which properties to show in the region edit popup ("name", "line-direction").                             | `["class", "name"]` |
| `movementLocked`     | `boolean`                    | Reset zoom/pan to the default view and lock canvas movement (panning/zooming).                            | `false`            |
| `userReducer`        | `(state, action) => state`   | User defined reducer that receives every event triggered within the annotator. See demo site for example. |                    |

## Developers

### Development

To begin developing run the following commands in the cloned repo.

1. `npm install`
2. `npm start`

Then navigate to http://localhost:5173/ and start testing.

See more details in the [contributing guidelines](https://github.com/waoai/react-image-annotate/wiki/Setup-for-Development).

### Icons

Consult these icon repositories:

- [Material Icons](https://material.io/tools/icons/)
- [Font Awesome Icons](https://fontawesome.com/icons?d=gallery&m=free)

### Testdrive in project
To test this package in your project follow this quickstart:
1. Run `npm link` in the root directory of this project (where the `package.json` is located)
2. With the same Terminal window, go to your target project folder where the `package.json` is located
3. Run `npm link "@starwit/react-image-annotate"` to install the package. It might be necessary to remove a previously installed `@starwit/react-image-annotate` package. Please use the same node version when using npm link and executing the application. 
4. Changes to this repository will apply live to the running dev session in your target project :)


### Notes
Currently, there is an issue with vite-plugin-node-polyfills (0.15.0 at the time of writing), 
which shows many warnings while building (related to "use client"). That is expected and will probably be fixed in the future. See here: https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/49 
