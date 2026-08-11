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

function renderStock(stock, symbol) {
  const body = document.getElementById("stock-body");
  if (!body) return;
  if (!stock || !Array.isArray(stock.closes) || stock.closes.length < 2) {
    body.innerHTML = `<p class="error">No ${symbol} quote available yet.</p>`;
    return;
  }

  const { closes, currentPrice, currency } = stock;
  const weekStart = closes[0];
  const change = currentPrice - weekStart;
  const changePct = stock.weekChangePct ?? (change / weekStart) * 100;
  const isUp = change >= 0;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const w = 200;
  const h = 50;
  const points = closes
    .map((v, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  body.innerHTML = `
    <div class="stock-price">${currentPrice.toFixed(2)} <span class="stock-currency">${currency}</span></div>
    <div class="stock-change ${isUp ? "up" : "down"}">${isUp ? "&#9650;" : "&#9660;"} ${Math.abs(change).toFixed(2)} (${changePct.toFixed(2)}%) this week</div>
    <svg class="stock-sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke="${isUp ? "#1d9a4c" : "#dc2626"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

const CATEGORY_ICONS = {
  sports: '<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>',
  world: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
  finance: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
  ai: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>',
};

function hashHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  return hash;
}

function categoryThumb(category, seedText, hidden) {
  const hue = hashHue(seedText || category);
  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.world;
  const style = `background: linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 55% 30%));${hidden ? " display: none;" : ""}`;
  return `<div class="bullet-thumb placeholder" style="${style}">
    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
  </div>`;
}

function renderArticleList(items, category) {
  return `<ul class="bullet-list">${(items || [])
    .map((item) => {
      const thumb = item.image
        ? `<img class="bullet-thumb" src="${item.image}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           ${categoryThumb(category, item.headline, true)}`
        : categoryThumb(category, item.headline, false);
      return `<li>
        ${thumb}
        <div class="bullet-headline">${item.headline}</div>
        <div class="bullet-note">${item.note ?? ""}</div>
        ${item.url ? `<a class="bullet-link" href="${item.url}" target="_blank" rel="noopener">Read full article &rarr;</a>` : ""}
      </li>`;
    })
    .join("")}</ul>`;
}

function formatGeneratedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `Updated ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

async function loadDigest() {
  const sections = [
    { body: "sports-body", field: "sports", note: "note", category: "sports" },
    { body: "worldnews-body", field: "worldNews", note: "why", category: "world" },
    { body: "businessfinance-body", field: "businessFinance", note: "why", category: "finance" },
    { body: "aisales-body", field: "aiSales", note: "takeaway", category: "ai" },
  ];

  try {
    const res = await fetch(`data/digest.json?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const updatedLabel = formatGeneratedAt(data.generatedAt);

    for (const section of sections) {
      const bodyEl = document.getElementById(section.body);
      if (!bodyEl) continue;
      const articles = (data[section.field] || []).map((item) => ({
        headline: item.headline,
        note: item[section.note],
        url: item.url,
        image: item.image,
      }));
      bodyEl.innerHTML = renderArticleList(articles, section.category);
    }

    renderStock(data.stock, data.stock?.symbol ?? "AVGO");

    const stockWidget = document.getElementById("stock-widget");
    if (stockWidget && data.stock?.name) {
      stockWidget.querySelector("h2").textContent = `${data.stock.name} (${data.stock.symbol}) — 1W`;
    }

    const footerNote = document.getElementById("data-updated");
    if (footerNote) footerNote.textContent = updatedLabel;
  } catch (err) {
    const msg = `<p class="error">Couldn't load today's digest (${err.message}).</p>`;
    for (const section of sections) {
      const bodyEl = document.getElementById(section.body);
      if (bodyEl) bodyEl.innerHTML = msg;
    }
    const stockBody = document.getElementById("stock-body");
    if (stockBody) stockBody.innerHTML = msg;
  }
}

setDateHeading();
startClock();
buildCalendar();
loadWeather();
loadDigest();
