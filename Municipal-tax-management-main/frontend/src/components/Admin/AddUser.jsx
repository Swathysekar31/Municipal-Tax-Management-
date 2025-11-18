import React, { useState } from 'react';
import API from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import './AddUser.css';

const AddUser = () => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        phone_number: '',
        gender: '',
        door_no: '',
        street: '',
        city: '',
        district: '',
        state: '',
        pin_code: '',
        ward_no: '',
        home_type: 'Residential',
        old_assessment_no: '',
        new_assessment_no: '',
        tax_amount: '',
        water_tax_amount: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await API.post('/admin/users', formData);
            alert('User created successfully! Customer ID will be sent via SMS.');
            navigate('/admin/users');
        } catch (error) {
            alert('Error creating user: ' + error.response?.data?.message);
        }
        setLoading(false);
    };

    return (
        <div>
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit} className="add-user-form">
                <div style={{ gridColumn: 'span 2' }}>
                    <h3>Personal Information</h3>
                </div>
                
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                <input type="tel" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} required />
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>

                <div style={{ gridColumn: 'span 2' }}>
                    <h3>Address Information</h3>
                </div>

                <input type="text" name="door_no" placeholder="Door No" value={formData.door_no} onChange={handleChange} required />
                <input type="text" name="street" placeholder="Street" value={formData.street} onChange={handleChange} required />
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required />
                <input type="text" name="district" placeholder="District" value={formData.district} onChange={handleChange} required />
                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required />
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
                 <div className="form-group">
        <label>Ward Number *</label>
        <input
            type="text"
            name="ward_no"
            placeholder="Ward number"
            value={formData.ward_no}
            onChange={handleChange}
            required
        />
    </div>
                <select name="home_type" value={formData.home_type} onChange={handleChange}>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                </select>

                <div style={{ gridColumn: 'span 2' }}>
                    <h3>Assessment Details</h3>
                </div>

                <input type="text" name="old_assessment_no" placeholder="Old Assessment No" value={formData.old_assessment_no} onChange={handleChange} />
                <input type="text" name="new_assessment_no" placeholder="New Assessment No" value={formData.new_assessment_no} onChange={handleChange} />

                <div style={{ gridColumn: 'span 2' }}>
                    <h3>Tax Information</h3>
                </div>

                <input type="number" name="tax_amount" placeholder="Property Tax Amount" value={formData.tax_amount} onChange={handleChange} />
                <input type="number" name="water_tax_amount" placeholder="Water Tax Amount" value={formData.water_tax_amount} onChange={handleChange} />

                <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating User...' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddUser;