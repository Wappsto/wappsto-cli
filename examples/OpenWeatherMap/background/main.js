let Wappsto = require("wappsto-wapp");
let OpenWeatherMap = require("./owm");

let forecast_count = 3;
let owm;
let timer;
let last_data;

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
    description:
      "This network contains the virtual device for Open Weather Map Converter",
  });
  let device = await network.createDevice({
    name: "Open Weather Map",
    description: "This is a device for teh virtual Open Weather Map Converter",
    product: "Open Weather Map Converter",
    version: "1.0.0",
    manufacturer: "Seluxit A/S",
  });
  latitude = await device.createValue(
    "Latitude",
    "r",
    Wappsto.ValueTemplate.LATITUDE
  );
  longitude = await device.createValue(
    "Longitude",
    "r",
    Wappsto.ValueTemplate.LONGITUDE
  );
  city_value = await device.createValue(
    "City",
    "rw",
    Wappsto.ValueTemplate.CITY
  );

  city_value.onControl((value, data) => {
    city = data;
    start();
  });

  current_temperature = await device.createValue(
    "Temperature",
    "r",
    Wappsto.ValueTemplate.TEMPERATURE_CELSIUS
  );
  current_pressure = await device.createValue(
    `Pressure`,
    "r",
    Wappsto.ValueTemplate.PRESSURE_HPA
  );
  current_humidity = await device.createValue(
    `Humidity`,
    "r",
    Wappsto.ValueTemplate.HUMIDITY
  );
  current_wind_speed = await device.createValue(
    `Wind Speed`,
    "r",
    Wappsto.ValueTemplate.SPEED_MS
  );
  current_wind_deg = await device.createValue(
    `Wind Direction`,
    "r",
    Wappsto.ValueTemplate.ANGLE
  );

  for (let i = 0; i < forecast_count; i++) {
    forecast_temperature[i] = await device.createValue(
      `Temperature in ${(i + 1) * 3} hours`,
      "r",
      Wappsto.ValueTemplate.TEMPERATURE_CELSIUS
    );
    forecast_pressure[i] = await device.createValue(
      `Pressure in ${(i + 1) * 3} hours`,
      "r",
      Wappsto.ValueTemplate.PRESSURE_HPA
    );
    forecast_humidity[i] = await device.createValue(
      `Humidity in ${(i + 1) * 3} hours`,
      "r",
      Wappsto.ValueTemplate.HUMIDITY
    );
    forecast_wind_speed[i] = await device.createValue(
      `Wind Speed in ${(i + 1) * 3} hours`,
      "r",
      Wappsto.ValueTemplate.SPEED_MS
    );
    forecast_wind_deg[i] = await device.createValue(
      `Wind Direction in ${(i + 1) * 3} hours`,
      "r",
      Wappsto.ValueTemplate.ANGLE
    );
  }
}

function convertTimestamp(txt) {
  return txt.replace(" ", "T") + "Z";
}

async function updateValues() {
  console.log("Updating Weather values");
  let data = await owm.getAllData(city, forecast_count);
  last_data = data;
  console.log("data", data);

  latitude.report(data.current.coord.lat);
  longitude.report(data.current.coord.lon);
  city_value.report(city);

  current_temperature.report(data.current.main.temp);
  current_pressure.report(data.current.main.pressure);
  current_humidity.report(data.current.main.humidity);
  current_wind_speed.report(data.current.wind.speed);
  current_wind_deg.report(data.current.wind.deg);

  for (let i = 0; i < forecast_count; i++) {
    forecast_temperature[i].report(
      data.forecast[i].main.temp,
      convertTimestamp(data.forecast[i].dt_txt)
    );
    forecast_humidity[i].report(
      data.forecast[i].main.humidity,
      convertTimestamp(data.forecast[i].dt_txt)
    );
    forecast_pressure[i].report(
      data.forecast[i].main.pressure,
      convertTimestamp(data.forecast[i].dt_txt)
    );
    forecast_wind_speed[i].report(
      data.forecast[i].wind.speed,
      convertTimestamp(data.forecast[i].dt_txt)
    );
    forecast_wind_deg[i].report(
      data.forecast[i].wind.deg,
      convertTimestamp(data.forecast[i].dt_txt)
    );
  }

  console.log("update", data);
  let res = await Wappsto.sendToForeground(data);
  console.log("updated res", res);
}

async function init(key) {
  console.log("Init");
  if (!current_temperature) {
    await generateNetwork();
  }
  console.log("Network created");
  let res = await Wappsto.sendToForeground({ network: "created" });
  console.log("init res", res);

  if (!owm) {
    owm = new OpenWeatherMap(key);
  }

  city = city_value.getReportData();
  if (city) {
    console.log("Saved city", city);
    start();
  }
}

async function start() {
  console.log("Updating", city);
  if (city) {
    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(updateValues, 60 * 60 * 1000);

    updateValues();
  }
}

function handleCommand(event) {
  console.log("handleCommand", event);
  if (event.update) {
    console.log("sending update");
    Wappsto.sendToForeground(last_data).then((res) => {
      console.log("last_data res", res);
    });
  } else if (event.network) {
    if (current_temperature) {
      Wappsto.sendToForeground({ network: "created" }).then((res) => {
        console.log("created res", res);
      });
    }
  }
  return "OK";
}

(async () => {
  Wappsto.fromForeground(handleCommand);
  let storage = await Wappsto.wappStorage();
  let key = storage.get("api_key");

  storage.onChange(() => {
    console.log("Configuration changed");
    key = storage.get("api_key");

    if (key) {
      init(key);
    }
  });

  if (key) {
    init(key);
  }
})();
