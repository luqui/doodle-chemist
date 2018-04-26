// params:
//   container: the container to add the lab element to
//   database: the firestore database object
//   utils: a Utils module instance
Laboratory = function(PARAMS) {

var $$ = {};

var frame = $('<div>');
PARAMS.container.appendChild(frame[0]);

var elements = ['earth', 'water', 'fire', 'air'];

$$.refresh = function() {
  frame.empty();

  var elementsBox = $('<div>');
  var reagent1 = $('<span>');
  var reagent2 = $('<span>');
  var equationBox = $('<div>').append(reagent1, $('<span>').text('+'), reagent2);
  var resultBox = $('<div>');

  frame.append(elementsBox, equationBox, resultBox);

  var compute = function() {
    if (reagent1.text() <= reagent2.text()) {
      var reaction = reagent1.text() + ":" + reagent2.text();
    }
    else {
      var reaction = reagent2.text() + ":" + reagent1.text();
    }

    var docref = PARAMS.database.collection("reactions").doc(reaction);
    PARAMS.database.runTransaction(function(transaction) {
      return transaction.get(docref)
        .then(function(q) {
          if (!q.exists) {
            transaction.set(docref, { demand: 1, results: {} });
            return null;
          }

          var data = q.data();
          data.demand++;
          transaction.set(docref, data);

          return PARAMS.utils.computeLeader(data);   
        });
    }).then(function(leader) {
      if (leader == null) {
        resultBox.text('No reaction');
        PARAMS.utils.delay(2000).then(function() { $$.refresh() });
      }
      else {
        resultBox.append(PARAMS.utils.renderElement(leader));
        var cont = function() { 
          PARAMS.utils.delay(2000).then(function() { $$.refresh() });
        };
        for (var i = 0; i < elements.length; i++) {
          if (leader == elements[i]) { cont(); return; }
        }
        elements.push(leader);
        cont();
      }
    });
  };

  var select = function(element) {
    if (reagent1.text() == "") {
      reagent1.text(element);
    } 
    else if (reagent2.text() == "") {
      reagent2.text(element);
      compute();
    }
  };

  for (var i = 0; i < elements.length; i++) {
    (function() {
      var element = elements[i];
      elementsBox.append($('<button>').text(element).click(function() { select(element) }));
    })();
  }
};

return $$;

};
