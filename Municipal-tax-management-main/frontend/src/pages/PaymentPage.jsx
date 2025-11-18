import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './PaymentPage.css';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { 
    taxType, 
    paymentData, 
    quarterDetail, 
    source, 
    quarterIndex, 
    demandIndex, 
    isFullPayment 
  } = location.state || {};
    
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolder: ''
  });

  // Dummy payment data for testing
  const dummyData = {
    card: {
      cardNumber: '4111 1111 1111 1111',
      expiryDate: '12/25',
      cvv: '123',
      cardHolder: 'John Doe'
    },
    upi: 'success@upi',
    netbanking: {
      accountNumber: '1234567890',
      ifscCode: 'SBIN0000123',
      accountHolder: 'John Doe'
    }
  };

  useEffect(() => {
    console.log('📍 PaymentPage mounted');
    console.log('📦 Location state:', location.state);
    console.log('💳 Tax Type:', taxType);
    console.log('💰 Payment Data:', paymentData);
    console.log('👤 User:', user);
  }, [location.state, taxType, paymentData, user]);

  const fillDummyData = () => {
    if (paymentMethod === 'card') {
      setCardDetails(dummyData.card);
    } else if (paymentMethod === 'upi') {
      setUpiId(dummyData.upi);
    } else if (paymentMethod === 'netbanking') {
      setBankDetails(dummyData.netbanking);
    }
  };

  if (!taxType || !paymentData) {
    return (
      <div className="payment-page">
        <div className="payment-error">
          <h2>Invalid Payment Request</h2>
          <p>Please go back and try again.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.substring(0, 19);
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) formattedValue = formattedValue.substring(0, 5);
    }
    
    // Format CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        alert('Please enter a valid 16-digit card number');
        return false;
      }
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length !== 5) {
        alert('Please enter a valid expiry date (MM/YY)');
        return false;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
        alert('Please enter a valid CVV');
        return false;
      }
      if (!cardDetails.cardHolder) {
        alert('Please enter card holder name');
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID');
        return false;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 9) {
        alert('Please enter a valid account number');
        return false;
      }
      if (!bankDetails.ifscCode || bankDetails.ifscCode.length !== 11) {
        alert('Please enter a valid IFSC code');
        return false;
      }
      if (!bankDetails.accountHolder) {
        alert('Please enter account holder name');
        return false;
      }
    }
    return true;
  };

  const simulatePaymentGateway = async () => {
    // Simulate API call to payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful payment 90% of the time
        const success = Math.random() > 0.1;
        if (success) {
          resolve({
            success: true,
            transactionId: 'TXN' + Date.now(),
            gatewayResponse: 'Payment processed successfully'
          });
        } else {
          resolve({
            success: false,
            error: 'Payment declined by bank'
          });
        }
      }, 2000);
    });
  };

  const processPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
        console.log('💳 Processing payment with details:', {
            paymentMethod,
            cardDetails,
            upiId,
            bankDetails
        });

        // Step 1: Simulate payment gateway processing
        const paymentResult = await simulatePaymentGateway();
        
        if (!paymentResult.success) {
            alert(`Payment failed: ${paymentResult.error}`);
            setLoading(false);
            return;
        }

        console.log('✅ Payment gateway processing successful');

        // Step 2: Call backend API to record payment
        let response;
        const paymentPayload = {
            period: paymentData.period,
            amount: paymentData.amount,
            quarter: paymentData.quarter,
            transactionId: paymentResult.transactionId,
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString()
        };

        console.log('📤 Sending payment payload:', paymentPayload);

        if (taxType === 'water') {
            response = await API.post('/users/pay-water-tax', paymentPayload);
        } else {
            response = await API.post('/users/pay-property-tax', paymentPayload);
        }

        console.log('📥 Backend response:', response.data);

        if (response.data.success) {
            console.log('✅ Payment recorded in database');
            
            // Navigate to success page
            navigate('/payment-success', { 
                state: { 
                    receiptNumber: response.data.receiptNumber,
                    amount: paymentData.amount,
                    taxType: taxType,
                    period: paymentData.period,
                    source: source,
                    quarterIndex: quarterIndex,
                    demandIndex: demandIndex,
                    isFullPayment: isFullPayment,
                    quarterDetail: quarterDetail,
                    transactionId: paymentResult.transactionId
                }
            });
        } else {
            alert(`Payment recording failed: ${response.data.message}`);
            setLoading(false);
        }
    } catch (error) {
        console.error('❌ Payment error:', error);
        console.error('❌ Error response:', error.response);
        alert(`Payment error: ${error.response?.data?.message || 'Please try again'}`);
        setLoading(false);
    }
};

  const getTaxTitle = () => {
    if (taxType === 'water') {
      return quarterDetail ? `Water Tax - ${quarterDetail.quarter}` : 'Water Tax';
    } else {
      return quarterDetail ? `Property Tax - ${quarterDetail.financialYear}` : 'Property Tax';
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <button 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            ← Back
          </button>
          <h1>Secure Payment</h1>
          <div className="payment-logo">🔒</div>
        </div>

        <div className="payment-content">
          {/* Left Side - Payment Summary */}
          <div className="payment-summary-section">
            <h2>Payment Summary</h2>
            <div className="summary-card">
              <div className="summary-item">
                <span>Tax Type:</span>
                <span>{getTaxTitle()}</span>
              </div>
              <div className="summary-item">
                <span>Amount:</span>
                <span className="amount">₹{paymentData.amount}</span>
              </div>
              {quarterDetail && (
                <div className="summary-item">
                  <span>Period:</span>
                  <span>{quarterDetail.period || quarterDetail.financialYear}</span>
                </div>
              )}
              <div className="summary-item">
                <span>Customer:</span>
                <span>{user?.name}</span>
              </div>
              <div className="summary-item">
                <span>Customer ID:</span>
                <span>{user?.customer_id}</span>
              </div>
              <div className="divider"></div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span className="total-amount">₹{paymentData.amount}</span>
              </div>
            </div>

            {/* Dummy Data Button */}
            <div className="dummy-data-section">
              <h3>🔄 Test Payment</h3>
              <p>Fill dummy data for testing:</p>
              <button 
                onClick={fillDummyData}
                className="dummy-data-btn"
                disabled={loading}
              >
                Fill Test Data
              </button>
              <div className="test-notes">
                <p><strong>Test Card:</strong> 4111 1111 1111 1111</p>
                <p><strong>Test UPI:</strong> success@upi</p>
                <p><em>90% success rate simulation</em></p>
              </div>
            </div>

            {/* Security Features */}
            <div className="security-features">
              <h3>🔒 Secure Payment</h3>
              <div className="security-badges">
                <div className="badge">SSL Encrypted</div>
                <div className="badge">PCI DSS Compliant</div>
                <div className="badge">3D Secure</div>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="payment-form-section">
            <h2>Payment Method</h2>
            
            {/* Payment Method Selection */}
            <div className="payment-methods">
              <div 
                className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="method-icon">💳</div>
                <span>Credit/Debit Card</span>
              </div>
              <div 
                className={`method-option ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="method-icon">📱</div>
                <span>UPI</span>
              </div>
              <div 
                className={`method-option ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <div className="method-icon">🏦</div>
                <span>Net Banking</span>
              </div>
            </div>

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="payment-form">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength="3"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Card Holder Name</label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={handleCardChange}
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <div className="payment-form">
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                </div>
                <div className="upi-apps">
                  <div className="upi-app">Google Pay</div>
                  <div className="upi-app">PhonePe</div>
                  <div className="upi-app">Paytm</div>
                  <div className="upi-app">BHIM</div>
                </div>
              </div>
            )}

            {/* Net Banking Form */}
            {paymentMethod === 'netbanking' && (
              <div className="payment-form">
                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankDetails.accountNumber}
                    onChange={handleBankChange}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={bankDetails.ifscCode}
                    onChange={handleBankChange}
                    placeholder="SBIN0000123"
                  />
                </div>
                <div className="form-group">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={bankDetails.accountHolder}
                    onChange={handleBankChange}
                    placeholder="As per bank records"
                  />
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button 
              className={`pay-now-button ${loading ? 'loading' : ''}`}
              onClick={processPayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing Payment...
                </>
              ) : (
                `Pay ₹${paymentData.amount}`
              )}
            </button>

            {/* Terms */}
            <div className="terms">
              <p>By proceeding, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;