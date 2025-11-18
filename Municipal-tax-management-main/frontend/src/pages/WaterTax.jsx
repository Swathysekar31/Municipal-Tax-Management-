import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './TaxPages.css';
import { downloadReceiptPDF } from '../utils/pdfGenerator';

const WaterTax = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [waterTaxDetails, setWaterTaxDetails] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchUserData();
    }, [location, refreshKey]); // Add refreshKey to dependencies

    const fetchUserData = async () => {
        try {
            const response = await API.get('/users/profile');
            setUserData(response.data);
            
            // Fetch water tax details with penalty calculations
            try {
                const waterTaxResponse = await API.get('/users/water-tax-details');
                if (waterTaxResponse.data.success) {
                    generateWaterTaxDetailsWithPenalties(response.data, waterTaxResponse.data.data);
                } else {
                    generateWaterTaxDetails(response.data);
                }
            } catch (penaltyError) {
                console.log('Penalty calculation not available, using basic calculation');
                generateWaterTaxDetails(response.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
        setLoading(false);
    };

    const generateWaterTaxDetailsWithPenalties = (userData, penaltyData) => {
        const dailyRate = 2; // ₹2 per day
        
        // Use penalty calculation data
        console.log('📊 Using penalty-aware water tax data:', penaltyData);
        
        const quarters = [
            {
                quarter: 'Q1 (April-June)',
                period: '2025-04-01 to 2025-06-30',
                days: 91,
                monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                quarterKey: 'q1'
            },
            {
                quarter: 'Q2 (July-September)',
                period: '2025-07-01 to 2025-09-30',
                days: 92,
                monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                quarterKey: 'q2'
            },
            {
                quarter: 'Q3 (October-December)',
                period: '2025-10-01 to 2025-12-31',
                days: 92,
                monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                quarterKey: 'q3'
            },
            {
                quarter: 'Q4 (January-March)',
                period: '2026-01-01 to 2026-03-31',
                days: 90,
                monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                quarterKey: 'q4'
            }
        ];

        // Map penalty data to quarters
        const demandDetails = quarters.map(quarter => {
            const penaltyDetail = penaltyData.quarterDetails.find(q => q.quarter === quarter.quarterKey);
            const isPaid = userData.tax_details?.water_tax?.[`${quarter.quarterKey}_paid`] || false;
            
            return {
                ...quarter,
                taxDemandAmount: penaltyDetail ? penaltyDetail.originalAmount : Math.round((dailyRate * quarter.days) * 100) / 100,
                penaltyAmount: penaltyDetail ? penaltyDetail.penaltyAmount : 0,
                totalAmount: penaltyDetail ? penaltyDetail.totalAmount : Math.round((dailyRate * quarter.days) * 100) / 100,
                collectionTaxAmount: isPaid ? (penaltyDetail ? penaltyDetail.totalAmount : Math.round((dailyRate * quarter.days) * 100) / 100) : 0,
                receiptNumber: userData.tax_details?.water_tax?.[`${quarter.quarterKey}_receipt`] || '',
                status: isPaid ? 'paid' : 'pending',
                billingDate: '2025-04-01',
                dueDate: penaltyDetail ? penaltyDetail.dueDate.toISOString().split('T')[0] : '2025-06-30',
                hasPenalty: penaltyDetail ? penaltyDetail.hasPenalty : false,
                monthsDelayed: penaltyDetail ? penaltyDetail.monthsDelayed : 0,
                gracePeriodEnd: penaltyDetail ? penaltyDetail.gracePeriodEnd.toISOString().split('T')[0] : null
            };
        });

        const waterTaxData = {
            registrationNo: userData.customer_id || 'WTR' + userData._id,
            name: userData.name,
            waterMeterNo: 'WM' + (userData.customer_id || userData._id),
            doorNo: userData.door_no,
            wardNo: userData.ward_no,
            habitationName: 'Municipality Area',
            streetName: userData.street,
            natureOfConnection: 'Domestic',
            slab: 'Residential',
            connectionType: 'Permanent',
            dailyRate: dailyRate,
            demandDetails: demandDetails,
            penaltySummary: {
                totalOriginalAmount: penaltyData.totalOriginalAmount,
                totalPenaltyAmount: penaltyData.totalPenaltyAmount,
                totalAmount: penaltyData.totalAmount,
                hasAnyPenalty: penaltyData.hasAnyPenalty
            }
        };
        
        setWaterTaxDetails(waterTaxData);
    };

    const generateWaterTaxDetails = (userData) => {
        const dailyRate = 2; // ₹2 per day
        
        // Check if we have actual payment data from backend
        const waterTaxFromDB = userData.tax_details?.water_tax;
        
        if (waterTaxFromDB && waterTaxFromDB.payment_history && waterTaxFromDB.payment_history.length > 0) {
            // Use ACTUAL data from backend
            console.log('📊 Using actual water tax data from DB:', waterTaxFromDB);
            
            // Create quarters based on actual payment data
            const quarters = [
                {
                    quarter: 'Q1 (April-June)',
                    period: '2025-04-01 to 2025-06-30',
                    days: 91,
                    monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                    taxDemandAmount: Math.round((dailyRate * 91) * 100) / 100,
                    quarterKey: 'q1'
                },
                {
                    quarter: 'Q2 (July-September)',
                    period: '2025-07-01 to 2025-09-30',
                    days: 92,
                    monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                    taxDemandAmount: Math.round((dailyRate * 92) * 100) / 100,
                    quarterKey: 'q2'
                },
                {
                    quarter: 'Q3 (October-December)',
                    period: '2025-10-01 to 2025-12-31',
                    days: 92,
                    monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                    taxDemandAmount: Math.round((dailyRate * 92) * 100) / 100,
                    quarterKey: 'q3'
                },
                {
                    quarter: 'Q4 (January-March)',
                    period: '2026-01-01 to 2026-03-31',
                    days: 90,
                    monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                    taxDemandAmount: Math.round((dailyRate * 90) * 100) / 100,
                    quarterKey: 'q4'
                }
            ];

            // Map actual payment data to quarters
            const demandDetails = quarters.map(quarter => {
                // Find if this quarter is paid
                const quarterPayment = waterTaxFromDB.payment_history.find(
                    payment => payment.quarter === quarter.quarterKey
                );
                
                const isPaid = waterTaxFromDB[`${quarter.quarterKey}_paid`] || quarterPayment;
                
                return {
                    ...quarter,
                    collectionTaxAmount: isPaid ? quarter.taxDemandAmount : 0,
                    receiptNumber: quarterPayment?.receipt_number || (isPaid ? `WTR${Date.now()}` : ''),
                    status: isPaid ? 'paid' : 'pending',
                    billingDate: quarter.billingDate || '2025-04-01',
                    dueDate: quarter.dueDate || '2025-06-30'
                };
            });

            const waterTaxData = {
                registrationNo: userData.customer_id || 'WTR' + userData._id,
                name: userData.name,
                waterMeterNo: 'WM' + (userData.customer_id || userData._id),
                doorNo: userData.door_no,
                wardNo: userData.ward_no,
                habitationName: 'Municipality Area',
                streetName: userData.street,
                natureOfConnection: 'Domestic',
                slab: 'Residential',
                connectionType: 'Permanent',
                dailyRate: dailyRate,
                demandDetails: demandDetails
            };
            
            setWaterTaxDetails(waterTaxData);
        } else {
            // Use MOCK data (only if no actual data exists)
            console.log('📊 Using mock water tax data');
            const quarterlyAmount = Math.round((dailyRate * 91) * 100) / 100;
            
            const waterTaxData = {
                registrationNo: 'WTR' + (userData.new_assessment_no || userData.customer_id || Math.random().toString(36).substr(2, 8).toUpperCase()),
                name: userData.name,
                waterMeterNo: 'WM' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                doorNo: userData.door_no,
                wardNo: userData.ward_no,
                habitationName: 'Municipality Area',
                streetName: userData.street,
                natureOfConnection: 'Domestic',
                slab: 'Residential',
                connectionType: 'Permanent',
                dailyRate: dailyRate,
                demandDetails: [
                    {
                        quarter: 'Q1 (April-June)',
                        period: '2025-04-01 to 2025-06-30',
                        days: 91,
                        monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                        taxDemandAmount: quarterlyAmount,
                        collectionTaxAmount: 0,
                        receiptNumber: '',
                        billingDate: '2025-04-01',
                        dueDate: '2025-06-30',
                        status: 'pending',
                        quarterKey: 'q1'
                    },
                    {
                        quarter: 'Q2 (July-September)',
                        period: '2025-07-01 to 2025-09-30',
                        days: 92,
                        monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                        taxDemandAmount: Math.round((dailyRate * 92) * 100) / 100,
                        collectionTaxAmount: 0,
                        receiptNumber: '',
                        billingDate: '2025-07-01',
                        dueDate: '2025-09-30',
                        status: 'pending',
                        quarterKey: 'q2'
                    },
                    {
                        quarter: 'Q3 (October-December)',
                        period: '2025-10-01 to 2025-12-31',
                        days: 92,
                        monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                        taxDemandAmount: Math.round((dailyRate * 92) * 100) / 100,
                        collectionTaxAmount: 0,
                        receiptNumber: '',
                        billingDate: '2025-10-01',
                        dueDate: '2025-12-31',
                        status: 'pending',
                        quarterKey: 'q3'
                    },
                    {
                        quarter: 'Q4 (January-March)',
                        period: '2026-01-01 to 2026-03-31',
                        days: 90,
                        monthly: Math.round((dailyRate * 30.4) * 100) / 100,
                        taxDemandAmount: Math.round((dailyRate * 90) * 100) / 100,
                        collectionTaxAmount: 0,
                        receiptNumber: '',
                        billingDate: '2026-01-01',
                        dueDate: '2026-03-31',
                        status: 'pending',
                        quarterKey: 'q4'
                    }
                ]
            };
            setWaterTaxDetails(waterTaxData);
        }
        setLoading(false);
    };

    const handlePayWaterTaxQuarter = (quarterDetail, index) => {
        setPaymentLoading(true);
        
        // Use total amount including penalty if available
        const amountToPay = quarterDetail.totalAmount || quarterDetail.taxDemandAmount;
        
        navigate('/payment', {
            state: {
                taxType: 'water',
                paymentData: {
                    period: quarterDetail.quarter,
                    amount: amountToPay,
                    quarter: `q${index + 1}`,
                    originalAmount: quarterDetail.taxDemandAmount,
                    penaltyAmount: quarterDetail.penaltyAmount || 0
                },
                quarterDetail: quarterDetail,
                source: 'water-tax',
                quarterIndex: index
            }
        });
    };

    const handlePayFullWaterTax = () => {
        const pendingQuarters = waterTaxDetails.demandDetails.filter(q => q.status === 'pending');
        const totalAmount = pendingQuarters.reduce((sum, q) => sum + (q.totalAmount || q.taxDemandAmount), 0);
        const totalOriginalAmount = pendingQuarters.reduce((sum, q) => sum + q.taxDemandAmount, 0);
        const totalPenaltyAmount = pendingQuarters.reduce((sum, q) => sum + (q.penaltyAmount || 0), 0);
        
        setPaymentLoading(true);
        
        navigate('/payment', {
            state: {
                taxType: 'water',
                paymentData: {
                    period: 'Full Year 2025-2026',
                    amount: totalAmount,
                    quarter: 'full',
                    originalAmount: totalOriginalAmount,
                    penaltyAmount: totalPenaltyAmount
                },
                quarterDetail: { quarter: 'Full Year Payment' },
                source: 'water-tax',
                isFullPayment: true
            }
        });
    };

    const generateReceipt = (paymentDetail) => {
        const receiptContent = `
MUNICIPAL TAX RECEIPT
=====================

Receipt No: ${paymentDetail.receiptNumber}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Customer Details:
----------------
Name: ${waterTaxDetails.name}
Door No: ${waterTaxDetails.doorNo}
Ward No: ${waterTaxDetails.wardNo}

Payment Details:
---------------
Tax Type: Water Charges
Period: ${paymentDetail.quarter}
Amount Paid: ₹${paymentDetail.taxDemandAmount}
Payment Mode: Online
Status: SUCCESSFUL

Thank you for your payment!
===========================
        `;

        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `water_receipt_${paymentDetail.receiptNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadQuarterReceipt = (quarterDetail) => {
    if (quarterDetail.status === 'paid') {
        const receiptData = {
            receiptNumber: quarterDetail.receiptNumber,
            transactionId: quarterDetail.transactionId || quarterDetail.receiptNumber,
            customerName: waterTaxDetails.name,
            doorNo: waterTaxDetails.doorNo,
            wardNo: waterTaxDetails.wardNo,
            taxType: 'Water Charges',
            amount: quarterDetail.taxDemandAmount,
            period: quarterDetail.quarter,
            paymentDate: new Date().toLocaleDateString()
        };
        
        downloadReceiptPDF(receiptData);
    }
};

    const handleBack = () => {
        navigate('/dashboard');
    };

    // Refresh data when coming back from payment
    useEffect(() => {
        if (location.state?.fromPayment) {
            setRefreshKey(prev => prev + 1);
        }
    }, [location.state]);

    if (loading) return <div className="loading-container">Loading Water Tax Details...</div>;

    return (
        <div className="tax-page">
            <div className="tax-header">
                <div className="header-content">
                    <h1>Water Charges - Assessment Details</h1>
                    <div className="header-actions">
                        <button onClick={handleBack} className="back-btn">
                            ← Back to Dashboard
                        </button>
                        <button 
                            onClick={() => setRefreshKey(prev => prev + 1)} 
                            className="refresh-btn"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {waterTaxDetails && (
                <div className="tax-content">
                    {/* Assessment Details */}
                    <div className="details-card">
                        <h2>Water Charges - Assessment Details</h2>
                        <div className="details-grid">
                            <div className="detail-item">
                                <label>Registration No</label>
                                <span>{waterTaxDetails.registrationNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Name</label>
                                <span>{waterTaxDetails.name}</span>
                            </div>
                            <div className="detail-item">
                                <label>Water Meter No</label>
                                <span>{waterTaxDetails.waterMeterNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Door No</label>
                                <span>{waterTaxDetails.doorNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Ward No</label>
                                <span>{waterTaxDetails.wardNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Habitation Name</label>
                                <span>{waterTaxDetails.habitationName}</span>
                            </div>
                            <div className="detail-item">
                                <label>Street Name</label>
                                <span>{waterTaxDetails.streetName}</span>
                            </div>
                            <div className="detail-item">
                                <label>Nature of Connection</label>
                                <span>{waterTaxDetails.natureOfConnection}</span>
                            </div>
                            <div className="detail-item">
                                <label>Slab</label>
                                <span>{waterTaxDetails.slab}</span>
                            </div>
                            <div className="detail-item">
                                <label>Connection Type</label>
                                <span>{waterTaxDetails.connectionType}</span>
                            </div>
                            <div className="detail-item">
                                <label>Daily Rate</label>
                                <span>₹{waterTaxDetails.dailyRate} per day</span>
                            </div>
                        </div>
                    </div>

                    {/* Demand Details */}
                    <div className="demand-card">
                        <h2>Water Charges - Demand Details</h2>
                        <table className="demand-table">
                            <thead>
                                <tr>
                                    <th>Quarter</th>
                                    <th>Period</th>
                                    <th>Days</th>
                                    <th>Monthly (₹)</th>
                                    <th>Original Amount (₹)</th>
                                    <th>Penalty (₹)</th>
                                    <th>Total Amount (₹)</th>
                                    <th>Paid Amount (₹)</th>
                                    <th>Receipt Number</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waterTaxDetails.demandDetails.map((detail, index) => (
                                    <tr key={index} className={detail.hasPenalty ? 'penalty-row' : ''}>
                                        <td>{detail.quarter}</td>
                                        <td>{detail.period}</td>
                                        <td>{detail.days}</td>
                                        <td>₹{detail.monthly}</td>
                                        <td>₹{detail.taxDemandAmount}</td>
                                        <td>
                                            {detail.penaltyAmount > 0 ? (
                                                <span className="penalty-amount" title={`${detail.monthsDelayed} months delayed`}>
                                                    ₹{detail.penaltyAmount}
                                                    {detail.hasPenalty && <span className="penalty-indicator">⚠️</span>}
                                                </span>
                                            ) : (
                                                '₹0'
                                            )}
                                        </td>
                                        <td>
                                            <strong>₹{detail.totalAmount || detail.taxDemandAmount}</strong>
                                        </td>
                                        <td>₹{detail.collectionTaxAmount}</td>
                                        <td>
                                            {detail.receiptNumber ? (
                                                <span 
                                                    className="receipt-link"
                                                    onClick={() => downloadQuarterReceipt(detail)}
                                                    title="Download Receipt"
                                                >
                                                    {detail.receiptNumber}
                                                </span>
                                            ) : (
                                                'Not Paid'
                                            )}
                                        </td>
                                        <td>
                                            {detail.dueDate}
                                            {detail.gracePeriodEnd && (
                                                <div className="grace-period-info" title="Grace period ends">
                                                    <small>Grace: {detail.gracePeriodEnd}</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${detail.status}`}>
                                                {detail.status.toUpperCase()}
                                            </span>
                                            {detail.hasPenalty && (
                                                <div className="penalty-status">
                                                    <small>Penalty Applied</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {detail.status === 'pending' ? (
                                                <button 
                                                    onClick={() => handlePayWaterTaxQuarter(detail, index)}
                                                    className="pay-quarter-btn"
                                                    disabled={paymentLoading}
                                                    title={detail.penaltyAmount > 0 ? `Pay ₹${detail.totalAmount} (₹${detail.taxDemandAmount} + ₹${detail.penaltyAmount} penalty)` : `Pay ₹${detail.taxDemandAmount}`}
                                                >
                                                    Pay ₹{detail.totalAmount || detail.taxDemandAmount}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => downloadQuarterReceipt(detail)}
                                                    className="download-receipt-btn"
                                                >
                                                    📄
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="total-row">
                                    <td colSpan="4"><strong>Annual Total</strong></td>
                                    <td><strong>₹{waterTaxDetails.demandDetails.reduce((sum, detail) => sum + detail.taxDemandAmount, 0)}</strong></td>
                                    <td>
                                        <strong>₹{waterTaxDetails.demandDetails.reduce((sum, detail) => sum + (detail.penaltyAmount || 0), 0)}</strong>
                                        {waterTaxDetails.penaltySummary?.hasAnyPenalty && <span className="penalty-indicator">⚠️</span>}
                                    </td>
                                    <td><strong>₹{waterTaxDetails.demandDetails.reduce((sum, detail) => sum + (detail.totalAmount || detail.taxDemandAmount), 0)}</strong></td>
                                    <td><strong>₹{waterTaxDetails.demandDetails.reduce((sum, detail) => sum + detail.collectionTaxAmount, 0)}</strong></td>
                                    <td colSpan="4"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Section */}
                    <div className="payment-card">
                        <div className="payment-summary">
                            <h3>Payment Summary</h3>
                            <div className="summary-details">
                                <div className="summary-item">
                                    <span>Original Tax Due:</span>
                                    <span className="amount-due">
                                        ₹{waterTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + (detail.status === 'pending' ? detail.taxDemandAmount : 0), 0)}
                                    </span>
                                </div>
                                {waterTaxDetails.penaltySummary?.hasAnyPenalty && (
                                    <div className="summary-item penalty">
                                        <span>Penalty Amount:</span>
                                        <span className="penalty-amount">
                                            ₹{waterTaxDetails.demandDetails.reduce((sum, detail) => 
                                                sum + (detail.status === 'pending' ? (detail.penaltyAmount || 0) : 0), 0)}
                                            <span className="penalty-indicator">⚠️</span>
                                        </span>
                                    </div>
                                )}
                                <div className="summary-item">
                                    <span>Total Amount Due:</span>
                                    <span className="amount-due total">
                                        ₹{waterTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + (detail.status === 'pending' ? (detail.totalAmount || detail.taxDemandAmount) : 0), 0)}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span>Amount Paid:</span>
                                    <span className="amount-paid">
                                        ₹{waterTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + detail.collectionTaxAmount, 0)}
                                    </span>
                                </div>
                                <div className="summary-item total">
                                    <span>Balance Due:</span>
                                    <span className="balance-due">
                                        ₹{waterTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + ((detail.totalAmount || detail.taxDemandAmount) - detail.collectionTaxAmount), 0)}
                                    </span>
                                </div>
                            </div>
                            <div className="payment-actions">
                                {waterTaxDetails.demandDetails.some(detail => detail.status === 'pending') && (
                                    <button 
                                        onClick={handlePayFullWaterTax} 
                                        className="pay-btn"
                                        disabled={paymentLoading}
                                    >
                                        {paymentLoading ? 'Processing...' : 'Pay Full Water Tax'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WaterTax;