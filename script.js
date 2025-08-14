// script.js

// Feature elements
const alarmClockEl = document.getElementById('alarm-clock');
const stopwatchEl = document.getElementById('stopwatch');
const timerEl = document.getElementById('timer');
const weatherEl = document.getElementById('weather');

// Clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock-time').textContent =
        now.toLocaleTimeString();
}

// Stopwatch
let stopwatchInterval, stopwatchTime = 0;
function updateStopwatch() {
    const hrs = String(Math.floor(stopwatchTime / 3600)).padStart(2, '0');
    const mins = String(Math.floor((stopwatchTime % 3600) / 60)).padStart(2, '0');
    const secs = String(stopwatchTime % 60).padStart(2, '0');
    document.getElementById('stopwatch-time').textContent = `${hrs}:${mins}:${secs}`;
}
document.getElementById('start-stopwatch').onclick = () => {
    if (!stopwatchInterval) {
        stopwatchInterval = setInterval(() => {
            stopwatchTime++;
            updateStopwatch();
        }, 1000);
    }
};
document.getElementById('stop-stopwatch').onclick = () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
};
document.getElementById('reset-stopwatch').onclick = () => {
    stopwatchTime = 0;
    updateStopwatch();
};

// Timer
let timerInterval, timerRemaining = 0;
document.getElementById('start-timer').onclick = () => {
    const inputSeconds = parseInt(document.getElementById('timer-input').value, 10);
    if (!isNaN(inputSeconds) && inputSeconds > 0) {
        timerRemaining = inputSeconds;
        document.getElementById('timer-display').textContent = timerRemaining;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerRemaining--;
            document.getElementById('timer-display').textContent = timerRemaining;
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                alert("Timer done!");
            }
        }, 1000);
    }
};

// Weather
async function loadWeather() {
    const city = "London"; // hardcoded
    const apiKey = "YOUR_OPENWEATHERMAP_API_KEY"; // replace with your key
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const data = await res.json();
        document.getElementById('weather-info').textContent =
            `${data.name}: ${data.weather[0].description}, ${data.main.temp}°C`;
    } catch (e) {
        document.getElementById('weather-info').textContent = "Failed to load weather.";
    }
}

// Show correct feature
function showFeature(feature) {
    [alarmClockEl, stopwatchEl, timerEl, weatherEl].forEach(el => el.classList.remove('visible'));
    feature.classList.add('visible');
}

// Orientation detection
function handleOrientationChange() {
    const orientationType = screen.orientation.type;
    console.log("Orientation detected:", orientationType);

    if (orientationType.includes("portrait-primary")) {
        showFeature(alarmClockEl);
    } else if (orientationType.includes("landscape-primary")) {
        showFeature(stopwatchEl);
    } else if (orientationType.includes("portrait-secondary")) {
        showFeature(timerEl);
    } else if (orientationType.includes("landscape-secondary")) {
        loadWeather();
        showFeature(weatherEl);
    }
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock();

// Listen for orientation change
if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientationChange);
    handleOrientationChange();
} else if (window.DeviceOrientationEvent) {
    // Fallback for browsers without screen.orientation
    window.addEventListener('deviceorientation', (event) => {
        console.log("Device orientation event:", event.alpha, event.beta, event.gamma);
        // This could be extended for more precise control if needed
    });
}
