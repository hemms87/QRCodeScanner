module.exports = (core, proc) => {
  const { routeAuthenticated } = core.make('osjs/express');
  var request = require("request");
  var otpGenerator = require('otp-generator');
  return {
    // When server initializes
    async init() {
      // HTTP Route example (see index.js)
      routeAuthenticated('POST', proc.resource('/test'), (req, res) => {
        res.json({ hello: 'World' });
      });

      routeAuthenticated('POST', proc.resource('/get-items'), (req, res) => {
        const object_id = req.body.id;
        const object_url = 'https://otpcodes-8c81.restdb.io/rest/otp-storage' + '/' + object_id;
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

      routeAuthenticated('POST', proc.resource('/create-otp'), (req, res) => {
        var otp_value = otpGenerator.generate(12, { alphabets: false, upperCase: false, specialChars: false });
        var options = {
          method: 'POST',
          url: 'https://otpcodes-8c81.restdb.io/rest/otpswithsessionids',
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4',
            'content-type': 'application/json'
          },
          body: {
            OTP: otp_value,
            Verified: false,
            UserId: req.body.userId,
            SessionId: req.body.sessionId,
            ScannedBy: req.body.scannedBy
          },
          json: true
        };

        request(options, function (error, response, body) {
          if (error) throw new Error(error);
          res.json({
            id: body._id, otp: body.OTP, isVerified: body.Verified, userId: body.UserId,
            sessionId: body.SessionId, scannedBy: body.scannedBy
          });
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
