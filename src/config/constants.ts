// Application Configuration Constants

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_DISPLAY: '10MB',
  ALLOWED_TYPES: ['text/csv', 'application/csv'],
  ALLOWED_EXTENSIONS: ['.csv'],
  UPLOAD_TIMEOUT_MS: 30000, // 30 seconds
} as const;

export const VALIDATION = {
  THRESHOLD: {
    MIN: 0,
    MAX: Number.MAX_SAFE_INTEGER,
    HIGH_WARNING_LIMIT: 10000,
  },
  CSV: {
    MIN_COLUMNS: 1,
    MAX_COLUMNS: 100,
    MIN_ROWS: 0,
    MAX_ROWS: 100000,
  },
} as const;

export const UI = {
  ALERT: {
    AUTO_DISMISS_MS: 5000,
    MAX_VISIBLE: 5,
  },
  ANIMATION: {
    TRANSITION_MS: 300,
    SLIDE_IN_DURATION_MS: 300,
  },
  DEBOUNCE: {
    INPUT_MS: 300,
    SEARCH_MS: 500,
  },
} as const;

export const API = {
  ENDPOINTS: {
    UPLOAD: '/api/upload',
  },
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const PROCESSING = {
  BATCH_SIZE: 1000,
  PROGRESS_UPDATE_INTERVAL: 100,
  MAX_PROCESSING_TIME_MS: 60000, // 1 minute
} as const;

export const STORAGE = {
  KEYS: {
    LAST_THRESHOLD: 'csvUploader_lastThreshold',
    USER_PREFERENCES: 'csvUploader_preferences',
    RECENT_FILES: 'csvUploader_recentFiles',
  },
  EXPIRY_DAYS: 30,
} as const;

export const PATTERNS = {
  USAGE_COLUMNS: /usage|consumption|amount|quantity|value|kwh|units|energy/i,
  DATE_COLUMNS: /date|day|month|time|period|billing|timestamp/i,
  CUSTOMER_NAME: /name|customer.*name|client.*name|account.*name/i,
  CUSTOMER_ID: /id|customer.*id|client.*id|account.*id|user.*id/i,
  EMAIL: /email|e-mail|mail/i,
  PHONE: /phone|telephone|mobile|contact/i,
  ADDRESS: /address|location|street|city|zip|postal/i,
} as const;

export const COLORS = {
  SUCCESS: 'green',
  ERROR: 'red',
  WARNING: 'yellow',
  INFO: 'blue',
  PRIMARY: 'indigo',
  SECONDARY: 'gray',
} as const;

export const ENVIRONMENT = {
  DEV: 'development',
  TEST: 'test',
  PROD: 'production',
} as const; 