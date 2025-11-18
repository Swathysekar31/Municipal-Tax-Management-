const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const { sendSMS } = require('../utils/smsService');
const Person = require('../models/Person');
const taxScheduler = require('../utils/taxScheduler');
const penaltyCalculator = require('../utils/penaltyCalculator');

// Generate unique customer ID
const generateCustomerId = () => {
    return 'CUST' + Date.now() + Math.floor(Math.random() * 1000);
};

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new user
router.post('/users', auth, adminAuth, async (req, res) => {
    try {
        const {
            old_assessment_no,
            new_assessment_no,
            name,
            dob,
            phone_number,
            gender,
            door_no,
            street,
            city,
            district,
            state,
            pin_code,
            home_type,
            tax_amount,
            water_tax_amount
        } = req.body;

        // Check if phone number already has too many registrations (optional limit)
        const existingUsers = await User.countDocuments({ phone_number });
        if (existingUsers >= 5) {
            return res.status(400).json({ message: 'Maximum registrations reached for this phone number' });
        }

        const customer_id = generateCustomerId();
        const defaultPassword = 'password123';

        const user = new User({
            customer_id,
            old_assessment_no,
            new_assessment_no,
            name,
            dob,
            phone_number,
            gender,
            door_no,
            street,
            city,
            district,
            state,
            pin_code,
            home_type,
            password: defaultPassword,
            'tax_details.property_tax.amount': tax_amount || 0,
            'tax_details.water_tax.amount': water_tax_amount || 0
        });

        await user.save();

        // Upsert person record
        await Person.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                customer_id: user.customer_id,
                name: user.name,
                phone_number: user.phone_number,
                ward_no: user.ward_no,
                door_no: user.door_no,
                property_tax_status: user.tax_details.property_tax.status,
                water_tax_status: user.tax_details.water_tax.status
            },
            { upsert: true, new: true }
        );

        // Send SMS with customer ID
        const message = `Welcome to Municipal Tax System. Your Customer ID: ${customer_id}. Default Password: ${defaultPassword}`;
        await sendSMS(phone_number, message);

        res.status(201).json({ message: 'User created successfully', customer_id });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Assessment number or customer ID already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update tax status
router.put('/users/:id/tax-status', auth, adminAuth, async (req, res) => {
    try {
        const { tax_type, status } = req.body;
        const user = await User.findById(req.params.id);
        
        if (tax_type === 'property') {
            user.tax_details.property_tax.status = status;
        } else if (tax_type === 'water') {
            user.tax_details.water_tax.status = status;
        }
        
        await user.save();
        res.json({ message: 'Tax status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Send regular tax reminders
router.post('/send-tax-reminders', auth, adminAuth, async (req, res) => {
    try {
        console.log('🔄 Admin requested to send tax reminders');
        const result = await taxScheduler.sendTaxReminders();
        
        if (result.success) {
            console.log(`✅ Reminders sent: ${result.sentCount} successful, ${result.failedCount} failed`);
            res.json(result);
        } else {
            console.log('❌ Failed to send reminders:', result.error);
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('🚨 Error in send-tax-reminders:', error);
        res.status(500).json({ success: false, message: 'Error sending reminders', error: error.message });
    }
});

// Send penalty-aware tax reminders
router.post('/send-penalty-reminders', auth, adminAuth, async (req, res) => {
    try {
        console.log('🔄 Admin requested to send penalty-aware tax reminders');
        const result = await taxScheduler.sendPenaltyAwareReminders();
        
        if (result.success) {
            console.log(`✅ Penalty-aware reminders sent: ${result.sentCount} successful, ${result.failedCount} failed`);
            res.json(result);
        } else {
            console.log('❌ Failed to send penalty-aware reminders:', result.error);
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('🚨 Error in send-penalty-reminders:', error);
        res.status(500).json({ success: false, message: 'Error sending penalty-aware reminders', error: error.message });
    }
});

// Search users
router.post('/search-users', auth, adminAuth, async (req, res) => {
    try {
        const { assessmentNumber, phone_number, door_no } = req.body;
        
        let query = {};
        
        if (assessmentNumber) {
            query.$or = [
                { new_assessment_no: assessmentNumber },
                { old_assessment_no: assessmentNumber }
            ];
        } else if (phone_number) {
            query.phone_number = phone_number;
        } else if (door_no) {
            query.door_no = door_no;
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

// Pay water tax (quarterly) - ADMIN VERSION
router.post('/pay-water-tax', auth, adminAuth, async (req, res) => {
    try {
        const { userId, period, amount, quarter } = req.body;
        
        console.log('💧 Admin water tax payment:', { userId, period, amount, quarter });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const receiptNumber = 'WTR' + Date.now();
        
        // Update specific quarter payment
        if (quarter && quarter !== 'full') {
            // Calculate penalty for this quarter before payment
            const penaltyDetails = penaltyCalculator.calculateWaterTaxPenalty(user, quarter);
            const originalAmount = penaltyDetails.originalAmount;
            const penaltyAmount = penaltyDetails.penaltyAmount;
            
            console.log(`💰 Admin payment breakdown for ${quarter}:`);
            console.log(`   Original amount: ₹${originalAmount}`);
            console.log(`   Penalty amount: ₹${penaltyAmount}`);
            console.log(`   Total amount: ₹${amount}`);
            
            user.tax_details.water_tax[`${quarter}_paid`] = true;
            user.tax_details.water_tax[`${quarter}_receipt`] = receiptNumber;
            user.tax_details.water_tax.last_paid_date = new Date();
            
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
                penalty_amount: penaltyAmount,
                original_amount: originalAmount
            });

            console.log(`✅ Updated quarter ${quarter} for user ${user.name}`);
        } else if (quarter === 'full') {
            // Pay all unpaid quarters
            const quarters = ['q1', 'q2', 'q3', 'q4'];
            quarters.forEach(q => {
                if (!user.tax_details.water_tax[`${q}_paid`]) {
                    user.tax_details.water_tax[`${q}_paid`] = true;
                    user.tax_details.water_tax[`${q}_receipt`] = receiptNumber;
                    
                    user.tax_details.water_tax.payment_history.push({
                        period: `Full Year ${new Date().getFullYear()}`,
                        amount: amount,
                        paid_date: new Date(),
                        due_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                        receipt_number: receiptNumber,
                        quarter: q
                    });
                }
            });
            user.tax_details.water_tax.last_paid_date = new Date();
            console.log(`✅ Paid full water tax for user ${user.name}`);
        }

        // Update overall water tax status
        const quarters = ['q1_paid', 'q2_paid', 'q3_paid', 'q4_paid'];
        const allPaid = quarters.every(q => user.tax_details.water_tax[q]);
        if (allPaid) {
            user.tax_details.water_tax.status = 'paid';
        } else {
            user.tax_details.water_tax.status = 'partial';
        }

        await user.save();

        // Reflect in person collection
        await Person.findOneAndUpdate(
            { userId: user._id },
            { water_tax_status: user.tax_details.water_tax.status },
            { upsert: true }
        );
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
        console.error('❌ Error processing admin water tax payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed', 
            error: error.message 
        });
    }
});

// Pay property tax - ADMIN VERSION
router.post('/pay-property-tax', auth, adminAuth, async (req, res) => {
    try {
        const { userId, period, amount } = req.body;
        
        console.log('🏠 Admin property tax payment:', { userId, period, amount });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

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
            due_date: new Date(new Date().getFullYear() + 1, 2, 31),
            receipt_number: receiptNumber
        });

        await user.save();

        // Reflect in person collection
        await Person.findOneAndUpdate(
            { userId: user._id },
            { property_tax_status: user.tax_details.property_tax.status },
            { upsert: true }
        );
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
        console.error('❌ Error processing admin property tax payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed', 
            error: error.message 
        });
    }
});

// Get detailed tax breakdown for a user
router.get('/users/:id/tax-breakdown', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate detailed breakdowns
        const propertyBreakdown = getPropertyTaxBreakdown(user);
        const waterBreakdown = getWaterTaxBreakdown(user);
        
        const taxBreakdown = {
            propertyTax: propertyBreakdown,
            waterTax: waterBreakdown,
            summary: {
                totalDue: (user.tax_details.property_tax.status === 'pending' ? user.tax_details.property_tax.amount : 0) +
                         (user.tax_details.water_tax.status !== 'paid' ? user.tax_details.water_tax.amount : 0),
                status: user.tax_details.property_tax.status === 'paid' && 
                       user.tax_details.water_tax.status === 'paid' ? 'fully_paid' : 'pending'
            }
        };

        res.json(taxBreakdown);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user payment history
router.get('/users/:id/payment-history', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const paymentHistory = {
            propertyTax: user.tax_details.property_tax.payment_history || [],
            waterTax: user.tax_details.water_tax.payment_history || []
        };

        res.json(paymentHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper functions for tax breakdown (NO PENALTIES)
function getPropertyTaxBreakdown(user) {
    const propertyTax = user.tax_details.property_tax;
    const halfYearlyAmount = propertyTax.amount / 2;
    
    return [
        {
            period: '2025-2026 (April-September) - First Half',
            amount: halfYearlyAmount,
            status: propertyTax.status,
            receiptNumber: propertyTax.payment_history?.[0]?.receipt_number || '',
            dueDate: '2025-09-30',
            paidDate: propertyTax.payment_history?.[0]?.paid_date || null
        },
        {
            period: '2025-2026 (October-March) - Second Half',
            amount: halfYearlyAmount,
            status: propertyTax.status,
            receiptNumber: propertyTax.payment_history?.[1]?.receipt_number || '',
            dueDate: '2026-03-31',
            paidDate: propertyTax.payment_history?.[1]?.paid_date || null
        }
    ];
}

function getWaterTaxBreakdown(user) {
    const dailyRate = 2;
    const quarters = [
        { key: 'q1_paid', name: 'Q1 (April-June)', days: 91, period: '2025-04-01 to 2025-06-30', dueDate: '2025-06-30' },
        { key: 'q2_paid', name: 'Q2 (July-September)', days: 92, period: '2025-07-01 to 2025-09-30', dueDate: '2025-09-30' },
        { key: 'q3_paid', name: 'Q3 (October-December)', days: 92, period: '2025-10-01 to 2025-12-31', dueDate: '2025-12-31' },
        { key: 'q4_paid', name: 'Q4 (January-March)', days: 90, period: '2026-01-01 to 2026-03-31', dueDate: '2026-03-31' }
    ];

    return quarters.map(quarter => {
        const amount = dailyRate * quarter.days;
        const isPaid = user.tax_details.water_tax[quarter.key];
        const receipt = user.tax_details.water_tax[`${quarter.key.split('_')[0]}_receipt`];
        const paymentRecord = user.tax_details.water_tax.payment_history?.find(
            payment => payment.quarter === quarter.key.split('_')[0]
        );
        
        return {
            ...quarter,
            amount: Math.round(amount * 100) / 100,
            status: isPaid ? 'paid' : 'pending',
            receiptNumber: receipt || '',
            dueDate: quarter.dueDate,
            paidDate: paymentRecord?.paid_date || null,
            quarterKey: quarter.key.split('_')[0]
        };
    });
}

// Generate receipt for admin
router.post('/generate-receipt', auth, adminAuth, async (req, res) => {
    try {
        const { userId, taxType, period, amount, quarter } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const receiptNumber = taxType === 'water' ? 'WTR' + Date.now() : 'PTX' + Date.now();
        
        const receiptData = {
            receiptNumber,
            transactionId: receiptNumber,
            customerName: user.name,
            doorNo: user.door_no,
            wardNo: user.ward_no,
            taxType: taxType === 'water' ? 'Water Charges' : 'Property Tax',
            amount: amount,
            period: period,
            paymentDate: new Date().toLocaleDateString(),
            quarter: quarter || ''
        };

        res.json({
            success: true,
            receiptData,
            message: 'Receipt generated successfully'
        });
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ success: false, message: 'Error generating receipt', error: error.message });
    }
});

// Tax status summary for dashboard charts
router.get('/tax-status-summary', auth, adminAuth, async (req, res) => {
    try {
        const [
            totalUsers,
            propertyPaid,
            waterPaid,
            waterPartial
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ 'tax_details.property_tax.status': 'paid' }),
            User.countDocuments({ 'tax_details.water_tax.status': 'paid' }),
            User.countDocuments({ 'tax_details.water_tax.status': 'partial' })
        ]);

        const propertyNotPaid = Math.max(0, totalUsers - propertyPaid);
        const waterNotPaid = Math.max(0, totalUsers - (waterPaid + waterPartial));

        res.json({
            property: { paid: propertyPaid, notPaid: propertyNotPaid },
            water: { paid: waterPaid, partial: waterPartial, notPaid: waterNotPaid },
            totals: { users: totalUsers }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Detailed tax report listing who paid and who not
router.get('/tax-report', auth, adminAuth, async (req, res) => {
    try {
        const projection = 'customer_id name phone_number door_no ward_no tax_details.property_tax.status tax_details.water_tax.status';

        const [allUsers] = await Promise.all([
            User.find().select(projection)
        ]);

        const property = {
            paid: [],
            notPaid: []
        };
        const water = {
            paid: [],
            partial: [],
            notPaid: []
        };

        allUsers.forEach(u => {
            const userLite = {
                customer_id: u.customer_id,
                name: u.name,
                phone_number: u.phone_number,
                door_no: u.door_no,
                ward_no: u.ward_no
            };

            if (u.tax_details?.property_tax?.status === 'paid') {
                property.paid.push(userLite);
            } else {
                property.notPaid.push(userLite);
            }

            const waterStatus = u.tax_details?.water_tax?.status;
            if (waterStatus === 'paid') {
                water.paid.push(userLite);
            } else if (waterStatus === 'partial') {
                water.partial.push(userLite);
            } else {
                water.notPaid.push(userLite);
            }
        });

        res.json({ property, water });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Sync all users into person collection
router.post('/sync-person-status', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find();
        let upserts = 0;
        for (const u of users) {
            await Person.findOneAndUpdate(
                { userId: u._id },
                {
                    userId: u._id,
                    customer_id: u.customer_id,
                    name: u.name,
                    phone_number: u.phone_number,
                    ward_no: u.ward_no,
                    door_no: u.door_no,
                    property_tax_status: u.tax_details.property_tax.status,
                    water_tax_status: u.tax_details.water_tax.status
                },
                { upsert: true, new: true }
            );
            upserts += 1;
        }
        res.json({ success: true, upserts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sync failed', error: error.message });
    }
});

// Get user statistics for dashboard
router.get('/dashboard-stats', auth, adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({
            'tax_details.property_tax.status': 'paid',
            'tax_details.water_tax.status': 'paid'
        });
        const pendingUsers = await User.countDocuments({
            $or: [
                { 'tax_details.property_tax.status': 'pending' },
                { 'tax_details.water_tax.status': { $in: ['pending', 'partial'] } }
            ]
        });

        // Calculate total revenue
        const users = await User.find();
        let totalRevenue = 0;
        let pendingRevenue = 0;

        users.forEach(user => {
            // Property tax revenue
            if (user.tax_details.property_tax.status === 'paid') {
                totalRevenue += user.tax_details.property_tax.amount;
            } else {
                pendingRevenue += user.tax_details.property_tax.amount;
            }

            // Water tax revenue
            if (user.tax_details.water_tax.status === 'paid') {
                totalRevenue += user.tax_details.water_tax.amount;
            } else {
                pendingRevenue += user.tax_details.water_tax.amount;
            }
        });

        const stats = {
            totalUsers,
            paidUsers,
            pendingUsers,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            pendingRevenue: Math.round(pendingRevenue * 100) / 100,
            collectionRate: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Enhanced dashboard stats with additional metrics
router.get('/dashboard-stats-enhanced', auth, adminAuth, async (req, res) => {
    try {
        // Basic counts
        const totalUsers = await User.countDocuments();
        const paidUsers = await User.countDocuments({
            'tax_details.property_tax.status': 'paid',
            'tax_details.water_tax.status': 'paid'
        });
        const pendingUsers = await User.countDocuments({
            $or: [
                { 'tax_details.property_tax.status': 'pending' },
                { 'tax_details.water_tax.status': { $in: ['pending', 'partial'] } }
            ]
        });
        const partialPaidUsers = await User.countDocuments({
            'tax_details.water_tax.status': 'partial'
        });

        // Revenue calculations
        const users = await User.find();
        let totalRevenue = 0;
        let pendingRevenue = 0;
        let propertyTaxRevenue = 0;
        let waterTaxRevenue = 0;

        users.forEach(user => {
            const propTax = user.tax_details.property_tax;
            const waterTax = user.tax_details.water_tax;

            // Property tax
            if (propTax.status === 'paid') {
                totalRevenue += propTax.amount;
                propertyTaxRevenue += propTax.amount;
            } else {
                pendingRevenue += propTax.amount;
            }

            // Water tax
            if (waterTax.status === 'paid') {
                totalRevenue += waterTax.amount;
                waterTaxRevenue += waterTax.amount;
            } else if (waterTax.status === 'partial') {
                // Calculate partial payment for water tax
                const paidQuarters = ['q1_paid', 'q2_paid', 'q3_paid', 'q4_paid'].filter(q => waterTax[q]).length;
                const quarterAmount = waterTax.amount / 4;
                totalRevenue += quarterAmount * paidQuarters;
                waterTaxRevenue += quarterAmount * paidQuarters;
                pendingRevenue += quarterAmount * (4 - paidQuarters);
            } else {
                pendingRevenue += waterTax.amount;
            }
        });

        // Monthly trends (current year)
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = Array(12).fill(0);
        
        users.forEach(user => {
            // Property tax payments this year
            user.tax_details.property_tax.payment_history?.forEach(payment => {
                const paymentDate = new Date(payment.paid_date);
                if (paymentDate.getFullYear() === currentYear) {
                    monthlyRevenue[paymentDate.getMonth()] += payment.amount;
                }
            });

            // Water tax payments this year
            user.tax_details.water_tax.payment_history?.forEach(payment => {
                const paymentDate = new Date(payment.paid_date);
                if (paymentDate.getFullYear() === currentYear) {
                    monthlyRevenue[paymentDate.getMonth()] += payment.amount;
                }
            });
        });

        const stats = {
            overview: {
                totalUsers,
                paidUsers,
                pendingUsers,
                partialPaidUsers,
                collectionRate: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
            },
            revenue: {
                total: Math.round(totalRevenue * 100) / 100,
                pending: Math.round(pendingRevenue * 100) / 100,
                propertyTax: Math.round(propertyTaxRevenue * 100) / 100,
                waterTax: Math.round(waterTaxRevenue * 100) / 100
            },
            trends: {
                monthlyRevenue: monthlyRevenue.map(amount => Math.round(amount * 100) / 100),
                currentYear: currentYear
            },
            timestamp: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching enhanced dashboard stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get recent activities for dashboard
router.get('/recent-activities', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().sort({ updatedAt: -1 }).limit(10).select('name customer_id tax_details updatedAt');
        
        const recentActivities = users.map(user => {
            const lastPropertyPayment = user.tax_details.property_tax.payment_history?.slice(-1)[0];
            const lastWaterPayment = user.tax_details.water_tax.payment_history?.slice(-1)[0];
            
            return {
                customerName: user.name,
                customerId: user.customer_id,
                lastUpdated: user.updatedAt,
                propertyTaxStatus: user.tax_details.property_tax.status,
                waterTaxStatus: user.tax_details.water_tax.status,
                lastPropertyPayment: lastPropertyPayment ? {
                    date: lastPropertyPayment.paid_date,
                    amount: lastPropertyPayment.amount
                } : null,
                lastWaterPayment: lastWaterPayment ? {
                    date: lastWaterPayment.paid_date,
                    amount: lastWaterPayment.amount
                } : null
            };
        });

        res.json(recentActivities);
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;