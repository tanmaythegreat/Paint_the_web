
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

//region Canvas
let canvas = document.getElementById("canvas");

canvas.width = Res * screen.width;
canvas.height = Res * screen.height;

console.log(canvas.width);

/** @type {CanvasRenderingContext2D} */
let ctx = canvas.getContext('2d');



let strokes = []; //array of strokes each element is a object which contains DrawMode etc
let redoes = [];
let active = DrawMode.None;

function drag_pencil(event){
    let speed = Math.pow(scale_factorX*event.movementX,2)+Math.pow(event.movementY*scale_factorY,2);
    //ctx.lineWidth = thickness//*(Math.atanh((speed_offset-speed)/speed_scale)/Math.PI);
    let x = scale_factorX*(event.offsetX);
    let y = scale_factorY*(event.offsetY);
    strokes[strokes.length-1].coords.push({x,y,thickness:ctx.lineWidth});
    ctx.lineTo(x,y);
    ctx.stroke();
}
function init_pencil(event,erase){
    active = DrawMode.Pencil;
    ctx.lineWidth = thickness;
    if (erase) {ctx.strokeStyle=getComputedStyle(canvas).backgroundColor; ctx.lineWidth*=10; console.log(getComputedStyle(canvas).backgroundColor); } else {ctx.strokeStyle = color;}
    ctx.beginPath();
    let x = scale_factorX*event.offsetX;
    let y = scale_factorY*event.offsetY;
    strokes.push({drawMode: DrawMode.Pencil, color:ctx.strokeStyle, coords: [{x,y,thickness}]})
    ctx.moveTo(x,y);
    ctx.stroke();
}
function end_pencil(event){
    ctx.closePath();
    active = DrawMode.None;
    redoes.length = 0;
}
let canvas_left,canvas_top,scale_factorX,scale_factorY;
canvas.addEventListener('mousedown',(e)=>{
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
    }
});
canvas.addEventListener('mousemove',(e)=>{
    switch (active){
        case DrawMode.Pencil:
            drag_pencil(e);
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
    }
}
canvas.addEventListener('mouseup',mouse_up_on_canvas_listener);
canvas.addEventListener('mouseleave',mouse_up_on_canvas_listener);
canvas.addEventListener('keydown',function shortcuts(event)
{
    if (event.ctrlKey){
        if (event.key==="z"){
            Undo();
        }else if (event.key==='Z'){
            Redo();
        }
    }
    else if (event.key==="Escape"){
        if (active===DrawMode.Pencil){
            active = DrawMode.None;
            strokes.pop();
            ReCreate();
        }
    }
});
function ReCreate(){
    console.log("Recreate")
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let stroke of strokes) {
        ctx.closePath();
        ctx.beginPath();
        console.log(stroke);
        ctx.strokeStyle = stroke.color;
        switch (stroke.drawMode) {
            case DrawMode.Pencil:
                ctx.moveTo(stroke.coords[0].x,stroke.coords.y)
                ctx.lineWidth = stroke.coords[0].thickness;
                for (let i = 1; i < stroke.coords.length; i++) {
                    ctx.lineWidth = stroke.coords[i].thickness;
                    ctx.lineTo(stroke.coords[i].x,stroke.coords[i].y);
                }
                ctx.stroke();
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

pencil_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Pencil;
    console.log("Changed to pencil")
});
eraser_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Eraser;
    console.log("Changed to eraser")
});
//end region