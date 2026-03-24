
//region Drawing Settings
let DrawMode = {
    None : 0,
    Pencil:1,
    Eraser:2,
    Square:3,
    Circle:4
}
let color = '#f0f0f0';
let currentMode = DrawMode.Pencil;
const Res = 5;
let thickness = Res*5
const speed_offset = 10000;
const speed_scale = 10000;
//endregion

//region Coordinate-geometry
function getSquare_from_diagonal(x1,y1,x3,y3){
    return {x2:(x1+x3+y1-y3)/2,y2:(y1+y3+x3-x1)/2,x4:(x1+x3-y1+y3)/2,y4:(y1+y3-x3+x1)/2}
}
//endregion

//region Canvas
let canvas = document.getElementById("canvas");
let preview_canvas = document.getElementById("preview_canvas");

canvas.width = Res * screen.width;
canvas.height = Res * screen.height;

preview_canvas.width = Res * screen.width;
preview_canvas.height = Res * screen.height;


/** @type {CanvasRenderingContext2D} */
let ctx = canvas.getContext('2d');
ctx.lineJoin = "round"
ctx.lineCap = "round"

/** @type {CanvasRenderingContext2D} */
let preview_ctx = preview_canvas.getContext('2d');
preview_ctx.lineJoin = "round"
preview_ctx.lineCap = "round"

let strokes = []; //array of strokes each element is a object which contains DrawMode etc
let redoes = [];
let active = DrawMode.None;

function init_pencil(event,erase){
    active = DrawMode.Pencil;
    preview_ctx.lineWidth = thickness;
    if (erase) {preview_ctx.strokeStyle=getComputedStyle(canvas).backgroundColor; preview_ctx.lineWidth*=10;  } else {preview_ctx.strokeStyle = color;}
    preview_ctx.beginPath();
    let x = scale_factorX*event.offsetX;
    let y = scale_factorY*event.offsetY;
    strokes.push({drawMode: DrawMode.Pencil, color:preview_ctx.strokeStyle, coords: [{x,y,thickness}]})
    preview_ctx.moveTo(x,y);
    preview_ctx.stroke();
}
function drag_pencil(event){
    let speed = Math.pow(scale_factorX*event.movementX,2)+Math.pow(event.movementY*scale_factorY,2);
    //ctx.lineWidth = thickness//*(Math.atanh((speed_offset-speed)/speed_scale)/Math.PI);
    let x = scale_factorX*(event.offsetX);
    let y = scale_factorY*(event.offsetY);
    strokes[strokes.length-1].coords.push({x,y,thickness:preview_ctx.lineWidth});
    preview_ctx.lineTo(x,y);
    preview_ctx.stroke();
}
function end_pencil(event){
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_pencil(strokes[strokes.length-1])
    active = DrawMode.None;
    redoes.length = 0;
}
function draw_pencil(stroke){
    ctx.lineWidth = stroke.coords[0].thickness;
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    console.log(stroke);
    ctx.strokeStyle = stroke.color;
    ctx.moveTo(stroke.coords[0].x,stroke.coords.y)
    ctx.lineWidth = stroke.coords[0].thickness;
    for (let i = 1; i < stroke.coords.length; i++) {
        ctx.lineWidth = stroke.coords[i].thickness;
        ctx.lineTo(stroke.coords[i].x,stroke.coords[i].y);
    }
    ctx.stroke();
}
function init_square(event){
    active = DrawMode.Square;
    preview_ctx.lineWidth = thickness;
    preview_ctx.strokeStyle = color;
    let x = scale_factorX*event.offsetX;
    let y = scale_factorY*event.offsetY;
    let sq_config = {drawMode: DrawMode.Square,color,thickness,x1:x,y1:y,x2:x,y2:y,x3:x,y3:y,x4:x,y4:y};
    strokes.push(sq_config);
}
function drag_square(event){
    let sq_config = strokes[strokes.length-1];
    sq_config.x3 = scale_factorX*event.offsetX;
    sq_config.y3 = scale_factorY*event.offsetY;

    let points = getSquare_from_diagonal(sq_config.x1,sq_config.y1,sq_config.x3,sq_config.y3);
    sq_config.x2 = points.x2;
    sq_config.y2 = points.y2;
    sq_config.x4 = points.x4;
    sq_config.y4 = points.y4;
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_square(sq_config,preview_ctx);
}
function end_square(event){
    drag_square(event);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_square(strokes[strokes.length-1],ctx)
    active = DrawMode.None;
    redoes.length = 0;
}
function draw_square(stroke,ctx) {
    ctx.lineWidth = stroke.thickness;
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.thickness;
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    ctx.lineTo(stroke.x3, stroke.y3);
    ctx.lineTo(stroke.x4, stroke.y4);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();
    ctx.closePath();
}
let canvas_left,canvas_top,scale_factorX,scale_factorY;
preview_canvas.addEventListener('mousedown',(e)=>{
    let rect = canvas.getBoundingClientRect();
    canvas_left = rect.left;
    canvas_top = rect.top;
    scale_factorX = canvas.width/rect.width;
    scale_factorY = canvas.height/rect.height;
    switch (currentMode){
        case DrawMode.Pencil:
            init_pencil(e,false);
            break;
        case DrawMode.Eraser:
            init_pencil(e,true);
            break;
        case DrawMode.Square:
            init_square(e);
            break;
    }
});
preview_canvas.addEventListener('mousemove',(e)=>{
    switch (active){
        case DrawMode.Pencil:
            drag_pencil(e);
            break;
        case DrawMode.Square:
            drag_square(e);
            break;
    }
});
function mouse_up_on_canvas_listener(e){
    switch (active){
        case DrawMode.Pencil:
            end_pencil(e);
            break;
        case DrawMode.Eraser:
            end_pencil(e);
            break;
        case DrawMode.Square:
            end_square(e);
            break;
    }
}
preview_canvas.addEventListener('mouseup',mouse_up_on_canvas_listener);
preview_canvas.addEventListener('mouseleave',mouse_up_on_canvas_listener);
preview_canvas.addEventListener('keydown',function shortcuts(event)
{
    if (event.ctrlKey){
        if (event.key==="z"){
            Undo();
        }else if (event.key==='Z'){
            Redo();
        }
    }
    else if (event.key==="Escape" && strokes.length>0){
        preview_ctx.closePath();
        strokes.pop();
        preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    }
});


function ReCreate(){
    console.log("Recreate")
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let stroke of strokes) {
        switch (stroke.drawMode) {
            case DrawMode.Pencil:
                draw_pencil(stroke);
                break;
            case DrawMode.Square:
                draw_square(stroke,ctx);
                break;
        }
    }
}

function Undo(){
    if (strokes.length>0) {
        console.log("UNDO")
        redoes.push(strokes.pop());
        ReCreate();
    }
}
function Redo(){
    if (redoes.length>0) {
        console.log("REDO")
        strokes.push(redoes.pop());
        ReCreate();
    }
}
//endregion

//region Tools
pencil_btn = document.getElementById("pencil")
eraser_btn = document.getElementById("eraser")
square_btn = document.getElementById("square")

pencil_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Pencil;
    console.log("Changed to pencil")
});
eraser_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Eraser;
    console.log("Changed to eraser")
});
square_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Square;
    console.log("Changed to eraser")
});
//endregion