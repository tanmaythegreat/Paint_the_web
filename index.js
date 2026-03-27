
//region Drawing Settings
const DrawMode = {
    None : 0,
    Pencil:1,
    Eraser:2,
    Square:3,
    Circle:4,
    Line:5,
    Clear:6,
    Text: 7,
}
let color = '#f0f0f0';
let fill_color = '#f0f0f0';
let currentMode = DrawMode.Pencil;
const Res = 4;
const speed_offset = 10000;
const speed_scale = 10000;
//endregion


//region Canvas init
const eraser_cursor = document.getElementById('eraser-cursor');
const canvas = document.getElementById("canvas");
const preview_canvas = document.getElementById("preview_canvas");
const main = document.querySelector('main');

canvas.width = Res * screen.width;
canvas.height = Res * screen.height;

preview_canvas.width = Res * screen.width;
preview_canvas.height = Res * screen.height;


/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
ctx.lineJoin = "round"
ctx.lineCap = "round"

/** @type {CanvasRenderingContext2D} */
const preview_ctx = preview_canvas.getContext('2d');
preview_ctx.lineJoin = "round"
preview_ctx.lineCap = "round"

window.addEventListener("beforeunload",()=>{
    localStorage.setItem("redoes",JSON.stringify(redoes));
    localStorage.setItem("strokes",JSON.stringify(strokes));
    localStorage.setItem("bg-color",bg_picker.value);
});
let active = DrawMode.None;
//endregion

//region Tools
pencil_btn = document.getElementById("pencil")
eraser_btn = document.getElementById("eraser")
square_btn = document.getElementById("square")
circle_btn = document.getElementById("circle")
line_btn = document.getElementById("line")
text_btn = document.getElementById("text")

pencil_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Pencil;
    preview_canvas.style.cursor  = "url('images/pencil.png') 0 64,auto";
});
eraser_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Eraser;
    preview_canvas.style.cursor  = "url('images/eraser.png') 15 50,auto";
});
square_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Square;
    preview_canvas.style.cursor = "crosshair"
});
circle_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Circle;
    preview_canvas.style.cursor = "crosshair"
});
line_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Line;
    preview_canvas.style.cursor = "crosshair"

});
text_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Text;
    preview_canvas.style.cursor = "crosshair"

});


const clear_btn = document.getElementById("clearCanvas");
clear_btn.addEventListener('click',()=>{
    strokes.push({drawMode:DrawMode.Clear});
    ctx.clearRect(0,0,canvas.width,canvas.height);
    preview_canvas.focus();
})
const permanent_clear_btn = document.getElementById("permanent_clearCanvas");
permanent_clear_btn.addEventListener('click',()=>{
    strokes.clear();
    redoes.clear();
    localStorage.removeItem('strokes');
    localStorage.removeItem('redoes');
    localStorage.removeItem('bg-color');
    recreate();
})

const thickness_slider = document.getElementById("thickness");
const color_picker = document.getElementById("color-picker");
color_picker.addEventListener('input',(inp)=>{
    color = color_picker.value;
})
const fill_picker = document.getElementById("fill-color-picker");
fill_picker.addEventListener('input',(inp)=>{
    fill_color = fill_picker.value
})
const bg_picker = document.getElementById("bg-picker");
bg_picker.addEventListener('input',(inp)=>{
    canvas.style.backgroundColor = bg_picker.value;
    recreate();
})

const fill_checkbox = document.getElementById("fill-checkbox");

const theme_toggle_btn = document.getElementById('theme-toggle');
theme_toggle_btn.addEventListener('click',(e)=>{
    document.body.classList.toggle('light-mode');
});
//endregion


let redoes = JSON.parse(localStorage.getItem('redoes') || "[]");
let strokes = JSON.parse(localStorage.getItem('strokes') || "[]");
bg_picker.value=localStorage.getItem('bg-color')||"#121212"
canvas.style.backgroundColor = bg_picker.value;
recreate();

//region Coordinate-geometry
function getSquare_from_diagonal(x1,y1,x3,y3){
    return {x2:(x1+x3+y1-y3)/2,y2:(y1+y3+x3-x1)/2,x4:(x1+x3-y1+y3)/2,y4:(y1+y3-x3+x1)/2}
}
//endregion


//region Canvas functions
function init_pencil(event,erase){
    if (erase){
        active = DrawMode.Eraser;
    }else{
        active = DrawMode.Pencil;
    }
    const dm = active;
    preview_ctx.lineWidth = thickness_slider.value;
    if (erase) {preview_ctx.strokeStyle=getComputedStyle(canvas).backgroundColor; preview_ctx.lineWidth=thickness_slider.value*10;  } else {preview_ctx.strokeStyle = color;}
    preview_ctx.beginPath();
    const x = scale_factorX*event.offsetX;
    const y = scale_factorY*event.offsetY;
    strokes.push({drawMode: dm, color:preview_ctx.strokeStyle, coords: [{x,y,thickness:thickness_slider.value}]})
    preview_ctx.moveTo(x,y);
    preview_ctx.stroke();
}
function drag_pencil(event){
    const speed = Math.pow(scale_factorX*event.movementX,2)+Math.pow(event.movementY*scale_factorY,2);
    //ctx.lineWidth = thickness//*(Math.atanh((speed_offset-speed)/speed_scale)/Math.PI);
    const x = scale_factorX*(event.offsetX);
    const y = scale_factorY*(event.offsetY);
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
    if (stroke.drawMode===DrawMode.Eraser){ctx.strokeStyle=getComputedStyle(canvas).backgroundColor;
    console.log("its eraser!");}else{ctx.strokeStyle = stroke.color;}
    ctx.beginPath();
    ctx.moveTo(stroke.coords[0].x,stroke.coords[0].y)
    ctx.lineWidth = stroke.coords[0].thickness;
    for (let i = 0; i < stroke.coords.length; i++) {
        ctx.lineWidth = stroke.coords[i].thickness;
        ctx.lineTo(stroke.coords[i].x,stroke.coords[i].y);
    }
    ctx.stroke();
}
function init_square(event){
    active = DrawMode.Square;
    preview_ctx.lineWidth = thickness_slider.value;
    preview_ctx.strokeStyle = color;
    const x = scale_factorX*event.offsetX;
    const y = scale_factorY*event.offsetY;
    const sq_config = {drawMode: DrawMode.Square,fill_color,color,fill:fill_checkbox.checked,thickness:thickness_slider.value,x1:x,y1:y,x2:x,y2:y,x3:x,y3:y,x4:x,y4:y};
    strokes.push(sq_config);
}
function drag_square(event){
    const sq_config = strokes[strokes.length-1];
    sq_config.x3 = scale_factorX*event.offsetX;
    sq_config.y3 = scale_factorY*event.offsetY;

    const points = getSquare_from_diagonal(sq_config.x1,sq_config.y1,sq_config.x3,sq_config.y3);
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
function init_line(event){
    active = DrawMode.Line;
    preview_ctx.lineWidth = thickness_slider.value;
    preview_ctx.strokeStyle = color;
    const x = scale_factorX*event.offsetX;
    const y = scale_factorY*event.offsetY;
    strokes.push({drawMode: DrawMode.Pencil, color:preview_ctx.strokeStyle, coords: [{x,y,thickness:thickness_slider.value},{x,y,thickness:thickness_slider.value}]})
}
function drag_line(event){
    const line_config = strokes[strokes.length-1];
    line_config.coords[1].x = scale_factorX*event.offsetX;
    line_config.coords[1].y = scale_factorY*event.offsetY;
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_line(line_config,preview_ctx);
}
function end_line(event){
    drag_line(event);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_line(strokes[strokes.length-1],ctx)
    active = DrawMode.None;
    redoes.length = 0;
}
function draw_line(stroke,ctx){
    ctx.lineWidth = stroke.coords[0].thickness;
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    ctx.moveTo(stroke.coords[0].x,stroke.coords[0].y);
    ctx.lineTo(stroke.coords[1].x,stroke.coords[1].y);
    ctx.stroke();
}
function init_circle(event){
    active = DrawMode.Circle;
    preview_ctx.lineWidth = thickness_slider.value;
    preview_ctx.strokeStyle = color;
    const x = scale_factorX*event.offsetX;
    const y = scale_factorY*event.offsetY;
    strokes.push({drawMode: DrawMode.Circle,fill_color, color:preview_ctx.strokeStyle,fill:fill_checkbox.checked,thickness:thickness_slider.value, coords: [{x,y},{x,y}]})
}
function drag_circle(event){
    const circle_config = strokes[strokes.length-1];
    circle_config.coords[1].x = scale_factorX*event.offsetX;
    circle_config.coords[1].y = scale_factorY*event.offsetY;
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_circle(circle_config,preview_ctx);
}
function end_circle(event){
    drag_circle(event);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_circle(strokes[strokes.length-1],ctx)
    active = DrawMode.None;
    redoes.length = 0;
}
function draw_circle(stroke,ctx){
    ctx.lineWidth = stroke.thickness;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.fill_color;
    ctx.beginPath();
    ctx.arc((stroke.coords[0].x+stroke.coords[1].x)/2,(stroke.coords[0].y+stroke.coords[1].y)/2,Math.sqrt(Math.pow(stroke.coords[0].x-stroke.coords[1].x,2)+Math.pow(stroke.coords[0].y-stroke.coords[1].y,2))/2,0,Math.PI*2);
    ctx.closePath();
    if (stroke.fill) {
        ctx.fill();
    }
    ctx.stroke();

}
function draw_square(stroke,ctx) {
    ctx.lineWidth = stroke.thickness;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.fill_color;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.thickness;
    ctx.moveTo(stroke.x1, stroke.y1);
    ctx.lineTo(stroke.x2, stroke.y2);
    ctx.lineTo(stroke.x3, stroke.y3);
    ctx.lineTo(stroke.x4, stroke.y4);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.closePath();
    if (stroke.fill) {
        ctx.fill()
    }
    ctx.stroke();
}

let canvas_left,canvas_top,scale_factorX,scale_factorY;
preview_canvas.addEventListener('mousedown',(e)=>{
    const rect = canvas.getBoundingClientRect();
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
        case DrawMode.Circle:
            init_circle(e);
            break;
        case DrawMode.Line:
            init_line(e);
            break;

    }
});
preview_canvas.addEventListener('mousemove',(e)=>{
    switch (active){
        case DrawMode.Pencil:
            drag_pencil(e);
            break;
        case DrawMode.Eraser:
            drag_pencil(e);
            break;
        case DrawMode.Square:
            drag_square(e);
            break;
        case DrawMode.Circle:
            drag_circle(e);
            break;
        case DrawMode.Line:
            drag_line(e);
            break;
    }
    if (currentMode===DrawMode.Eraser){
        eraser_cursor.style.display = 'flex';
        eraser_cursor.style.left = e.clientX+'px';
        eraser_cursor.style.top = e.clientY+'px';
        eraser_cursor.style.width = 10*thickness_slider.value/Res+'px';
        eraser_cursor.style.height =10*thickness_slider.value/Res+'px';
    }
    else{
        eraser_cursor.style.display = 'none';
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
        case DrawMode.Circle:
            end_circle(e);
            break;
        case DrawMode.Line:
            end_line(e);
    }
}
preview_canvas.addEventListener('mouseup',(e)=>{
    if (currentMode===DrawMode.Text){

        const textbox = document.createElement('input');
        main.appendChild(textbox)
        textbox.style.position = "absolute";
        textbox.style.top = (e.clientY).toString()+'px';
        textbox.style.left = (e.clientX).toString()+'px';
        textbox.style.width = "100px";
        textbox.style.height = "50px";
        textbox.style.zIndex = "10";
        textbox.style.color = "#fff";
        textbox.classList.add('tb')
        textbox.addEventListener('focusout', () => {
            // ctx.font = "200px Arial";
            ctx.font = "italic 180px Times New Roman";
            ctx.fillStyle = fill_color;
            ctx.fillText(textbox.value,e.offsetX*scale_factorX,e.offsetY*scale_factorY);
            strokes.push({drawMode:DrawMode.Text,text:textbox.value,font:ctx.font,color:ctx.fillStyle,x:e.offsetX*scale_factorX,y:e.offsetY*scale_factorY})
            textbox.remove();
        });
        textbox.focus();

    }
    else{
        mouse_up_on_canvas_listener(e);
    }
});
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
        strokes.pop();
        active = DrawMode.None;
        preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    }
});

function recreate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (const stroke of strokes) {
        switch (stroke.drawMode) {
            case DrawMode.Pencil:
                draw_pencil(stroke);
                break;
            case DrawMode.Eraser:
                draw_pencil(stroke);
                break;
            case DrawMode.Square:
                draw_square(stroke,ctx);
                break;
            case DrawMode.Circle:
                draw_circle(stroke,ctx);
                break;
            case DrawMode.Clear:
                ctx.clearRect(0,0,canvas.width,canvas.height);
                break;
            case DrawMode.Text:
                ctx.font = stroke.font;
                ctx.fillStyle = stroke.color;
                ctx.fillText(stroke.text,stroke.x,stroke.y);
                break;
        }
    }
}

function Undo(){
    if (strokes.length>0) {
        redoes.push(strokes.pop());
        recreate();
    }
}
function Redo(){
    if (redoes.length>0) {
        strokes.push(redoes.pop());
        recreate();
    }
}
//endregion
