import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Link } from 'react-router-dom';
import Loading from '../Common/Loading';
import './Admin.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await API.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
        setLoading(false);
    };

    // Generate detailed water tax breakdown with penalty calculations
    const getWaterTaxBreakdown = (user) => {
        const dailyRate = 2;
        const quarters = [
            { key: 'q1_paid', name: 'Q1 (April-June)', days: 91, period: '2025-04-01 to 2025-06-30', quarterKey: 'q1' },
            { key: 'q2_paid', name: 'Q2 (July-September)', days: 92, period: '2025-07-01 to 2025-09-30', quarterKey: 'q2' },
            { key: 'q3_paid', name: 'Q3 (October-December)', days: 92, period: '2025-10-01 to 2025-12-31', quarterKey: 'q3' },
            { key: 'q4_paid', name: 'Q4 (January-March)', days: 90, period: '2026-01-01 to 2026-03-31', quarterKey: 'q4' }
        ];

        return quarters.map(quarter => {
            const originalAmount = dailyRate * quarter.days;
            const isPaid = user.tax_details.water_tax[quarter.key];
            const receipt = user.tax_details.water_tax[`${quarter.key.split('_')[0]}_receipt`];
            
            // Calculate penalty for this quarter
            let penaltyAmount = 0;
            let monthsDelayed = 0;
            let hasPenalty = false;
            let totalAmount = originalAmount;
            
            if (!isPaid) {
                // Simple penalty calculation (1% per month after 1 year)
                const dueDate = new Date(quarter.period.split(' to ')[1]);
                const oneYearAfterDue = new Date(dueDate);
                oneYearAfterDue.setFullYear(oneYearAfterDue.getFullYear() + 1);
                const currentDate = new Date();
                
                if (currentDate > oneYearAfterDue) {
                    const timeDiff = currentDate.getTime() - oneYearAfterDue.getTime();
                    monthsDelayed = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30.44));
                    penaltyAmount = originalAmount * 0.01 * monthsDelayed;
                    hasPenalty = true;
                    totalAmount = originalAmount + penaltyAmount;
                }
            }
            
            return {
                ...quarter,
                originalAmount: Math.round(originalAmount * 100) / 100,
                penaltyAmount: Math.round(penaltyAmount * 100) / 100,
                totalAmount: Math.round(totalAmount * 100) / 100,
                status: isPaid ? 'paid' : 'pending',
                receiptNumber: receipt || '',
                paidDate: isPaid ? user.tax_details.water_tax.last_paid_date : null,
                hasPenalty,
                monthsDelayed
            };
        });
    };

    // Generate property tax breakdown
    const getPropertyTaxBreakdown = (user) => {
        const propertyTax = user.tax_details.property_tax;
        const halfYearlyAmount = propertyTax.amount / 2;
        
        return [
            {
                period: '2025-2026 (April-September) - First Half',
                amount: halfYearlyAmount,
                status: propertyTax.status,
                receiptNumber: propertyTax.payment_history?.[0]?.receipt_number || '',
                paidDate: propertyTax.payment_history?.[0]?.paid_date || null
            },
            {
                period: '2025-2026 (October-March) - Second Half',
                amount: halfYearlyAmount,
                status: propertyTax.status,
                receiptNumber: propertyTax.payment_history?.[1]?.receipt_number || '',
                paidDate: propertyTax.payment_history?.[1]?.paid_date || null
            }
        ];
    };

    const deleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete user: ${userName}?`)) {
            try {
                await API.delete(`/admin/users/${userId}`);
                alert('User deleted successfully');
                fetchUsers();
            } catch (error) {
                alert('Error deleting user');
            }
        }
    };

    const viewTaxDetails = (user) => {
        setSelectedUser(user);
        setShowTaxModal(true);
        setActiveTab('overview');
    };

    const updateTaxStatus = async (userId, taxType, newStatus) => {
        try {
            await API.put(`/admin/users/${userId}/tax-status`, {
                tax_type: taxType,
                status: newStatus
            });
            alert('Tax status updated successfully!');
            fetchUsers();
            setShowTaxModal(false);
        } catch (error) {
            alert('Error updating tax status');
        }
    };

    // Send regular reminders
    const sendRemindersToAll = async () => {
        if (window.confirm('Send tax reminders to all users with pending payments?')) {
            setSendingReminders(true);
            try {
                const response = await API.post('/admin/send-tax-reminders');
                if (response.data.success) {
                    alert(`✅ ${response.data.message}\n\nSuccessful: ${response.data.sentCount}\nFailed: ${response.data.failedCount}`);
                } else {
                    alert(`❌ Error sending reminders: ${response.data.message}`);
                }
            } catch (error) {
                alert('❌ Error sending reminders. Please check console for details.');
            }
            setSendingReminders(false);
        }
    };

    // Send penalty-aware reminders
    const sendPenaltyAwareReminders = async () => {
        if (window.confirm('Send penalty-aware tax reminders to all users with pending payments?\n\nThis will include penalty calculations for overdue water tax payments.')) {
            setSendingReminders(true);
            try {
                const response = await API.post('/admin/send-penalty-reminders');
                if (response.data.success) {
                    alert(`✅ ${response.data.message}\n\nSuccessful: ${response.data.sentCount}\nFailed: ${response.data.failedCount}\n\nPenalty-aware reminders include detailed penalty calculations for overdue payments.`);
                } else {
                    alert(`❌ Error sending penalty reminders: ${response.data.message}`);
                }
            } catch (error) {
                alert('❌ Error sending penalty reminders. Please check console for details.');
            }
            setSendingReminders(false);
        }
    };

    // Pay specific quarter or half
    const handleAdminPayment = async (taxType, period, amount, quarter = null) => {
        if (!selectedUser) return;

        try {
            let endpoint = '';
            let payload = {
                userId: selectedUser._id,
                period: period,
                amount: amount
            };

            if (taxType === 'water') {
                endpoint = '/admin/pay-water-tax';
                if (quarter) {
                    payload.quarter = quarter;
                }
            } else {
                endpoint = '/admin/pay-property-tax';
            }

            console.log('🔄 Sending admin payment request:', { endpoint, payload });

            const response = await API.post(endpoint, payload);
            
            if (response.data.success) {
                alert(`✅ Payment recorded successfully!\nReceipt: ${response.data.receiptNumber}`);
                fetchUsers();
                setShowTaxModal(false);
            } else {
                alert(`❌ Payment failed: ${response.data.message}`);
            }
        } catch (error) {
            console.error('🚨 Admin payment error:', error);
            alert(`❌ Payment error: ${error.response?.data?.message || 'Please check console for details'}`);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.phone_number.includes(searchTerm);
        
        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'paid') {
            return matchesSearch && 
                   user.tax_details.property_tax.status === 'paid' && 
                   user.tax_details.water_tax.status === 'paid';
        }
        if (filterStatus === 'pending') {
            return matchesSearch && 
                   (user.tax_details.property_tax.status === 'pending' || 
                    user.tax_details.water_tax.status === 'pending');
        }
        return matchesSearch;
    });

    if (loading) return <Loading message="Loading users..." />;

    return (
        <div className="admin-dashboard">
            {/* Search and Filter Section */}
            <div className="admin-filters">
                <input
                    type="text"
                    placeholder="Search by name, customer ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                />
                
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Users</option>
                    <option value="paid">Fully Paid</option>
                    <option value="pending">Pending Payments</option>
                </select>
                
                <button onClick={fetchUsers} className="admin-nav-link" style={{margin: 0}}>
                    Refresh
                </button>

                <button 
                    onClick={sendRemindersToAll} 
                    disabled={sendingReminders}
                    className="admin-nav-link"
                    style={{backgroundColor: '#28a745'}}
                >
                    {sendingReminders ? 'Sending...' : '📧 Send Reminders'}
                </button>

                <button 
                    onClick={sendPenaltyAwareReminders} 
                    disabled={sendingReminders}
                    className="admin-nav-link"
                    style={{backgroundColor: '#dc3545'}}
                >
                    {sendingReminders ? 'Sending...' : '⚠️ Send Penalty Reminders'}
                </button>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Property Tax</th>
                            <th>Water Tax</th>
                            <th>Total Due</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => {
                            const propertyDue = user.tax_details.property_tax.status === 'pending' ? 
                                user.tax_details.property_tax.amount : 0;
                            const waterDue = user.tax_details.water_tax.status !== 'paid' ? 
                                user.tax_details.water_tax.amount : 0;
                            const totalDue = propertyDue + waterDue;
                            
                            return (
                                <tr key={user._id}>
                                    <td style={{fontWeight: 'bold', color: '#2c3e50'}}>{user.customer_id}</td>
                                    <td style={{color: '#2c3e50'}}>{user.name}</td>
                                    <td style={{color: '#2c3e50'}}>{user.phone_number}</td>
                                    <td>
                                        <span className={`tax-status ${user.tax_details.property_tax.status}`}>
                                            ₹{user.tax_details.property_tax.amount}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`tax-status ${user.tax_details.water_tax.status}`}>
                                            ₹{user.tax_details.water_tax.amount}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`total-due ${totalDue === 0 ? 'paid' : 'pending'}`}>
                                            ₹{totalDue.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-view"
                                                onClick={() => viewTaxDetails(user)}
                                            >
                                                📊 View Details
                                            </button>
                                            <Link 
                                                to={`/admin/edit-user/${user._id}`}
                                                className="btn btn-edit"
                                            >
                                                ✏️ Edit
                                            </Link>
                                            <button 
                                                className="btn btn-delete"
                                                onClick={() => deleteUser(user._id, user.name)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="no-data">
                        No users found matching your criteria.
                    </div>
                )}

                <div className="summary-info">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* Enhanced Tax Details Modal */}
            {showTaxModal && selectedUser && (
                <div className="tax-modal">
                    <div className="tax-modal-content large-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{color: '#2c3e50', margin: 0}}>
                                📊 Tax Details - {selectedUser.name}
                            </h3>
                            <button 
                                onClick={() => setShowTaxModal(false)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    fontSize: '24px', 
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="tax-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                📈 Overview
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'property' ? 'active' : ''}`}
                                onClick={() => setActiveTab('property')}
                            >
                                🏠 Property Tax
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'water' ? 'active' : ''}`}
                                onClick={() => setActiveTab('water')}
                            >
                                💧 Water Tax
                            </button>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="tab-content">
                                <div className="tax-summary">
                                    <div className="tax-card property">
                                        <h4>🏠 Property Tax</h4>
                                        <div className="tax-amount">₹{selectedUser.tax_details.property_tax.amount}</div>
                                        <span className={`tax-status ${selectedUser.tax_details.property_tax.status}`}>
                                            {selectedUser.tax_details.property_tax.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="tax-card water">
                                        <h4>💧 Water Tax</h4>
                                        <div className="tax-amount">₹{selectedUser.tax_details.water_tax.amount}</div>
                                        <span className={`tax-status ${selectedUser.tax_details.water_tax.status}`}>
                                            {selectedUser.tax_details.water_tax.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="tax-card total">
                                        <h4>💰 Total Due</h4>
                                        <div className="tax-amount">
                                            ₹{(selectedUser.tax_details.property_tax.status === 'pending' ? selectedUser.tax_details.property_tax.amount : 0) +
                                              (selectedUser.tax_details.water_tax.status !== 'paid' ? selectedUser.tax_details.water_tax.amount : 0)}
                                        </div>
                                        <span className="tax-status pending">TO PAY</span>
                                    </div>
                                </div>

                                <div className="quick-actions">
                                    <h4>Quick Actions</h4>
                                    <div className="action-buttons-grid">
                                        <button 
                                            className="btn btn-success"
                                            onClick={() => handleAdminPayment('property', '2025-2026', selectedUser.tax_details.property_tax.amount)}
                                        >
                                            💳 Pay Full Property Tax
                                        </button>
                                        <button 
                                            className="btn btn-success"
                                            onClick={() => handleAdminPayment('water', '2025-2026', selectedUser.tax_details.water_tax.amount, 'full')}
                                        >
                                            💳 Pay Full Water Tax
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Property Tax Tab */}
                        {activeTab === 'property' && (
                            <div className="tab-content">
                                <h4>Property Tax Breakdown</h4>
                                <table className="breakdown-table">
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Receipt</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPropertyTaxBreakdown(selectedUser).map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.period}</td>
                                                <td>₹{item.amount}</td>
                                                <td>
                                                    <span className={`status-badge ${item.status}`}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {item.receiptNumber || 'Not Paid'}
                                                </td>
                                                <td>
                                                    {item.status === 'pending' ? (
                                                        <button 
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleAdminPayment('property', item.period, item.amount)}
                                                        >
                                                            Pay
                                                        </button>
                                                    ) : (
                                                        <span className="paid-badge">✅ Paid</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Water Tax Tab */}
                        {activeTab === 'water' && (
                            <div className="tab-content">
                                <h4>Water Tax Quarterly Breakdown with Penalty Details</h4>
                                <table className="breakdown-table">
                                    <thead>
                                        <tr>
                                            <th>Quarter</th>
                                            <th>Period</th>
                                            <th>Original Amount</th>
                                            <th>Penalty</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Receipt</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getWaterTaxBreakdown(selectedUser).map((quarter, index) => (
                                            <tr key={index} className={quarter.hasPenalty ? 'penalty-row' : ''}>
                                                <td>{quarter.name}</td>
                                                <td>{quarter.period}</td>
                                                <td>₹{quarter.originalAmount}</td>
                                                <td>
                                                    {quarter.penaltyAmount > 0 ? (
                                                        <span className="penalty-amount" title={`${quarter.monthsDelayed} months delayed`}>
                                                            ₹{quarter.penaltyAmount}
                                                            <span className="penalty-indicator">⚠️</span>
                                                        </span>
                                                    ) : (
                                                        '₹0'
                                                    )}
                                                </td>
                                                <td>
                                                    <strong>₹{quarter.totalAmount}</strong>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${quarter.status}`}>
                                                        {quarter.status.toUpperCase()}
                                                    </span>
                                                    {quarter.hasPenalty && (
                                                        <div className="penalty-status">
                                                            <small>Penalty Applied</small>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {quarter.receiptNumber || 'Not Paid'}
                                                </td>
                                                <td>
                                                    {quarter.status === 'pending' ? (
                                                        <button 
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleAdminPayment('water', quarter.name, quarter.totalAmount, `q${index + 1}`)}
                                                            title={quarter.penaltyAmount > 0 ? `Pay ₹${quarter.totalAmount} (₹${quarter.originalAmount} + ₹${quarter.penaltyAmount} penalty)` : `Pay ₹${quarter.originalAmount}`}
                                                        >
                                                            Pay ₹{quarter.totalAmount}
                                                        </button>
                                                    ) : (
                                                        <span className="paid-badge">✅ Paid</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {/* Penalty Summary */}
                                {getWaterTaxBreakdown(selectedUser).some(q => q.hasPenalty) && (
                                    <div className="penalty-summary" style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '5px'}}>
                                        <h5 style={{color: '#721c24', margin: '0 0 10px 0'}}>⚠️ Penalty Summary</h5>
                                        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                                            <div>
                                                <strong>Total Original Amount:</strong> ₹{getWaterTaxBreakdown(selectedUser).reduce((sum, q) => sum + q.originalAmount, 0)}
                                            </div>
                                            <div>
                                                <strong>Total Penalty:</strong> ₹{getWaterTaxBreakdown(selectedUser).reduce((sum, q) => sum + q.penaltyAmount, 0)}
                                            </div>
                                            <div>
                                                <strong>Total Due:</strong> ₹{getWaterTaxBreakdown(selectedUser).filter(q => q.status === 'pending').reduce((sum, q) => sum + q.totalAmount, 0)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="close-btn" onClick={() => setShowTaxModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;