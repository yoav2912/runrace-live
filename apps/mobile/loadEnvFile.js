const fs = require('fs');
const path = require('path');

/** Read apps/mobile/.env — ignores Windows system env that may hold old LAN IP */
function loadEnvFile() {
  const env = {};
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

const CLOUD_API = 'https://runrace-api.onrender.com';

function isLocalUrl(url) {
  return /localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\./i.test(url);
}

function resolveUrl(key, fallback = CLOUD_API) {
  const file = loadEnvFile()[key];
  if (file && !isLocalUrl(file)) return file;
  const fromProcess = process.env[key];
  if (fromProcess && !isLocalUrl(fromProcess)) return fromProcess;
  return fallback;
}

module.exports = { loadEnvFile, resolveUrl, CLOUD_API };
