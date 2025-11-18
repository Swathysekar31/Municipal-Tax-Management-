import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        gender: '',
        ward_no: '',
        door_no: '',
        street: '',
        city: '',
        district: '',
        state: '',
        pin_code: '',
        password: '',
        confirmPassword: '',
        // NEW FIELDS
        dob: '',
        old_assessment_no: '',
        new_assessment_no: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCustomerId, setShowCustomerId] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        if (e.target.name === 'pin_code') {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setFormData({
                ...formData,
                [e.target.name]: value
            });
        } else if (e.target.name === 'phone_number') {
            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
            setFormData({
                ...formData,
                [e.target.name]: value
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setShowCustomerId('');

        // Client-side validation
        if (formData.password !== formData.confirmPassword) {
            setMessage('❌ Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setMessage('❌ Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (formData.pin_code.length !== 6) {
            setMessage('❌ PIN code must be exactly 6 digits');
            setLoading(false);
            return;
        }

        if (formData.phone_number.length !== 10) {
            setMessage('❌ Phone number must be exactly 10 digits');
            setLoading(false);
            return;
        }

        // Check if all required fields are filled
        const requiredFields = ['name', 'phone_number', 'gender', 'ward_no', 'door_no', 'street', 'city', 'district', 'state', 'pin_code'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            setMessage('❌ Please fill all required fields');
            setLoading(false);
            return;
        }

        try {
            console.log('🔄 Sending registration request...');
            
            // Test backend connection first
            try {
                await API.get('/test');
                console.log('✅ Backend connection successful');
            } catch (testError) {
                console.error('❌ Backend connection failed:', testError);
                setMessage('❌ Backend server is not running. Please start the backend server on port 5000.');
                setLoading(false);
                return;
            }

            const response = await API.post('/auth/register', {
                name: formData.name,
                phone_number: formData.phone_number,
                gender: formData.gender,
                ward_no: formData.ward_no,
                door_no: formData.door_no,
                street: formData.street,
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pin_code: formData.pin_code,
                password: formData.password,
                // NEW FIELDS
                dob: formData.dob,
                old_assessment_no: formData.old_assessment_no,
                new_assessment_no: formData.new_assessment_no
            });

            console.log('📨 Registration response:', response.data);

            if (response.data.success) {
                setMessage('✅ Registration successful!');
                setShowCustomerId(`Your Customer ID: ${response.data.customer_id}. Please save this ID for login. Customer ID has been sent to your mobile number.`);
                
                // Clear form
                setFormData({
                    name: '',
                    phone_number: '',
                    gender: '',
                    ward_no: '',
                    door_no: '',
                    street: '',
                    city: '',
                    district: '',
                    state: '',
                    pin_code: '',
                    password: '',
                    confirmPassword: '',
                    dob: '',
                    old_assessment_no: '',
                    new_assessment_no: ''
                });

                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            } else {
                setMessage('❌ ' + response.data.message);
            }
        } catch (error) {
            console.error('🚨 Registration error:', error);
            
            if (error.code === 'ERR_NETWORK') {
                setMessage('❌ Cannot connect to server. Please make sure the backend is running on port 5000.');
            } else if (error.response?.data?.message) {
                setMessage('❌ ' + error.response.data.message);
            } else {
                setMessage('❌ Registration failed. Please try again.');
            }
        }
        setLoading(false);
    };

    return (
        <div className="auth-container full-page">
            <div className="auth-card large-card">
                <h2>User Registration</h2>
                <p className="form-subtitle">Fill in your details to create an account</p>
                
                {message && (
                    <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                        {message}
                        {message.includes('port 5000') && (
                            <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                <strong>To fix this:</strong>
                                <ol style={{ textAlign: 'left', margin: '10px 0', paddingLeft: '20px' }}>
                                    <li>Open terminal in backend folder</li>
                                    <li>Run: <code>npm run dev</code></li>
                                    <li>Wait for "Server running on port 5000" message</li>
                                    <li>Then try registering again</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {showCustomerId && (
                    <div className="message success">
                        {showCustomerId}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Personal Information */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone_number"
                                placeholder="10-digit mobile number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                                maxLength="10"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Gender *</label>
                            <select 
                                name="gender" 
                                value={formData.gender} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Assessment Details */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Old Assessment No</label>
                            <input
                                type="text"
                                name="old_assessment_no"
                                placeholder="Old assessment number"
                                value={formData.old_assessment_no}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>New Assessment No</label>
                            <input
                                type="text"
                                name="new_assessment_no"
                                placeholder="New assessment number"
                                value={formData.new_assessment_no}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ward Number *</label>
                            <input
                                type="text"
                                name="ward_no"
                                placeholder="Enter ward number"
                                value={formData.ward_no}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Door No *</label>
                            <input
                                type="text"
                                name="door_no"
                                placeholder="Enter door number"
                                value={formData.door_no}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Street *</label>
                            <input
                                type="text"
                                name="street"
                                placeholder="Enter street name"
                                value={formData.street}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>City *</label>
                            <input
                                type="text"
                                name="city"
                                placeholder="Enter city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>District *</label>
                            <input
                                type="text"
                                name="district"
                                placeholder="Enter district"
                                value={formData.district}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>State *</label>
                            <input
                                type="text"
                                name="state"
                                placeholder="Enter state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>PIN Code *</label>
                            <input
                                type="text"
                                name="pin_code"
                                placeholder="6-digit PIN code"
                                value={formData.pin_code}
                                onChange={handleChange}
                                required
                                maxLength="6"
                            />
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter password (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="auth-button">
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="auth-links">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;