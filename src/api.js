import { API_ENDPOINT, API_KEY, REQUEST_TIMEOUT_MS } from './constants.js';

export class WeatherError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WeatherError';
    this.kind = options.kind ?? 'unknown';
    this.status = options.status ?? null;
    this.apiCode = options.apiCode ?? null;
    this.raw = options.raw ?? null;
    this.payload = options.payload ?? null;
  }
}

/**
 * Maps WeatherAPI's HTTP/status error combinations to UI-independent error
 * kinds. See https://www.weatherapi.com/docs/#intro-error-codes
 */
export function classifyApiError(status, apiCode) {
  const code = Number(apiCode);

  if (code === 1006 || status === 404) return 'invalidCity';
  if (status === 429 || code === 2007) return 'rateLimit';
  if ([401, 403].includes(status) || [1002, 2006, 2008, 2009].includes(code)) return 'config';
  if (status >= 500) return 'server';
  return 'unexpected';
}

function isWeatherPayload(data) {
  return Boolean(
    data &&
      data.location &&
      typeof data.location.name === 'string' &&
      data.location.name.trim() &&
      data.current &&
      data.current.condition &&
      typeof data.current.condition.text === 'string' &&
      Number.isFinite(Number(data.current.temp_c)) &&
      (data.current.is_day === 0 || data.current.is_day === 1),
  );
}

export async function fetchWeather(city, { signal } = {}) {
  if (!API_KEY) {
    throw new WeatherError('Missing WeatherAPI key.', { kind: 'config' });
  }

  const url = new URL(API_ENDPOINT);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('q', city);

  const controller = new AbortController();
  let timedOut = false;
  let cancelled = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const handleExternalAbort = () => {
    cancelled = true;
    controller.abort();
  };

  if (signal) {
    if (signal.aborted) handleExternalAbort();
    else signal.addEventListener('abort', handleExternalAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const raw = await response.text();
    let payload = null;

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
    }

    if (!response.ok || payload?.error) {
      const apiCode = payload?.error?.code ?? null;
      throw new WeatherError(payload?.error?.message ?? `WeatherAPI request failed (${response.status}).`, {
        kind: classifyApiError(response.status, apiCode),
        status: response.status,
        apiCode,
        raw,
        payload,
      });
    }

    if (!isWeatherPayload(payload)) {
      throw new WeatherError('The weather service returned an unexpected response.', {
        kind: 'unexpected',
        status: response.status,
        raw,
        payload,
      });
    }

    return { data: payload, raw, fetchedAt: new Date() };
  } catch (error) {
    if (error instanceof WeatherError) throw error;
    if (timedOut) {
      throw new WeatherError('The weather service timed out.', { kind: 'timeout' });
    }
    if (cancelled || signal?.aborted) {
      throw new WeatherError('Request cancelled.', { kind: 'cancelled' });
    }
    if (error?.name === 'AbortError') {
      throw new WeatherError('Request cancelled.', { kind: 'cancelled' });
    }
    if (error instanceof TypeError) {
      throw new WeatherError('Unable to reach the weather service.', { kind: 'network' });
    }
    throw new WeatherError('Something unexpected happened while fetching weather.', { kind: 'unknown' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}
