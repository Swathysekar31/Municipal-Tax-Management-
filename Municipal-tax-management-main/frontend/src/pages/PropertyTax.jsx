import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './TaxPages.css';
import { downloadReceiptPDF } from '../utils/pdfGenerator';

const PropertyTax = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [propertyTaxDetails, setPropertyTaxDetails] = useState(null);
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
            generatePropertyTaxDetails(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
        setLoading(false);
    };

    const generatePropertyTaxDetails = (userData) => {
        // Check if we have actual payment data from backend
        const propertyTaxFromDB = userData.tax_details?.property_tax;
        
        if (propertyTaxFromDB && propertyTaxFromDB.payment_history && propertyTaxFromDB.payment_history.length > 0) {
            // Use ACTUAL data from backend
            console.log('📊 Using actual property tax data from DB:', propertyTaxFromDB);
            
            const demandDetails = [
                {
                    slNo: 1,
                    financialYear: '2025-2026(APRIL-SEPTEMBER)-First Half',
                    generalTax: 120,
                    libraryTax: 24,
                    propertyDemand: 144,
                    propertyTaxCollection: propertyTaxFromDB.status === 'paid' ? 144 : 0,
                    receiptNumber: propertyTaxFromDB.payment_history[0]?.receipt_number || '',
                    billingDate: '2025-04-01'
                },
                {
                    slNo: 2,
                    financialYear: '2025-2026(OCTOBER-MARCH)-Second Half',
                    generalTax: 120,
                    libraryTax: 24,
                    propertyDemand: 144,
                    propertyTaxCollection: propertyTaxFromDB.status === 'paid' ? 144 : 0,
                    receiptNumber: propertyTaxFromDB.payment_history[1]?.receipt_number || '',
                    billingDate: '2025-10-01'
                }
            ];

            const propertyTaxData = {
                name: userData.name,
                buildingLicenseNo: 'BL' + (userData.customer_id || userData._id),
                buildingLicenseDate: '2023-05-15',
                subDivisionNo: '1',
                blockNo: userData.door_no?.split('/')[0] || '4',
                wardNo: userData.ward_no,
                habitationName: 'Municipality Area',
                buildingUsage: 'Own Residence',
                buildingCompletionDate: '2023-12-01',
                buildingType: 'Permanent',
                surveyNo: 'SURV' + (userData.customer_id || userData._id),
                doorNumber: userData.door_no,
                streetName: userData.street,
                totalArea: '1200 sq.ft',
                modeType: 'Permanent',
                demandDetails: demandDetails
            };
            
            setPropertyTaxDetails(propertyTaxData);
        } else {
            // Use MOCK data (only if no actual data exists)
            console.log('📊 Using mock property tax data');
            const propertyTaxData = {
                name: userData.name,
                buildingLicenseNo: 'BL' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                buildingLicenseDate: '2023-05-15',
                subDivisionNo: '1',
                blockNo: userData.door_no?.split('/')[0] || '4',
                wardNo: userData.ward_no,
                habitationName: 'Municipality Area',
                buildingUsage: 'Own Residence',
                buildingCompletionDate: '2023-12-01',
                buildingType: 'Permanent',
                surveyNo: 'SURV' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                doorNumber: userData.door_no,
                streetName: userData.street,
                totalArea: '1200 sq.ft',
                modeType: 'Permanent',
                demandDetails: [
                    {
                        slNo: 1,
                        financialYear: '2025-2026(APRIL-SEPTEMBER)-First Half',
                        generalTax: 120,
                        libraryTax: 24,
                        propertyDemand: 144,
                        propertyTaxCollection: 0,
                        receiptNumber: '',
                        billingDate: '2025-04-01'
                    },
                    {
                        slNo: 2,
                        financialYear: '2025-2026(OCTOBER-MARCH)-Second Half',
                        generalTax: 120,
                        libraryTax: 24,
                        propertyDemand: 144,
                        propertyTaxCollection: 0,
                        receiptNumber: '',
                        billingDate: '2025-10-01'
                    }
                ]
            };
            setPropertyTaxDetails(propertyTaxData);
        }
        setLoading(false);
    };

    const handlePayPropertyTax = () => {
        const totalAmount = propertyTaxDetails.demandDetails.reduce((sum, detail) => 
            sum + (detail.propertyTaxCollection === 0 ? detail.propertyDemand : 0), 0);
        
        setPaymentLoading(true);
        
        navigate('/payment', {
            state: {
                taxType: 'property',
                paymentData: {
                    period: '2025-2026',
                    amount: totalAmount
                },
                source: 'property-tax',
                isFullPayment: true
            }
        });
    };

    const handlePayHalfYearly = (demandDetail, index) => {
        setPaymentLoading(true);
        
        navigate('/payment', {
            state: {
                taxType: 'property',
                paymentData: {
                    period: demandDetail.financialYear,
                    amount: demandDetail.propertyDemand
                },
                quarterDetail: demandDetail,
                source: 'property-tax',
                demandIndex: index
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
Name: ${propertyTaxDetails.name}
Door No: ${propertyTaxDetails.doorNumber}
Ward No: ${propertyTaxDetails.wardNo}

Payment Details:
---------------
Tax Type: Property Tax
Period: ${paymentDetail.financialYear}
Amount Paid: ₹${paymentDetail.propertyDemand}
Payment Mode: Online
Status: SUCCESSFUL

Thank you for your payment!
===========================
        `;

        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `property_receipt_${paymentDetail.receiptNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadPropertyReceipt = (demandDetail) => {
    if (demandDetail.propertyTaxCollection > 0) {
        const receiptData = {
            receiptNumber: demandDetail.receiptNumber,
            transactionId: demandDetail.transactionId || demandDetail.receiptNumber,
            customerName: propertyTaxDetails.name,
            doorNo: propertyTaxDetails.doorNumber,
            wardNo: propertyTaxDetails.wardNo,
            taxType: 'Property Tax',
            amount: demandDetail.propertyDemand,
            period: demandDetail.financialYear,
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

    if (loading) return <div className="loading-container">Loading Property Tax Details...</div>;

    return (
        <div className="tax-page">
            <div className="tax-header">
                <div className="header-content">
                    <h1>Property Tax - Assessment Details</h1>
                    <div className="header-actions">
                        <button onClick={handleBack} className="back-btn">← Back to Dashboard</button>
                        <button 
                            onClick={() => setRefreshKey(prev => prev + 1)} 
                            className="refresh-btn"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {propertyTaxDetails && (
                <div className="tax-content">
                    {/* Assessment Details */}
                    <div className="details-card">
                        <h2>Property Tax - Assessment Details</h2>
                        <div className="details-grid">
                            <div className="detail-item">
                                <label>Name</label>
                                <span>{propertyTaxDetails.name}</span>
                            </div>
                            <div className="detail-item">
                                <label>Building License No</label>
                                <span>{propertyTaxDetails.buildingLicenseNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Door Number</label>
                                <span>{propertyTaxDetails.doorNumber}</span>
                            </div>
                            <div className="detail-item">
                                <label>Ward No</label>
                                <span>{propertyTaxDetails.wardNo}</span>
                            </div>
                            <div className="detail-item">
                                <label>Street Name</label>
                                <span>{propertyTaxDetails.streetName}</span>
                            </div>
                            <div className="detail-item">
                                <label>Total Area</label>
                                <span>{propertyTaxDetails.totalArea}</span>
                            </div>
                            <div className="detail-item">
                                <label>Building Type</label>
                                <span>{propertyTaxDetails.buildingType}</span>
                            </div>
                            <div className="detail-item">
                                <label>Building Usage</label>
                                <span>{propertyTaxDetails.buildingUsage}</span>
                            </div>
                        </div>
                    </div>

                    {/* Demand Details */}
                    <div className="demand-card">
                        <h2>Property Tax - Demand Details</h2>
                        <table className="demand-table">
                            <thead>
                                <tr>
                                    <th>Sl No</th>
                                    <th>Financial Year</th>
                                    <th>General Tax (₹)</th>
                                    <th>Library Tax (₹)</th>
                                    <th>Property Demand (₹)</th>
                                    <th>Property Tax Collection (₹)</th>
                                    <th>Receipt Number</th>
                                    <th>Billing Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {propertyTaxDetails.demandDetails.map((detail, index) => (
                                    <tr key={detail.slNo}>
                                        <td>{detail.slNo}</td>
                                        <td>{detail.financialYear}</td>
                                        <td>₹{detail.generalTax}</td>
                                        <td>₹{detail.libraryTax}</td>
                                        <td>₹{detail.propertyDemand}</td>
                                        <td>₹{detail.propertyTaxCollection}</td>
                                        <td>
                                            {detail.receiptNumber ? (
                                                <span 
                                                    className="receipt-link"
                                                    onClick={() => downloadPropertyReceipt(detail)}
                                                    title="Download Receipt"
                                                >
                                                    {detail.receiptNumber}
                                                </span>
                                            ) : (
                                                'Not Paid'
                                            )}
                                        </td>
                                        <td>{detail.billingDate}</td>
                                        <td>
                                            {detail.propertyTaxCollection === 0 ? (
                                                <button 
                                                    onClick={() => handlePayHalfYearly(detail, index)}
                                                    className="pay-half-btn"
                                                    disabled={paymentLoading}
                                                >
                                                    Pay
                                                </button>
                                            ) : (
                                                <span className="status-badge paid">Paid</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Section */}
                    <div className="payment-card">
                        <div className="payment-summary">
                            <h3>Payment Summary</h3>
                            <div className="summary-details">
                                <div className="summary-item">
                                    <span>Total Property Tax Due:</span>
                                    <span className="amount-due">
                                        ₹{propertyTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + (detail.propertyTaxCollection === 0 ? detail.propertyDemand : 0), 0)}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span>Amount Paid:</span>
                                    <span className="amount-paid">
                                        ₹{propertyTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + detail.propertyTaxCollection, 0)}
                                    </span>
                                </div>
                                <div className="summary-item total">
                                    <span>Balance Due:</span>
                                    <span className="balance-due">
                                        ₹{propertyTaxDetails.demandDetails.reduce((sum, detail) => 
                                            sum + (detail.propertyDemand - detail.propertyTaxCollection), 0)}
                                    </span>
                                </div>
                            </div>
                            {propertyTaxDetails.demandDetails.some(detail => detail.propertyTaxCollection === 0) && (
                                <button 
                                    onClick={handlePayPropertyTax} 
                                    className="pay-btn"
                                    disabled={paymentLoading}
                                >
                                    {paymentLoading ? 'Processing...' : 'Pay Full Property Tax'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyTax;