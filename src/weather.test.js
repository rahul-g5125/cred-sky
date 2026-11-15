import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyCondition,
  getPersonality,
  getStatusLabel,
  getWeatherKind,
  getWeatherTheme,
} from './weather.js';

function current(overrides = {}) {
  return {
    temp_c: 24,
    wind_kph: 10,
    uv: 3,
    is_day: 1,
    condition: { text: 'Partly cloudy' },
    ...overrides,
  };
}

test('very cold conditions produce Freeze Frame', () => {
  const verdict = getPersonality(current({ temp_c: 4, condition: { text: 'Clear' } }));
  assert.equal(verdict.key, 'freeze');
  assert.equal(verdict.title, 'Freeze Frame');
  assert.equal(verdict.description, 'Bone-chilling cold. Bundle up tight.');
  assert.equal(verdict.status, 'unfavorable');
});

test('freezing point is inclusive at 10°C', () => {
  assert.equal(getPersonality(current({ temp_c: 10, condition: { text: 'Clear' } })).key, 'freeze');
  assert.equal(getPersonality(current({ temp_c: 10.1, condition: { text: 'Clear' } })).key, 'cold');
});

test('pleasant conditions produce Perfect Day at both thresholds', () => {
  assert.equal(getPersonality(current({ temp_c: 18 })).key, 'perfect');
  assert.equal(getPersonality(current({ temp_c: 30 })).key, 'perfect');
  assert.equal(getPersonality(current({ temp_c: 24 })).title, 'Perfect Day');
  assert.equal(getPersonality(current({ temp_c: 24 })).status, 'favorable');
});

test('very hot conditions produce Sun Alert', () => {
  const verdict = getPersonality(current({ temp_c: 35, condition: { text: 'Sunny' }, uv: 5 }));
  assert.equal(verdict.key, 'heat');
  assert.equal(verdict.title, 'Sun Alert');
  assert.equal(verdict.description, 'Stay hydrated and avoid excessive sun exposure.');
});

test('high UV alone produces Sun Alert', () => {
  assert.equal(getPersonality(current({ temp_c: 25, uv: 8 })).key, 'heat');
  assert.equal(getPersonality(current({ temp_c: 25, uv: 7.9 })).key, 'perfect');
});

test('rain produces Rain Check', () => {
  const verdict = getPersonality(current({ temp_c: 22, condition: { text: 'Moderate rain' } }));
  assert.equal(verdict.key, 'rain');
  assert.equal(verdict.title, 'Rain Check');
  assert.equal(verdict.description, 'Carry an umbrella before stepping out.');
  assert.equal(verdict.status, 'caution');
});

test('wind produces Breezy Mode at 35 km/h', () => {
  const verdict = getPersonality(current({ wind_kph: 35 }));
  assert.equal(verdict.key, 'wind');
  assert.equal(verdict.title, 'Breezy Mode');
  assert.equal(verdict.description, 'Expect strong winds. Dress accordingly.');
});

test('storm outranks rain and heat', () => {
  const verdict = getPersonality(
    current({ temp_c: 38, condition: { text: 'Thundery outbreaks possible' }, wind_kph: 50 }),
  );
  assert.equal(verdict.key, 'storm');
  assert.equal(verdict.title, 'Storm Watch');
});

test('freezing rain outranks rain', () => {
  const verdict = getPersonality(current({ temp_c: 2, condition: { text: 'Light freezing rain' } }));
  assert.equal(verdict.key, 'freeze');
});

test('rain outranks heat in the documented priority order', () => {
  const verdict = getPersonality(current({ temp_c: 36, condition: { text: 'Light rain' }, wind_kph: 40 }));
  assert.equal(verdict.key, 'rain');
});

test('heat outranks wind in the documented priority order', () => {
  const verdict = getPersonality(current({ temp_c: 36, condition: { text: 'Sunny' }, wind_kph: 40 }));
  assert.equal(verdict.key, 'heat');
});

test('fallback personalities keep every temperature covered', () => {
  assert.equal(getPersonality(current({ temp_c: 15, condition: { text: 'Clear' } })).key, 'cold');
  assert.equal(getPersonality(current({ temp_c: 15, condition: { text: 'Clear' } })).title, 'Layer Up');
  assert.equal(getPersonality(current({ temp_c: 32, condition: { text: 'Sunny' }, uv: 4 })).key, 'warm');
  assert.equal(getPersonality(current({ temp_c: 32, condition: { text: 'Sunny' }, uv: 4 })).title, 'Warm Spell');
});

test('missing temperature produces a safe fallback instead of a false verdict', () => {
  const verdict = getPersonality({
    condition: { text: 'Cloudy' },
    wind_kph: 5,
    uv: 1,
    is_day: 1,
  });
  assert.equal(verdict.key, 'unknown');
  assert.equal(verdict.status, 'caution');
});

test('condition classification covers WeatherAPI phrasing', () => {
  assert.equal(classifyCondition('Thundery outbreaks possible'), 'storm');
  assert.equal(classifyCondition('Blowing snow'), 'snow');
  assert.equal(classifyCondition('Light freezing rain'), 'rain');
  assert.equal(classifyCondition('Patchy rain possible'), 'rain');
  assert.equal(classifyCondition('Smoky haze'), 'mist');
  assert.equal(classifyCondition('Freezing fog'), 'mist');
  assert.equal(classifyCondition('Partly cloudy'), 'partly');
  assert.equal(classifyCondition('Overcast'), 'cloudy');
  assert.equal(classifyCondition('Sunny'), 'clear');
});

test('weather icons and themes respond to day/night', () => {
  assert.equal(getWeatherKind({ current: { condition: { text: 'Sunny' }, is_day: 1 } }), 'clear');
  assert.equal(getWeatherKind({ current: { condition: { text: 'Clear' }, is_day: 0 } }), 'clear-night');
  assert.equal(getWeatherKind({ current: { condition: { text: 'Partly cloudy' }, is_day: 0 } }), 'partly-night');
  assert.equal(getWeatherTheme({ current: { condition: { text: 'Sunny' }, is_day: 1 } }), 'theme-clear-day');
  assert.equal(getWeatherTheme({ current: { condition: { text: 'Clear' }, is_day: 0 } }), 'theme-clear-night');
  assert.equal(getWeatherTheme({ current: { condition: { text: 'Smoky haze' }, is_day: 1 } }), 'theme-mist');
});

test('status labels are human readable', () => {
  assert.equal(getStatusLabel('favorable'), 'Favorable');
  assert.equal(getStatusLabel('caution'), 'Caution');
  assert.equal(getStatusLabel('unfavorable'), 'Unfavorable');
});
