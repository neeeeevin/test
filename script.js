// ----------------------
// Feature Switching Logic
// ----------------------

function showFeature(id) {
    document.querySelectorAll(".feature").forEach(f => f.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// ----------------------
// Orientation Detection
// ----------------------

function handleOrientationChange() {
    if (screen.orientation && typeof screen.orientation.type === "string") {
        console.log("✅ Using ScreenOrientation API:", screen.orientation.type);
        setModeFromType(screen.orientation.type);
    }
}

function handleDeviceOrientation(event) {
    const beta = event.beta;   // front/back tilt: 0 (upright) to ±180
    const gamma = event.gamma; // left/right tilt: -90 to 90

    let mode = "";

    // Portrait upright
    if (Math.abs(beta) < 45 && Math.abs(gamma) < 30) {
        mode = "portrait-primary";
    }
    // Portrait upside down
    else if (Math.abs(Math.abs(beta) - 180) < 45 && Math.abs(gamma) < 30) {
        mode = "portrait-secondary";
    }
    // Landscape right-side up
    else if (Math.abs(gamma) > 45 && gamma > 0) {
        mode = "landscape-primary";
    }
    // Landscape left-side up
    else if (Math.abs(gamma) > 45 && gamma < 0) {
        mode = "landscape-secondary";
    }

    if (mode) {
        console.log("⚠️ Using DeviceOrientationEvent fallback:", mode, `(beta: ${beta}, gamma: ${gamma})`);
        setModeFromType(mode);
    }
}

function setModeFromType(type) {
    if (type.includes("portrait-primary")) {
        showFeature("alarm-clock");
    } else if (type.includes("landscape-primary")) {
        showFeature("stopwatch");
    } else if (type.includes("portrait-secondary")) {
        showFeature("timer");
    } else if (type.includes("landscape-secondary")) {
        showFeature("weather");
    }
}

function initOrientationDetection() {
    if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
        screen.orientation.addEventListener("change", handleOrientationChange);
        handleOrientationChange(); // initial check
    } else if ("DeviceOrientationEvent" in window) {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
    } else {
        console.warn("❌ Orientation detection not supported on this device.");
    }
}

initOrientationDetection();

// ----------------------
// Alarm Clock
// ----------------------

function updateClock() {
    const now = new Date();
    document.getElementById("clock-time").textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ----------------------
// Stopwatch
// ----------------------

let stopwatchInterval;
let stopwatchStartTime;
let stopwatchElapsed = 0;

function updateStopwatch() {
    const elapsed = Date.now() - stopwatchStartTime + stopwatchElapsed;
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000) % 60;
    const hrs = Math.floor(elapsed / 3600000);
    document.getElementById("stopwatch-time").textContent =
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

// ----------------------
// Timer
// ----------------------

let timerInterval;

document.getElementById("start-timer").addEventListener("click", () => {
    let timeLeft = parseInt(document.getElementById("timer-input").value, 10);
    document.getElementById("timer-display").textContent = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer-display").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
        }
    }, 1000);
});

// ----------------------
// Weather (default city hardcoded for now)
// ----------------------

const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const CITY = "London";

function fetchWeather() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => {
            const info = `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`;
            document.getElementById("weather-info").textContent = info;
        })
        .catch(err => {
            console.error(err);
            document.getElementById("weather-info").textContent = "Error loading weather.";
        });
}

fetchWeather();
