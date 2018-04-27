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

  var reagent1 = null
  var reagent2 = null;
  var elementsBox = $('<div>');
  var reagent1Box = $('<span>');
  var reagent2Box = $('<span>');
  var resultBox = $('<span>');
  var equationBox = $('<div>').addClass('equation')
                              .css('visibility', 'hidden')
                              .append(reagent1Box, 
                                      $('<span>').addClass('operator').text('+'),
                                      reagent2Box,
                                      $('<span>').addClass('operator').text('='),
                                      resultBox);

  frame.append(elementsBox, equationBox);

  var compute = function() {
    if (reagent1 <= reagent2) {
      var reaction = reagent1 + ":" + reagent2;
    }
    else {
      var reaction = reagent2 + ":" + reagent1;
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
    equationBox.css('visibility', 'visible');
    if (reagent1 == null) {
      reagent1 = element;
      reagent1Box.append(PARAMS.utils.renderElement(element));
    } 
    else if (reagent2 == null) {
      reagent2 = element;
      reagent2Box.append(PARAMS.utils.renderElement(element));
      compute();
    }
  };

  for (var i = 0; i < elements.length; i++) {
    (function() {
      var element = elements[i];
      elementsBox.append(PARAMS.utils.renderElement(element)
                               .click(function() { select(element) }));
    })();
  }
};

return $$;

};
