
// Setup Zendesk module for commands to utilize.
global.zd = require('node-zendesk'),
global.client = zd.createClient();
global.zdOptions = { limit: 100, delay: 400 };

// Various utilities for commands.
global.fs = require('fs'),
global._  = require('underscore'),
global.Q  = require('Q');

// Load any utility functions.
fs.readdirSync('./utilities').forEach(function(file) { require('./utilities/' + file); });

// Setup prompt environment.
var prompt = require('prompt');
prompt.message = null;
prompt.delimiter = '';
prompt.start();

// Welcome!
console.log('\n-- ZENDESK BULK TICKET ACTIONS --\nRespond to a prompt with [H]elp for available actions.\n');
promptForSearch();

function promptForSearch() {
  var ticketSearch = require('./commands/ticket_find');

  prompt.get(ticketSearch.schema, function (err, result) {
    // User has cancelled.
    if (!result) return console.log('\n\nGoodbye!\n');
    response = result.search.toLowerCase();

    // Help!
    if (response == 'h') {
      ticketSearch.help();
      promptForSearch();
    }

    // Search tickets by View.
    else if (response == 'v') {
      prompt.get({
        properties: {
          viewId: {
            description: 'Please provide the ID of the view:'.white,
            required: true
          }
        }
      }, function (err, result) {
        require('./commands/ticket_find').findTicketsInView(result.viewId).then(function(tickets) {
          console.log('Found a total of ' + tickets.length + ' tickets.');
          promptForAction(tickets);
        }, function (error) {
          console.error(error);
        });
      });
    }

    // @todo: Implement the ability to prompt for file location.
    else if (response == "f") {
      var tickets = require('./tickets.json');
      if (tickets) {
        require('./commands/ticket_find').loadTicketsFromArray(tickets).then(function(tickets) {
          console.log('Found a total of ' + tickets.length + ' tickets.');
          promptForAction(tickets);
        }, function (error) {
          console.error(error);
        });
      } else {
        console.log('Failed to load file.');
        promptForSearch();
      }
    }

    // Response doesn't match any known options.
    else {
      console.log('Invalid response.');
      promptForSearch();
    }
  });
}

function promptForAction(actionableTickets) {
  var ticketActions = require('./commands/ticket_action');

  prompt.get(ticketActions.schema, function (err, result) {
    // User has cancelled.
    if (!result) return console.log('\n\nGoodbye!\n');
    response = result.search.toLowerCase();

    // Help!
    if (response == 'h') {
      ticketActions.help();
      promptForAction();
    }

    // Change the organization ID associated with the ticket.
    else if (response == 'org') {
      prompt.get({
        properties: {
          orgId: {
            description: 'Please provide the Organization ID:'.white,
            required: true
          }
        }
      }, function (err, result) {
        ticketActions.changeOrg(actionableTickets, result.orgId);
      });
    }

    else if (response == 'sol') {
      ticketActions.solve(actionableTickets);
    }

    else if (response == 'del') {
      ticketActions.destroy(actionableTickets);
    }

    // Response doesn't match any known options.
    else {
      console.log('Invalid response.');
      promptForAction();
    }
  });

}

// DEPRECATED: Find tickets that contain a comment.
//require('./commands/ticket_find').findTicketsContainingComment(42338498, commentCriteria);
/*var commentCriteria = ['Close (permanent)', 'Closed (permanent)', '> Closed', 'Closing', 'Solution Suggested 3 (close)'];*/
