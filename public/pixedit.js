// params:
//   container:     the element to place the editor in
//   width, height: the size of the image
//   scale:         the width (in pixels) of each pixel
//   modlimit:      the number of modifed pixels allowed
//   base:          an image to start from (optional)
//   callback:      what to do when the "done" button is pressed
//   title:         the title of the editor (what image is being edited)
PixEditor = function(PARAMS) {

var $$ = {};

var canvas = $('<canvas>').addClass('mainCanvas')
                          .attr('width', PARAMS.width * PARAMS.scale)
                          .attr('height', PARAMS.height * PARAMS.scale)
                          [0];
var cx = canvas.getContext('2d');
cx.fillStyle = '#000000';


var baseimg = null;
var baseimg_loaded = false;
if (typeof(PARAMS.base) === 'string') {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function() { 
    var url = URL.createObjectURL(xhr.response);
    window.open(url);
    baseimg = $('<img>')[0];
    baseimg.onload = function() { 
      baseimg_loaded = true;
      reset();
    };
    $(baseimg).attr('src', url);
  };
  xhr.open('GET', PARAMS.base);
  xhr.send();
}
else if (PARAMS.base) {
  baseimg_loaded = true;
  baseimg = PARAMS.base;
}
else {
  baseimg_loaded = false;
}



var touched = new Int8Array(PARAMS.width * PARAMS.height);

var modscounter = $('<span>').addClass('modsCounter');
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

  for (var i = 0; i < touched.length; i++) {
    touched[i] = 0;
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
  if (cx.fillStyle == 'rgba(0, 0, 0, 0)') {
    cx.clearRect(x*PARAMS.scale, y*PARAMS.scale, PARAMS.scale, PARAMS.scale);
  }
  else {
    cx.fillRect(x*PARAMS.scale, y*PARAMS.scale, PARAMS.scale, PARAMS.scale);
  }
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

var palette = $('<div>').addClass('palette');
var paletteColors = [ 
  // Crayola 24 color pack
  "rgba(0, 0, 0, 0)", // transparent
  "#fce883",  // yellow
  "#1f75fe",  // blue
  "#b4674d",  // brown
  "#ff7538",  // orange
  "#1cac78",  // green
  "#926eae",  // violet
  "#232323",  // black
  "#ee204d",  // red
  //"#ffaacc",  // carnation pink
  "#ffb653",  // yellow orange
  "#199ebd",  // blue green
  "#888800",  // red violet
  "#c0448f",  // red orange
  "#c5e384",  // yellow green
  "#7366bd",  // blue violet
  "#ededed",  // white
  "#f75394",  // violet red
  "#fddb6d",  // dandelion
  "#1dacd6",  // cerulean
  "#fdd9b5",  // apricot
  "#fc2847",  // scarlet
  "#f0e891",  // green yellow
  "#5d76cb",  // indigo
  "#95918c"   // gray
  ];
var selectedColor = null;
for (var i = 0; i < paletteColors.length; i++) {
  (function() {
    var color = paletteColors[i];
    var entry = $('<span>').addClass('paletteColor')
                           .css('background-color', color);
    if (color == "#232323") {  // start with black
      selectedColor = entry;
    }
    entry.click(function(e) {
      cx.fillStyle = color;
      selectedColor.removeClass('selected');
      entry.addClass('selected');
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

$(PARAMS.container).append($('<div>').addClass('topBar').append(
  $('<span>').addClass('resetButton').append(
    $('<button>').text("Reset")
                 .click(reset)),
  $('<span>').addClass('elementTitle').text(PARAMS.title),
  $('<span>').append(
    modscounter),
  $('<span>').addClass('doneButton').append(
    $('<button>').text("Done")
                 .click(function() { if (PARAMS.callback) PARAMS.callback(); }))));
PARAMS.container.appendChild(canvas);
PARAMS.container.appendChild($('<div>').append(
  palette)[0]);

$$.toGif = function() {
  return new Promise(function(cb) {
    var gif = new GIF({ 
      workers: 2,
      quality: 10,
      transparent: 'rgba(0,0,0,0)',
      width: PARAMS.width,
      height: PARAMS.height,
      workerScript: 'site/gif.worker.js'   // TODO: yuck factor this out
    });
    
    var canvas = $('<canvas>').attr('width', PARAMS.width)
                              .attr('height', PARAMS.height)[0];
    var renderCx = canvas.getContext('2d');

    for (var y = 0; y < PARAMS.height; y++) {
      for (var x = 0; x < PARAMS.width; x++) {
        var imgdata = cx.getImageData(PARAMS.scale*x, PARAMS.scale*y, 1, 1).data;
        var color = rgbaToHex(imgdata[0], imgdata[1], imgdata[2], imgdata[3]);
        renderCx.fillStyle = 'rgba(' + imgdata.join(',') + ')';
        renderCx.fillRect(x,y,1,1);
      }
    }
    setTimeout(function() {
      gif.addFrame(canvas);
      
      gif.on('finished', cb);
      gif.render();
    }, 1000);
  });
};

var rgbaToHex = function(r,g,b,a) {
  return "#" + ("00000000" + ((r << 24) | (g << 16) | (b << 8) | a).toString(16)).slice(-8);
};

return $$;
};
