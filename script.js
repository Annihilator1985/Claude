const SOFIA_LAT = 42.6977;
const SOFIA_LON = 23.3219;

const WEATHER_CODES = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  66: "Freezing rain", 67: "Heavy freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Light showers", 81: "Showers", 82: "Violent showers",
  85: "Light snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
};

function weatherDescription(code) {
  return WEATHER_CODES[code] || "Unknown";
}

function setDateHeading() {
  const el = document.getElementById("today-date");
  el.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function startClock() {
  const el = document.getElementById("sofia-clock");
  if (!el) return;
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const tick = () => {
    el.textContent = `${formatter.format(new Date())} Sofia time`;
  };
  tick();
  setInterval(tick, 1000);
}

async function loadWeather() {
  const body = document.getElementById("weather-body");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${SOFIA_LAT}&longitude=${SOFIA_LON}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FSofia`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cw = data.current_weather;

    const daily = data.daily;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const forecastHtml = daily.time
      .map((dateStr, i) => {
        const d = new Date(dateStr);
        const name = dayNames[d.getDay()];
        return `<div class="forecast-day">
          <div class="day-name">${name}</div>
          <div>${weatherDescription(daily.weathercode[i]).split(" ")[0]}</div>
          <div>${Math.round(daily.temperature_2m_max[i])}&deg;/${Math.round(daily.temperature_2m_min[i])}&deg;</div>
        </div>`;
      })
      .join("");

    body.innerHTML = `
      <div class="weather-now">
        <span class="weather-temp">${Math.round(cw.temperature)}&deg;C</span>
        <span class="weather-desc">${weatherDescription(cw.weathercode)}</span>
      </div>
      <div class="weather-details">
        <span>Wind: ${Math.round(cw.windspeed)} km/h</span>
      </div>
      <div class="forecast-row">${forecastHtml}</div>
    `;
  } catch (err) {
    body.innerHTML = `<p class="error">Couldn't load weather (${err.message}).</p>`;
  }
}

async function loadSports() {
  const body = document.getElementById("sports-body");
  const feedUrl = "http://feeds.bbci.co.uk/sport/rss.xml";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, "text/xml");
    const items = Array.from(xml.querySelectorAll("item")).slice(0, 8);
    if (!items.length) throw new Error("No headlines found");

    const listHtml = items
      .map((item) => {
        const title = item.querySelector("title")?.textContent ?? "Untitled";
        const link = item.querySelector("link")?.textContent ?? "#";
        return `<li><a href="${link}" target="_blank" rel="noopener">${title}</a></li>`;
      })
      .join("");

    body.innerHTML = `<ul class="headline-list">${listHtml}</ul>`;
  } catch (err) {
    body.innerHTML = `<p class="error">Couldn't load sports headlines (${err.message}).</p>`;
  }
}

function formatGeneratedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

async function loadDigest() {
  const worldBody = document.getElementById("worldnews-body");
  const worldMeta = document.getElementById("worldnews-meta");
  const aiBody = document.getElementById("aisales-body");
  const aiMeta = document.getElementById("aisales-meta");

  try {
    const res = await fetch(`data/digest.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    worldMeta.textContent = formatGeneratedAt(data.generatedAt);
    aiMeta.textContent = formatGeneratedAt(data.generatedAt);

    worldBody.innerHTML = `<ul class="bullet-list">${(data.worldNews || [])
      .map(
        (item) => `<li>
          <div class="bullet-headline">${item.headline}</div>
          <div class="bullet-note">${item.why}</div>
          ${item.url ? `<a class="bullet-link" href="${item.url}" target="_blank" rel="noopener">Read full article &rarr;</a>` : ""}
        </li>`
      )
      .join("")}</ul>`;

    aiBody.innerHTML = `<ul class="bullet-list">${(data.aiSales || [])
      .map(
        (item) => `<li>
          <div class="bullet-headline">${item.headline}</div>
          <div class="bullet-note">${item.takeaway}</div>
          ${item.url ? `<a class="bullet-link" href="${item.url}" target="_blank" rel="noopener">Read full article &rarr;</a>` : ""}
        </li>`
      )
      .join("")}</ul>`;
  } catch (err) {
    const msg = `<p class="error">Couldn't load today's digest (${err.message}).</p>`;
    worldBody.innerHTML = msg;
    aiBody.innerHTML = msg;
  }
}

setDateHeading();
startClock();
loadWeather();
loadSports();
loadDigest();
