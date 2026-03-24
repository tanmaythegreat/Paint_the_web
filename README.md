# Paint the Web

A simple browser-based drawing application built using the HTML CSS and Javascript.

## Features

### Draw Modes

- **Pencil** – Freehand drawing on the canvas.
- **Eraser** – Works like the pencil but uses a thicker stroke with the same color as the background.
- **Square** – Draw squares on the canvas. (with preview!!)

## How It Works

### Stroke Storage

All strokes are stored in an array. Each element in the array is an object containing a `drawMode` key, whose value indicates whether the stroke is a pencil stroke or a square.

### Undo / Redo

- **Ctrl+Z** – Pops the last stroke from the strokes array, moves it into a separate redos array, and redraws the entire canvas from scratch using the remaining strokes.
- **Ctrl+Y** – Pops the last entry from the redos array and pushes it back into the strokes array, then redraws the canvas. when a stroke is confirmed `redos` array is cleared.
- **Escape** - When drawing something and press escape,will cancel that stroke.it works the same way as `Ctrl+Z`.(i changed this mechanism later after the implementation of preview canvas)

### Square Preview

Showing a live preview of the square while the cursor moves was difficult. I refactored my entire code for this. I created another transparent canvas on top of it,which only contains the stroke that the user is drawing rn.like this i only need to update this one which only have a single stroke.Every frame when the cursor moves i reset the preview_canvas and redraw the shape.

> **Approach #1 (failed):** Take a snapshot of the canvas just before square creation, then composite that image with the square on every cursor move. This was abandoned because reading image data from the canvas is a heavy operation, and it disables many GPU-based canvas optimisations(I dont know more about this), making performance worse.

> **Approach #2 (worked but rejected):** i created a shape (square) and every time the user drags the cursor i redrew the entire drawing.which works well when the drawing is small.

## TODO

- Add more shapes (circle, rectangle, etc.)
- Change the cursor icon based on the selected tool
- Improve the UI
- Add color options and stroke thickness control
