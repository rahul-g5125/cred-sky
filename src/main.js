import { DEFAULT_CITY } from './constants.js';
import { fetchWeather, WeatherError } from './api.js';
import { el } from './dom.js';
import { formatApiClock, formatNumber } from './format.js';
import { initJsonViewer, resetJson, setJsonError, setJsonResponse } from './json-view.js';
import {
  announce,
  clearFieldError,
  hideReportAlert,
  initClock,
  renderChips,
  renderReport,
  setFieldError,
  setInitialLoading,
  setLoading,
  setServiceStatus,
  showReportAlert,
  showWeatherError,
  syncActiveChip,
} from './render.js';
import { getPersonality } from './weather.js';

const state = {
  data: null,
  raw: '',
  query: null,
  error: null,
  requestId: 0,
  controller: null,
  lastAttempt: null,
  lastSuccessAt: null,
};

function normalizeCity(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function describeError(error, city) {
  switch (error.kind) {
    case 'invalidCity':
      return {
        title: 'City not found',
        message: `We couldn't find “${city}”. Check the spelling, or try a nearby city.`,
        canRetry: false,
      };
    case 'config':
      return {
        title: 'API configuration error',
        message: 'The weather service key is missing or invalid. Check the API configuration and try again.',
        canRetry: false,
      };
    case 'rateLimit':
      return {
        title: 'Temporary service limit reached',
        message: 'The weather service is at its limit right now. Please wait a moment and try again.',
        canRetry: true,
      };
    case 'network':
      return {
        title: 'No internet connection',
        message: 'We couldn’t reach the weather service. Check your connection and try again.',
        canRetry: true,
      };
    case 'server':
      return {
        title: 'Weather service unavailable',
        message: 'The weather service is having trouble right now. Please try again shortly.',
        canRetry: true,
      };
    case 'timeout':
      return {
        title: 'The request timed out',
        message: 'The weather service took too long to respond. Please try again.',
        canRetry: true,
      };
    case 'unexpected':
      return {
        title: 'Unexpected response',
        message: 'The weather service returned something we didn’t expect. Please try again.',
        canRetry: true,
      };
    default:
      return {
        title: 'Something went wrong',
        message: 'We couldn’t load the sky report. Please try again.',
        canRetry: true,
      };
  }
}

function validateCity(city) {
  if (city) return true;

  setFieldError('Enter a city to check the sky.');
  el.input.focus();
  el.searchField.classList.remove('is-shaking');
  void el.searchField.offsetWidth;
  el.searchField.classList.add('is-shaking');
  announce('Enter a city to check the sky.');
  return false;
}

function handleSearchError(error, city) {
  const details = describeError(error, city);
  const hasData = Boolean(state.data);
  const lastCity = state.data?.location?.name ?? state.query;

  setServiceStatus('degraded');

  if (hasData) {
    showReportAlert({
      title: details.title,
      message: details.message,
      context: `Showing the last successful report for ${lastCity}.`,
      canRetry: details.canRetry,
    });
  } else {
    showWeatherError(details);

    if (error.raw || error.payload) {
      setJsonError({
        data: error.payload,
        raw: error.raw,
        label: `Error response${error.status ? ` · HTTP ${error.status}` : ''}`,
      });
    } else {
      resetJson(details.message);
    }
  }

  announce(`${details.title}. ${details.message}`);
}

async function loadCity(rawCity) {
  const city = normalizeCity(rawCity);
  if (!validateCity(city)) return;

  clearFieldError();
  hideReportAlert();

  const requestId = ++state.requestId;

  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;
  state.lastAttempt = city;

  if (!state.data) {
    setInitialLoading(city);
  }
  setLoading({ loading: true, city, initial: !state.data });

  try {
    const { data, raw } = await fetchWeather(city, { signal: controller.signal });

    if (requestId !== state.requestId) return;

    state.data = data;
    state.raw = raw;
    state.query = city;
    state.error = null;
    state.lastSuccessAt = new Date();

    renderReport(data);
    syncActiveChip({ query: city, apiName: data.location.name });
    setJsonResponse({
      data,
      raw,
      label: `${data.location.name} · ${formatApiClock(data.current.last_updated)} local`,
    });
    setServiceStatus('live');

    document.title = `${data.location.name} · ${formatNumber(data.current.temp_c, 0)}°C — SKY CRED`;

    const personality = getPersonality(data.current);
    announce(
      `${data.location.name}: ${formatNumber(data.current.temp_c, 1)} degrees Celsius, ${data.current.condition.text}. Verdict: ${personality.title}.`,
    );
  } catch (error) {
    if (requestId !== state.requestId) return;

    const normalizedError =
      error instanceof WeatherError
        ? error
        : new WeatherError('Unexpected application error.', { kind: 'unknown' });

    if (normalizedError.kind === 'cancelled') return;

    state.error = normalizedError;
    handleSearchError(normalizedError, city);
  } finally {
    if (requestId === state.requestId) {
      state.controller = null;
      setLoading({ loading: false, city, initial: !state.data });
    }
  }
}

function retryLastAttempt() {
  loadCity(state.lastAttempt || state.query || DEFAULT_CITY);
}

function focusCityInput() {
  el.input.focus();
  el.input.select();
}

function bindEvents() {
  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    loadCity(el.input.value);
  });

  el.input.addEventListener('input', () => {
    if (el.input.getAttribute('aria-invalid') === 'true') {
      clearFieldError();
    }
  });

  el.cityChips.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;

    el.input.value = chip.dataset.city;
    loadCity(chip.dataset.city);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-retry]')) {
      retryLastAttempt();
    }
  });

  el.alertDismiss.addEventListener('click', () => {
    hideReportAlert();
  });

  el.weatherChangeCity.addEventListener('click', focusCityInput);

  el.searchField.addEventListener('animationend', () => {
    el.searchField.classList.remove('is-shaking');
  });

  window.addEventListener('pagehide', () => {
    state.controller?.abort();
  });
}

function init() {
  renderChips();
  initJsonViewer();
  initClock();
  setServiceStatus('connecting');
  resetJson('Waiting for the first response…');
  bindEvents();
  loadCity(DEFAULT_CITY);
}

init();
