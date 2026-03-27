export const logInfo = (message, meta = {}) => {
  console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
};

export const logError = (message, error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }),
  );
};

