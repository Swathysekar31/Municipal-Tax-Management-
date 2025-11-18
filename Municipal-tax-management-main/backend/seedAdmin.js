const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function seedAdmin() {
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
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        
        // Check if admin exists
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const admin = new Admin({
                username: 'admin',
                password: 'admin123', // This will be hashed automatically
                email: 'admin@municipal.com'
            });
            
            await admin.save();
            console.log('✅ Default admin created successfully!');
            console.log('📋 Admin credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   Email: admin@municipal.com');
            console.log('⚠️  Please change the password after first login!');
        } else {
            console.log('✅ Admin user already exists');
            console.log('📋 Existing admin:');
            console.log('   Username: admin');
            console.log('   You can reset password if needed');
        }
        
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

// Run the seeder
seedAdmin();