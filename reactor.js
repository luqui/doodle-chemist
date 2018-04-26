// params:
//   container: the element to insert the reactor into
//   database: the firestore database handle
Reactor = function(PARAMS) {

var frame = $('<div>');
PARAMS.container.appendChild(frame[0]);

var renderElement = function(elementName) {
  return $('<span>').text(elementName);
};

var computeLeader = function(data) {
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

var submitReaction = function(reactionName, proposed, resultBox) {
  proposed = proposed.toLowerCase()
                     .replace(/^\s+/, '')
                     .replace(/\s+$/, '')
                     .replace(/\s+/, ' ');
  if (!proposed.match(/^[a-z0-9 ]+$/)) {
    resultBox.append($('<span>').text('Invalid element name'));
    return;
  }

  var docref = PARAMS.database.collection("reactions").doc(reactionName);
  return db.runTransaction(function(transaction) {
    return transaction.get(docref)
      .then(function(q) {
        var data = q.data();
        if (!(proposed in data.results)) {
          data.results[proposed] = 1;
        }
        else {
          data.results[proposed]++;
        }
        data.demand--;
        transaction.set(docref, data);

        return computeLeader(data);
      });
  }).then(function(leader) {
    if (proposed == leader) {
      resultBox.append($('<span>').text('Yes!'));
    }
    else {
      resultBox.append($('<span>').text('No!'));
    }
  });
};

var skipReaction = function(reactionName) {
  var docref = PARAMS.database.collection("reactions").doc(reactionName);
  return db.runTransaction(function(transaction) {
    return transaction.get(docref)
      .then(function(q) {
        demand = q.data().demand;
        transaction.update(docref, { demand: demand-1 });
      });
  });
};

// Pads a promise so that it takes at least `msec` milliseconds to execute.
var timePad = function(msec, promise) {
  return new Promise(function(cb) {
    var promisecb;
    var timecb;
  
    promisecb = function(x) {
      timecb = function() { cb(x); }
    };
    timecb = function() {
      promisecb = cb;
    };

    // Cannot eta-contract these functions because they are mutated.
    setTimeout(function() { timecb(); }, msec);
    promise.then(function(x) { promisecb(x); });
  });
};

var $$ = {};

$$.getReaction = function() {
  PARAMS.database.collection("reactions").orderBy("demand", "desc").limit(10).get()
    .then(function(docs) {
      frame.empty();
      if (docs.empty) {
        frame.append($('<span>').text('No reactions (it must be the beginning of the universe)'),
                     $('<button>').text('Check again').click(function() { $$.getReaction(); }));
        return;
      }

      var which = Math.floor(Math.random()*docs.size);

      var doc  = docs.docs[which];
      var reagents = doc.id.split(':');
      var proposedBox = $('<input>').attr('type', 'text');
      var resultBox = $('<div>');

      frame.append(renderElement(reagents[0]), 
                   $('<span>').text('+'),
                   renderElement(reagents[1]), 
                   $('<span>').text('='),
                   proposedBox,
                   $('<button>').text('Skip').click(function() {
                      proposedBox.attr('disabled', true);
                      skipReaction(doc.id).then($$.getReaction);
                   }),
                   resultBox);
      proposedBox.keyup(function(e) {
        if (e.keyCode == 13) {
          proposedBox.attr('disabled', true);
          timePad(2000, submitReaction(doc.id, proposedBox.val(), resultBox))
            .then($$.getReaction);
        }
      });
      proposedBox.focus();
    });
};

return $$;

};
