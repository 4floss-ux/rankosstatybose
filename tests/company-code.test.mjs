import test from 'node:test';
import assert from 'node:assert/strict';
import { companyCodeError } from '../src/lib/companyCode.js';

test('rejects missing, arbitrary, malformed and non-ASCII codes', () => {
  for (const value of ['', null, undefined, 'UAB testas', '123', '12345678', '1234567890', '123 456786', '１２３４５６７８６', '0000000', '000000000', 'LT123456786']) {
    assert.ok(companyCodeError(value), String(value));
  }
});
test('validates synthetic 9-digit checksum with both fallback paths', () => {
  for (const value of ['123456786', '100000080', '100000810']) assert.equal(companyCodeError(value), '');
  for (const value of ['123456787', '100000081', '100000811']) assert.ok(companyCodeError(value));
});
test('supports legacy seven-digit format without inventing a modern checksum', () => {
  assert.equal(companyCodeError('1234567'), '');
  assert.equal(companyCodeError(' 1234567 '), '');
  assert.equal(companyCodeError(' 123456786 '), '');
});
