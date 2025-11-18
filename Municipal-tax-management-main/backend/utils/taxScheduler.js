const User = require('../models/User');
const { sendSMS } = require('./smsService');
const penaltyCalculator = require('./penaltyCalculator');

class TaxScheduler {
    // Manual method to send reminders (call this from admin panel)
    async sendTaxReminders() {
        try {
            const currentPeriod = this.getCurrentTaxPeriod();
            const users = await User.find({
                $or: [
                    { 'tax_details.property_tax.status': 'pending' },
                    { 'tax_details.water_tax.status': { $in: ['pending', 'partial'] } }
                ]
            });

            let sentCount = 0;
            let failedCount = 0;
            
            for (const user of users) {
                try {
                    let message = '';
                    let totalAmount = 0;
                    let hasPending = false;

                    // Check property tax
                    if (user.tax_details.property_tax.status === 'pending') {
                        message += `Property Tax: ₹${user.tax_details.property_tax.amount} is pending. `;
                        totalAmount += user.tax_details.property_tax.amount;
                        hasPending = true;
                    }
                    
                    // Check water tax - handle partial payments with penalty calculation
                    if (user.tax_details.water_tax.status === 'pending' || user.tax_details.water_tax.status === 'partial') {
                        const waterTaxDetails = penaltyCalculator.calculateTotalWaterTaxWithPenalties(user);
                        if (waterTaxDetails.totalAmount > 0) {
                            message += `Water Tax: ₹${waterTaxDetails.totalAmount} is pending`;
                            if (waterTaxDetails.hasAnyPenalty) {
                                message += ` (₹${waterTaxDetails.totalOriginalAmount} + ₹${waterTaxDetails.totalPenaltyAmount} penalty)`;
                            }
                            message += `. `;
                            totalAmount += waterTaxDetails.totalAmount;
                            hasPending = true;
                        }
                    }

                    if (message && hasPending) {
                        message += `Due date: ${this.getDueDate()}. Pay online at municipal portal. - Municipal Corporation`;
                        
                        console.log(`📱 Attempting to send SMS to ${user.name}: ${user.phone_number}`);
                        const smsResult = await sendSMS(user.phone_number, message);
                        
                        if (smsResult.success || smsResult.realSMS) {
                            sentCount++;
                            console.log(`✅ Reminder sent to ${user.name}: ${user.phone_number}`);
                        } else {
                            failedCount++;
                            console.log(`❌ Failed to send to ${user.name}: ${user.phone_number}`);
                        }
                    }
                } catch (userError) {
                    failedCount++;
                    console.error(`❌ Error sending to ${user.name}:`, userError.message);
                }
            }

            return { 
                success: true, 
                sentCount, 
                failedCount,
                totalUsers: users.length,
                message: `Reminders sent: ${sentCount} successful, ${failedCount} failed`
            };
        } catch (error) {
            console.error('Error sending tax reminders:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate water tax due based on unpaid quarters (now includes penalty calculation)
    calculateWaterTaxDue(user) {
        const waterTaxDetails = penaltyCalculator.calculateTotalWaterTaxWithPenalties(user);
        return waterTaxDetails.totalAmount;
    }

    // Send penalty-aware reminders
    async sendPenaltyAwareReminders() {
        try {
            const users = await User.find({
                $or: [
                    { 'tax_details.property_tax.status': 'pending' },
                    { 'tax_details.water_tax.status': { $in: ['pending', 'partial'] } }
                ]
            });

            let sentCount = 0;
            let failedCount = 0;
            
            for (const user of users) {
                try {
                    let message = '';
                    let totalAmount = 0;
                    let hasPending = false;

                    // Check property tax
                    if (user.tax_details.property_tax.status === 'pending') {
                        message += `Property Tax: ₹${user.tax_details.property_tax.amount} is pending. `;
                        totalAmount += user.tax_details.property_tax.amount;
                        hasPending = true;
                    }
                    
                    // Check water tax with penalty details
                    if (user.tax_details.water_tax.status === 'pending' || user.tax_details.water_tax.status === 'partial') {
                        const waterTaxMessage = penaltyCalculator.generateWaterTaxReminderMessage(user);
                        if (waterTaxMessage) {
                            message += waterTaxMessage.replace(`Dear ${user.name}, Water Tax Reminder: `, 'Water Tax: ');
                            const waterTaxDetails = penaltyCalculator.calculateTotalWaterTaxWithPenalties(user);
                            totalAmount += waterTaxDetails.totalAmount;
                            hasPending = true;
                        }
                    }

                    if (message && hasPending) {
                        message += ` Due date: ${this.getDueDate()}. Pay online at municipal portal to avoid further penalties. - Municipal Corporation`;
                        
                        console.log(`📱 Sending penalty-aware SMS to ${user.name}: ${user.phone_number}`);
                        const smsResult = await sendSMS(user.phone_number, message);
                        
                        if (smsResult.success || smsResult.realSMS) {
                            sentCount++;
                            console.log(`✅ Penalty-aware reminder sent to ${user.name}: ${user.phone_number}`);
                        } else {
                            failedCount++;
                            console.log(`❌ Failed to send to ${user.name}: ${user.phone_number}`);
                        }
                    }
                } catch (userError) {
                    failedCount++;
                    console.error(`❌ Error sending to ${user.name}:`, userError.message);
                }
            }

            return { 
                success: true, 
                sentCount, 
                failedCount,
                totalUsers: users.length,
                message: `Penalty-aware reminders sent: ${sentCount} successful, ${failedCount} failed`
            };
        } catch (error) {
            console.error('Error sending penalty-aware reminders:', error);
            return { success: false, error: error.message };
        }
    }

    // Send reminders with penalty
    async sendRemindersWithPenalty() {
        try {
            const users = await User.find({
                $or: [
                    { 'tax_details.property_tax.status': 'pending' },
                    { 'tax_details.water_tax.status': { $in: ['pending', 'partial'] } }
                ]
            });

            let sentCount = 0;
            let failedCount = 0;
            const currentDate = new Date();
            
            for (const user of users) {
                try {
                    let message = 'Tax Reminder: ';
                    let totalAmount = 0;
                    let hasPending = false;

                    // Check property tax with penalty
                    if (user.tax_details.property_tax.status === 'pending') {
                        const penalty = this.calculatePenalty(user.tax_details.property_tax.amount, currentDate);
                        totalAmount += user.tax_details.property_tax.amount + penalty;
                        hasPending = true;
                    }

                    // Check water tax with penalty
                    if (user.tax_details.water_tax.status === 'pending' || user.tax_details.water_tax.status === 'partial') {
                        const waterTaxDue = this.calculateWaterTaxDue(user);
                        if (waterTaxDue > 0) {
                            const penalty = this.calculatePenalty(waterTaxDue, currentDate);
                            totalAmount += waterTaxDue + penalty;
                            hasPending = true;
                        }
                    }

                    if (hasPending && totalAmount > 0) {
                        message += `You have pending taxes with penalty. Total due: ₹${totalAmount.toFixed(2)}. Pay before next due date to avoid additional charges. - Municipal Corporation`;
                        
                        console.log(`📱 Attempting to send penalty reminder to ${user.name}: ${user.phone_number}`);
                        const smsResult = await sendSMS(user.phone_number, message);
                        
                        if (smsResult.success || smsResult.realSMS) {
                            sentCount++;
                            console.log(`✅ Penalty reminder sent to ${user.name}: ${user.phone_number}`);
                        } else {
                            failedCount++;
                            console.log(`❌ Failed to send penalty reminder to ${user.name}: ${user.phone_number}`);
                        }
                    }
                } catch (userError) {
                    failedCount++;
                    console.error(`❌ Error sending penalty reminder to ${user.name}:`, userError.message);
                }
            }

            return { 
                success: true, 
                sentCount, 
                failedCount,
                totalUsers: users.length,
                message: `Penalty reminders sent: ${sentCount} successful, ${failedCount} failed`
            };
        } catch (error) {
            console.error('Error sending penalty reminders:', error);
            return { success: false, error: error.message };
        }
    }

    // Calculate penalty (10% penalty after due date)
    calculatePenalty(amount, currentDate) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() - 1); // Due date was last month (overdue)
        
        if (currentDate > dueDate) {
            return amount * 0.10; // 10% penalty
        }
        return 0;
    }

    getCurrentTaxPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        if (month >= 4 && month <= 9) {
            return `April-September ${year}`;
        } else {
            return `October-March ${month >= 1 && month <= 3 ? year : year + 1}`;
        }
    }

    getDueDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        if (month >= 4 && month <= 9) {
            return `30th September ${year}`;
        } else {
            return `31st March ${year + 1}`;
        }
    }

    // Method to mark tax as paid and send confirmation
    async markTaxAsPaid(userId, taxType, period, amount) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const taxField = `tax_details.${taxType}`;
            const receiptNumber = taxType === 'property' ? 'PTX' + Date.now() : 'WTR' + Date.now();
            
            // Update tax status
            await User.findByIdAndUpdate(userId, {
                [`${taxField}.status`]: 'paid',
                [`${taxField}.last_paid_date`]: new Date(),
                [`${taxField}.amount`]: amount,
                [`${taxField}.payment_history`]: [
                    ...(user.tax_details[taxType].payment_history || []),
                    {
                        period: period,
                        amount: amount,
                        paid_date: new Date(),
                        due_date: this.getDueDateForPeriod(period),
                        receipt_number: receiptNumber
                    }
                ]
            });

            // Send confirmation SMS
            const message = `Thank you! Your ${taxType.replace('_', ' ')} of ₹${amount} for ${period} has been successfully paid. Receipt No: ${receiptNumber} - Municipal Corporation`;
            await sendSMS(user.phone_number, message);

            return { success: true, message: 'Payment recorded successfully', receiptNumber };
        } catch (error) {
            console.error('Error marking tax as paid:', error);
            return { success: false, error: error.message };
        }
    }

    getDueDateForPeriod(period) {
        const yearMatch = period.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
        
        if (period.includes('April-September')) {
            return new Date(year, 8, 30); // September 30
        } else {
            return new Date(year + 1, 2, 31); // March 31 next year
        }
    }
}

module.exports = new TaxScheduler();