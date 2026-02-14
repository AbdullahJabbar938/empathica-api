module.exports = {
  // MongoDB connection options
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
  // Connection settings
  autoIndex: process.env.NODE_ENV !== "production",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};