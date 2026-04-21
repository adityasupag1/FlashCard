const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn('⚠️  MONGO_URI not set — skipping DB connection. Set it in .env');
      return;
    }
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    // Don't exit in dev so the server still boots for inspection
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};

module.exports = connectDB;
