/**
 * logger.js — Dev-only console logger. No-ops in production builds so the
 * release app stays quiet and slightly faster.
 */
import { IS_DEV } from '../constants/config';

const tag = '[Investly]';

export const logger = {
  log: (...args) => IS_DEV && console.log(tag, ...args),
  info: (...args) => IS_DEV && console.info(tag, ...args),
  warn: (...args) => IS_DEV && console.warn(tag, ...args),
  error: (...args) => IS_DEV && console.error(tag, ...args),
};
