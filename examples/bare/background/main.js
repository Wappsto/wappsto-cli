const Wappsto = require('wappsto-wapp');

Wappsto.startLogging();

console.log('Background wapp started.');

setInterval(() => {
  console.log('Background wapp is alive.');
}, 5000);
