// params:
//   container: the element to insert the reactor into
//   database: the firestore database handle
//   utils: a Utils module instance
Reactor = function(PARAMS) {

var frame = $('<div>');
PARAMS.container.appendChild(frame[0]);


var submitReaction = function(reactionName, proposed, resultBox) {
  proposed = proposed.toLowerCase()
                     .replace(/^\s+/, '')
                     .replace(/\s+$/, '')
                     .replace(/\s+/, ' ');
  if (!proposed.match(/^[a-z0-9 ]+$/)) {
    resultBox.append($('<span>').text('Invalid element name'));
    return PARAMS.utils.pure(null);
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

        return PARAMS.utils.computeLeader(data);
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


var $$ = {};

$$.refresh = function() {
  PARAMS.database.collection("reactions").orderBy("demand", "desc").limit(10).get()
    .then(function(docs) {
      frame.empty();
      if (docs.empty) {
        frame.append($('<span>').text('No reactions (it must be the beginning of the universe)'),
                     $('<button>').text('Check again').click(function() { $$.refresh(); }));
        return;
      }

      var which = Math.floor(Math.random()*docs.size);

      var doc  = docs.docs[which];
      var reagents = doc.id.split(':');
      var proposedBox = $('<input>').attr('type', 'text');
      var resultBox = $('<div>');

      frame.append(PARAMS.utils.renderElement(reagents[0]), 
                   $('<span>').text('+'),
                   PARAMS.utils.renderElement(reagents[1]), 
                   $('<span>').text('='),
                   proposedBox,
                   $('<button>').text('Skip').click(function() {
                      proposedBox.attr('disabled', true);
                      skipReaction(doc.id).then($$.refresh);
                   }),
                   resultBox);
      proposedBox.keyup(function(e) {
        if (e.keyCode == 13) {
          proposedBox.attr('disabled', true);
          PARAMS.utils.timePad(2000, submitReaction(doc.id, proposedBox.val(), resultBox))
            .then($$.refresh);
        }
      });
      proposedBox.focus();
    });
};

return $$;

};
