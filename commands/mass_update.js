// Required libraries.
var zd = require('node-zendesk'),
    fs = require('fs'),
    _ = require('underscore'),
    client = zd.createClient({remoteUri: 'https://acquia.zendesk.com/api/v2'});

module.exports = {
  updateTicketsBySender: function (senders, runDebug) {
    // Because we fetch every page of tickets, it may take a few seconds.
    console.log('Please wait, fetching matching tickets from Zendesk...');

    // Payload contains user IDs to run this command against, loop through each ID.
    senders.forEach(function(userId) {

      client.tickets.listByUserRequested(userId, function (err, statusList, body, responseList, resultList) {

        if (err) {
          console.log(err);
          return;
        }

        var pending = [],
            tickets = body.length;

        // We're only looking for "Open" tickets.
        // ("New" tickets could catch newly submitted Ops tickets.)
        body.forEach(function(ticket) {
          if (ticket.status == "open") {
            pending.push(ticket.id);
          }
        });

        // Let the user know we're still doing stuff.
        console.log('Solving ' + pending.length + ' out of ' + tickets + ' total tickets for user ' + userId + '.');

        // Split ticket list into groups of 100 to run against ZD.
        var batch = _.chunk(pending, 100);

        // Don't actually close tickets if we're running in debug mode.
        if (runDebug == true) {
          console.log('DEBUG--TICKETS MARKING AS SOLVED:');
          console.log(batch);
        } else {
          // For each batch of 100 tickets (ZD API limit), mass close.
          // The paranoid side of me has commented out the following so I don't accidently trigger anything :)
          batch.forEach(function(ticket_batch) {

            // Mark tickets as solved with an internal comment referencing Jira issue.
            client.tickets.updateMany(ticket_batch, {
              "ticket": {
                "comment" : {
                  "body": "Marking as solved per HD-288.",
                  "public": "false"
                },
                "status": "solved"
              }
            }, function(err) {
              if (err) { console.log(err); return; }
            });
          
          });
        }
      });
    });
  }
}