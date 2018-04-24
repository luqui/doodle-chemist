// params:
//   container:     the element to place the editor in
//   width, height: the size of the image
//   scale:         the width (in pixels) of each pixel
//   modlimit:      the number of modifed pixels allowed
//   base:          an image to start from (optional)
//   callback:      what to do when the "done" button is pressed
PixEditor = function(PARAMS) {

var $$ = {};

var canvas = $('<canvas>').attr('style',  'border: 1px solid black')
                          .attr('width', PARAMS.width * PARAMS.scale)
                          .attr('height', PARAMS.height * PARAMS.scale)
                          [0];
var cx = canvas.getContext('2d');
cx.fillStyle = '#000000';


var baseimg = null;
var baseimg_loaded = false;
if (PARAMS.base !== undefined) {
  if (typeof(PARAMS.base) === 'string') {
    baseimg = $('<img>').attr('src', PARAMS.base)
                        [0];
    baseimg.onload = function() { baseimg_loaded = true; reset() };
  }
}
else if (PARAMS.base) {
  baseimg_loaded = true;
  baseimg = PARAMS.base;
}
else {
  baseimg_loaded = false;
}



var touched = new Int8Array(PARAMS.width * PARAMS.height);

var modscounter = $('<span>').css('font-size', '30px')
                             .css('font-family', 'monospace');
var mods;


var reset = function() {
  mods = 0;
  modscounter.text("0/" + PARAMS.modlimit);
  if (!baseimg) {
    cx.clearRect(0,0,canvas.width,canvas.height);
    return;
  }

  if (baseimg_loaded) {
    var scalex = canvas.width/baseimg.width;
    var scaley = canvas.height/baseimg.height;
    cx.scale(scalex, scaley);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(baseimg, 0, 0);
    cx.scale(1/scalex, 1/scaley);
  }
};

reset();



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
  return handlegeneral(e.pageX, e.pageY, e.which);
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
  "#000088",
  "#0000ff",
  "#008800",
  "#008888",
  "#0088ff",
  "#00ff00",
  "#00ff88",
  "#00ffff",
  "#880000",
  "#880088",
  "#8800ff",
  "#888800",
  "#888888",
  "#8888ff",
  "#88ff00",
  "#88ff88",
  "#88ffff",
  "#ff0000",
  "#ff0088",
  "#ff00ff",
  "#ff8800",
  "#ff8888",
  "#ff88ff",
  "#ffff00",
  "#ffff88",
  "#ffffff"
  ];
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
PARAMS.container.appendChild($('<button>').text("Reset")
                                          .click(reset)
                                          [0]);
PARAMS.container.appendChild($('<button>').text("Done")
                                          .click(function() { if (PARAMS.callback) PARAMS.callback(); })
                                          [0]);

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
  var prevFillStyle = cx.fillStyle;
  cx.clearRect(0, 0, canvas.width, canvas.height);
  for (var y = 0; y < PARAMS.height; y++) {
    for (var x = 0; x < PARAMS.width; x++) {
      var ix = 4*(PARAMS.width*y + x);
      cx.fillStyle = rgbaToHex(data[ix+0], data[ix+1], data[ix+2], data[ix+3]);
      cx.fillRect(x*PARAMS.scale, y*PARAMS.scale, PARAMS.scale, PARAMS.scale);
    }
  }
  cx.fillStyle = prevFillStyle;
};

return $$;
};
