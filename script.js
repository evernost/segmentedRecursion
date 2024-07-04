const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let isDraggingLeft = false;
let isDraggingRight = false;

let plotRange = {xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2};
let gridMinor = {x: .25, y: .25};

let segments = 
[
    {xStart: 0, yStart: 0, xEnd: 350, yEnd: 100, xMid: 0, yMid: 0, slope: 0.0, dragStart: false, dragEnd: false, dragMid: false},
    {xStart: 0, yStart: 0, xEnd: 350, yEnd: 100, xMid: 0, yMid: 0, slope: 0.0, dragStart: false, dragEnd: false, dragMid: false},
    {xStart: 0, yStart: 0, xEnd: 350, yEnd: 100, xMid: 0, yMid: 0, slope: 0.0, dragStart: false, dragEnd: false, dragMid: false},
    {xStart: 0, yStart: 0, xEnd: 350, yEnd: 100, xMid: 0, yMid: 0, slope: 0.0, dragStart: false, dragEnd: false, dragMid: false}
    
];

let startPoint = {x: 500, y: 300, drag: false};


/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) 
{
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}


function getX(x)
{
    return (canvas.width*(x-plotRange.xMin)/(plotRange.xMax-plotRange.xMin));
}

function getY(y)
{
    return (-canvas.height*(y-plotRange.yMax)/(plotRange.yMax-plotRange.yMin));
}


function invGetX(pixelX)
{
    return (((plotRange.xMax-plotRange.xMin)*pixelX/canvas.width) + plotRange.xMin);
}

function invGetY(pixelY)
{
    return ((-(plotRange.yMax-plotRange.yMin)*pixelY/canvas.height) + plotRange.yMax);
}



function grid()
{
    let x = gridMinor.x
    while(x <= plotRange.xMax)
    {
        drawLine(getX(x), 0, getX(x), canvas.height, true);
        x += gridMinor.x;
    }
    x = -gridMinor.x
    while(x >= plotRange.xMin)
    {
        drawLine(getX(x), 0, getX(x), canvas.height, true);
        x -= gridMinor.x;
    }

    let y = gridMinor.y
    while(y <= plotRange.yMax)
    {
        drawLine(0, getY(y), canvas.width, getY(y), true);
        y += gridMinor.y;
    }
    y = -gridMinor.y
    while(y >= plotRange.yMin)
    {
        drawLine(0, getY(y), canvas.width, getY(y), true);
        y -= gridMinor.y;
    }

    // x axis
    drawLine(0, getY(0.0), canvas.width, getY(0.0));
    
    // y axis
    drawLine(getX(0.0), 0, getX(0.0), canvas.height);



}


function drawLine(x1, y1, x2, y2, dashed = false, rgbColor = {r: 0, g: 0, b: 0}) 
{
    ctx.strokeStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
    if (dashed)
    {
        ctx.setLineDash([5, 3]);
    }
    else
    {
        ctx.setLineDash([]);
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}


function drawDot(x,y,radius)
{
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
}

function recurFunc(x)
{
    let index;
    if (x < -1.0)
    {
        return 0.0;
    }
    else if ((x >= -1.0) && (x < -0.5))
    {
        index = 0;
    }
    else if ((x >= -0.5) && (x < 0.0))
    {
        index = 1;
    }
    else if ((x >= 0.0) && (x < 0.5))
    {
        index = 2;
    }
    else if ((x >= 0.5) && (x < 1.0))
    {
        index = 3;
    }
    else
    {
        return 0.0;
    }
    
    let y = ((segments[index].yEnd-segments[index].yStart)*(getX(x)-segments[index].xStart)/(segments[index].xEnd-segments[index].xStart));
    y += segments[index].yStart;
    return invGetY(y);
}

function isWithinRange(x0, y0, x, y, range = 20) 
{
    return ((Math.abs(x - x0) <= range) && (Math.abs(y - y0) <= range));
}

// React to a click
// Detect if it happened next to the line's end
canvas.addEventListener('mousedown', (e) => 
{
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    for (let i = 0; i < 4; i++)
    {
        segments[i].dragStart = isWithinRange(mouseX, mouseY, segments[i].xStart, segments[i].yStart);
        segments[i].dragEnd   = isWithinRange(mouseX, mouseY, segments[i].xEnd, segments[i].yEnd);
        segments[i].dragMid   = isWithinRange(mouseX, mouseY, segments[i].xMid, segments[i].yMid);
    }

    startPoint.drag = isWithinRange(mouseX, mouseY, startPoint.x, startPoint.y);
});

canvas.addEventListener('mousemove', (e) => 
{
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;
    let needUpdate = false;

    for (let i = 0; i < 4; i++)
    {
        if (segments[i].dragStart)
        {
            segments[i].yStart = mouseY;
            segments[i].yMid = (segments[i].yStart + segments[i].yEnd)/2;
            needUpdate = true;
        }

        if (segments[i].dragEnd)
        {
            segments[i].yEnd = mouseY;
            segments[i].yMid = (segments[i].yStart + segments[i].yEnd)/2;
            needUpdate = true;
        }

        if (segments[i].dragMid)
        {
            segments[i].yStart += (mouseY - segments[i].yMid);
            segments[i].yEnd += (mouseY - segments[i].yMid);
            segments[i].yMid = mouseY;
            needUpdate = true;
        }
    }

    if (startPoint.drag)
    {
        startPoint.x = mouseX;
        needUpdate = true;
    }

    if (needUpdate)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 4; i++)
        {
            drawLine(segments[i].xStart, segments[i].yStart, segments[i].xEnd, segments[i].yEnd);
        }

        grid();
        drawDot(startPoint.x, startPoint.y, 5);

        let x0 = invGetX(startPoint.x);
        let x1 = recurFunc(x0);
        drawLine(getX(x0), getY(0.0), getX(x0), getY(x1), false, HSVtoRGB(0.0/100.0, 0.88, 0.89));
        drawLine(getX(x0), getY(x1), getX(x1), getY(x1), false, HSVtoRGB(0.0/100.0, 0.88, 0.89));

        for (let i = 1; i < 100; i++)
        {
            x0 = x1;
            x1 = recurFunc(x0);
            drawLine(getX(x0), getY(x0), getX(x0), getY(x1), false, HSVtoRGB(i/100.0, 0.88, 0.89));
            drawLine(getX(x0), getY(x1), getX(x1), getY(x1), false, HSVtoRGB(i/100.0, 0.88, 0.89));
        }
        needUpdate = false;
    }



    
});

canvas.addEventListener('mouseup', () => 
{
    for (let i = 0; i < 4; i++)
    {
        segments[i].dragStart = false;
        segments[i].dragEnd = false;
        segments[i].dragMid = false;
    }
    startPoint.drag = false;
});




let e = 0.1;
for (let i = 0; i < 4; i++)
{
    let x = -1.0 + i*0.5; 
    segments[i].xStart = getX(x); segments[i].xEnd = getX(x+0.5);
    segments[i].yStart = getY(x + e); segments[i].yEnd = getY(x + 0.5 + e);
    segments[i].xMid = (segments[i].xStart + segments[i].xEnd)/2;
    segments[i].yMid = (segments[i].yStart + segments[i].yEnd)/2;
    
    drawLine(segments[i].xStart, segments[i].yStart, segments[i].xEnd, segments[i].yEnd);
    
    e = -e;
}


drawDot(startPoint.x, startPoint.y, 5);

grid();