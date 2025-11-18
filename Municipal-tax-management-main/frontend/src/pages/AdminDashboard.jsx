import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import UserManagement from '../components/Admin/UserManagement';
import AddUser from '../components/Admin/AddUser';
import EditUser from '../components/Admin/EditUser';
import TaxPieCharts from '../components/Admin/TaxPieCharts';
import Reports from '../components/Admin/Reports';
import { useAuth } from '../context/AuthContext';
import '../components/Admin/Admin.css';

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="admin-dashboard">
            {/* Admin Header */}
            <div className="admin-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Admin Dashboard</h1>
                        <div>Welcome, {user?.name}</div>
                    </div>
                    
                </div>
            </div>
            
            {/* Navigation Tabs (Top Bar) */}
            <nav className="admin-nav">
                <Link 
                    to="/admin/overview" 
                    className={`admin-nav-link ${location.pathname.includes('/overview') ? 'active' : ''}`}
                >
                    🏠 Overview
                </Link>
                <Link 
                    to="/admin/users" 
                    className={`admin-nav-link ${location.pathname.includes('/users') ? 'active' : ''}`}
                >
                    📊 Manage Users
                </Link>
                <Link 
                    to="/admin/add-user" 
                    className={`admin-nav-link ${location.pathname.includes('/add-user') ? 'active' : ''}`}
                >
                    ➕ Add New User
                </Link>
                <Link 
                    to="/admin/reports" 
                    className={`admin-nav-link ${location.pathname.includes('/reports') ? 'active' : ''}`}
                >
                    📄 Reports
                </Link>
            </nav>

            {/* Main Content Area */}
            <div className="admin-content">
                <Routes>
                    <Route path="users" element={<UserManagement />} />
                    <Route path="add-user" element={<AddUser />} />
                    <Route path="edit-user/:id" element={<EditUser />} />
                    <Route path="overview" element={<TaxPieCharts />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="" element={<Navigate to="overview" replace />} />
                    <Route path="*" element={<Navigate to="overview" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;
