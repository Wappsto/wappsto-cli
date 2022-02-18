let Wappsto = require('wappsto-wapp');
let OpenWeatherMap = require('./owm');

let forecast_count = 3;
let owm;
let timer;

let current_temperature;
let forecast_temperature = [];
let latitude;
let longitude;

Wappsto.startLogging();

async function generateNetwork() {
    let network = await Wappsto.createNetwork({
	    name: "Open Weather Map",
	    description: "This network contains the virtual device for Open Weather Map Converter"
    });
    let device = await network.createDevice({
    	name: 'Open Weather Map',
    	description: 'This is a device for teh virtual Open Weather Map Converter',
    	product: 'Open Weather Map Converter',
    	version: '1.0.0',
    	manufacturer: 'Seluxit A/S',
    });
    latitude = await device.createValue('Latitude', 'r', Wappsto.ValueTemplate.LATITUDE);
    longitude = await device.createValue('Longitude', 'r', Wappsto.ValueTemplate.LONGITUDE);
    city_value = await device.createValue('City', 'r', Wappsto.ValueTemplate.CITY);

    current_temperature = await device.createValue('Current Temperature', 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS);

    for(let i=0; i<forecast_count; i++) {
        forecast_temperature[0] = await device.createValue(`Temperature in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS);
    }
}

async function updateValues() {
    console.log("Updating Weather values");
    let data = await owm.getAllData(city, forecast_count);
    console.log(data);

    latitude.report(data.current.coord.lat);
    longitude.report(data.current.coord.lon);
    city_value.report(city);

    current_temperature.report(data.current.main.temp);
    for(let i=0; i<forecast_count; i++) {
	    forecast_temperature[i].report(data.forecast[i].main.temp);
    }
}

async function start(key, city) {
    console.log("Starting");
    if(!current_temperature) {
	    await generateNetwork();
    }
    if(!owm) {
	    owm = new OpenWeatherMap(key);
    }

    if(timer) {
	    cancelTimer(timer);
    }

    timer = setInterval(updateValues, 60*60*1000);

    updateValues();
}

(async () => {
    let storage = await Wappsto.wappStorage();
    let key = storage.get('api_key');
    city = storage.get('city');

	storage.onChange(() => {
	    key = storage.get('api_key');
	    city = storage.get('city');

	    if(city && key) {
		    start(key, city);
	    }
	});

    if(key && city) {
	    start(key, city);
    }
})();
