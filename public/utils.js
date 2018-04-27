// params:
//   firestore: firestore database
//   storage:   google cloud storage database
Utils = function(PARAMS) {

var $$ = {};

$$.computeLeader = function(data) {
  var best = null;
  var bestScore = 0;
  for (var i in data.results) {
    if (data.results[i] > bestScore) {
      bestScore = data.results[i];
      best = i;
    }
    else if (data.results[i] == bestScore) {
      best = null;  // If there is a tie, there is no leader
    }
  }
  if (bestScore >= 3) {
    return best;
  }
  else {
    return null;
  }
};

var imageCache = {};

$$.getImage = function(element) {
  // This function is very tricky, because we need to handle the case when
  // two getImage calls happen right next to each other.  In this case, we
  // return the *same* promise for both of them, so that when the image is
  // finally fetched, they both get triggered.
  // However, we subscribe to updates, so we have a *mutable* cacheEntry
  // within the per-element promise that is created, and that is what is
  // updated, so that future calls to getImage will get the updated image.
  // (We don't bother making the <img> tags that are created dynamically 
  // update).
  
  if (element in imageCache) {
    return imageCache[element];
  }
  
  return imageCache[element] = new Promise(function(cb) {
    var callbackOnce = function(x) {
      if (cb) {
        var tempcb = cb;
        // We signal it this way so that we don't keep a continuation
        // reference and it can be garbage collected;
        cb = null;
        return tempcb(x);
      }
    };

    var cacheEntry = { };

    PARAMS.firestore.collection("elements").doc(element).onSnapshot(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        imgname = data.imgname;
        var ref = PARAMS.storage.ref('elements').child(element).child(imgname);
        ref.getDownloadURL().then(function(url) {
          cacheEntry.url = url;
          cacheEntry.ordinal = data.ordinal;
          callbackOnce(cacheEntry);
        });
      }
      else {
        callbackOnce(cacheEntry);
      }
    });
  });
};


$$.putImage = function(element, blob, ordinal) {
  var id = Math.floor(1e6*Math.random());
  var imgname = ordinal + "_" + id + ".gif";
  var ref = PARAMS.storage.ref('elements').child(element).child(imgname);
  return ref.put(blob, { contentType: 'image/gif' }).then(function() { 
    var docref = PARAMS.firestore.collection("elements").doc(element);
    docref.set({ imgname: imgname, ordinal: ordinal });
  });
};

$$.renderElement = function(elementName) {
  var imgtag = $('<img>');
  var ret = $('<span>').addClass('element')
                       .append(imgtag)
                       .append($('<br/>'))
                       .append($('<span>').text(elementName));
  $$.getImage(elementName).then(function(img) {
    if (img.url) {
      imgtag.attr('src', img.url);
    }
  });
  return ret;
};

$$.delay = function(msec) {
  return new Promise(function(cb) {
    setTimeout(cb, msec);
  });
};

// Merges two promises -- runs them in parallel; when they both finish, contains
// as its result the array [result1,result2].
$$.merge = function(promise1, promise2) {
  return new Promise(function(cb) {
    var p1cb;
    var p2cb;

    p1cb = function(x) { p2cb = function(y) { cb([x,y]) } };
    p2cb = function(y) { p1cb = function(x) { cb([x,y]) } };

    promise1.then(function(x) { p1cb(x) } );
    promise2.then(function(y) { p2cb(y) } );
  });
};

// Pads a promise so that it takes at least `msec` milliseconds to execute.
$$.timePad = function(msec, promise) {
  return $$.merge($$.delay(msec), promise).then(function(args) {
    return args[1];
  });
};

$$.pure = function(x) {
  return new Promise(function(cb) { cb(x) });
};

return $$;

};
