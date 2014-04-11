
module.exports = {
  schema: {
    properties: {
      search: {
        description: '\nWhat action would you like to perform?'.white,
        required: true
      }
    }
  },

  help: function() {
    console.log('\nAvailable actions:');
    console.log('  [Org]anization: Change the ticket organization ID (also assigns customer to org)');
    console.log('  [Sol]ve:        Mark all tickets as Solved.');
    console.log('  [Del]ete:       Delete all tickets (WARNING!)');
    console.log('');
  },

  destroy: function (ticketArray) {
    console.log('Please wait while tickets are deleted...');

    // Split ticket list into groups of 100 to run against ZD.
    var batch = _.chunk(ticketArray, zdOptions.limit);

    // For each batch of 100 tickets (ZD API limit), mass delete.
    batch.forEach(function(ticketBatch, batchIndex) {
      _.delay(function() {
        client.tickets.deleteMany(ticketBatch, function(err) {
          if (err) { return console.error(error); }
        });

        if (batchIndex == batch.length-1) {
          console.log('\nFinished!\n');
        }
      }, zdOptions.delay*batchIndex);
    });
  },

  solve: function (ticketArray) {
    // Split ticket list into groups of 100 to run against ZD.
    var batch = _.chunk(ticketArray, zdOptions.limit);

    console.log('Please wait while tickets are marked as solved...');

    // For each batch of 100 tickets (ZD API limit), mass close.
    // Delaying to 350 miliseconds to not exceed ZD API limitation.
    batch.forEach(function(ticketBatch, batchIndex) {
      console.log(ticketBatch);
      _.delay(function() {
        // Mark tickets as solved with an internal comment referencing Jira issue.
        client.tickets.updateMany(ticketBatch, {
          "ticket": {
            "status": "solved"
          }
        }, function(err) {
          if (err) { return console.error(err); }
        });

        if (batchIndex == batch.length-1) {
          console.log('\nFinished!\n');
        }
      }, zdOptions.delay*batchIndex);
    
    });
  },

  changeOrg: function (ticketArray, orgId) {
    console.log('Please wait while tickets are assigned to organization #' + orgId + '...');

    ticketArray.forEach(function(ticket, batchIndex) {
      _.delay(function() {
        // Update the user submitting the ticket first.
        client.users.update(ticket.requester_id, {
          "user": {
            "organization_id": orgId
          }
        }, function(err) {
          if (err) { return console.error(err); }
        });

        // Now we can update the ticket with the correct org.
        client.tickets.update(ticket.id, {
          "ticket": {
            "organization_id": orgId
          }
        }, function(err) {
          if (err) { return console.error(err); }
        });

        if (batchIndex == ticketArray.length-1) {
          console.log('\nFinished!\n');
        }
      }, zdOptions.delay*batchIndex);
    });
  }
}