export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatNumber(value, digits = 1) {
  const number = toNumber(value);
  if (number === null) return '—';
  return number.toFixed(digits);
}

export function formatInteger(value) {
  const number = toNumber(value);
  if (number === null) return '—';
  return Math.round(number).toString();
}

export function formatBytes(bytes) {
  const number = toNumber(bytes);
  if (number === null) return '—';
  if (number < 1024) return `${number} B`;
  if (number < 1024 * 1024) return `${(number / 1024).toFixed(1)} KB`;
  return `${(number / (1024 * 1024)).toFixed(1)} MB`;
}

export function joinLocation(region, country) {
  const parts = [region, country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function getTimezoneLabel(timeZone) {
  return timeZone ? timeZone.replaceAll('_', ' ') : '—';
}

export function getClockParts(timeZone, date = new Date()) {
  if (!timeZone) return null;

  try {
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return {
      time: timeFormatter.format(date),
      shortDate: shortDateFormatter.format(date),
      longDate: longDateFormatter.format(date),
    };
  } catch {
    return null;
  }
}

/**
 * Parses WeatherAPI's `local 2026-11-15 15:21` string without applying the
 * browser's timezone. This is a fallback when a runtime cannot resolve tz_id.
 */
export function parseApiLocaltime(localtime) {
  const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(localtime ?? '');
  if (!match) return null;

  const [, year, month, day, hours, minutes] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return {
    time: `${hours}:${minutes}`,
    shortDate: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(utcDate),
    longDate: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(utcDate),
  };
}

export function formatApiClock(localtime) {
  const parsed = parseApiLocaltime(localtime);
  return parsed ? parsed.time : '—';
}

export function formatUpdatedTimestamp(localtime) {
  const parsed = parseApiLocaltime(localtime);
  if (!parsed) return '—';
  return `${parsed.time} local · ${parsed.shortDate}`;
}

export function getHumidityNote(humidity) {
  const value = toNumber(humidity);
  if (value === null) return 'Awaiting live data';
  if (value < 30) return 'Dry air';
  if (value <= 60) return 'Comfortable humidity';
  if (value <= 80) return 'Humid conditions';
  return 'Very humid';
}

export function getWindNote(windKph, windDir, gustKph) {
  const wind = toNumber(windKph);
  if (wind === null) return 'Awaiting live data';
  const direction = getWindDirectionName(windDir);
  const gust = toNumber(gustKph);

  if (direction && gust !== null) return `From ${direction} · gusts ${gust.toFixed(1)} km/h`;
  if (direction) return `From ${direction}`;
  if (gust !== null) return `Gusts ${gust.toFixed(1)} km/h`;
  return 'Sustained wind';
}

export function getUvInfo(uv) {
  const value = toNumber(uv);
  if (value === null) return { key: 'unknown', label: 'Awaiting live data' };
  if (value < 3) return { key: 'low', label: 'Low exposure risk' };
  if (value < 6) return { key: 'moderate', label: 'Moderate exposure risk' };
  if (value < 8) return { key: 'high', label: 'High exposure risk' };
  if (value < 11) return { key: 'very-high', label: 'Very high exposure risk' };
  return { key: 'extreme', label: 'Extreme exposure risk' };
}

export function getWindDirectionName(direction) {
  if (!direction) return '';
  const names = {
    N: 'the north',
    NNE: 'the north-northeast',
    NE: 'the northeast',
    ENE: 'the east-northeast',
    E: 'the east',
    ESE: 'the east-southeast',
    SE: 'the southeast',
    SSE: 'the south-southeast',
    S: 'the south',
    SSW: 'the south-southwest',
    SW: 'the southwest',
    WSW: 'the west-southwest',
    W: 'the west',
    WNW: 'the west-northwest',
    NW: 'the northwest',
    NNW: 'the north-northwest',
  };
  return names[String(direction).toUpperCase()] ?? String(direction);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
