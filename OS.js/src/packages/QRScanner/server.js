module.exports = (core, proc) => {
  const { routeAuthenticated } = core.make('osjs/express');
  var request = require("request");

  return {
    // When server initializes
    async init() {
      // HTTP Route example (see index.js)
      routeAuthenticated('POST', proc.resource('/test'), (req, res) => {
        res.json({ hello: 'World' });
      });

      routeAuthenticated('PUT', proc.resource('/update-otp'), (req, res) => {
        console.log(req.body);
        const object_url = 'https://otpcodes-8c81.restdb.io/rest/otpswithsessionids/' + req.body.id;
        var options = {
          method: 'PUT',
          url: object_url,
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4',
            'content-type': 'application/json'
          },
          body: {
            OTP: req.body.otp, Verified: true, UserId: req.body.userId, SessionId: req.body.sessionId,
            ScannedBy: req.body.scannedBy
          },
          json: true
        };

        request(options, function (error, response, body) {
          res.json({ response: response });
        });

      });

      routeAuthenticated('POST', proc.resource('/update-privilege'), (req, res) => {
        console.log(req.body);
        const object_url = 'https://otpcodes-8c81.restdb.io/rest/privileges';
        var options = {
          method: 'POST',
          url: object_url,
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4',
            'content-type': 'application/json'
          },
          body: {
            UserId: req.body.userId, ScannedBy: req.body.scannedBy,
            Module: req.body.module, RoomName: req.body.venue, StartDate: req.body.startDate,
            EndDate: req.body.endDate, StartTime: req.body.startTime, EndTime: req.body.endTime,
            PassOnPrivilege: req.body.passOnPrivilege, CanScan: req.body.canScan, ScannedTime: new Date()
          },
          json: true
        };

        request(options, function (error, response, body) {
          res.json({ response: response });
        });

      });

      routeAuthenticated('GET', proc.resource('/retrieve-privilege'), (req, res) => {
        var request = require("request");
        var options = {
          method: 'GET',
          url: 'https://otpcodes-8c81.restdb.io/rest/privileges',
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4'
          }
        };
        request(options, function (error, response, body) {
          if (error) throw new Error(error);
          console.log("Privilege Response " + JSON.stringify(response));
          res.json({ response: response });
        });
      });

      routeAuthenticated('POST', proc.resource('/get-items'), (req, res) => {
        const object_id = req.body.id;
        const object_url = 'https://otpcodes-8c81.restdb.io/rest/otpswithsessionids' + '/' + object_id;
        var settings = {
          url: object_url,
          method: 'GET',
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4',
            'content-type': 'application/json'
          },
          json: true
        };

        request(settings, function (error, response, body) {
          if (error) throw new Error(error);
          res.json({ id: body._id, otp: body.OTP, isVerified: body.Verified });
        });
      });


      // WebSocket Route example (see index.js)
      // NOTE: This creates a new connection. You can use a core bound socket instead
      core.app.ws(proc.resource('/socket'), (ws, req) => {
        ws.send('Hello World');
      });
    },

    // When server starts
    async start() {
    },

    // When server goes down
    destroy() {
    },

    // When using an internally bound websocket, messages comes here
    onmessage(ws, respond, args) {
      respond('Pong');
    }
  };
};
