const Wappsto = require('wappsto-wapp');

console.log('Background wapp started.');

setInterval(() => {
  console.log('Background wapp is alive.');
}, 5000);

Wappsto.wappStorage().then(() => {
  console.log('Storage created');
});
