import { PERSONALITY_THRESHOLDS } from './constants.js';

/**
 * WeatherAPI condition text is descriptive, so keyword classification is more
 * resilient than relying on icon URLs or a partial numeric code table.
 */
export function classifyCondition(conditionText = '') {
  const text = String(conditionText).toLowerCase();

  if (/thunder|storm/.test(text)) return 'storm';
  if (/snow|blizzard|ice pellets|sleet/.test(text)) return 'snow';
  if (/freezing rain/.test(text)) return 'rain';
  if (/rain|drizzle|shower/.test(text)) return 'rain';
  if (/fog|mist|haze|smoke|dust|sand/.test(text)) return 'mist';
  if (/partly/.test(text)) return 'partly';
  if (/overcast|cloudy/.test(text)) return 'cloudy';
  if (/sunny|clear/.test(text)) return 'clear';

  return 'cloudy';
}

export function getWeatherKind(data) {
  const category = classifyCondition(data?.current?.condition?.text);
  const isDay = Boolean(data?.current?.is_day);

  if (category === 'clear') return isDay ? 'clear' : 'clear-night';
  if (category === 'partly') return isDay ? 'partly' : 'partly-night';
  return category;
}

export function getWeatherTheme(data) {
  const category = classifyCondition(data?.current?.condition?.text);
  const isDay = Boolean(data?.current?.is_day);

  if (category === 'clear') return isDay ? 'theme-clear-day' : 'theme-clear-night';
  if (category === 'partly') return isDay ? 'theme-partly-day' : 'theme-partly-night';
  if (category === 'rain') return 'theme-rain';
  if (category === 'storm') return 'theme-storm';
  if (category === 'snow') return 'theme-snow';
  if (category === 'mist') return 'theme-mist';
  return 'theme-cloudy';
}

/**
 * Priority order is deliberately explicit:
 * storm → freeze → rain → heat → wind → pleasant → fallbacks.
 *
 * This means a thunderstorm wins over heavy rain, and freezing conditions win
 * over rain. Heat is prioritised over wind because prolonged sun exposure is
 * the more immediate advisory at 35°C+ or UV 8+.
 */
export function getPersonality(current = {}) {
  const thresholds = PERSONALITY_THRESHOLDS;
  const tempC = Number(current.temp_c);
  const windKph = Number(current.wind_kph);
  const uv = Number(current.uv);
  const conditionText = String(current.condition?.text ?? '');
  const category = classifyCondition(conditionText);
  const isFreezingCondition = /freez/i.test(conditionText);

  if (category === 'storm') {
    return {
      key: 'storm',
      title: 'Storm Watch',
      description: 'Storm energy is in the air. Keep plans indoors if you can.',
      status: 'unfavorable',
    };
  }

  if ((Number.isFinite(tempC) && tempC <= thresholds.freezeMaxC) || category === 'snow' || isFreezingCondition) {
    return {
      key: 'freeze',
      title: 'Freeze Frame',
      description: 'Bone-chilling cold. Bundle up tight.',
      status: 'unfavorable',
    };
  }

  if (category === 'rain') {
    return {
      key: 'rain',
      title: 'Rain Check',
      description: 'Carry an umbrella before stepping out.',
      status: 'caution',
    };
  }

  if ((Number.isFinite(tempC) && tempC >= thresholds.heatMinC) || (Number.isFinite(uv) && uv >= thresholds.highUv)) {
    return {
      key: 'heat',
      title: 'Sun Alert',
      description: 'Stay hydrated and avoid excessive sun exposure.',
      status: 'unfavorable',
    };
  }

  if (Number.isFinite(windKph) && windKph >= thresholds.windyMinKph) {
    return {
      key: 'wind',
      title: 'Breezy Mode',
      description: 'Expect strong winds. Dress accordingly.',
      status: 'caution',
    };
  }

  if (
    Number.isFinite(tempC) &&
    tempC >= thresholds.pleasantMinC &&
    tempC <= thresholds.pleasantMaxC
  ) {
    return {
      key: 'perfect',
      title: 'Perfect Day',
      description: 'Great weather to step outside.',
      status: 'favorable',
    };
  }

  if (Number.isFinite(tempC) && tempC < thresholds.pleasantMinC) {
    return {
      key: 'cold',
      title: 'Layer Up',
      description: 'Cool enough for an extra layer. Keep it close.',
      status: 'caution',
    };
  }

  if (Number.isFinite(tempC) && tempC > thresholds.pleasantMaxC) {
    return {
      key: 'warm',
      title: 'Warm Spell',
      description: 'Warm out there. Keep water within reach.',
      status: 'caution',
    };
  }

  return {
    key: 'unknown',
    title: 'Sky Report',
    description: 'Live conditions are in. Use the numbers above to plan your day.',
    status: 'caution',
  };
}

export function getStatusLabel(status) {
  if (status === 'favorable') return 'Favorable';
  if (status === 'unfavorable') return 'Unfavorable';
  return 'Caution';
}

export const PERSONALITY_PRIORITY = [
  'storm',
  'freeze',
  'rain',
  'heat',
  'wind',
  'perfect',
  'cold',
  'warm',
];
