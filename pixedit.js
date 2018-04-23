// params:
//   container:     the element to place the editor in
//   width, height: the size of the image
//   scale:         the width (in pixels) of each pixel
//   modlimit:      the number of modifed pixels allowed
PixEditor = function(PARAMS) {

var $$ = {};

var canvas = $('<canvas>').attr('style',  'border: 1px solid black')
                          .attr('width', PARAMS.width * PARAMS.scale)
                          .attr('height', PARAMS.height * PARAMS.scale)
                          [0];
var cx = canvas.getContext('2d');
cx.fillStyle = '#000000';

var touched = $('<canvas>').attr('width', PARAMS.width)
                           .attr('height', PARAMS.height)
                           [0];
var touchcx = touched.getContext('2d');
touchcx.fillStyle = '#000000';

var modscounter = $('<div>').text("0/" + PARAMS.modlimit);
var mods = 0;


var putpixel = function(x,y) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= PARAMS.width || y >= PARAMS.height) return;

  var toucheddata = touchcx.getImageData(x,y,1,1).data;
  if (toucheddata[3] == 0) {
    if (mods < PARAMS.modlimit) {
      mods++;
      modscounter.text(mods + "/" + PARAMS.modlimit);
    }
    else {
      return;
    }
    touchcx.fillRect(x, y, 1, 1);
  }
  cx.fillRect(x*PARAMS.scale, y*PARAMS.scale, PARAMS.scale, PARAMS.scale);
};

var findPos = function(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return { x: curleft, y: curtop };
  }
  return undefined;
};

// These are in image coordiantes:
var lastmousex = 0;
var lastmousey = 0;
var lastdown = false;

var handlegeneral = function(x, y, button) {
  if (!button) { lastdown = false; return; }
  var canvasPos = findPos(canvas);

  var newx = Math.floor((x - canvasPos.x)/PARAMS.scale);
  var newy = Math.floor((y - canvasPos.y)/PARAMS.scale);
  if (lastdown) {
    var veclen = Math.sqrt(
        (newx-lastmousex)*(newx-lastmousex)
       +(newy-lastmousey)*(newy-lastmousey));
    var vx = (newx-lastmousex)/veclen;
    var vy = (newy-lastmousey)/veclen;
    
    for (var t = 0; t <= veclen; t++) {
      putpixel(vx*t + lastmousex, vy*t + lastmousey);
    }
  }
  else {
    putpixel(newx, newy);
  }
  lastdown = true;
  lastmousex = newx;
  lastmousey = newy;
  return true;
};

var handlemouse = function(e) {
  return handlegeneral(e.pageX, e.pageY, e.buttons);
};

var handlescroll = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

var handletouch = function(e) {
  handlescroll(e);
  return handlegeneral(e.touches[0].pageX, e.touches[0].pageY, true);
};

var palette = $('<div>');
var paletteColors = [ 
  "#000000",
  "#0000ff",
  "#00ff00",
  "#00ffff",
  "#ff0000",
  "#ff00ff",
  "#ffff00",
  "#ffffff" ];
for (var i = 0; i < paletteColors.length; i++) {
  (function() {
    var color = paletteColors[i];
    var entry = $('<span>').css('display', 'inline-block')
                           .css('width', '50px')
                           .css('height', '50px')
                           .css('border', '1px solid black')
                           .css('background-color', color);
    entry.click(function(e) {
      cx.fillStyle = color;
    });
    palette.append(entry);
  })();
}

canvas.addEventListener('mousedown', handlemouse);
canvas.addEventListener('mousemove', handlemouse);
canvas.addEventListener('mouseup', handlemouse);
canvas.addEventListener('touchstart', handletouch);
canvas.addEventListener('touchmove', handletouch);
canvas.addEventListener('scroll', handlescroll);

PARAMS.container.appendChild(canvas);
PARAMS.container.appendChild(modscounter[0]);
PARAMS.container.appendChild(palette[0]);

return $$;
};
