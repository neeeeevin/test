function showFeature(id) {
    document.querySelectorAll(".feature").forEach(f => f.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function setModeFromType(type) {
    if (type.includes("portrait-primary")) {
        showFeature("alarm-clock");
        document.body.className = "mode-alarm";
    } else if (type.includes("landscape-primary")) {
        showFeature("stopwatch");
        document.body.className = "mode-stopwatch";
    } else if (type.includes("portrait-secondary")) {
        showFeature("timer");
        document.body.className = "mode-timer";
    } else if (type.includes("landscape-secondary")) {
        showFeature("weather");
        document.body.className = "mode-weather";
    }
}

function handleOrientationChange() {
    if (screen.orientation && typeof screen.orientation.type === "string") {
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
        setModeFromType(mode);
    }
}

function detectOrientationNow() {
    if (screen.orientation && typeof screen.orientation.type === "string") {
        setModeFromType(screen.orientation.type);
    }
}

function initOrientationDetection() {
    if (screen.orientation && typeof screen.orientation.addEventListener === "function") {
        screen.orientation.addEventListener("change", handleOrientationChange);
        handleOrientationChange();
    } else if ("DeviceOrientationEvent" in window) {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            const btn = document.createElement("button");
            btn.textContent = "Enable Motion";
            btn.style.position = "fixed";
            btn.style.bottom = "20px";
            btn.style.left = "50%";
            btn.style.transform = "translateX(-50%)";
            document.body.appendChild(btn);

            btn.addEventListener("click", () => {
                DeviceOrientationEvent.requestPermission()
                    .then(state => {
                        if (state === "granted") {
                            window.addEventListener("deviceorientation", handleDeviceOrientation);
                            btn.remove();
                        } else {
                            alert("Permission denied");
                        }
                    });
            });
        } else {
            window.addEventListener("deviceorientation", handleDeviceOrientation);
        }
    }
    detectOrientationNow();
}

initOrientationDetection();

// Clock
function updateClock() {
    const now = new Date();
    document.getElementById("clock-time").textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Stopwatch
let stopwatchInterval, stopwatchStartTime, stopwatchElapsed = 0;
document.getElementById("start-stopwatch").addEventListener("click", () => {
    stopwatchStartTime = Date.now();
    stopwatchInterval = setInterval(() => {
        const elapsed = Date.now() - stopwatchStartTime + stopwatchElapsed;
        const secs = Math.floor(elapsed / 1000) % 60;
        const mins = Math.floor(elapsed / 60000) % 60;
        const hrs = Math.floor(elapsed / 3600000);
        document.getElementById("stopwatch-time").textContent =
            `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    }, 1000);
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

// Timer
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

// Weather
const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const CITY = "London";
function fetchWeather() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("weather-info").textContent =
                `${data.name}: ${data.main.temp}°C, ${data.weather[0].description}`;
            document.getElementById("weather-icon").src =
                `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        })
        .catch(() => {
            document.getElementById("weather-info").textContent = "Error loading weather.";
        });
}
fetchWeather();
