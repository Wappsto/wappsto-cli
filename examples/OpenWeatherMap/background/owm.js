let axios = require('axios');

class OpenWeatherMap {
    constructor(key) {
	this.key = key;
	this.url = 'https://api.openweathermap.org';
	this.query = `?units=metric&appid=${this.key}`;
    }
    
    async getCurrentData(lat, lon) {
	let res = await axios.get(`${this.url}/data/2.5/weather${this.query}&lat=${lat}&lon=${lon}`);
	return res.data;
    }

    async getForecast(lat, lon) {
	let res = await axios.get(`${this.url}/data/2.5/forecast${this.query}&lat=${lat}&lon=${lon}&cnt=3`);
	return res.data;
    }

    async getCity(city) {
	let res = await axios.get(`${this.url}/geo/1.0/direct?q=${city}&limit=1&appid=${this.key}`);
	return res.data;
    }

    async getAllData(city) {
	let data = await this.getCity(city);
	if(data) {
	    data = data[0];
	    let current = await this.getCurrentData(data.lat, data.lon);
	    let forecast = await this.getForecast(data.lat, data.lon);
	    return {
		current: current,
		forecast: forecast.list
	    };
	}
	return {};
    }
}

module.exports = OpenWeatherMap;
/*
(async () => {

const key = 'dc56eb6a23a476085e45f85cd1c44f8d';

    let owm = new OpenWeatherMap(key);
    //let d = await owm.getCurrentData(9,50);
    //console.log(d);
    //let f = await owm.getForecast(9, 50);
    //console.log(f);
    //let c = await owm.getCity('aalborg');
    //console.log(c);
    let data = await owm.getAllData('aalborg');
    console.log(data);
})();
*/
