const http = require("http");
const os = require("os");

module.exports = () => {
  return {
    // API (public) functions
    post: (glucose) => {
      // log error and ignore errant glucose values
      if (glucose.glucose > 800 || glucose.glucose < 20) {
        console.log('Invalid glucose value received from transmitter, ignoring');
        return;
      }

      let direction;
      if (glucose.trend <= -30) {
        direction = 'DoubleDown';
      } else if (glucose.trend <= -20) {
        direction = 'SingeDown';
      } else if (glucose.trend <= -10) {
        direction = 'FortyFiveDown';
      } else if (glucose.trend < 10) {
        direction = 'Flat';
      } else if (glucose.trend < 20) {
        direction = 'FortyFiveUp';
      } else if (glucose.trend < 30) {
        direction = 'SingleUp';
      } else {
        direction = 'DoubleUp';
      }

      const entry = [{
        'device': 'openaps://' + os.hostname(),
        'date': glucose.readDate,
        'dateString': new Date(glucose.readDate).toISOString(),
        'sgv': glucose.glucose,
        'direction': direction,
        'type': 'sgv',
        'filtered': glucose.filtered,
        'unfiltered': glucose.unfiltered,
        'rssi': "100", // TODO: consider reading this on connection and reporting
        'noise': "1",
        'trend': glucose.trend,
        'glucose': glucose.glucose
      }];

      const data = JSON.stringify(entry);
      const secret = process.env.API_SECRET;

      const options = {
        hostname: '127.0.0.1', // could also try localhost ?
        port: 5000,
        path: '/api/v1/entries',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'API-SECRET': secret
        }
      };

      const req = http.request(options);

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });

      req.write(data);
      req.end();
    }
  };
};