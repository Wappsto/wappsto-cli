let storage;
let eKey;
let eCity;
let city_value;

function saveApiKey() {
  console.log("Save new API Key", eKey.value);
  storage.set("api_key", eKey.value);
  document.getElementById("city_details").open = true;
  return false;
}

function saveCity() {
  console.log("Save new City", eCity.value);
  if (city_value) {
    city_value.control(eCity.value);
  }
  //storage.set('city', eCity.value);
  //Wappsto.sendToBackground({"city": eCity.value});
  return false;
}

async function handleWeatherData(event) {
  console.log("handleWeatherData", event);
  if (event.current) {
    console.log("event", event.current);
    let weather = event.current.weather[0];
    console.log("Weather", weather);
    document.getElementById("weather_text").innerHTML = weather.description;
    document.getElementById("weather_icon").src =
      "http://openweathermap.org/img/wn/" + weather.icon + "@2x.png";
  }

  if (event.network) {
    console.log("find by type");
    city_value = await Wappsto.Value.findByType("city");
    console.log("city", city_value);
    if (city_value) {
      city_value = city_value[0];
      console.log("Network value", city_value);
      city = city_value.getReportData();

      if (city) {
        eCity.value = city;
        Wappsto.sendToBackground({ update: true }).then((res) => {
          console.log("update res", res);
        });
      }

      document.getElementById("city_article").attributes[
        "aria-busy"
      ].value = false;
      var city_form = document.getElementById("city_form");
      var elements = city_form.elements;
      for (var i = 0, len = elements.length; i < len; ++i) {
        elements[i].disabled = false;
      }
    }
  }

  return "OK";
}

async function start() {
  console.log("Starting");
  eKey = document.getElementById("api_key");
  eCity = document.getElementById("city");

  Wappsto.fromBackground(handleWeatherData);

  storage = await Wappsto.wappStorage();
  let key = storage.get("api_key");
  console.log("API key: " + key);

  if (key) {
    eKey.value = key;
    document.getElementById("city_details").open = true;
    let res = await Wappsto.sendToBackground({ network: "update" });
    console.log("network res", res);
  } else {
    document.getElementById("key_details").open = true;
  }

  var api_form = document.getElementById("api_form");
  var elements = api_form.elements;
  for (var i = 0, len = elements.length; i < len; ++i) {
    elements[i].disabled = false;
  }

  console.log("ready");
}
