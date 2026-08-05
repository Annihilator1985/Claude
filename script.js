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

function sofiaTimeParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

function buildClockTicks() {
  const group = document.getElementById("clock-ticks");
  if (!group) return;
  const ns = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const outer = 90;
    const inner = i % 3 === 0 ? 78 : 84;
    const x1 = 100 + outer * Math.sin(angle);
    const y1 = 100 - outer * Math.cos(angle);
    const x2 = 100 + inner * Math.sin(angle);
    const y2 = 100 - inner * Math.cos(angle);
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", x1.toFixed(1));
    line.setAttribute("y1", y1.toFixed(1));
    line.setAttribute("x2", x2.toFixed(1));
    line.setAttribute("y2", y2.toFixed(1));
    line.setAttribute("class", "clock-tick");
    group.appendChild(line);
  }
}

function startClock() {
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHand = document.getElementById("second-hand");
  const digital = document.getElementById("sofia-clock-digital");
  if (!hourHand || !minuteHand || !secondHand) return;

  buildClockTicks();

  const digitalFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const tick = () => {
    const now = new Date();
    const { hour, minute, second } = sofiaTimeParts(now);
    const hourDeg = ((hour % 12) + minute / 60) * 30;
    const minuteDeg = (minute + second / 60) * 6;
    const secondDeg = second * 6;

    hourHand.setAttribute("transform", `rotate(${hourDeg} 100 100)`);
    minuteHand.setAttribute("transform", `rotate(${minuteDeg} 100 100)`);
    secondHand.setAttribute("transform", `rotate(${secondDeg} 100 100)`);

    if (digital) digital.textContent = `${digitalFormatter.format(now)} Sofia time`;
  };
  tick();
  setInterval(tick, 1000);
}

function buildCalendar() {
  const title = document.getElementById("calendar-title");
  const weekdaysEl = document.getElementById("calendar-weekdays");
  const gridEl = document.getElementById("calendar-grid");
  if (!title || !weekdaysEl || !gridEl) return;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const year = get("year");
  const month = get("month") - 1;
  const today = get("day");

  title.textContent = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const weekdayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  weekdaysEl.innerHTML = weekdayNames.map((d) => `<div>${d}</div>`).join("");

  const firstDay = new Date(year, month, 1).getDay();
  const leadingBlanks = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let cellsHtml = "";
  for (let i = 0; i < leadingBlanks; i++) {
    cellsHtml += `<div class="calendar-day empty"></div>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today;
    cellsHtml += `<div class="calendar-day${isToday ? " today" : ""}">${day}</div>`;
  }
  gridEl.innerHTML = cellsHtml;
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

function previewImageUrl(articleUrl) {
  return `https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}&meta=false&embed=image.url`;
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || "").trim();
}

function renderArticleList(items) {
  return `<ul class="bullet-list">${(items || [])
    .map((item) => {
      const imgSrc = item.image || (item.url ? previewImageUrl(item.url) : "");
      const img = imgSrc
        ? `<img class="bullet-thumb" src="${imgSrc}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
        : "";
      return `<li>
        ${img}
        <div class="bullet-headline">${item.headline}</div>
        <div class="bullet-note">${item.note ?? ""}</div>
        ${item.url ? `<a class="bullet-link" href="${item.url}" target="_blank" rel="noopener">Read full article &rarr;</a>` : ""}
      </li>`;
    })
    .join("")}</ul>`;
}

async function fetchTextWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function loadSports() {
  const body = document.getElementById("sports-body");
  const feedUrl = "https://feeds.bbci.co.uk/sport/rss.xml";
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(feedUrl)}`,
  ];

  let lastError;
  for (const proxyUrl of proxyUrls) {
    try {
      const text = await fetchTextWithTimeout(proxyUrl);
      const xml = new DOMParser().parseFromString(text, "text/xml");
      if (xml.querySelector("parsererror")) throw new Error("Malformed feed response");
      const items = Array.from(xml.querySelectorAll("item")).slice(0, 15);
      if (!items.length) throw new Error("No headlines found");

      const articles = items.map((item) => {
        const title = item.querySelector("title")?.textContent ?? "Untitled";
        const link = item.querySelector("link")?.textContent ?? "#";
        const description = stripHtml(item.querySelector("description")?.textContent ?? "");
        const thumbnail =
          item.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url") ||
          item.querySelector("enclosure[type^='image']")?.getAttribute("url") ||
          "";
        return { headline: title, note: description, url: link, image: thumbnail };
      });

      body.innerHTML = renderArticleList(articles);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  body.innerHTML = `<p class="error">Couldn't load sports headlines right now (${lastError?.message ?? "unknown error"}). Try refreshing in a bit.</p>`;
}

function formatGeneratedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

async function loadDigest() {
  const sections = [
    { body: "worldnews-body", meta: "worldnews-meta", field: "worldNews", note: "why" },
    { body: "businessfinance-body", meta: "businessfinance-meta", field: "businessFinance", note: "why" },
    { body: "aisales-body", meta: "aisales-meta", field: "aiSales", note: "takeaway" },
  ];

  try {
    const res = await fetch(`data/digest.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const section of sections) {
      const bodyEl = document.getElementById(section.body);
      const metaEl = document.getElementById(section.meta);
      if (metaEl) metaEl.textContent = formatGeneratedAt(data.generatedAt);
      const articles = (data[section.field] || []).map((item) => ({
        headline: item.headline,
        note: item[section.note],
        url: item.url,
        image: item.image,
      }));
      if (bodyEl) bodyEl.innerHTML = renderArticleList(articles);
    }
  } catch (err) {
    const msg = `<p class="error">Couldn't load today's digest (${err.message}).</p>`;
    for (const section of sections) {
      const bodyEl = document.getElementById(section.body);
      if (bodyEl) bodyEl.innerHTML = msg;
    }
  }
}

setDateHeading();
startClock();
buildCalendar();
loadWeather();
loadSports();
loadDigest();
