/**
 * TCSS450 Mobile Applications
 * Fall 2021
 */


/**
 * This function takes data from a request, parses through it, and returns
 * temperature, humidity, fills like, and icon for current weather
 * and pass it as a response currentDate.
 * 
 * If the body of the request is undefined, it throws an error message.
 */
function createCurrentWeather(request, response, next) {
    let timeZO = request.body.data.timezone_offset;
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
        request.body.timeZoneOffset = timeZO;
        next();
    }
}

/**
 * This function takes a date from a request, parses through it, and returns
 * an array with hours, temperatures, and icon for hourly weather
 * and pass it as a response hourlyDate.
 */
function createHourlyWeather(request, response, next) {

    // retrieves data from the request body
    let hours = [];
    let hVal;
    let tempVal;
    let iconVal;
    let humadDate = new Date(request.body.humanTime);

    hVal =  humadDate.getHours();

    // makes an object with needed data for hourly weather
    for (let i = 0; i < 24; i++) {
        
        tempVal = Math.round(request.body.data.hourly[i].temp);
        iconVal = request.body.data.hourly[i].weather[0].icon;

        hours[i] = {
            hHours: hVal, 
            hTemp: tempVal,
            hIcon: iconVal
        };

        hVal = (hVal + 1) % 24;
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
    let theHumanDate = request.body.humanTime; // "2021-11-18 50:00:00"
    
    let dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let dateObj = new Date(theHumanDate.split(" ")[0]);
    let dayIndex = dateObj.getDay();
    
    // makes an object with needed data for daily weather
    for (let i = 0; i < 7; i++) {
       
        let dayName = dayNames[dayIndex];
        let tempVal = Math.round(request.body.data.daily[i].temp.day);
        let iconVal = request.body.data.daily[i].weather[0].icon;

        dayIndex = (dayIndex + 1) % 7;

        days[i] = {
            dDay: dayName, 
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