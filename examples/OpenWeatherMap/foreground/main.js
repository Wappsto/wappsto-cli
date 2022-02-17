let storage;
let eKey;
let eCity;

function saveApiKey() {
    console.log("Save new API Key", eKey.value);
    storage.set('api_key', eKey.value);
    return false;
}

function saveCity() {
    console.log("Save new City", eCity.value);
    storage.set('city', eCity.value);
    return false;
}

async function start() {
    console.log("Starting");
    eKey = document.getElementById('api_key');
    eCity = document.getElementById('city');
    
    storage = await Wappsto.wappStorage();
    let key = storage.get('api_key');
    let city = storage.get('city');
    console.log('API key: ' + key);
    eKey.value = key;
    eCity.value = city;

    var api_form = document.getElementById("api_form");
    var elements = api_form.elements;
    for (var i = 0, len = elements.length; i < len; ++i) {
	elements[i].disabled = false;
    }

    var city_form = document.getElementById("city_form");
    var elements = city_form.elements;
    for (var i = 0, len = elements.length; i < len; ++i) {
	elements[i].disabled = false;
    }

    console.log("ready");
}
