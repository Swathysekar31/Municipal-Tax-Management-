const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
//const { sendSMS } = require('../utils/smsService');
//const { sendSMS } = require('../utils/msg91Service');
const { sendSMS } = require('../utils/twilioService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_me';

// Generate unique customer ID
const generateCustomerId = () => {
    return 'CUST' + Date.now() + Math.floor(Math.random() * 1000);
};

// User Registration - UPDATED with new fields
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            phone_number,
            gender,
            ward_no,
            door_no,
            street,
            city,
            district,
            state,
            pin_code,
            password,
            dob,                    // NEW FIELD
            old_assessment_no,      // NEW FIELD
            new_assessment_no       // NEW FIELD
        } = req.body;

        console.log('📝 Registration attempt for:', name);
        console.log('📦 Received data:', { 
            name, 
            phone_number, 
            ward_no, 
            door_no,
            dob,
            old_assessment_no,
            new_assessment_no
        });

        // Quick validation - Only required fields
        if (!name || !phone_number || !gender || !door_no || !street || !city || !district || !state || !pin_code || !password || !ward_no) {
            return res.status(400).json({ 
                success: false,
                message: 'All required fields are missing' 
            });
        }

        // Quick phone validation
        const cleanedPhone = phone_number.toString().replace(/\D/g, '');
        if (cleanedPhone.length !== 10) {
            return res.status(400).json({ 
                success: false,
                message: 'Phone number must be 10 digits' 
            });
        }

        // Quick PIN validation
        const cleanedPin = pin_code.toString().replace(/\D/g, '');
        if (cleanedPin.length !== 6) {
            return res.status(400).json({ 
                success: false,
                message: 'PIN code must be 6 digits' 
            });
        }

        // Check if new_assessment_no already exists (if provided)
        if (new_assessment_no && new_assessment_no.trim() !== '') {
            const existingAssessment = await User.findOne({ 
                new_assessment_no: new_assessment_no.trim() 
            });
            
            if (existingAssessment) {
                return res.status(400).json({
                    success: false,
                    message: 'New Assessment Number already exists. Please use a different number.'
                });
            }
        }

        // Check if combination of name + phone + door_no already exists
        const existingUser = await User.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            phone_number: cleanedPhone,
            door_no: door_no.toString().trim()
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with same name, phone number, and door number already exists.'
            });
        }

        // Count how many users already have this phone number
        const usersWithSamePhone = await User.countDocuments({ phone_number: cleanedPhone });
        console.log(`📱 Phone ${cleanedPhone} is used by ${usersWithSamePhone} users`);

        // Generate customer ID
        const customer_id = generateCustomerId();
        console.log('✅ Generated Customer ID:', customer_id);

        // Format date of birth if provided
        let formattedDob = null;
        if (dob && dob.trim() !== '') {
            formattedDob = new Date(dob);
            if (isNaN(formattedDob.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date of birth format'
                });
            }
        }

        // Create user with new fields
        const user = new User({
            customer_id,
            ward_no: ward_no.toString().trim(),
            name: name.trim(),
            phone_number: cleanedPhone,
            gender,
            door_no: door_no.toString().trim(),
            street: street.trim(),
            city: city.trim(),
            district: district.trim(),
            state: state.trim(),
            pin_code: cleanedPin,
            password,
            role: 'user',
            // NEW FIELDS
            dob: formattedDob,
            old_assessment_no: old_assessment_no ? old_assessment_no.trim() : '',
            new_assessment_no: new_assessment_no ? new_assessment_no.trim() : ''
        });

        // Save user
        await user.save();
        console.log('✅ User saved successfully with new fields');

        // Send SMS with customer ID
        try {
            const smsMessage = `Welcome to Municipal Tax System! Your Customer ID: ${customer_id}. Use this with your password to login. - Municipal Corporation`;
            console.log(`📱 ATTEMPTING REAL SMS to ${cleanedPhone}...`);
    
            const smsResult = await sendSMS(cleanedPhone, smsMessage);
    
            if (smsResult.realSMS) {
                console.log('🎉 REAL SMS DELIVERED to mobile phone!');
                console.log(`📱 User should receive SMS shortly on +91 ${cleanedPhone}`);
            } else {
                console.log('⚠️ SMS sent but may be in simulation mode');
            }
        } catch (smsError) {
            console.log('❌ SMS FAILED - but user registered successfully');
            console.log('💡 User can still login with Customer ID:', customer_id);
            console.log('💡 SMS Error:', smsError.message);
        }

        // Response
        res.status(201).json({ 
            success: true,
            message: 'Registration successful!', 
            customer_id,
            phone: cleanedPhone,
            note: 'Customer ID has been sent to your mobile number.'
        });

    } catch (error) {
        console.error('❌ Registration error:', error.message);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 11000) {
            if (error.keyPattern?.customer_id) {
                errorMessage = 'Customer ID conflict. Please try again.';
            } else if (error.keyPattern?.new_assessment_no) {
                errorMessage = 'Assessment number already exists.';
            }
        } else if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(val => val.message);
            errorMessage = `Validation error: ${errors.join(', ')}`;
        }
        
        res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
});

// User Login remains the same
router.post('/login', async (req, res) => {
    try {
        const { name, phone_number, password, isAdmin } = req.body;
        
        console.log('🔐 Login attempt:', { name, isAdmin });

        if (isAdmin) {
            // Admin login
            const admin = await Admin.findOne({ username: name.trim() });
            if (!admin) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid admin credentials' 
                });
            }

            const isMatch = await admin.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid admin credentials' 
                });
            }

            const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
            
            res.json({
                success: true,
                token,
                user: {
                    id: admin._id,
                    name: admin.username,
                    role: 'admin'
                }
            });
        } else {
            // User login
            const cleanedPhone = phone_number.toString().replace(/\D/g, '');
            
            // Find ALL users with this name and phone number
            const users = await User.find({ 
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
                phone_number: cleanedPhone 
            });
            
            if (users.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid credentials. Please check your name, phone number, and password.' 
                });
            }

            // Try to find the correct user by checking password for each
            let authenticatedUser = null;
            for (const user of users) {
                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    authenticatedUser = user;
                    break;
                }
            }

            if (!authenticatedUser) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid credentials. Please check your name, phone number, and password.' 
                });
            }

            const token = jwt.sign({ id: authenticatedUser._id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
            
            res.json({
                success: true,
                token,
                user: {
                    id: authenticatedUser._id,
                    name: authenticatedUser.name,
                    phone_number: authenticatedUser.phone_number,
                    role: authenticatedUser.role,
                    customer_id: authenticatedUser.customer_id,
                    door_no: authenticatedUser.door_no
                }
            });
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Login failed. Please try again.' 
        });
    }
});

module.exports = router;