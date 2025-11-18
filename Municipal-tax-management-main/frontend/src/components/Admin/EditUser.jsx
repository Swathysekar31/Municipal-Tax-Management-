import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../Common/Loading';

const EditUser = () => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        phone_number: '',
        gender: '',
        ward_no: '',
        door_no: '',
        street: '',
        city: '',
        district: '',
        state: '',
        pin_code: '',
        home_type: 'Residential',
        old_assessment_no: '',
        new_assessment_no: '',
        tax_amount: '',
        water_tax_amount: '',
        property_tax_status: 'pending',
        water_tax_status: 'pending'
    });
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        try {
            const response = await API.get(`/admin/users`);
            const user = response.data.find(u => u._id === id);
            if (user) {
                setFormData({
                    name: user.name || '',
                    dob: user.dob ? user.dob.split('T')[0] : '',
                    phone_number: user.phone_number || '',
                    gender: user.gender || '',
                    ward_no: user.ward_no || '',
                    door_no: user.door_no || '',
                    street: user.street || '',
                    city: user.city || '',
                    district: user.district || '',
                    state: user.state || '',
                    pin_code: user.pin_code || '',
                    home_type: user.home_type || 'Residential',
                    old_assessment_no: user.old_assessment_no || '',
                    new_assessment_no: user.new_assessment_no || '',
                    tax_amount: user.tax_details?.property_tax?.amount || '',
                    water_tax_amount: user.tax_details?.water_tax?.amount || '',
                    property_tax_status: user.tax_details?.property_tax?.status || 'pending',
                    water_tax_status: user.tax_details?.water_tax?.status || 'pending'
                });
            } else {
                setMessage('User not found');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setMessage('Error loading user data');
        }
        setUserLoading(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const updateData = {
                name: formData.name,
                dob: formData.dob,
                phone_number: formData.phone_number,
                gender: formData.gender,
                ward_no: formData.ward_no,
                door_no: formData.door_no,
                street: formData.street,
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pin_code: formData.pin_code,
                home_type: formData.home_type,
                old_assessment_no: formData.old_assessment_no,
                new_assessment_no: formData.new_assessment_no,
                'tax_details.property_tax.amount': parseFloat(formData.tax_amount) || 0,
                'tax_details.water_tax.amount': parseFloat(formData.water_tax_amount) || 0,
                'tax_details.property_tax.status': formData.property_tax_status,
                'tax_details.water_tax.status': formData.water_tax_status
            };

            console.log('Updating user with data:', updateData);

            const response = await API.put(`/admin/users/${id}`, updateData);
            
            if (response.data) {
                setMessage('✅ User updated successfully!');
                setTimeout(() => {
                    navigate('/admin/users');
                }, 2000);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage('❌ Error updating user: ' + (error.response?.data?.message || 'Please try again'));
        }
        setLoading(false);
    };

    const updateTaxStatus = async (taxType, status) => {
        try {
            await API.put(`/admin/users/${id}/tax-status`, {
                tax_type: taxType,
                status: status
            });
            setMessage('✅ Tax status updated successfully!');
            fetchUserData(); // Refresh data
        } catch (error) {
            setMessage('❌ Error updating tax status');
        }
    };

    if (userLoading) return <Loading />;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Edit User</h2>
                <button 
                    onClick={() => navigate('/admin/users')}
                    style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Back to Users
                </button>
            </div>

            {message && (
                <div style={{ 
                    padding: '15px', 
                    marginBottom: '20px', 
                    borderRadius: '5px',
                    backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
                    color: message.includes('✅') ? '#155724' : '#721c24',
                    border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                
                {/* Personal Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Gender *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Address Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Ward Number *</label>
                            <input
                                type="text"
                                name="ward_no"
                                value={formData.ward_no}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Door No *</label>
                            <input
                                type="text"
                                name="door_no"
                                value={formData.door_no}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Street *</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>District *</label>
                            <input
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>State *</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>PIN Code *</label>
                            <input
                                type="text"
                                name="pin_code"
                                value={formData.pin_code}
                                onChange={handleChange}
                                required
                                maxLength="6"
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Home Type</label>
                            <select
                                name="home_type"
                                value={formData.home_type}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            >
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Industrial">Industrial</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Assessment Details */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Assessment Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>Old Assessment No</label>
                            <input
                                type="text"
                                name="old_assessment_no"
                                value={formData.old_assessment_no}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>New Assessment No</label>
                            <input
                                type="text"
                                name="new_assessment_no"
                                value={formData.new_assessment_no}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', border: '2px solid #bdc3c7', borderRadius: '5px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tax Information */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Tax Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        
                        {/* Property Tax */}
                        <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '10px', border: '2px solid #2196f3' }}>
                            <h4 style={{ color: '#2196f3', marginBottom: '15px' }}>Property Tax</h4>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Amount (₹)</label>
                                <input
                                    type="number"
                                    name="tax_amount"
                                    value={formData.tax_amount}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #2196f3', borderRadius: '5px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Status</label>
                                <select
                                    name="property_tax_status"
                                    value={formData.property_tax_status}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #2196f3', borderRadius: '5px' }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        {/* Water Tax */}
                        <div style={{ padding: '20px', background: '#e8f5e8', borderRadius: '10px', border: '2px solid #4caf50' }}>
                            <h4 style={{ color: '#4caf50', marginBottom: '15px' }}>Water Tax</h4>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Amount (₹)</label>
                                <input
                                    type="number"
                                    name="water_tax_amount"
                                    value={formData.water_tax_amount}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #4caf50', borderRadius: '5px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Status</label>
                                <select
                                    name="water_tax_status"
                                    value={formData.water_tax_status}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #4caf50', borderRadius: '5px' }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            padding: '12px 30px', 
                            background: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? 'Updating...' : 'Update User'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/admin/users')}
                        style={{ 
                            padding: '12px 30px', 
                            background: '#6c757d', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditUser;