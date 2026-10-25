import { toString } from 'lodash';
import Field from './field';

function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

// Query strings carry booleans spelled out as well as in their compact forms.
const TRUE_SPELLINGS = ['true', 't', '1'];
const FALSE_SPELLINGS = ['false', 'f', '0'];

export default class BooleanField extends Field {
  toDB(value: unknown) {
    if (typeof value === 'boolean') {
      return value;
    }

    // Handle null/undefined values explicitly
    if (value === null || value === undefined) {
      return null;
    }

    if (isStringOrNumber(value)) {
      const normalized = `${value}`.trim().toLowerCase();

      if (TRUE_SPELLINGS.includes(normalized)) {
        return true;
      }

      if (FALSE_SPELLINGS.includes(normalized)) {
        return false;
      }
    }

    return Boolean(value);
  }

  fromDB(value: unknown) {
    if (typeof value === 'boolean') {
      return value;
    }

    const strVal = toString(value);

    if (strVal === '1') {
      return true;
    }
    if (strVal === '0') {
      return false;
    }
    return null;
  }
}
