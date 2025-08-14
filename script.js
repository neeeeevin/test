// script.js

/* ===============================
   DOM ELEMENTS
================================= */
const alarmClockEl = document.getElementById('alarm-clock');
const stopwatchEl = document.getElementById('stopwatch');
const timerEl = document.getElementById('timer');
const weatherEl = document.getElementById('weather');

// Alarm
const clockTimeEl = document.getElementById('clock-time');
const alarmTimeInput = document.getElementById('alarm-time');
const setAlarmBtn = document.getElementById('set-alarm');

// Stopwatch
const stopwatchTimeEl = document.getElementById('stopwatch-time');
const startStopwatchBtn = document.getElementById('start-stopwatch');
const stopStopwatchBtn = document.getElementById('stop-stopwatch');
const resetStopwatchBtn = document.getElementById('reset-stopwatch');
const lapStopwatchBtn = document.getElementById('lap-stopwatch');
const lapsListEl = document.getElementById('stopwatch-laps');

// Timer
const timerInputEl = document.getElementById('timer-input');
const startTimerBtn = document.getElementById('start-timer');
const timerDisplayEl = document.getElementById('timer-display');
const timerProgressCircle = document.getElementById('timer-progress');

// Weather
const weatherInfoEl = document.getElementById('weather-info');
const weatherIconEl = document.getElementById('weather-icon');

/* ===============================
   STATE VARIABLES
================================= */
let alarmTime = null;
let alarmSet = false;

let stopwatchInterval = null;
let stopwatchTime = 0;
let lapCount = 0;

let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;

// Debounce
let orientationTimeout = null;
const ORIENTATION_DEBOUNCE_MS = 300;

/* ===============================
   UTILITY FUNCTIONS
================================= */
function showFeature(feature, modeClass) {
    [alarmClockEl, stopwatchEl, timerEl, weatherEl].forEach(el => {
        el.classList.remove('visible');
    });
    feature.classList.add('visible');
    document.body.className = modeClass;
}

/* ===============================
   ALARM CLOCK
================================= */
function updateClock() {
    const now = new Date();
    clockTimeEl.textContent = now.toLocaleTimeString();
    if (alarmSet && alarmTime === `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`) {
        alert("⏰ Alarm ringing!");
        alarmSet = false;
    }
}
setAlarmBtn.addEventListener('click', () => {
    alarmTime = alarmTimeInput.value;
    if (alarmTime) {
        alarmSet = true;
        alert(`Alarm set for ${alarmTime}`);
    }
});

/* ===============================
   STOPWATCH
================================= */
function updateStopwatch() {
    const hrs = String(Math.floor(stopwatchTime / 3600)).padStart(2, '0');
    const mins = String(Math.floor((stopwatchTime % 3600) / 60)).padStart(2, '0');
    const secs = String(stopwatchTime % 60).padStart(2, '0');
    stopwatchTimeEl.textContent = `${hrs}:${mins}:${secs}`;
}
startStopwatchBtn.addEventListener('click', () => {
    if (!stopwatchInterval) {
        stopwatchInterval = setInterval(() => {
            stopwatchTime++;
            updateStopwatch();
        }, 1000);
    }
});
stopStopwatchBtn.addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
});
resetStopwatchBtn.addEventListener('click', () => {
    stopwatchTime = 0;
    lapCount = 0;
    lapsListEl.innerHTML = '';
    updateStopwatch();
});
lapStopwatchBtn.addEventListener('click', () => {
    if (stopwatchInterval) {
        lapCount++;
        const li = document.createElement('li');
        li.textContent = `Lap ${lapCount}: ${stopwatchTimeEl.textContent}`;
        lapsListEl.appendChild(li);
    }
});

/* ===============================
   TIMER
================================= */
function updateTimerDisplay() {
    timerDisplayEl.textContent = timerRemaining;
    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (timerRemaining / timerTotal) * circumference;
    timerProgressCircle.style.strokeDashoffset = offset;
}
startTimerBtn.addEventListener('click', () => {
    const seconds = parseInt(timerInputEl.value, 10);
    if (!isNaN(seconds) && seconds > 0) {
        timerTotal = seconds;
        timerRemaining = seconds;
        updateTimerDisplay();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                alert("⏳ Timer finished!");
            }
        }, 1000);
    }
});

/* ===============================
   WEATHER
================================= */
async function loadWeather(lat = null, lon = null) {
    const apiKey = "YOUR_OPENWEATHERMAP_API_KEY";
    let url;
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        const defaultCity = "London";
        url = `https://api.openweathermap.org/data/2.5/weather?q=${defaultCity}&appid=${apiKey}&units=metric`;
    }
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.weather && data.weather[0]) {
            weatherInfoEl.textContent = `${data.name}: ${data.weather[0].description}, ${data.main.temp}°C`;
            weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        } else {
            weatherInfoEl.textContent = "Weather data unavailable.";
            weatherIconEl.src = "";
        }
    } catch {
        weatherInfoEl.textContent = "Failed to load weather.";
    }
}
function detectWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => loadWeather(pos.coords.latitude, pos.coords.longitude),
            () => loadWeather()
        );
    } else {
        loadWeather();
    }
}

/* ===============================
   ORIENTATION DETECTION
================================= */
function setModeFromType(orientationType) {
    if (orientationType.includes("portrait-primary")) {
        showFeature(alarmClockEl, "mode-alarm");
    } else if (orientationType.includes("landscape-primary")) {
        showFeature(stopwatchEl, "mode-stopwatch");
    } else if (orientationType.includes("portrait-secondary")) {
        showFeature(timerEl, "mode-timer");
    } else if (orientationType.includes("landscape-secondary")) {
        detectWeather();
        showFeature(weatherEl, "mode-weather");
    }
}

function handleOrientationChange() {
    if (orientationTimeout) clearTimeout(orientationTimeout);
    orientationTimeout = setTimeout(() => {
        if (screen.orientation && screen.orientation.type) {
            setModeFromType(screen.orientation.type);
        }
    }, ORIENTATION_DEBOUNCE_MS);
}

function handleDeviceOrientation(event) {
    if (orientationTimeout) clearTimeout(orientationTimeout);
    orientationTimeout = setTimeout(() => {
        const beta = event.beta;   // front/back tilt (-180, 180)
        const gamma = event.gamma; // left/right tilt (-90, 90)

        if (beta > 45 && beta < 135) {
            showFeature(alarmClockEl, "mode-alarm");
        } else if (beta < -45 && beta > -135) {
            showFeature(timerEl, "mode-timer");
        } else if (Math.abs(beta) < 45 && gamma > 0) {
            showFeature(stopwatchEl, "mode-stopwatch");
        } else if (Math.abs(beta) < 45 && gamma < 0) {
            detectWeather();
            showFeature(weatherEl, "mode-weather");
        }
    }, ORIENTATION_DEBOUNCE_MS);
}

/* ===============================
   INIT
================================= */
setInterval(updateClock, 1000);
updateClock();

if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
    screen.orientation.addEventListener("change", handleOrientationChange);
    handleOrientationChange();
} else if ("DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", handleDeviceOrientation);
}
