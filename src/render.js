import { el } from './dom.js';
import { POPULAR_CITIES } from './constants.js';
import {
  clamp,
  formatApiClock,
  formatInteger,
  formatNumber,
  formatUpdatedTimestamp,
  getClockParts,
  getHumidityNote,
  getTimezoneLabel,
  getUvInfo,
  getWindNote,
  joinLocation,
  parseApiLocaltime,
} from './format.js';
import { weatherIcon, verdictIcon } from './icons.js';
import { getPersonality, getStatusLabel, getWeatherKind, getWeatherTheme } from './weather.js';

const THEME_CLASSES = [
  'theme-clear-day',
  'theme-clear-night',
  'theme-partly-day',
  'theme-partly-night',
  'theme-cloudy',
  'theme-rain',
  'theme-storm',
  'theme-snow',
  'theme-mist',
];

let clockTimer = null;

function setText(node, value) {
  node.textContent = value;
}

export function initClock() {
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  startClock({ tz_id: browserTimeZone, localtime: '' });
}

export function startClock(location) {
  stopClock();

  const emit = () => {
    const parts = getClockParts(location?.tz_id) || parseApiLocaltime(location?.localtime);
    if (!parts) return;

    setText(el.localTime, parts.time);
    setText(el.localDate, parts.shortDate);
    setText(el.topbarTime, parts.time);
    setText(el.heroDate, parts.longDate);
  };

  emit();
  clockTimer = window.setInterval(emit, 15000);
}

export function stopClock() {
  if (clockTimer !== null) {
    window.clearInterval(clockTimer);
    clockTimer = null;
  }
}

export function updateTheme(data) {
  el.body.classList.remove(...THEME_CLASSES);
  el.body.classList.add(getWeatherTheme(data));
}

export function renderReport(data) {
  renderWeather(data);
  renderVerdict(data);
  renderMetrics(data);
  renderDetails(data);
  hideReportAlert();

  el.report.removeAttribute('data-stale');
  el.weatherCard.dataset.state = 'ready';
  el.weatherContent.hidden = false;
  el.initialLoader.hidden = true;
  el.weatherError.hidden = true;

  el.verdictCard.dataset.state = 'ready';
  el.verdictContent.hidden = false;
  el.verdictState.hidden = true;
  el.verdictState.classList.remove('is-loading', 'is-error');
}

function renderWeather(data) {
  const { location, current } = data;
  const kind = getWeatherKind(data);

  setText(el.locationName, location.name || '—');
  setText(el.locationRegion, joinLocation(location.region, location.country));
  setText(el.tempC, formatNumber(current.temp_c, 1));
  setText(el.conditionText, current.condition?.text ?? '—');
  setText(el.feelsLike, `${formatNumber(current.feelslike_c, 1)}°`);
  setText(el.daylight, current.is_day ? 'Daylight' : 'After dark');
  setText(el.lastUpdated, `${formatApiClock(current.last_updated)} local`);
  setText(el.timezone, getTimezoneLabel(location.tz_id));

  el.weatherVisual.dataset.kind = kind;
  el.weatherVisual.innerHTML = weatherIcon(kind);

  updateTheme(data);
  startClock(location);
}

function renderVerdict(data) {
  const personality = getPersonality(data.current);

  el.verdictCard.dataset.verdict = personality.key;
  el.verdictStatus.dataset.status = personality.status;
  setText(el.verdictStatus, getStatusLabel(personality.status));
  el.verdictIcon.innerHTML = verdictIcon(personality.key);
  setText(el.verdictTitle, personality.title);
  setText(el.verdictDescription, personality.description);

  setText(el.basisTemp, `${formatNumber(data.current.temp_c, 1)}°C`);
  setText(el.basisCondition, data.current.condition?.text ?? '—');
  setText(
    el.basisWind,
    `${formatNumber(data.current.wind_kph, 1)} km/h${data.current.wind_dir ? ` · ${data.current.wind_dir}` : ''}`,
  );
}

function renderMetrics(data) {
  const { current } = data;
  const humidity = formatInteger(current.humidity);
  const wind = formatNumber(current.wind_kph, 1);
  const uv = formatNumber(current.uv, 1);
  const uvInfo = getUvInfo(current.uv);

  setText(el.humidity, humidity);
  el.humidityBar.style.width = `${clamp(Number(current.humidity) || 0, 0, 100)}%`;
  setText(el.humidityNote, getHumidityNote(current.humidity));

  setText(el.wind, wind);
  el.windBar.style.width = `${clamp(((Number(current.wind_kph) || 0) / 60) * 100, 0, 100)}%`;
  setText(el.windNote, getWindNote(current.wind_kph, current.wind_dir, current.gust_kph));

  setText(el.uv, uv);
  el.uvBar.style.width = `${clamp(((Number(current.uv) || 0) / 12) * 100, 0, 100)}%`;
  el.uvBar.dataset.level = uvInfo.key;
  setText(el.uvNote, uvInfo.label);
}

function renderDetails(data) {
  const { current } = data;

  setText(el.detailCloud, `${formatInteger(current.cloud)}%`);
  setText(el.detailVisibility, `${formatNumber(current.vis_km, 1)} km`);
  setText(el.detailPressure, `${formatNumber(current.pressure_mb, 1)} mb`);
  setText(el.detailWind, `${formatNumber(current.wind_kph, 1)} km/h`);
  setText(el.detailTempF, `${formatNumber(current.temp_f, 1)}°F`);
  setText(el.detailUpdated, formatUpdatedTimestamp(current.last_updated));
}

export function resetMetrics() {
  setText(el.humidity, '—');
  setText(el.wind, '—');
  setText(el.uv, '—');
  el.humidityBar.style.width = '0%';
  el.windBar.style.width = '0%';
  el.uvBar.style.width = '0%';
  delete el.uvBar.dataset.level;
  setText(el.humidityNote, 'Awaiting live data');
  setText(el.windNote, 'Awaiting live data');
  setText(el.uvNote, 'Awaiting live data');
}

export function resetDetails() {
  setText(el.detailCloud, '—');
  setText(el.detailVisibility, '—');
  setText(el.detailPressure, '—');
  setText(el.detailWind, '—');
  setText(el.detailTempF, '—');
  setText(el.detailUpdated, '—');
}

export function setInitialLoading(city) {
  el.weatherCard.dataset.state = 'loading';
  el.weatherContent.hidden = true;
  el.weatherError.hidden = true;
  el.initialLoader.hidden = false;
  setText(el.initialLoaderText, `Reading the sky for ${city}…`);

  el.verdictCard.dataset.state = 'loading';
  el.verdictContent.hidden = true;
  el.verdictState.hidden = false;
  el.verdictState.classList.add('is-loading');
  el.verdictState.classList.remove('is-error');
  setText(el.verdictStateTitle, 'Reading conditions…');
  setText(el.verdictStateMessage, 'The verdict appears as soon as live data lands.');

  resetMetrics();
  resetDetails();
}

export function setLoading({ loading, city, initial }) {
  el.searchBtn.classList.toggle('is-loading', loading);
  el.searchBtn.setAttribute('aria-busy', String(loading));
  setText(el.searchBtnText, loading ? 'Checking…' : 'Check the sky');
  el.report.setAttribute('aria-busy', String(loading));

  if (loading && !initial) {
    setText(el.loadingText, `Updating report for ${city}…`);
    el.loadingStrip.hidden = false;
    el.report.classList.add('is-refreshing');
  } else {
    el.loadingStrip.hidden = true;
    el.report.classList.remove('is-refreshing');
  }
}

export function showWeatherError({ title, message, canRetry }) {
  el.weatherCard.dataset.state = 'error';
  el.weatherContent.hidden = true;
  el.initialLoader.hidden = true;
  el.weatherError.hidden = false;
  setText(el.weatherErrorTitle, title);
  setText(el.weatherErrorMessage, message);
  el.weatherRetry.hidden = !canRetry;

  el.verdictCard.dataset.state = 'error';
  el.verdictContent.hidden = true;
  el.verdictState.hidden = false;
  el.verdictState.classList.remove('is-loading');
  el.verdictState.classList.add('is-error');
  setText(el.verdictStateTitle, 'Verdict unavailable');
  setText(el.verdictStateMessage, 'We need live conditions to read the sky.');
}

export function showReportAlert({ title, message, context, canRetry }) {
  setText(el.alertTitle, title);
  setText(el.alertMessage, message);
  setText(el.alertContext, context || '');
  el.alertContext.hidden = !context;
  el.alertRetry.hidden = !canRetry;
  el.reportAlert.hidden = false;
  el.report.classList.add('has-alert');
}

export function hideReportAlert() {
  el.reportAlert.hidden = true;
  el.report.classList.remove('has-alert');
}

export function setServiceStatus(status) {
  el.serviceStatus.dataset.status = status;
  const labels = {
    connecting: 'Connecting',
    live: 'Live',
    degraded: 'Degraded',
  };
  setText(el.serviceStatusText, labels[status] ?? 'Unknown');
}

export function setFieldError(message) {
  setText(el.searchError, message);
  if (message) {
    el.input.setAttribute('aria-invalid', 'true');
    el.searchField.classList.add('has-error');
  } else {
    el.input.removeAttribute('aria-invalid');
    el.searchField.classList.remove('has-error');
  }
}

export function clearFieldError() {
  setFieldError('');
}

export function renderChips() {
  const fragment = document.createDocumentFragment();

  for (const city of POPULAR_CITIES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.dataset.city = city;
    button.textContent = city;
    button.setAttribute('aria-pressed', 'false');
    fragment.append(button);
  }

  el.cityChips.append(fragment);
}

export function syncActiveChip({ query, apiName }) {
  const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedQuery = normalize(query);
  const normalizedApiName = normalize(apiName);
  const activeCity = POPULAR_CITIES.find(
    (city) => normalize(city) === normalizedQuery || normalize(city) === normalizedApiName,
  );

  for (const chip of el.cityChips.querySelectorAll('.chip')) {
    const isActive = activeCity === chip.dataset.city;
    chip.classList.toggle('is-active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  }
}

export function clearActiveChip() {
  for (const chip of el.cityChips.querySelectorAll('.chip')) {
    chip.classList.remove('is-active');
    chip.setAttribute('aria-pressed', 'false');
  }
}

export function announce(message) {
  el.liveRegion.textContent = '';
  window.setTimeout(() => {
    el.liveRegion.textContent = message;
  }, 30);
}
