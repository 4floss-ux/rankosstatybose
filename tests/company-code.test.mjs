import test from 'node:test';
import assert from 'node:assert/strict';
import { companyCodeError, companyCodeEditError } from '../src/lib/companyCode.js';

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

test('admin rejects newly entered invalid code, allows valid edits and preserves unchanged legacy records', () => {
  assert.ok(companyCodeEditError('UAB pavardė', '123456786'));
  assert.ok(companyCodeEditError('123456787', '123456786'));
  assert.equal(companyCodeEditError('123456786', 'UAB senas įrašas'), '');
  assert.equal(companyCodeEditError('UAB senas įrašas', 'UAB senas įrašas'), '');
  assert.equal(companyCodeEditError('', ''), '');
  assert.ok(companyCodeEditError('', '123456786'));
  assert.equal(companyCodeEditError('1234567', ''), '');
  assert.equal(companyCodeEditError(' 123456786 ', '123456786'), '');
});
