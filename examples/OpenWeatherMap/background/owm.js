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

    async getForecast(lat, lon, count) {
        let res = await axios.get(`${this.url}/data/2.5/forecast${this.query}&lat=${lat}&lon=${lon}&cnt=${count}`);
        return res.data;
    }

    async getCity(city) {
        let res = await axios.get(`${this.url}/geo/1.0/direct?q=${city}&limit=1&appid=${this.key}`);
        return res.data;
    }

    async getAllData(city, count) {
        let data = await this.getCity(city);
        if(data) {
            data = data[0];
            if(data) {
                let current = await this.getCurrentData(data.lat, data.lon);
                let forecast = await this.getForecast(data.lat, data.lon, count);
                return {
                    current: current,
                    forecast: forecast.list
                };
            }
        }
        return {};
    }
}

module.exports = OpenWeatherMap;
