let Wappsto = require('wappsto-wapp');
let OpenWeatherMap = require('./owm');

let forecast_count = 3;
let owm;
let timer;

let latitude;
let longitude;
let current_temperature;
let forecast_temperature = [];
let forecast_pressure = [];
let forecast_humidity = [];
let forecast_wind_speed = [];
let forecast_wind_deg = [];

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

    current_temperature = await device.createValue('Temperature', 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS);
    current_pressure = await device.createValue(`Pressure`, 'r', Wappsto.ValueTemplate.PRESSURE_HPA);
    current_humidity = await device.createValue(`Humidity`, 'r', Wappsto.ValueTemplate.HUMIDITY);
    current_wind_speed = await device.createValue(`Wind Speed`, 'r', Wappsto.ValueTemplate.SPEED_MS);
    current_wind_deg = await device.createValue(`Wind Direction`, 'r', Wappsto.ValueTemplate.ANGLE);

    for(let i=0; i<forecast_count; i++) {
        forecast_temperature[i] = await device.createValue(`Temperature in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.TEMPERATURE_CELSIUS);
	forecast_pressure[i] = await device.createValue(`Pressure in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.PRESSURE_HPA);
	forecast_humidity[i] = await device.createValue(`Humidity in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.HUMIDITY);
	forecast_wind_speed[i] = await device.createValue(`Wind Speed in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.SPEED_MS);
	forecast_wind_deg[i] = await device.createValue(`Wind Direction in ${(i+1)*3} hours`, 'r', Wappsto.ValueTemplate.ANGLE);
    }
}

function convertTimestamp(txt) {
    return txt.replace(" ", "T") + "Z";
}

async function updateValues() {
    console.log("Updating Weather values");
    let data = await owm.getAllData(city, forecast_count);
    console.log(data);

    latitude.report(data.current.coord.lat);
    longitude.report(data.current.coord.lon);
    city_value.report(city);

    current_temperature.report(data.current.main.temp);
    current_pressure.report(data.current.main.pressure);
    current_humidity.report(data.current.main.humidity);
    current_wind_speed.report(data.current.wind.speed);
    current_wind_deg.report(data.current.wind.deg);
    
    for(let i=0; i<forecast_count; i++) {
	forecast_temperature[i].report(data.forecast[i].main.temp, convertTimestamp(data.forecast[i].dt_txt));
	forecast_humidity[i].report(data.forecast[i].main.humidity, convertTimestamp(data.forecast[i].dt_txt));
	forecast_pressure[i].report(data.forecast[i].main.pressure, convertTimestamp(data.forecast[i].dt_txt));
	forecast_wind_speed[i].report(data.forecast[i].wind.speed, convertTimestamp(data.forecast[i].dt_txt));
	forecast_wind_deg[i].report(data.forecast[i].wind.deg, convertTimestamp(data.forecast[i].dt_txt));
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
