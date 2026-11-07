require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB connection successful: ping returned OK.');
  } catch (error) {
    console.error('MongoDB connection failed.');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
  } finally {
    await client.close();
  }
}

testConnection();
