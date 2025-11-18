const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use 'muni' as the database name
        let mongoURI = process.env.MONGODB_URI;
        
        // If no MONGODB_URI is provided, use default with 'muni' database
        if (!mongoURI) {
            mongoURI = 'mongodb://localhost:27017/muni';
        } else {
            // If MONGODB_URI is provided but doesn't specify a database, append '/muni'
            if (!mongoURI.includes('/') || mongoURI.endsWith('/')) {
                mongoURI = mongoURI.replace(/\/$/, '') + '/muni';
            }
        }
        
        console.log(`🔗 Connecting to MongoDB: ${mongoURI}`);
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;