import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGO_URI which includes the database name
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📍 URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    
    // Test the connection by listing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Available Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed');
    console.error('Error details:', error.message);
    
    // Try fallback to local MongoDB
    try {
      console.log('🔄 Trying local MongoDB fallback...');
      const conn = await mongoose.connect(process.env.MONGODB_URI_LOCAL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log(`✅ Connected to Local MongoDB: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      
    } catch (localError) {
      console.error('❌ Both Atlas and Local MongoDB connections failed');
      console.error('Atlas Error:', error.message);
      console.error('Local Error:', localError.message);
      process.exit(1);
    }
  }
};

export default connectDB;
