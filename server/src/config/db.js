import mongoose from 'mongoose';
import dns from 'node:dns';

export async function connectDB(uri) {
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(','));
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'task_management' });
  console.log('MongoDB connected');
}
