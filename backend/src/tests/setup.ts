// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.API_VERSION = 'v1';
process.env.API_BASE_PATH = '/api';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW = '15';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // Higher limit for tests
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests