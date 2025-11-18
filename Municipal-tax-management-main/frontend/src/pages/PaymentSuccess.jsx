import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadReceiptPDF } from '../utils/pdfGenerator'; // Import the PDF utility
import './PaymentPage.css';

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        receiptNumber, 
        amount, 
        taxType, 
        period, 
        source,
        quarterIndex,
        demandIndex,
        isFullPayment,
        quarterDetail,
        transactionId
    } = location.state || {};

    // Add debugging
    useEffect(() => {
        console.log('🎉 PaymentSuccess mounted');
        console.log('📦 Location state:', location.state);
        console.log('🧾 Receipt Number:', receiptNumber);
        console.log('💰 Amount:', amount);
        console.log('💳 Tax Type:', taxType);
        console.log('🔧 Transaction ID:', transactionId);
    }, [location.state, receiptNumber, amount, taxType, transactionId]);

    const downloadReceipt = () => {
        const receiptData = {
            receiptNumber: receiptNumber,
            transactionId: transactionId || receiptNumber,
            customerName: 'User Name', // You might want to get this from user context
            doorNo: '123', // Get from user data
            wardNo: 'Ward 6', // Get from user data
            taxType: taxType === 'water' ? 'Water Charges' : 'Property Tax',
            amount: amount,
            period: period,
            paymentDate: new Date().toLocaleDateString()
        };

        downloadReceiptPDF(receiptData);
    };

    const handleBackToTaxPage = () => {
        if (source === 'water-tax') {
            navigate('/water-tax');
        } else if (source === 'property-tax') {
            navigate('/property-tax');
        } else {
            navigate('/dashboard');
        }
    };

    const getTaxPageTitle = () => {
        if (taxType === 'water') {
            return 'Water Tax Details';
        } else {
            return 'Property Tax Details';
        }
    };

    if (!receiptNumber) {
        return (
            <div className="payment-page">
                <div className="payment-container">
                    <div className="payment-error">
                        <div className="error-icon">❌</div>
                        <h2>Invalid Receipt</h2>
                        <p>No payment information found. Please try making the payment again.</p>
                        <div className="debug-info">
                            <p><strong>Debug Info:</strong></p>
                            <p>Receipt Number: {receiptNumber || 'Not found'}</p>
                            <p>Amount: {amount || 'Not found'}</p>
                            <p>Tax Type: {taxType || 'Not found'}</p>
                            <p>Transaction ID: {transactionId || 'Not found'}</p>
                            <p>Source: {source || 'Not found'}</p>
                            <p>Full State: {JSON.stringify(location.state, null, 2)}</p>
                        </div>
                        <div className="error-actions">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="dashboard-btn"
                            >
                                🏠 Go to Dashboard
                            </button>
                            <button 
                                onClick={() => navigate(-1)}
                                className="back-btn"
                            >
                                ↩️ Go Back
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="refresh-btn"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-success">
                    {/* Success Header */}
                    <div className="success-header">
                        <div className="success-icon">✅</div>
                        <div className="success-title">
                            <h1>Payment Successful!</h1>
                            <p className="success-message">Your payment has been processed successfully.</p>
                        </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="receipt-card">
                        <h2>Payment Receipt</h2>
                        <div className="receipt-details">
                            <div className="receipt-row">
                                <div className="receipt-item">
                                    <span className="label">Receipt Number:</span>
                                    <span className="value">{receiptNumber}</span>
                                </div>
                                <div className="receipt-item">
                                    <span className="label">Transaction Date:</span>
                                    <span className="value">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="receipt-row">
                                <div className="receipt-item">
                                    <span className="label">Amount Paid:</span>
                                    <span className="value amount">₹{amount}</span>
                                </div>
                                <div className="receipt-item">
                                    <span className="label">Tax Type:</span>
                                    <span className="value">{taxType === 'water' ? 'Water Charges' : 'Property Tax'}</span>
                                </div>
                            </div>
                            <div className="receipt-row">
                                <div className="receipt-item">
                                    <span className="label">Period:</span>
                                    <span className="value">{period}</span>
                                </div>
                                <div className="receipt-item">
                                    <span className="label">Status:</span>
                                    <span className="status-success">SUCCESSFUL</span>
                                </div>
                            </div>
                            {transactionId && (
                                <div className="receipt-row">
                                    <div className="receipt-item">
                                        <span className="label">Transaction ID:</span>
                                        <span className="value">{transactionId}</span>
                                    </div>
                                </div>
                            )}
                            {quarterDetail && (
                                <div className="receipt-row">
                                    <div className="receipt-item full-width">
                                        <span className="label">Details:</span>
                                        <span className="value">{quarterDetail.quarter || quarterDetail.financialYear}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="success-actions">
                        <button 
                            onClick={downloadReceipt} 
                            className="action-btn download-btn"
                        >
                            📄 Download Receipt (PDF)
                        </button>
                        <button 
                            onClick={handleBackToTaxPage}
                            className="action-btn tax-btn"
                        >
                            📊 {getTaxPageTitle()}
                        </button>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="action-btn dashboard-btn"
                        >
                            🏠 Dashboard
                        </button>
                    </div>

                    {/* Additional Information */}
                    <div className="success-info">
                        <div className="info-card">
                            <h3>📧 Confirmation Sent</h3>
                            <p>A confirmation SMS has been sent to your registered mobile number.</p>
                        </div>
                        <div className="info-card">
                            <h3>💾 Keep Your Receipt</h3>
                            <p>Please save this receipt for your records and future reference.</p>
                        </div>
                        <div className="info-card">
                            <h3>🕒 Processing Time</h3>
                            <p>Your payment will be reflected in the system within 24 hours.</p>
                        </div>
                    </div>

                    {/* Support Information */}
                    <div className="support-section">
                        <p>
                            <strong>Need help?</strong> Contact municipal support at{' '}
                            <a href="tel:+91-1800-123-4567">+91-1800-123-4567</a> or{' '}
                            <a href="mailto:support@municipal.gov">support@municipal.gov</a>
                        </p>
                    </div>

                    {/* Debug Info (only in development) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="debug-info">
                            <p><strong>Development Debug:</strong></p>
                            <p>Source: {source}</p>
                            <p>Quarter Index: {quarterIndex}</p>
                            <p>Demand Index: {demandIndex}</p>
                            <p>Is Full Payment: {isFullPayment ? 'Yes' : 'No'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;