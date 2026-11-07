/**
 * Environment Variable Validator
 * Validates critical environment variables required for server startup in both
 * development and production environments.
 */

function validateEnv() {
  const errors = [];
  const warnings = [];

  // 1. Database Connection String
  if (!process.env.MONGO_URI) {
    errors.push('MONGO_URI is required. Please set the MongoDB connection string.');
  } else if (
    !process.env.MONGO_URI.startsWith('mongodb://') &&
    !process.env.MONGO_URI.startsWith('mongodb+srv://')
  ) {
    errors.push('MONGO_URI must be a valid connection string starting with mongodb:// or mongodb+srv://');
  }

  // 2. JWT Secret Key
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required to sign and verify authentication tokens.');
  } else if (process.env.JWT_SECRET.length < 32 && process.env.NODE_ENV === 'production') {
    warnings.push('JWT_SECRET is shorter than 32 characters. A longer, high-entropy secret is recommended for production.');
  }

  // 3. CORS Configuration in Production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGIN) {
      warnings.push('CORS_ORIGIN is not defined in production. Requests without a matching origin may be rejected.');
    } else if (process.env.CORS_ORIGIN === '*') {
      errors.push('CORS_ORIGIN cannot be wildcard (*) in production. Specify exact frontend origin(s).');
    }
  }

  // Print warnings if any
  if (warnings.length > 0) {
    console.warn('\n[ENV WARNINGS]');
    warnings.forEach((warn) => console.warn(`  - ${warn}`));
  }

  // If there are fatal errors, log them and stop server startup
  if (errors.length > 0) {
    console.error('\n[FATAL STARTUP ERROR: Environment Configuration]');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('Please verify your .env file or deployment platform environment variables.\n');
    process.exit(1);
  }
}

module.exports = validateEnv;
