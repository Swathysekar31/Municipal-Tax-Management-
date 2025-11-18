const User = require('../models/User');

class PenaltyCalculator {
    /**
     * Calculate penalty for water tax based on delay
     * @param {Object} user - User object with tax details
     * @param {String} quarter - Quarter to calculate penalty for (q1, q2, q3, q4)
     * @returns {Object} - Penalty details
     */
    calculateWaterTaxPenalty(user, quarter) {
        const dailyRate = 2; // ₹2 per day
        const penaltyRate = 0.01; // 1% per month
        
        // Quarter configurations
        const quarterConfig = {
            q1: { days: 91, dueDate: new Date('2025-06-30'), name: 'Q1 (April-June)' },
            q2: { days: 92, dueDate: new Date('2025-09-30'), name: 'Q2 (July-September)' },
            q3: { days: 92, dueDate: new Date('2025-12-31'), name: 'Q3 (October-December)' },
            q4: { days: 90, dueDate: new Date('2026-03-31'), name: 'Q4 (January-March)' }
        };

        const config = quarterConfig[quarter];
        if (!config) {
            throw new Error(`Invalid quarter: ${quarter}`);
        }

        // Check if quarter is paid
        const isPaid = user.tax_details.water_tax[`${quarter}_paid`];
        if (isPaid) {
            return {
                hasPenalty: false,
                originalAmount: dailyRate * config.days,
                penaltyAmount: 0,
                totalAmount: dailyRate * config.days,
                monthsDelayed: 0,
                dueDate: config.dueDate,
                currentDate: new Date(),
                quarter: quarter,
                quarterName: config.name
            };
        }

        const originalAmount = dailyRate * config.days;
        const currentDate = new Date();
        const dueDate = config.dueDate;
        
        // Calculate months delayed (only after 1 year from due date)
        const oneYearAfterDue = new Date(dueDate);
        oneYearAfterDue.setFullYear(oneYearAfterDue.getFullYear() + 1);
        
        let monthsDelayed = 0;
        let penaltyAmount = 0;
        let hasPenalty = false;

        if (currentDate > oneYearAfterDue) {
            // Calculate months delayed after 1 year grace period
            const timeDiff = currentDate.getTime() - oneYearAfterDue.getTime();
            monthsDelayed = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
            
            // Calculate penalty: 1% per month on original amount
            penaltyAmount = originalAmount * penaltyRate * monthsDelayed;
            hasPenalty = true;
        }

        const totalAmount = originalAmount + penaltyAmount;

        return {
            hasPenalty,
            originalAmount: Math.round(originalAmount * 100) / 100,
            penaltyAmount: Math.round(penaltyAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            monthsDelayed,
            dueDate,
            oneYearAfterDue,
            currentDate,
            quarter,
            quarterName: config.name,
            gracePeriodEnd: oneYearAfterDue
        };
    }

    /**
     * Calculate total water tax due including penalties for all unpaid quarters
     * @param {Object} user - User object with tax details
     * @returns {Object} - Total water tax details with penalties
     */
    calculateTotalWaterTaxWithPenalties(user) {
        const quarters = ['q1', 'q2', 'q3', 'q4'];
        const quarterDetails = [];
        let totalOriginalAmount = 0;
        let totalPenaltyAmount = 0;
        let totalAmount = 0;

        quarters.forEach(quarter => {
            const penaltyDetails = this.calculateWaterTaxPenalty(user, quarter);
            quarterDetails.push(penaltyDetails);
            
            if (!penaltyDetails.hasPenalty && !user.tax_details.water_tax[`${quarter}_paid`]) {
                // Only add to totals if not paid
                totalOriginalAmount += penaltyDetails.originalAmount;
                totalPenaltyAmount += penaltyDetails.penaltyAmount;
                totalAmount += penaltyDetails.totalAmount;
            }
        });

        return {
            quarterDetails,
            totalOriginalAmount: Math.round(totalOriginalAmount * 100) / 100,
            totalPenaltyAmount: Math.round(totalPenaltyAmount * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            hasAnyPenalty: totalPenaltyAmount > 0
        };
    }

    /**
     * Generate penalty-aware reminder message for water tax
     * @param {Object} user - User object with tax details
     * @returns {String} - Formatted reminder message
     */
    generateWaterTaxReminderMessage(user) {
        const waterTaxDetails = this.calculateTotalWaterTaxWithPenalties(user);
        
        if (waterTaxDetails.totalAmount === 0) {
            return null; // No pending water tax
        }

        let message = `Dear ${user.name}, Water Tax Reminder: `;
        
        // Add quarter-wise details
        const pendingQuarters = waterTaxDetails.quarterDetails.filter(q => 
            !user.tax_details.water_tax[`${q.quarter}_paid`]
        );

        if (pendingQuarters.length > 0) {
            message += `Pending quarters: `;
            pendingQuarters.forEach((quarter, index) => {
                if (index > 0) message += ', ';
                message += `${quarter.quarterName} (₹${quarter.totalAmount}`;
                if (quarter.hasPenalty) {
                    message += ` incl. ₹${quarter.penaltyAmount} penalty for ${quarter.monthsDelayed} months delay`;
                }
                message += ')';
            });
        }

        message += `. Total Due: ₹${waterTaxDetails.totalAmount}`;
        
        if (waterTaxDetails.hasAnyPenalty) {
            message += ` (₹${waterTaxDetails.totalOriginalAmount} + ₹${waterTaxDetails.totalPenaltyAmount} penalty)`;
        }

        message += `. Pay online at municipal portal to avoid further penalties. - Municipal Corporation`;

        return message;
    }

    /**
     * Check if any quarter has penalty and generate detailed breakdown
     * @param {Object} user - User object with tax details
     * @returns {Object} - Detailed penalty breakdown
     */
    getDetailedPenaltyBreakdown(user) {
        const waterTaxDetails = this.calculateTotalWaterTaxWithPenalties(user);
        const pendingQuarters = waterTaxDetails.quarterDetails.filter(q => 
            !user.tax_details.water_tax[`${q.quarter}_paid`]
        );

        return {
            ...waterTaxDetails,
            pendingQuarters,
            summary: {
                totalQuarters: 4,
                paidQuarters: 4 - pendingQuarters.length,
                pendingQuarters: pendingQuarters.length,
                quartersWithPenalty: pendingQuarters.filter(q => q.hasPenalty).length
            }
        };
    }
}

module.exports = new PenaltyCalculator();
