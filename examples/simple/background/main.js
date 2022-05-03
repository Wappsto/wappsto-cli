// Load the Wappsto Wapp API
let Wappsto = require("wapp-api");
let wappsto = new Wappsto();

// Start sending console logs on the stream
let wappstoConsole = require("wapp-api/console");
wappstoConsole.start(); // to start sending logs

let helloCount = 1;

// Write a single message when we start
console.log("Starting Background Wapp");

// Create a timer that writes on the stream that the background wapp is still running
setInterval(() => {
    console.log(`Hello ${helloCount++} from the background Task`);
}, 5000);

// Subsribe to all the states under the value
function subscribeToStates(collection) {
    // Loop over all the values
    collection.forEach((val) => {
        val.get("state").forEach((state) => {
            console.log(`Subscribed to ${state.get('type')} state on ${val.get('name')}`);
            state.on("change:data", (model, old, value, key, opt) => {
                console.log(`State ${val.get('name')} changed from ${old} to ${value}`);
            });
        });
    });
}

// Save custom data
wappsto.get("data", {/* no filter */}, {
    "expand": 1, // Load the full data objecct
    "success": (collection, response) => {
        if(collection.length === 0) {
            console.log("Creating custom data");
            wappsto.create("Data", {custom: 'My data'});
        } else {
            console.log(`Custom saved data: ${collection.first().get('custom')}`);
        }
    },
    "error": (model, response) => {
        console.error("ERROR: Failed to get data value!");
        console.error(response);
    }
});


// Send a request to get access to a temperature value
wappsto.get("value", {
    // Filter to search for devices
    type: "temperature",
}, {
    "quantity": 1, // how many devices that we would like
    "expand": 2, // Load all the data of the value
    "success": (collection, response) => {
        console.log(`Got ${collection.length} temperature values`);
        subscribeToStates(collection);
    },
    "error": (model, response) => {
        console.error("ERROR: Failed to get temperature value!");
        console.error(response);
    }
});



// Send a request to get access to an on/off value
wappsto.get("value", {
    // Filter to search for devices
    type: "on/off",
}, {
    "quantity": 1, // how many devices that we would like
    "expand": 2, // Load all the data of the value
    "success": (collection, response) => {
        console.log(`Got ${collection.length} on/off values`);
        subscribeToStates(collection);

        // Get the first item
        let value = collection.first();
        // Find the control state
        let Control = value.get('state').findWhere({type: 'Control'});
        // Change the state to 1
        Control.save({data: '1'}).catch((err) => {
            console.error(`Failed to set value: ${err.responseJSON.message}`);
        });
    },
    "error": (model, response) => {
        console.error("ERROR: Failed to get on/off value!");
        console.error(responses);
    }
});
