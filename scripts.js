/* Minimal, production-ready orientation handling:
   - Prefer Screen Orientation API for mode switching.
   - Fallback for upside-down Timer using DeviceOrientation (beta/gamma).
   - Debounced (500ms) + dead-zone to avoid flicker on shakes.
   - iOS motion permission button when needed.
*/

// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showFeature(id){
  $$(".feature").forEach(el => el.classList.add("hidden"));
  $("#"+id).classList.remove("hidden");
}

function setBodyMode(modeClass){
  document.body.classList.remove("mode-alarm","mode-stopwatch","mode-timer","mode-weather");
  document.body.classList.add(modeClass);
}

function setModeByName(name){
  switch(name){
    case "portrait-primary": // Alarm
      showFeature("alarm-clock"); setBodyMode("mode-alarm"); break;
    case "landscape-primary": // Stopwatch
      showFeature("stopwatch"); setBodyMode("mode-stopwatch"); break;
    case "portrait-secondary": // Timer
      showFeature("timer"); setBodyMode("mode-timer"); break;
    case "landscape-secondary": // Weather
      showFeature("weather"); setBodyMode("mode-weather"); break;
  }
  // Debug line
  $("#debug").textContent = `mode: ${name}`;
}

// ---------- Screen Orientation (primary driver) ----------
function orientationToMode(type){
  if (!type) return null;
  if (type.includes("portrait-primary")) return "portrait-primary";
  if (type.includes("portrait-secondary")) return "portrait-secondary";
  if (type.includes("landscape-primary")) return "landscape-primary";
  if (type.includes("landscape-secondary")) return "landscape-secondary";
  return null;
}

function applyScreenOrientation(){
  if (!screen.orientation || !screen.orientation.type) return;
  const mode = orientationToMode(screen.orientation.type);
  if (mode) setModeByName(mode);
}

// ---------- Upside-down fallback with DeviceOrientation ----------
// We primarily use ScreenOrientation. However, some platforms never emit
// `portrait-secondary`. For the Timer, we detect upside-down using:
// - |gamma| < 15° (keeps phone not rolled to the side)  ← "use the gamma thing"
// - beta near ±180°
// We debounce (500ms) so small shakes won't switch modes.

let upsideCandidate = null;
let upsideSince = 0;
const UPSIDE_DEADZONE_GAMMA = 15;     // degrees
const UPSIDE_BETA_MIN = 135;          // near upside-down
const STABLE_MS = 500;

function deviceOrientationHandler(e){
  if (typeof e.beta !== "number" || typeof e.gamma !== "number") return;

  // Only attempt fallback when ScreenOrientation isn't reporting portrait-secondary
  const currentScreen = screen.orientation?.type || "";
  const screenIsTimer = currentScreen.includes("portrait-secondary");

  // "Use gamma thing": require gamma to be close to 0 so the device isn't sideways.
  const gammaOK = Math.abs(e.gamma) <= UPSIDE_DEADZONE_GAMMA;
  const betaUpside = (e.beta >= UPSIDE_BETA_MIN || e.beta <= -UPSIDE_BETA_MIN);

  const detectedUpside = gammaOK && betaUpside;

  // Debounce logic
  if (detectedUpside && !screenIsTimer){
    if (upsideCandidate !== true){
      upsideCandidate = true;
      upsideSince = Date.now();
    } else if (Date.now() - upsideSince >= STABLE_MS){
      setModeByName("portrait-secondary"); // Timer
    }
  } else {
    upsideCandidate = null;
  }

  // Optional: when clearly landscape by gamma, allow quick switch if OS won't rotate
  // (kept conservative to avoid jitter; ScreenOrientation covers landscape cases well)
}

// iOS permission (only needed if Safari blocks sensor)
function ensureMotionPermissionIfNeeded(){
  const btn = $("#enable-motion");
  const needsRequest =
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function";

  if (!needsRequest){ return; }

  btn.classList.remove("hidden");
  btn.onclick = async () => {
    try{
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === "granted"){
        window.addEventListener("deviceorientation", deviceOrientationHandler);
        btn.classList.add("hidden");
      }else{
        alert("Motion permission denied. Upside‑down detection may not work.");
      }
    }catch(err){
      console.error(err);
      alert("Unable to request motion permission.");
    }
  };
}

// ---------- Init ----------
(function init(){
  // Screen Orientation as the primary source
  if (screen.orientation?.addEventListener){
    screen.orientation.addEventListener("change", applyScreenOrientation);
  }
  // Apply immediately on load
  applyScreenOrientation();

  // Fallback sensor for upside‑down
  if ("DeviceOrientationEvent" in window){
    if (typeof DeviceOrientationEvent.requestPermission === "function"){
      // iOS: show button; add listener after permission
      ensureMotionPermissionIfNeeded();
    }else{
      // Android/desktop: allowed by default
      window.addEventListener("deviceorientation", deviceOrientationHandler);
    }
  }

  // Initial debug
  $("#debug").textContent = `mode: (init) ${screen.orientation?.type || "unknown"}`;
})();

// ---------- Alarm ----------
let alarmTimeStr = null;
$("#set-alarm").addEventListener("click", () => {
  const t = $("#alarm-time").value;
  if (!t){ alert("Pick a time"); return; }
  alarmTimeStr = t;
  alert("Alarm set for " + alarmTimeStr);
});
function updateClock(){
  const now = new Date();
  $("#clock-time").textContent = now.toLocaleTimeString();
  // Fire alarm
  if (alarmTimeStr){
    const [hh, mm] = alarmTimeStr.split(":").map(Number);
    if (now.getHours() === hh && now.getMinutes() === mm && now.getSeconds() === 0){
      alert("⏰ Alarm!");
      alarmTimeStr = null;
    }
  }
}
setInterval(updateClock, 1000); updateClock();

// ---------- Stopwatch ----------
let swInterval = null, swStart = 0, swCarry = 0;
function renderStopwatch(ms){
  const s = Math.floor(ms/1000)%60;
  const m = Math.floor(ms/60000)%60;
  const h = Math.floor(ms/3600000);
  $("#stopwatch-time").textContent =
    `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
$("#start-stopwatch").addEventListener("click", () => {
  if (swInterval) return;
  swStart = Date.now();
  swInterval = setInterval(() => renderStopwatch(Date.now() - swStart + swCarry), 250);
});
$("#stop-stopwatch").addEventListener("click", () => {
  if (!swInterval) return;
  clearInterval(swInterval); swInterval = null;
  swCarry += Date.now() - swStart;
});
$("#reset-stopwatch").addEventListener("click", () => {
  clearInterval(swInterval); swInterval = null; swCarry = 0; renderStopwatch(0);
});
renderStopwatch(0);

// ---------- Timer ----------
let timerInterval = null;
let timerTotal = 0;
let timerLeft = 0;

function updateTimerProgress(){
  const CIRC = 439.82;
  const frac = timerTotal > 0 ? Math.max(0, timerLeft / timerTotal) : 0;
  const offset = CIRC * (1 - frac);
  document.querySelector("#timer-circle .progress").style.strokeDashoffset = String(offset);
}

$("#start-timer").addEventListener("click", () => {
  const secs = parseInt($("#timer-input").value, 10);
  if (Number.isNaN(secs) || secs <= 0){ alert("Enter seconds > 0"); return; }
  clearInterval(timerInterval);
  timerTotal = timerLeft = secs;
  $("#timer-display").textContent = timerLeft;
  updateTimerProgress();
  timerInterval = setInterval(() => {
    timerLeft -= 1;
    $("#timer-display").textContent = Math.max(0, timerLeft);
    updateTimerProgress();
    if (timerLeft <= 0){
      clearInterval(timerInterval);
      alert("Time's up!");
    }
  }, 1000);
});

// ---------- Weather (geolocation with fallback) ----------
const OPENWEATHER_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // <-- replace
const FALLBACK_CITY = "London";

async function getWeatherByCoords(lat, lon){
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
  const res = await fetch(url);
  return res.json();
}
async function getWeatherByCity(city){
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_KEY}&units=metric`;
  const res = await fetch(url);
  return res.json();
}
function renderWeather(data){
  if (!data || !data.weather || !data.weather[0]) throw new Error("Bad weather data");
  const { name } = data;
  const { temp } = data.main;
  const { description, icon } = data.weather[0];
  $("#weather-info").textContent = `${name}: ${Math.round(temp)}°C, ${description}`;
  $("#weather-icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
async function loadWeather(){
  try{
    if ("geolocation" in navigator){
      navigator.geolocation.getCurrentPosition(async pos => {
        try{
          const data = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          renderWeather(data);
        }catch{ const data = await getWeatherByCity(FALLBACK_CITY); renderWeather(data); }
      }, async () => {
        const data = await getWeatherByCity(FALLBACK_CITY); renderWeather(data);
      }, { enableHighAccuracy:false, timeout:5000, maximumAge:60000 });
    }else{
      const data = await getWeatherByCity(FALLBACK_CITY); renderWeather(data);
    }
  }catch(err){
    console.error(err);
    $("#weather-info").textContent = "Weather unavailable.";
  }
}
loadWeather();
