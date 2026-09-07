import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (req, res) => {
  const readyState = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const isConnected = readyState === 1;

  let dbStats = null;
  if (isConnected) {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      dbStats = {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        collectionsCount: collections.length,
        collections: collections.map(c => c.name)
      };
    } catch (e) {
      dbStats = { error: e.message };
    }
  }

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'healthy' : 'degraded',
    service: 'Veridex Finance System API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: statusMap[readyState] || 'Unknown',
      readyState,
      isConnected,
      stats: dbStats
    }
  });
});

export default router;
