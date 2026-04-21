const logger = {
  info: (...args) => console.log('[INFO]', new Date().toLocaleTimeString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toLocaleTimeString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toLocaleTimeString(), ...args),
  debug: (...args) => process.env.NODE_ENV === 'development' && console.log('[DEBUG]', ...args),
  http: (...args) => console.log('[HTTP]', ...args)
};

module.exports = logger;