/**
 * TCSS450 Mobile Applications
 * Fall 2021
 */

const express = require('express');
const pool = require('./sql_conn.js');
const router = express.Router();

/**
 * Translate UNIX timestamp to the human readable date and time.
 * 
 * @param {number} UNIX_timestamp the number to translate
 * @returns an odject with date and time.
 */
function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var day = days[a.getDay()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = day + ' ' + date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

/**
 * Translate UNIX timestamp to the human readable hour
 * 
 * @param {number} UNIX_timestamp the number to translate
 * @returns an odject with a hour.
 */
  function hoursConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var hour = a.getHours();
    // var time = day + ' ' + date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return hour;
  }

/**
 * Translate UNIX timestamp to the human readable day of the week.
 * 
 * @param {number} UNIX_timestamp the number to translate
 * @returns an odject with a day abbreviation.
 */
  function daysConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var day = days[a.getDay()];
    return day;
  }

/**
 * This function takes data from a request, parses through it, and returns
 * temperature, humidity, fills like, and icon for current weather
 * and pass it as a response currentDate.
 * 
 * If the body of the request is undefined, it throws an error message.
 */
function createCurrentWeather(request, response, next) {
    
    if (request.body.data === undefined) {
        response.status(400).send({
            message: "No current weather data"
        });
    } else {

        // retrieves data from the request body
        const tempVal = Math.round(request.body.data.current.temp);
        const humidityVal = Math.round(request.body.data.current.humidity);
        const feels_likeVal = Math.round(request.body.data.current.feels_like);
        const chance_rainVal = Math.round(request.body.data.hourly[0].pop);
        const iconVal = request.body.data.current.weather[0].icon;

        // assign the json object to request.body.currentData
        request.body.currentData = {
            curTemp: tempVal,
            curHumidity: humidityVal, 
            curFeels_like: feels_likeVal,
            curRain: chance_rainVal,
            ccurIcon: iconVal
        };
        next();
    }
}

/**
 * This function takes data from a request, parses through it, and returns
 * an array with hours, temperatures, and icon for hourly weather
 * and pass it as a response hourlyDate.
 */
function createHourlyWeather(request, response, next) {

    // retrieves data from the request body
    let hours = [];
    let hVal;
    let tempVal;
    let iconVal;

    // makes an object with needed data for hourly weather
    for (let i = 0; i < 12; i++) {
        hVal = hoursConverter(request.body.data.hourly[i].dt);
        tempVal = Math.round(request.body.data.hourly[i].temp);
        iconVal = request.body.data.hourly[i].weather[0].icon;

        hours[i] = {
            hHours: hVal, 
            hTemp: tempVal,
            hIcon: iconVal
        };
    }

    // assign the json object to request.body.hourlyData
    request.body.hourData = hours;
    next();
}

/**
 * This function takes data from a request, parses through it, and returns
 * an array with days, temperatures, and icon for daily weather
 * and pass it as a response dailyDate.
 */
function createDailyWeather(request, response, next) {

    // retrieves data from the request body
    let days = [];
    let dVal;
    let tempVal;
    let iconVal;

    // makes an object with needed data for daily weather
    for (let i = 0; i < 7; i++) {
        dVal = daysConverter(request.body.data.daily[i].dt);
        tempVal = Math.round(request.body.data.daily[i].temp.day);
        iconVal = request.body.data.daily[i].weather[0].icon;

        days[i] = {
            dDay: dVal, 
            dTemp: tempVal,
            dIcon: iconVal
        };
    }

    // assign the json object to request.body.dailyData
    request.body.dailyData = days;
    next();
}



module.exports = {
    createCurrentWeather,
    createHourlyWeather,
    createDailyWeather
};