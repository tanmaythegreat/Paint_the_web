# Paint the Web

A browser-based drawing app built with vanilla JavaScript and the HTML5 Canvas API. Draw freehand, add shapes and text, then select, move, and rotate anything you've drawn — all with full undo/redo support and automatic autosave.

## Features

- **Freehand drawing** with the pencil tool — adjustable stroke color and thickness
- **Eraser** that matches the current canvas background color
- **Shapes** — square, circle, and line, with an optional fill color
- **Text tool** — click anywhere to drop in an editable text box
- **Select tool** — click a shape to select it, then:
    - drag *inside* the selection box to move it
    - drag *outside* the selection box to rotate it around its center
- **Undo / Redo** for every action, including moves and rotations
- **Clear canvas** (undoable) vs. **Permanently clear canvas** (also wipes saved history)
- **Light / dark theme toggle**
- **Customizable background color**
- **Autosave** — your drawing, undo history, and background color are saved to `localStorage` and restored automatically when you reopen the app
- High-resolution rendering (the canvas is drawn at 4x the display size for crisp lines on retina/high-DPI screens)

## Controls

| Action | How |
|---|---|
| Draw | Pick a tool, then click and drag on the canvas |
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Shift + Z` |
| Cancel current stroke | `Esc` |
| Add text | Select the Text tool → click on the canvas → type → click away to commit |
| Move a shape | Select tool → click the shape → drag inside its selection box |
| Rotate a shape | Select tool → click the shape → drag outside its selection box |

## Tools

- **Pencil** – freehand strokes
- **Eraser** – erases by painting in the background color
- **Text** – click to place an editable text box
- **Select** – select, move, and rotate existing shapes
- **Square / Circle / Line** – shape tools; toggle "Fill shapes?" to fill them with the chosen fill color

## Project structure

```
.
├── index.html      # App layout and toolbar
├── index.js        # Drawing engine: tools, undo/redo, selection, persistence
├── style.css        # Styling (required for layout, cursors, and theming)
└── images/
    ├── pencil.png    # pencil cursor
    ├── eraser.png    # eraser cursor
    └── circle.png    # eraser hover indicator
```

## How it works

- Two stacked `<canvas>` elements are used: one holds the finished drawing, the other renders a live preview of whatever is currently being drawn or dragged.
- Every stroke or shape is stored as an object in a `strokes` array (each with a bounding box used for hit-testing) alongside an `actions` array used to replay transformations like moves and rotations.
- Undo/redo works by moving entries between `actions` and `redoes`, then calling `recreate()` to redraw the whole canvas from scratch.
- Moving and rotating a selected shape apply a 2D affine transform (`a, b, c, d` matrix plus `x_shift`/`y_shift`) around the shape's center point.

## Known limitations

- No export — there's currently no way to save the drawing as an image file
- No image import
- Autosave lives in `localStorage`, so it's tied to one browser/device and will be lost if browser data is cleared
- Undo/redo history has no size cap, so very long sessions could grow `localStorage` usage over time

## Getting started

Just open `index.html` in a browser — no build step, server, or dependencies required.