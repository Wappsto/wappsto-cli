let Wappsto = require("wapp-api");
let wappsto = new Wappsto();

let wappstoConsole = require("wapp-api/console");
wappstoConsole.start(); // to start sending logs

console.log("Starting Background Wapp");

setInterval(() => {
    console.log("Hello from the background Task");
}, 5000);
