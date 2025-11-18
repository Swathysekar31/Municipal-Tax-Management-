import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChangePassword from './components/Auth/ChangePassword';
import UserDashboard from './pages/UserDashboard';
import WaterTax from './pages/WaterTax';
import PropertyTax from './pages/PropertyTax';
import PaymentPage from './pages/PaymentPage'; // Add this import
import PaymentSuccess from './pages/PaymentSuccess'; // Add this import
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import Loading from './components/Common/Loading';
import Navbar from './components/Common/Navbar';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <Loading />;
    
    if (!user) return <Navigate to="/login" />;
    
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;

    return (
        <div style={{ minHeight: '100vh' }}>
            {user && <Navbar />}
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={
                    !user ? <Login /> : 
                    user.role === 'admin' ? <Navigate to="/admin/users" /> : <Navigate to="/dashboard" />
                } />
                <Route path="/register" element={
                    !user ? <Register /> : <Navigate to="/dashboard" />
                } />
                
                {/* Protected User Routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <UserDashboard />
                    </ProtectedRoute>
                } />
                
                {/* Tax Routes */}
                <Route path="/water-tax" element={
                    <ProtectedRoute>
                        <WaterTax />
                    </ProtectedRoute>
                } />
                <Route path="/property-tax" element={
                    <ProtectedRoute>
                        <PropertyTax />
                    </ProtectedRoute>
                } />
                
                {/* Payment Routes */}
                <Route path="/payment" element={
                <ProtectedRoute>
                    <PaymentPage />
                </ProtectedRoute>
                } />
                <Route path="/payment-success" element={
                <ProtectedRoute>
                    <PaymentSuccess />
                </ProtectedRoute>
                } />

                {/* Protected Admin Routes */}
                <Route path="/admin/*" element={
                    <ProtectedRoute adminOnly={true}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                
                <Route path="/change-password" element={
                    <ProtectedRoute>
                        <ChangePassword />
                    </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;