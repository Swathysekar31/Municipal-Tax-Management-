# Database Configuration Guide

## Database Name Changed to "muni"

The database name has been updated to **"muni"** for the Municipal Tax System.

## Environment Variables Setup

Create a `.env` file in the `start/backend/` directory with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/muni

# Server Configuration
PORT=5000

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# SMS Service Configuration
FAST2SMS_API_KEY=your_fast2sms_api_key_here

# Twilio Configuration (if using Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# MSG91 Configuration (if using MSG91)
MSG91_API_KEY=your_msg91_api_key
MSG91_SENDER_ID=your_msg91_sender_id
```

## Database Connection Behavior

The system will now:

1. **Default Connection**: If no `MONGODB_URI` is set, it will connect to `mongodb://localhost:27017/muni`
2. **Environment Override**: If `MONGODB_URI` is set, it will use that connection string
3. **Auto Database Name**: If the connection string doesn't specify a database name, it will automatically append `/muni`

## Files Updated

- `start/backend/config/database.js` - Main database connection
- `start/backend/seedAdmin.js` - Admin seeding script

## Running the Application

1. Make sure MongoDB is running on your system
2. Create the `.env` file with the configuration above
3. Run the backend server: `npm start` (from `start/backend/`)
4. The system will automatically connect to the "muni" database

## Verification

When the server starts, you should see:
```
🔗 Connecting to MongoDB: mongodb://localhost:27017/muni
✅ MongoDB Connected: localhost:27017
📊 Database Name: muni
```

## Collections in "muni" Database

The following collections will be created in the "muni" database:
- `users` - User data and tax information
- `admins` - Admin user accounts
- Other collections as needed by the application
