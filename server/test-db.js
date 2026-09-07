import dns from 'node:dns';
// Set public DNS to resolve MongoDB Atlas SRV records reliably on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('--- MongoDB Atlas Connection Test ---');
console.log('Target URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'NOT DEFINED');

async function testConnection() {
  try {
    const startTime = Date.now();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    const duration = Date.now() - startTime;

    console.log(`[SUCCESS] Connected to MongoDB Atlas in ${duration}ms!`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`ReadyState: ${mongoose.connection.readyState} (1 = Connected)`);

    // Ping test
    const adminDb = mongoose.connection.db.admin();
    const pingResult = await adminDb.ping();
    console.log('Ping Response:', pingResult);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing Collections:', collections.map(c => c.name));

    await mongoose.disconnect();
    console.log('[SUCCESS] Disconnected gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('\n[ERROR] Connection failed:');
    console.error('Message:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

testConnection();
