const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('--- MongoDB Connection Error ---');
    console.error('Name:   ', error.name);
    console.error('Message:', error.message);
    console.error('Code:   ', error.code);

    if (error.cause) {
      console.error('Cause:  ', error.cause.message);
    }

    // Topology details — lists each server address, type, and its specific error
    if (error.reason?.servers) {
      console.error('Server topology errors:');
      for (const [address, server] of error.reason.servers) {
        console.error(`  [${address}] type=${server.type}, error=${server.error?.message}`);
      }
    }

    console.error('-------------------------------');
    process.exit(1); // Stop the process — no point running without a database
  }
};

module.exports = connectDB;
