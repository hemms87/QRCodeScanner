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
        const object_url = 'https://otpcodes-8c81.restdb.io/rest/otp-storage/' + req.body.id;
        var options = {
          method: 'PUT',
          url: object_url,
          headers:
          {
            'cache-control': 'no-cache',
            'x-apikey': 'f78b32a7ca80a5797d1e9cf1008be7133e2e4',
            'content-type': 'application/json'
          },
          body: { OTP: req.body.otp, Verified: true, Module: req.body.module, RoomName: req.body.venue },
          json: true
        };

        request(options, function (error, response, body) {
          res.json({ response: response });
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
