import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyApiError } from './api.js';

test('WeatherAPI no-location codes map to city not found', () => {
  assert.equal(classifyApiError(400, 1006), 'invalidCity');
  assert.equal(classifyApiError(404, 1006), 'invalidCity');
});

test('quota and rate limit codes map to a temporary service error', () => {
  assert.equal(classifyApiError(429, 2007), 'rateLimit');
  assert.equal(classifyApiError(403, 2007), 'rateLimit');
});

test('invalid and disabled key codes map to API configuration errors', () => {
  assert.equal(classifyApiError(401, 2006), 'config');
  assert.equal(classifyApiError(403, 2008), 'config');
  assert.equal(classifyApiError(401, 1002), 'config');
  assert.equal(classifyApiError(403, 2009), 'config');
});

test('server and unexpected failures stay distinct', () => {
  assert.equal(classifyApiError(500, null), 'server');
  assert.equal(classifyApiError(503, null), 'server');
  assert.equal(classifyApiError(400, 1003), 'unexpected');
  assert.equal(classifyApiError(200, null), 'unexpected');
});
