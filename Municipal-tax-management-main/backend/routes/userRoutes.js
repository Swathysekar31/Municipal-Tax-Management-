const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { sendSMS } = require('../utils/twilioService');
const penaltyCalculator = require('../utils/penaltyCalculator');
const jwt = require('jsonwebtoken');

// User login
router.post('/login', async (req, res) => {
    try {
        const { name, phone_number, password } = req.body;
        
        const user = await User.findOne({ 
            name: new RegExp(name, 'i'), 
            phone_number 
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                phone_number: user.phone_number,
                role: user.role,
                customer_id: user.customer_id
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Test payment route
router.post('/test-payment', auth, async (req, res) => {
    try {
        console.log('✅ Payment test route hit');
        console.log('📦 Request body:', req.body);
        console.log('👤 User ID:', req.user.id);
        
        res.json({ 
            success: true, 
            message: 'Payment test successful',
            user: req.user.id,
            data: req.body
        });
    } catch (error) {
        console.error('❌ Payment test error:', error);
        res.status(500).json({ success: false, message: 'Payment test failed' });
    }
});

// Get water tax details with penalty calculations
router.get('/water-tax-details', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const waterTaxDetails = penaltyCalculator.calculateTotalWaterTaxWithPenalties(user);
        const detailedBreakdown = penaltyCalculator.getDetailedPenaltyBreakdown(user);

        res.json({
            success: true,
            data: {
                ...waterTaxDetails,
                detailedBreakdown,
                user: {
                    name: user.name,
                    customer_id: user.customer_id,
                    door_no: user.door_no,
                    ward_no: user.ward_no,
                    street: user.street
                }
            }
        });
    } catch (error) {
        console.error('Error fetching water tax details:', error);
        res.status(500).json({ success: false, message: 'Error fetching water tax details' });
    }
});

// Pay water tax (quarterly) - User route
router.post('/pay-water-tax', auth, async (req, res) => {
    try {
        console.log('💧 Water tax payment request received');
        console.log('📦 Request body:', req.body);
        console.log('👤 User ID:', req.user.id);

        const { period, amount, quarter, transactionId, paymentMethod } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!period || !amount || !quarter) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: period, amount, quarter' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('👤 User found:', user.name);
        console.log('💰 Payment amount:', amount);

        const receiptNumber = 'WTR' + Date.now();
        
        // Calculate penalty for this quarter before payment
        const penaltyDetails = penaltyCalculator.calculateWaterTaxPenalty(user, quarter);
        const originalAmount = penaltyDetails.originalAmount;
        const penaltyAmount = penaltyDetails.penaltyAmount;
        
        console.log(`💰 Payment breakdown for ${quarter}:`);
        console.log(`   Original amount: ₹${originalAmount}`);
        console.log(`   Penalty amount: ₹${penaltyAmount}`);
        console.log(`   Total amount: ₹${amount}`);
        
        // Update specific quarter payment
        user.tax_details.water_tax[`${quarter}_paid`] = true;
        user.tax_details.water_tax[`${quarter}_receipt`] = receiptNumber;
        user.tax_details.water_tax.last_paid_date = new Date();
        user.tax_details.water_tax.amount = amount; // Update the amount
        
        // Add penalty to penalty history if there was penalty
        if (penaltyAmount > 0) {
            user.tax_details.water_tax.penalty_history.push({
                quarter: quarter,
                original_amount: originalAmount,
                penalty_amount: penaltyAmount,
                months_delayed: penaltyDetails.monthsDelayed,
                calculated_date: new Date(),
                paid_date: new Date()
            });
        }
        
        // Add to payment history with penalty details
        user.tax_details.water_tax.payment_history.push({
            period: period,
            amount: amount,
            paid_date: new Date(),
            due_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            receipt_number: receiptNumber,
            quarter: quarter,
            transaction_id: transactionId,
            payment_method: paymentMethod,
            penalty_amount: penaltyAmount,
            original_amount: originalAmount
        });

        // Update overall water tax status
        const quarters = ['q1_paid', 'q2_paid', 'q3_paid', 'q4_paid'];
        const allPaid = quarters.every(q => user.tax_details.water_tax[q]);
        if (allPaid) {
            user.tax_details.water_tax.status = 'paid';
        } else {
            user.tax_details.water_tax.status = 'partial';
        }

        await user.save();
        console.log('✅ Water tax payment saved to database');

        // Send SMS confirmation
        try {
            const message = `Thank you! Your water tax of ₹${amount} for ${period} has been paid successfully. Receipt No: ${receiptNumber} - Municipal Corporation`;
            await sendSMS(user.phone_number, message);
            console.log('📱 SMS sent successfully');
        } catch (smsError) {
            console.log('⚠️ SMS failed but payment recorded:', smsError.message);
        }

        res.json({ 
            success: true, 
            message: 'Water tax payment recorded successfully',
            receiptNumber: receiptNumber
        });

    } catch (error) {
        console.error('❌ Error processing water tax payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed', 
            error: error.message 
        });
    }
});

// Pay property tax - User route
router.post('/pay-property-tax', auth, async (req, res) => {
    try {
        console.log('🏠 Property tax payment request received');
        console.log('📦 Request body:', req.body);
        console.log('👤 User ID:', req.user.id);

        const { period, amount, transactionId, paymentMethod } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!period || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: period, amount' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('👤 User found:', user.name);
        console.log('💰 Payment amount:', amount);

        const receiptNumber = 'PTX' + Date.now();
        
        // Update property tax
        user.tax_details.property_tax.status = 'paid';
        user.tax_details.property_tax.last_paid_date = new Date();
        user.tax_details.property_tax.amount = amount;
        
        // Add to payment history
        user.tax_details.property_tax.payment_history.push({
            period: period,
            amount: amount,
            paid_date: new Date(),
            due_date: new Date(new Date().getFullYear() + 1, 2, 31), // March 31 next year
            receipt_number: receiptNumber,
            transaction_id: transactionId,
            payment_method: paymentMethod
        });

        await user.save();
        console.log('✅ Property tax payment saved to database');

        // Send SMS confirmation
        try {
            const message = `Thank you! Your property tax of ₹${amount} for ${period} has been paid successfully. Receipt No: ${receiptNumber} - Municipal Corporation`;
            await sendSMS(user.phone_number, message);
            console.log('📱 SMS sent successfully');
        } catch (smsError) {
            console.log('⚠️ SMS failed but payment recorded:', smsError.message);
        }

        res.json({ 
            success: true, 
            message: 'Property tax payment recorded successfully',
            receiptNumber: receiptNumber
        });

    } catch (error) {
        console.error('❌ Error processing property tax payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed', 
            error: error.message 
        });
    }
});

// Get user payment history
router.get('/payment-history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('tax_details');
        res.json(user.tax_details);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payment history' });
    }
});

module.exports = router;