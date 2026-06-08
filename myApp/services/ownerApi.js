/**
 * ownerApi.js — Re-exports ownerAPI from the central api.js module.
 *
 * This file exists only for backward-compatibility with any legacy import.
 * All owner API calls are routed through api.js → apiRequest → ASP.NET backend.
 */
export { ownerAPI } from './api';
