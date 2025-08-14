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
    const beta = event.beta;
    const gamma = event.gamma;
    let mode = "";

    if (beta > -45 && beta < 45 && Math.abs(gamma) < 30) {
        mode = "portrait-primary";
    } else if ((beta > 135 || beta < -135) && Math.abs(gamma) < 30) {
        mode = "portrait-secondary";
    } else if (gamma > 45) {
        mode = "landscape-primary";
    } else if (gamma < -45) {
        mode = "landscape-secondary";
    }

    if (mode) {
        console.log("⚠️ Using DeviceOrientationEvent fallback:", mode, `(beta: ${beta.toFixed(2)}, gamma: ${gamma.toFixed(2)})`);
        setModeFromType(mode);
    }
}

function setModeFromType(type) {
    if (type.includes("portrait-primary")) {
        showFeature("alarm-clock");
        document.body.style.background = "#fef5e7";
    } else if (type.includes("landscape-primary")) {
        showFeature("stopwatch");
        document.body.style.background = "#e8f8f5";
    } else if (type.includes("portrait-secondary")) {
        showFeature("timer");
        document.body.style.background = "#fdebd0";
    } else if (type.includes("landscape-secondary")) {
        showFeature("weather");
        document.body.style.background = "#ebf5fb";
    }
}

function detectOrientationNow() {
    if (screen.orientation && typeof screen.orientation.type === "string") {
        setModeFromType(screen.orientation.type);
    }
}

// ----------------------
// Init with iOS Button
// ----------------------
function initOrientationDetection() {
    if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
        screen.orientation.addEventListener("change", handleOrientationChange);
        handleOrientationChange();
    } else if ("DeviceOrientationEvent" in window) {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            // iOS Safari — show button
            const btn = document.createElement("button");
            btn.textContent = "Enable Motion";
            btn.style.position = "fixed";
            btn.style.bottom = "20px";
            btn.style.left = "50%";
            btn.style.transform = "translateX(-50%)";
            btn.style.padding = "10px 20px";
            btn.style.fontSize = "16px";
            btn.style.zIndex = "9999";
            btn.style.background = "#333";
            btn.style.color = "#fff";
            btn.style.border = "none";
            btn.style.borderRadius = "8px";
            btn.style.cursor = "pointer";
            document.body.appendChild(btn);

            btn.addEventListener("click", () => {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === "granted") {
                            window.addEventListener("deviceorientation", handleDeviceOrientation);
                            btn.remove();
                        } else {
                            alert("Motion permission denied. Orientation features will not work.");
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert("Error requesting motion permission.");
                    });
            });
        } else {
            // Android and others — start immediately
            window.addEventListener("deviceorientation", handleDeviceOrientation);
        }
    } else {
        console.warn("❌ Orientation detection not supported on this device.");
    }

    detectOrientationNow();
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
