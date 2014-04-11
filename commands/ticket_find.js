
module.exports = {
  schema: {
    properties: {
      search: {
        description: 'Search tickets by:'.white,
        required: true
      }
    }
  },

  help: function() {
    console.log('\nAvailable filters:');
    console.log('  [V]iew: find all tickets by a view ID.');
    console.log('  [F]ile: pass an array of ticket IDs in a JSON file.')
    console.log('');
  },

  // Pass a View ID and array containing case-sensitive text to search for in a comment.
  // Output will contain line separated ticket IDs.
  findTicketsContainingComment: function(viewId, commentTextSearch) {
    var affectedTickets = new Array();
    client.views.tickets(viewId, function (err, statusList, body, responseList, resultList) {
      console.log('Found ' + body.length + ' pages of open and migrated tickets.');
      body.forEach(function(ticketPage, ticketIndex) {
        // Each page returns 100 tickets; ZD is limited to 200 calls per minute.
        // 1 batch of tickets can theoretically be called every 30 seconds to not go over this limit.
        // Being conservative here and ensuring each batch gets executed every 32 seconds.
        _.delay(function() {
          console.log('ticketBatch: ' + new Date().valueOf());
          ticketPage.tickets.forEach(function(ticket) {

            client.tickets.getComments(ticket.id, function (err, statusList, commentBody, responseList, resultList) {
              if (commentBody) {
                commentBody[0].comments.forEach(function(comment) {
                  var commentText = comment.body || "";
                  var match = false;
                  commentTextSearch.forEach(function(comment) {
                    if (commentText.indexOf(comment) != -1) {
                      match = true;
                    }
                  });
                  if (match) {
                    affectedTickets.push(ticket.id);
                    console.log(ticket.id + ',')
                  }
                });
              }
            });

          });
        }, 32000*ticketIndex);
      });
    });
  },

  findTicketsInView: function(viewId) {
    var deferred = Q.defer();
    var affectedTickets = new Array();

    console.log('Please wait while tickets are fetched from view #' + viewId + '...');

    client.views.tickets(viewId, function (err, statusList, body, responseList, resultList) {
      if (!body) return deferred.reject(new Error('Zendesk returned no results.'));

      body.forEach(function(ticketPage, ticketIndex) {
        ticketPage.tickets.forEach(function(ticket) {
          affectedTickets.push(ticket);
        });
      });

      deferred.resolve(affectedTickets);
    });

    return deferred.promise;
  }

}
