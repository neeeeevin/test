function showFeature(id) {
    document.querySelectorAll(".feature").forEach(f => f.classList.remove("visible"));
    document.getElementById(id).classList.add("visible");
}

function setMode(mode) {
    if (mode === "portrait-primary") {
        showFeature("alarm-clock");
    } else if (mode === "landscape-primary") {
        showFeature("stopwatch");
    } else if (mode === "portrait-secondary") {
        showFeature("timer");
    } else if (mode === "landscape-secondary") {
        showFeature("weather");
    }
}

// --- Smoothed Gyroscope Detection ---
let lastMode = "";
let modeStableSince = 0;
let currentCandidate = "";

window.addEventListener("deviceorientation", (event) => {
    const beta = event.beta;   // front/back tilt
    const gamma = event.gamma; // left/right tilt
    let detected = "";

    if (beta > -45 && beta < 45 && Math.abs(gamma) < 30) {
        detected = "portrait-primary";
    } else if ((beta > 135 || beta < -135) && Math.abs(gamma) < 30) {
        detected = "portrait-secondary";
    } else if (gamma > 45) {
        detected = "landscape-primary";
    } else if (gamma < -45) {
        detected = "landscape-secondary";
    }

    if (detected) {
        if (detected !== currentCandidate) {
            currentCandidate = detected;
            modeStableSince = Date.now();
        } else if (Date.now() - modeStableSince > 400 && detected !== lastMode) {
            lastMode = detected;
            setMode(detected);
        }
    }
});

// --- Clock ---
function updateClock() {
    document.getElementById("clock-time").textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// --- Stopwatch ---
let stopwatchInterval, stopwatchStartTime, stopwatchElapsed = 0;
function updateStopwatch() {
    const elapsed = Date.now() - stopwatchStartTime + stopwatchElapsed;
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000) % 60;
    const hrs = Math.floor(elapsed / 3600000);
    document.getElementById("stopwatch-time").textContent =
        `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
document.getElementById("start-stopwatch").addEventListener("click", () => {
    stopwatchStartTime = Date.now();
    stopwatchInterval = setInterval(updateStopwatch, 1000);
});
document.getElementById("stop-stopwatch").addEventListener("click", () => {
    clearInterval(stopwatchInterval);
    stopwatchElapsed += Date.now() - stopwatchStartTime;
});
document.getElementById("reset-stopwatch").addEventListener("click", () => {
    clearInterval(stopwatchInterval);
    stopwatchElapsed = 0;
    document.getElementById("stopwatch-time").textContent = "00:00:00";
});

// --- Timer ---
document.getElementById("start-timer").addEventListener("click", () => {
    let timeLeft = parseInt(document.getElementById("timer-input").value, 10);
    document.getElementById("timer-display").textContent = timeLeft;
    const timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer-display").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
        }
    }, 1000);
});

// --- Weather ---
const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${API_KEY}&units=metric`)
    .then(r => r.json())
    .then(data => {
        document.getElementById("weather-info").textContent =
            `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`;
    })
    .catch(() => {
        document.getElementById("weather-info").textContent = "Weather data unavailable";
    });
