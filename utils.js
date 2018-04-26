// params:
//   (none)
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

$$.renderElement = function(elementName) {
  return $('<span>').text(elementName);
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
