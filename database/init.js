const { initializeMySQLDatabase } = require('./db');
require('dotenv').config();

async function run() {
  console.log('🔄 Initializing Residential Society MySQL Database...');
  const res = await initializeMySQLDatabase({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'residential_society_db'
  });

  if (res.success) {
    console.log('✅ ' + res.message);
    process.exit(0);
  } else {
    console.error('❌ Database initialization failed:', res.error);
    console.log('\nTip: Make sure MySQL is running and your DB_PASSWORD in .env is correct.');
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
