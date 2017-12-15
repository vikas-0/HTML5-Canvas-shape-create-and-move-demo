const height = window.innerHeight;
const width = window.innerWidth;

const painting_area = document.getElementById('painting_area');

//Set height and width of canvas
painting_area.height = (height * 0.8) - (document.getElementById('title').offsetHeight * 2);
painting_area.width = width * 0.8;


//returns random colour
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



function triangle_area(x1, y1, x2, y2, x3, y3) {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
}

function Triangle(startX, startY, width, height, color) {
    this.startX = startX;
    this.startY = startY;
    this.w = width;
    this.h = height;
    this.color = color;
}

Triangle.prototype.draw = function (ctx) {
    const endX = this.startX + this.w;
    const endY = this.startY + this.h;
    ctx.beginPath();
    ctx.moveTo(this.startX, endY);
    ctx.lineTo((this.startX + endX) / 2, this.startY);
    ctx.lineTo(endX, endY);
    ctx.fillStyle = this.color;
    ctx.fill();
}

Triangle.prototype.contains = function (x, y) {
    const endX = this.startX + this.w;
    const endY = this.startY + this.h;
    const x1 = this.startX, y1 = endY, x2 = (this.startX + endX) / 2, y2 = this.startY,
        x3 = endX, y3 = endY;
    const A = triangle_area(x1, y1, x2, y2, x3, y3);
    const A1 = triangle_area(x, y, x2, y2, x3, y3);
    const A2 = triangle_area(x1, y1, x, y, x3, y3);
    const A3 = triangle_area(x1, y1, x2, y2, x, y);
    return (A === A1 + A2 + A3);
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    let stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }
    const html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;


    this.valid = false; // when set to false, the canvas will redraw everything
    this.triangles = [];  // the collection of things to be drawn
    this.dragging = false; // Keep track of when we are dragging
    this.selection = null;

    //initializing new triangle
    this.newTrianlge = false;
    this.color = null;
    this.constructing = null;


    const myState = this;

    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function (e) { e.preventDefault(); return false; }, false);


    canvas.addEventListener('mousedown', function (e) {
        let mouse = myState.getMouse(e);
        let mx = mouse.x;
        let my = mouse.y;
        let triangles = myState.triangles;
        let l = triangles.length;
        for (let i = l - 1; i >= 0; i--) {
            if (triangles[i].contains(mx, my)) {
                let mySel = triangles[i];
                myState.dragging = true;
                myState.selection = mySel;
                myState.valid = false;
                return;
            }
        }
        if (myState.selection) {
            myState.selection = null;
            myState.valid = false; // Need to clear the old selection border
        }

        myState.newTrianlge = true;
        myState.color = getRandomColor();
        myState.addTriangle(new Triangle(mx, my, 0, 0, myState.color));
        myState.constructing = myState.triangles[myState.triangles.length - 1];

    }, true);
    canvas.addEventListener('mousemove', function (e) {
        const mouse = myState.getMouse(e);
        if (myState.dragging) {
            myState.selection.startX = mouse.x;
            myState.selection.startY = mouse.y;
            myState.valid = false; // Something's dragging so we must redraw
        }
        else if (myState.newTrianlge) {
            myState.constructing.w = mouse.x - myState.constructing.startX;
            myState.constructing.h = mouse.y - myState.constructing.startY;
            myState.valid = false

        }
    }, true);
    canvas.addEventListener('mouseup', function (e) {
        myState.dragging = false;
        myState.newTrianlge = false;
        myState.selection = null;
        if (myState.triangles[myState.triangles.length - 1].w === 0 || myState.triangles[myState.triangles.length - 1].h === 0) {
            myState.triangles.pop();
        }
        myState.valid =false;
    }, true);
    // double click for deleting trinagles
    canvas.addEventListener('dblclick', function (e) {
        let mouse = myState.getMouse(e);
        let mx = mouse.x;
        let my = mouse.y;
        myState.triangles = myState.triangles.filter(triangle => {
            return !triangle.contains(mx, my);
        });
    }, true);

    this.interval = 30;
    setInterval(function () { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addTriangle = function (triangle) {
    this.triangles.push(triangle);
    this.valid = false;
}

CanvasState.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function () {
    // if our state is invalid, redraw and validate!
    if (!this.valid) {
        let ctx = this.ctx;
        let triangles = this.triangles;
        this.clear();


        // draw all triangles
        triangles.map(triangle => triangle.draw(ctx));
        // draw selection
        if (this.selection != null) {
            var mySel = this.selection;
            new Triangle(mySel.startX, mySel.startY, mySel.w, mySel.h, 'rgba(0,255,0,.6)').draw(ctx);
        }
        this.valid = true;
    }
}


CanvasState.prototype.getMouse = function (e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

    // Compute the total offset
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    // We return a simple javascript object (a hash) with x and y defined
    return { x: mx, y: my };
}


function init() {
    const painting_area = document.getElementById('painting_area');

    //Set height and width of canvas
    painting_area.height = (height * 0.8) - (document.getElementById('title').offsetHeight * 2);
    painting_area.width = width * 0.8;
    const s = new CanvasState(painting_area);
    document.getElementById('reset_button').addEventListener('click', function () {
        s.clear();
    }, true);
}
init();