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

var touched = new Int8Array(PARAMS.width * PARAMS.height);

var modscounter = $('<span>').css('font-size', '30px')
                             .css('font-family', 'monospace')
                             .text("0/" + PARAMS.modlimit);
var mods = 0;


var putpixel = function(x,y) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= PARAMS.width || y >= PARAMS.height) return;

  if (touched[PARAMS.width*x + y] == 0) {
    if (mods < PARAMS.modlimit) {
      mods++;
      modscounter.text(mods + "/" + PARAMS.modlimit);
    }
    else {
      return;
    }
    touched[PARAMS.width*x + y] = 1;
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
  if (e.touches.length > 0) {
    return handlegeneral(e.touches[0].pageX, e.touches[0].pageY, true);
  }
  else {
    return handlegeneral(0, 0, false);
  }
};

var palette = $('<span>');
var paletteColors = [ 
  "#000000",
  "#0000ff",
  "#00ff00",
  "#00ffff",
  "#ff0000",
  "#ff00ff",
  "#ffff00",
  "#ffffff" ];
var selectedColor = null;
for (var i = 0; i < paletteColors.length; i++) {
  (function() {
    var color = paletteColors[i];
    var entry = $('<span>').css('display', 'inline-block')
                           .css('width', '50px')
                           .css('height', '50px')
                           .css('border', '1px solid black')
                           .css('margin', '5px')
                           .css('background-color', color);
    if (selectedColor == null) { selectedColor = entry; }
    entry.click(function(e) {
      cx.fillStyle = color;
      selectedColor.css('border', '1px solid black');
      selectedColor.css('margin', '5px');
      entry.css('border', '6px groove');
      entry.css('margin', '0px');
      selectedColor = entry;
    });
    palette.append(entry);
  })();
}
selectedColor.click();

canvas.addEventListener('mousedown', handlemouse);
canvas.addEventListener('mousemove', handlemouse);
canvas.addEventListener('mouseup', handlemouse);
canvas.addEventListener('touchstart', handletouch);
canvas.addEventListener('touchmove', handletouch);
canvas.addEventListener('touchend', handletouch);
canvas.addEventListener('scroll', handlescroll);

PARAMS.container.appendChild(canvas);
PARAMS.container.appendChild($('<div>').append(
  palette,
  modscounter)[0]);

$$.toArray = function() {
  var data = Array(PARAMS.height * PARAMS.width * 4);
  for (var y = 0; y < PARAMS.height; y++) {
    for (var x = 0; x < PARAMS.width; x++) {
      var imgdata = cx.getImageData(PARAMS.scale*x,PARAMS.scale*y,1,1);
      var ix = 4*(PARAMS.width*y + x);
      data[ix + 0] = imgdata.data[0];
      data[ix + 1] = imgdata.data[1];
      data[ix + 2] = imgdata.data[2];
      data[ix + 3] = imgdata.data[3];
    }
  }
  return data;
};

var rgbaToHex = function(r,g,b,a) {
  return "#" + ("00000000" + ((r << 24) | (g << 16) | (b << 8) | a).toString(16)).slice(-8);
};

$$.loadArray = function(data) {
  var localcx = canvas.getContext('2d');
  localcx.clearRect(0, 0, canvas.width, canvas.height);
  for (var y = 0; y < PARAMS.height; y++) {
    for (var x = 0; x < PARAMS.width; x++) {
      var ix = 4*(PARAMS.width*y + x);
      localcx.fillStyle = rgbaToHex(data[ix+0], data[ix+1], data[ix+2], data[ix+3]);
      localcx.fillRect(x*PARAMS.scale, y*PARAMS.scale, PARAMS.scale, PARAMS.scale);
    }
  }
};

return $$;
};
