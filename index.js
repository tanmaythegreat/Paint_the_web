
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
    Select:8,
    Dashed_Box:9,
    SelectMove:10,
    SelectRotate:11
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

canvas.style.width = (screen.width * 0.85) + 'px';
canvas.style.height = (screen.height * 0.85) + 'px';

preview_canvas.style.width = (screen.width * 0.85) + 'px';
preview_canvas.style.height = (screen.height * 0.85) + 'px';
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
    localStorage.setItem("actions",JSON.stringify(actions));
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
select_btn = document.getElementById("select")

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
select_btn.addEventListener('click',()=>{
    currentMode = DrawMode.Select;
    preview_canvas.style.cursor = "pointer"
});


const clear_btn = document.getElementById("clearCanvas");
clear_btn.addEventListener('click',()=>{
    strokes.push({drawMode:DrawMode.Clear});
    actions.push({drawMode:DrawMode.Clear});
    ctx.clearRect(0,0,canvas.width,canvas.height);
    preview_canvas.focus();
})
const permanent_clear_btn = document.getElementById("permanent_clearCanvas");
permanent_clear_btn.addEventListener('click',()=>{
    strokes.length = 0;
    redoes.length = 0;
    actions.length = 0;
    localStorage.removeItem('strokes');
    localStorage.removeItem('redoes');
    localStorage.removeItem('actions');
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

const redoes = JSON.parse(localStorage.getItem('redoes') || "[]");
const strokes = JSON.parse(localStorage.getItem('strokes') || "[]");
const actions = JSON.parse(localStorage.getItem('actions') || "[]");
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
    const stroke = {drawMode: dm, bounds:{x_min:x,x_max:x,y_min:y,y_max:y},color:preview_ctx.strokeStyle, coords: [{x,y,thickness:thickness_slider.value}]};
    strokes.push(stroke);
    preview_ctx.moveTo(x,y);
    preview_ctx.stroke();
}
function drag_pencil(event){
    const speed = Math.pow(scale_factorX*event.movementX,2)+Math.pow(event.movementY*scale_factorY,2);
    //ctx.lineWidth = thickness//*(Math.atanh((speed_offset-speed)/speed_scale)/Math.PI);
    const x = scale_factorX*(event.offsetX);
    const y = scale_factorY*(event.offsetY);
    strokes[strokes.length-1].coords.push({x,y,thickness:preview_ctx.lineWidth});
    const b = strokes[strokes.length-1].bounds;
    b.x_min = Math.min(x,b.x_min);
    b.y_min = Math.min(y,b.y_min);
    b.x_max = Math.max(x,b.x_max);
    b.y_max = Math.max(y,b.y_max);
    preview_ctx.lineTo(x,y);
    preview_ctx.stroke();
}
function end_pencil(event){
    drag_pencil(event);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_pencil(strokes[strokes.length-1],ctx)
    active = DrawMode.None;
    redoes.length = 0;
    actions.push(strokes[strokes.length-1]);
}
function draw_pencil(stroke,ctx){
    ctx.lineWidth = stroke.coords[0].thickness;
    if (stroke.drawMode===DrawMode.Eraser){ctx.strokeStyle=getComputedStyle(canvas).backgroundColor;}else{ctx.strokeStyle = stroke.color;}
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
    const sq_config = {drawMode: DrawMode.Square,bounds:{x_min:x,x_max:x,y_min:y,y_max:y},fill_color,color,fill:fill_checkbox.checked,thickness:thickness_slider.value,x1:x,y1:y,x2:x,y2:y,x3:x,y3:y,x4:x,y4:y};
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
    const sq_config = strokes[strokes.length-1];
    const b= sq_config.bounds;
    b.x_min = Math.min(sq_config.x1,sq_config.x2,sq_config.x3,sq_config.x4);
    b.x_max = Math.max(sq_config.x1,sq_config.x2,sq_config.x3,sq_config.x4);
    b.y_min = Math.min(sq_config.y1,sq_config.y2,sq_config.y3,sq_config.y4);
    b.y_max = Math.max(sq_config.y1,sq_config.y2,sq_config.y3,sq_config.y4);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw_square(strokes[strokes.length-1],ctx);
    active = DrawMode.None;
    redoes.length = 0;
    actions.push(strokes[strokes.length-1]);

}
function init_line(event){
    active = DrawMode.Line;
    preview_ctx.lineWidth = thickness_slider.value;
    preview_ctx.strokeStyle = color;
    const x = scale_factorX*event.offsetX;
    const y = scale_factorY*event.offsetY;
    const stroke = {drawMode: DrawMode.Pencil,bounds:{x_min:x,x_max:x,y_min:y,y_max:y}, color:preview_ctx.strokeStyle, coords: [{x,y,thickness:thickness_slider.value},{x,y,thickness:thickness_slider.value}]};
    strokes.push(stroke);
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
    const line_config = strokes[strokes.length-1];
    const b= line_config.bounds;
    b.x_min = Math.min(line_config.coords[0].x,line_config.coords[1].x);
    b.x_max = Math.max(line_config.coords[0].x,line_config.coords[1].x);
    b.y_min = Math.min(line_config.coords[0].y,line_config.coords[1].y);
    b.y_max = Math.max(line_config.coords[0].y,line_config.coords[1].y);
    draw_line(line_config,ctx)
    active = DrawMode.None;
    redoes.length = 0;
    actions.push(strokes[strokes.length-1]);

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
    const stroke = {drawMode: DrawMode.Circle,bounds:{x_min:x,x_max:x,y_min:y,y_max:y},fill_color, color:preview_ctx.strokeStyle,fill:fill_checkbox.checked,thickness:thickness_slider.value, coords: [{x,y},{x,y}]};
    strokes.push(stroke);
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
    const stroke = strokes[strokes.length-1];
    const b = stroke.bounds;

    const x = (stroke.coords[0].x+stroke.coords[1].x)/2;
    const y = (stroke.coords[0].y+stroke.coords[1].y)/2;
    const r= Math.sqrt(Math.pow(stroke.coords[0].x-stroke.coords[1].x,2)+Math.pow(stroke.coords[0].y-stroke.coords[1].y,2))/2;

    b.x_min = x-r;
    b.x_max = x+r;
    b.y_min = y-r;
    b.y_max = y+r;

    draw_circle(stroke,ctx)
    active = DrawMode.None;
    redoes.length = 0;
    actions.push(strokes[strokes.length-1]);
}
function draw_circle(stroke,ctx){
    ctx.lineWidth = stroke.thickness;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.fill_color;
    ctx.beginPath();
    const x = (stroke.coords[0].x+stroke.coords[1].x)/2;
    const y = (stroke.coords[0].y+stroke.coords[1].y)/2;
    const r= Math.sqrt(Math.pow(stroke.coords[0].x-stroke.coords[1].x,2)+Math.pow(stroke.coords[0].y-stroke.coords[1].y,2))/2;
    ctx.arc(x,y,r,0,Math.PI*2);
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

const selection_box = {drawMode:DrawMode.Dashed_Box,x1:0,y1:0,x2:0,y2:0,x3:0,y3:0,x4:0,y4:0};
function init_selection(event){
    const x = event.offsetX*scale_factorX;
    const y = event.offsetY*scale_factorY;
    let id;
    for (let i =strokes.length-1; i >=0; i--) {
        if (strokes[i].bounds.x_min<=x && strokes[i].bounds.x_max>=x && strokes[i].bounds.y_min<=y && strokes[i].bounds.y_max>=y){
            id = i;
            active = DrawMode.Select;
            selection_box.x1 = strokes[i].bounds.x_min;
            selection_box.x2 = strokes[i].bounds.x_min;
            selection_box.x3 = strokes[i].bounds.x_max;
            selection_box.x4 = strokes[i].bounds.x_max;
            selection_box.y1 = strokes[i].bounds.y_min;
            selection_box.y2 = strokes[i].bounds.y_max;
            selection_box.y3 = strokes[i].bounds.y_max;
            selection_box.y4 = strokes[i].bounds.y_min;
            const stroke = strokes.splice(i,1)[0];
            console.log("before");
            console.log(strokes);
            recreate();
            console.log("after");
            console.log(strokes);
            strokes.push(stroke)
            actions.push({drawMode:DrawMode.Select,id,x_shift:0,y_shift:0,a:1,b:0,c:0,d:1});
            preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
            draw(stroke,preview_ctx);
            draw(selection_box,preview_ctx);
            prevPosX = event.offsetX*scale_factorX;
            prevPosY = event.offsetY*scale_factorY;
            break;
        }
    }
}
function move_selection(event){
    actions[actions.length-1].x_shift+=event.movementX*scale_factorX;
    actions[actions.length-1].y_shift+=event.movementY*scale_factorY;
    const stroke = JSON.parse(JSON.stringify(strokes[strokes.length-1]));

    const box = {...selection_box};

    apply_action(actions[actions.length-1],stroke);
    apply_action(actions[actions.length-1],box);

    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    console.log(stroke)
    draw(stroke,preview_ctx);
    draw(box,preview_ctx);

}
function end_selection(event){
    console.log("the end");
    strokes[strokes.length-1].bounds = apply_action(actions[actions.length-1],strokes[strokes.length-1]);
    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    recreate();
    active = DrawMode.None;
}
let prevPosX = 0;
let prevPosY = 0;
function rotate_selection(event){
    const b = strokes[strokes.length-1].bounds;
    const centerX = (b.x_min+b.x_max)/2;
    const centerY = (b.y_min+b.y_max)/2;
    const A = {x:prevPosX-centerX,y:prevPosY-centerY};
    prevPosX = event.offsetX*scale_factorX;
    prevPosY = event.offsetY*scale_factorY;
    const B = {x:prevPosX-centerX,y:prevPosY-centerY};
    const cos = (A.x*B.x+A.y*B.y)/(Math.sqrt(A.x*A.x+A.y*A.y)*Math.sqrt(B.x*B.x+B.y*B.y));
    const sin = Math.sqrt(1-cos*cos)*(A.x*B.y-B.x*A.y>0?1:-1);

    const action = actions[actions.length-1];

    const a = action.a*cos-action.c*sin;
    const bB = action.b*cos-action.d*sin;
    const c = action.a*sin+action.c*cos;
    const d = action.b*sin+action.d*cos;

    action.a = a;
    action.b = bB;
    action.c = c;
    action.d = d;

    const stroke = JSON.parse(JSON.stringify(strokes[strokes.length-1]));
    const box = {...selection_box};

    apply_action(action,stroke);
    apply_action(action,box);

    preview_ctx.clearRect(0,0,preview_canvas.width,preview_canvas.height);
    draw(box,preview_ctx);
    draw(stroke,preview_ctx);
}

function draw(stroke,ctx){
    switch (stroke.drawMode){
        case DrawMode.Pencil:
            draw_pencil(stroke,ctx);
            break;
        case DrawMode.Circle:
            draw_circle(stroke,ctx);
            break;
        case DrawMode.Line:
            draw_line(stroke,ctx);
            break;
        case DrawMode.Square:
            draw_square(stroke,ctx);
            break;
        case DrawMode.Dashed_Box:
            ctx.lineWidth = 10;
            ctx.setLineDash([30,30]);
            ctx.strokeStyle = '#7b69ed';
            ctx.beginPath();
            ctx.moveTo(stroke.x1,stroke.y1);
            ctx.lineTo(stroke.x2,stroke.y2);
            ctx.lineTo(stroke.x3,stroke.y3);
            ctx.lineTo(stroke.x4,stroke.y4);
            ctx.closePath();
            ctx.stroke();
            ctx.moveTo((stroke.x2+stroke.x3)/2,(stroke.y2+stroke.y3)/2);
            ctx.lineTo((stroke.x2-stroke.x1)/10+(stroke.x2+stroke.x3)/2,(stroke.y2-stroke.y1)/10+(stroke.y2+stroke.y3)/2)
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = '#7b69ed';
            ctx.arc((stroke.x2-stroke.x1)/10+(stroke.x2+stroke.x3)/2,(stroke.y2-stroke.y1)/10+(stroke.y2+stroke.y3)/2,R,0,Math.PI*2);
            ctx.closePath();
            ctx.fill()
            break;
    }
}
const R = 60;//radius of the rotation circle
let canvas_left,canvas_top,scale_factorX,scale_factorY;
preview_canvas.addEventListener('click',(e)=>{
    if (currentMode===DrawMode.Select){
        if (active===DrawMode.SelectMove || active===DrawMode.SelectRotate || active===DrawMode.Select){
            end_selection(e);
        }
        else {
            init_selection(e);
        }
    }
})
preview_canvas.addEventListener('pointerdown',(e)=>{
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
        case DrawMode.Select:
            if (active===DrawMode.Select) {
                const box = {...selection_box};
                apply_action(actions[actions.length-1],box);
                const x = e.offsetX*scale_factorX;
                const y = e.offsetY*scale_factorY;
                if (x >= Math.min(box.x1, box.x2, box.x3, box.x4) && x <= Math.max(box.x1, box.x2, box.x3, box.x4) &&
                    y >= Math.min(box.y1, box.y2, box.y3, box.y4) && y <= Math.max(box.y1, box.y2, box.y3, box.y4)) {
                    active = DrawMode.SelectMove;
                }
                else{
                    active = DrawMode.SelectRotate;
                }
            }
            break;

    }
});
preview_canvas.addEventListener('pointermove',(e)=>{
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
        case DrawMode.SelectMove:
            if (e.buttons===1) {
                move_selection(e);
            }
            break;
        case DrawMode.SelectRotate:
            if (e.buttons===1) {
                rotate_selection(e);
            }
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
            break;
        // case DrawMode.SelectMove:
        //     end_selection(e);
        //     break;
        // case DrawMode.SelectRotate:
        //     end_selection(e);
        //     break;
    }
}
preview_canvas.addEventListener('pointerup',(e)=>{
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
            ctx.font = "italic 180px Times New Roman";
            ctx.fillStyle = fill_color;
            ctx.fillText(textbox.value,e.offsetX*scale_factorX,e.offsetY*scale_factorY);
            const stroke = {drawMode:DrawMode.Text,bounds:{x_min:0,x_max:0,y_min:0,y_max:0},text:textbox.value,font:ctx.font,color:ctx.fillStyle,x:e.offsetX*scale_factorX,y:e.offsetY*scale_factorY};
            strokes.push(stroke);
            actions.push(stroke);
            textbox.remove();
        });
        textbox.focus();

    }
    else{
        mouse_up_on_canvas_listener(e);
    }
});
preview_canvas.addEventListener('pointerleave',mouse_up_on_canvas_listener);
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
                draw_pencil(stroke,ctx);
                break;
            case DrawMode.Eraser:
                draw_pencil(stroke,ctx);
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
    if (actions.length>0) {
        const action = actions.pop();
        if (action.drawMode===DrawMode.Select){
            const stroke = strokes.pop();
            const det = (action.a*action.d-action.b*action.c);
            const a = action.d/det;
            const b= -action.b/det;
            const c = -action.c/det;
            const d = action.a/det;
            const CenterX = (stroke.bounds.x_min+stroke.bounds.x_max)/2;
            const CenterY = (stroke.bounds.y_min+stroke.bounds.y_max)/2;
            let x_min = canvas.width;
            let x_max = 0;
            let y_min = canvas.height;
            let y_max = 0;
            switch (stroke.drawMode){
                case DrawMode.Pencil:

                    for (let i = 0; i < stroke.coords.length; i++) {
                        const x = a*(stroke.coords[i].x-CenterX)+b*(stroke.coords[i].y-CenterY) - action.x_shift + CenterX;
                        const y = c*(stroke.coords[i].x-CenterX)+d*(stroke.coords[i].y-CenterY) - action.y_shift + CenterY;

                        stroke.coords[i].x = x;
                        stroke.coords[i].y = y;
                        x_min = Math.min(x,x_min);
                        x_max = Math.max(x_max,x);
                        y_min = Math.min(y,y_min);
                        y_max = Math.max(y,y_max);
                    }
                    stroke.bounds.x_min = x_min;
                    stroke.bounds.x_max = x_max;
                    stroke.bounds.y_min = y_min;
                    stroke.bounds.y_max = y_max;
                    break;
                case DrawMode.Square:

                    const x1 = a*(stroke.x1-CenterX)+b*(stroke.y1-CenterY) - action.x_shift + CenterX;
                    const y1 = c*(stroke.x1-CenterX)+d*(stroke.y1-CenterY) - action.y_shift + CenterY;

                    stroke.x1 = x1;
                    stroke.y1 = y1;
                    x_min = Math.min(x1,x_min);
                    x_max = Math.max(x_max,x1);
                    y_min = Math.min(y1,y_min);
                    y_max = Math.max(y1,y_max);

                    const x2 = a*(stroke.x2-CenterX)+b*(stroke.y2-CenterY) - action.x_shift + CenterX;
                    const y2 = c*(stroke.x2-CenterX)+d*(stroke.y2-CenterY) - action.y_shift + CenterY;

                    stroke.x2 = x2;
                    stroke.y2 = y2;
                    x_min = Math.min(x2,x_min);
                    x_max = Math.max(x_max,x2);
                    y_min = Math.min(y2,y_min);
                    y_max = Math.max(y2,y_max);


                    const x3 = a*(stroke.x3-CenterX)+b*(stroke.y3-CenterY) - action.x_shift + CenterX;
                    const y3 = c*(stroke.x3-CenterX)+d*(stroke.y3-CenterY) - action.y_shift + CenterY;

                    stroke.x3 = x3;
                    stroke.y3 = y3;
                    x_min = Math.min(x3,x_min);
                    x_max = Math.max(x_max,x3);
                    y_min = Math.min(y3,y_min);
                    y_max = Math.max(y3,y_max);


                    const x4 = a*(stroke.x4-CenterX)+b*(stroke.y4-CenterY) - action.x_shift + CenterX;
                    const y4 = c*(stroke.x4-CenterX)+d*(stroke.y4-CenterY) - action.y_shift + CenterY;

                    stroke.x4 = x4;
                    stroke.y4 = y4;
                    x_min = Math.min(x4,x_min);
                    x_max = Math.max(x_max,x4);
                    y_min = Math.min(y4,y_min);
                    y_max = Math.max(y4,y_max);
                    break;
                case DrawMode.Circle:

                    for (let i = 0; i < 2; i++) {
                        const x = a*(stroke.coords[i].x-CenterX)+b*(stroke.coords[i].y-CenterY) - action.x_shift + CenterX;
                        const y = c*(stroke.coords[i].x-CenterX)+d*(stroke.coords[i].y-CenterY) - action.y_shift + CenterY;

                        stroke.coords[i].x = x;
                        stroke.coords[i].y = y;
                     }
                    const x = (stroke.coords[0].x+stroke.coords[1].x)/2;
                    const y = (stroke.coords[0].y+stroke.coords[1].y)/2;
                    const r= Math.sqrt(Math.pow(stroke.coords[0].x-stroke.coords[1].x,2)+Math.pow(stroke.coords[0].y-stroke.coords[1].y,2))/2;

                    x_min = x-r;
                    x_max = x+r;
                    y_min = y-r;
                    y_max = y+r;
                    break;

            }
            stroke.bounds.x_min = x_min;
            stroke.bounds.x_max = x_max;
            stroke.bounds.y_min = y_min;
            stroke.bounds.y_max = y_max;
            strokes.splice(action.id,0,stroke);
        }
        else{
            strokes.pop();
        }
        redoes.push(action);
        recreate();
    }
}
function Redo(){
    if (redoes.length>0) {
        const action = redoes.pop();
        actions.push(action);
        if (action.drawMode===DrawMode.Select){
            const stroke = strokes[action.id];
            const b = apply_action(action,stroke);
            stroke.bounds.x_min = b.x_min;
            stroke.bounds.x_max = b.x_max;
            stroke.bounds.y_min = b.y_min;
            stroke.bounds.y_max = b.y_max;

            strokes.splice(action.id,1);
            strokes.push(stroke);
        }
        else{
            strokes.push(action);
        }
        recreate();
    }
}
//endregion

function apply_action(action,stroke){
    let x_min = canvas.width;
    let x_max = 0;
    let y_min = canvas.height;
    let y_max = 0;
    const CenterX = stroke.drawMode===DrawMode.Dashed_Box?(stroke.x1+stroke.x2+stroke.x3+stroke.x4)/4:(stroke.bounds.x_min+stroke.bounds.x_max)/2 ;
    const CenterY = stroke.drawMode===DrawMode.Dashed_Box?(stroke.y1+stroke.y2+stroke.y3+stroke.y4)/4:(stroke.bounds.y_min+stroke.bounds.y_max)/2;
    switch (stroke.drawMode){
        case DrawMode.Pencil:

            for (let i = 0; i < stroke.coords.length; i++) {
                const x = action.a*(stroke.coords[i].x-CenterX)+action.b*(stroke.coords[i].y-CenterY) + action.x_shift + CenterX;
                const y = action.c*(stroke.coords[i].x-CenterX)+action.d*(stroke.coords[i].y-CenterY) + action.y_shift + CenterY;

                stroke.coords[i].x = x;
                stroke.coords[i].y = y;
                x_min = Math.min(x,x_min);
                x_max = Math.max(x_max,x);
                y_min = Math.min(y,y_min);
                y_max = Math.max(y,y_max);
            }
            stroke.bounds.x_min = x_min;
            stroke.bounds.x_max = x_max;
            stroke.bounds.y_min = y_min;
            stroke.bounds.y_max = y_max;
            break;
        case DrawMode.Square:

            const x1_sq = action.a*(stroke.x1-CenterX)+action.b*(stroke.y1-CenterY) + action.x_shift + CenterX;
            const y1_sq = action.c*(stroke.x1-CenterX)+action.d*(stroke.y1-CenterY) + action.y_shift + CenterY;

            stroke.x1 = x1_sq;
            stroke.y1 = y1_sq;
            x_min = Math.min(x1_sq,x_min);
            x_max = Math.max(x_max,x1_sq);
            y_min = Math.min(y1_sq,y_min);
            y_max = Math.max(y1_sq,y_max);

            const x2_sq = action.a*(stroke.x2-CenterX)+action.b*(stroke.y2-CenterY) + action.x_shift + CenterX;
            const y2_sq = action.c*(stroke.x2-CenterX)+action.d*(stroke.y2-CenterY) + action.y_shift + CenterY;

            stroke.x2 = x2_sq;
            stroke.y2 = y2_sq;
            x_min = Math.min(x2_sq,x_min);
            x_max = Math.max(x_max,x2_sq);
            y_min = Math.min(y2_sq,y_min);
            y_max = Math.max(y2_sq,y_max);

            const x3_sq = action.a*(stroke.x3-CenterX)+action.b*(stroke.y3-CenterY) + action.x_shift + CenterX;
            const y3_sq = action.c*(stroke.x3-CenterX)+action.d*(stroke.y3-CenterY) + action.y_shift + CenterY;

            stroke.x3 = x3_sq;
            stroke.y3 = y3_sq;
            x_min = Math.min(x3_sq,x_min);
            x_max = Math.max(x_max,x3_sq);
            y_min = Math.min(y3_sq,y_min);
            y_max = Math.max(y3_sq,y_max);



            const x4_sq = action.a*(stroke.x4-CenterX)+action.b*(stroke.y4-CenterY) + action.x_shift + CenterX;
            const y4_sq = action.c*(stroke.x4-CenterX)+action.d*(stroke.y4-CenterY) + action.y_shift + CenterY;

            stroke.x4 = x4_sq;
            stroke.y4 = y4_sq;
            x_min = Math.min(x4_sq,x_min);
            x_max = Math.max(x_max,x4_sq);
            y_min = Math.min(y4_sq,y_min);
            y_max = Math.max(y4_sq,y_max);
            break;
        case DrawMode.Circle:

            for (let i = 0; i < 2; i++) {
                const x = action.a*(stroke.coords[i].x-CenterX)+action.b*(stroke.coords[i].y-CenterY) + action.x_shift + CenterX;
                const y = action.c*(stroke.coords[i].x-CenterX)+action.d*(stroke.coords[i].y-CenterY) + action.y_shift + CenterY;

                stroke.coords[i].x = x;
                stroke.coords[i].y = y;
            }
            const x = (stroke.coords[0].x+stroke.coords[1].x)/2;
            const y = (stroke.coords[0].y+stroke.coords[1].y)/2;
            const r= Math.sqrt(Math.pow(stroke.coords[0].x-stroke.coords[1].x,2)+Math.pow(stroke.coords[0].y-stroke.coords[1].y,2))/2;

            x_min = x-r;
            x_max = x+r;
            y_min = y-r;
            y_max = y+r;
            break;
        case DrawMode.Dashed_Box:

            const x1 = action.a*(stroke.x1-CenterX)+action.b*(stroke.y1-CenterY) + action.x_shift + CenterX;
            const y1 = action.c*(stroke.x1-CenterX)+action.d*(stroke.y1-CenterY) + action.y_shift + CenterY;

            stroke.x1 = x1;
            stroke.y1 = y1;

            const x2 = action.a*(stroke.x2-CenterX)+action.b*(stroke.y2-CenterY) + action.x_shift + CenterX;
            const y2 = action.c*(stroke.x2-CenterX)+action.d*(stroke.y2-CenterY) + action.y_shift + CenterY;

            stroke.x2 = x2;
            stroke.y2 = y2;


            const x3 = action.a*(stroke.x3-CenterX)+action.b*(stroke.y3-CenterY) + action.x_shift + CenterX;
            const y3 = action.c*(stroke.x3-CenterX)+action.d*(stroke.y3-CenterY) + action.y_shift + CenterY;

            stroke.x3 = x3;
            stroke.y3 = y3;

            const x4 = action.a*(stroke.x4-CenterX)+action.b*(stroke.y4-CenterY) + action.x_shift + CenterX;
            const y4 = action.c*(stroke.x4-CenterX)+action.d*(stroke.y4-CenterY) + action.y_shift + CenterY;

            stroke.x4 = x4;
            stroke.y4 = y4;
            break;
        case DrawMode.Text:

            break;
    }
    return {x_min,x_max,y_min,y_max}
}