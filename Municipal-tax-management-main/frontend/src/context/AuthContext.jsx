import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            console.log('🔍 Auth check - Token exists:', !!token, 'User data exists:', !!userData);
            
            if (token && userData) {
                API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                try {
                    // Test the token by making a simple API call
                    const response = await API.get('/users/profile');
                    console.log('✅ Token valid, user:', response.data);
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.log('❌ Token invalid, clearing storage');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    delete API.defaults.headers.common['Authorization'];
                }
            } else {
                console.log('🔍 No token or user data found');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const login = async (loginData) => {
        try {
            console.log('🚀 Starting login process for:', loginData);
            
            const response = await API.post('/auth/login', loginData);
            console.log('📨 Login response:', response.data);
            
            if (response.data.success) {
                const { token, user } = response.data;
                
                console.log('✅ Login successful, user role:', user.role);
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(user);
                
                return { success: true, user };
            } else {
                console.log('❌ Login failed:', response.data.message);
                return { 
                    success: false, 
                    message: response.data.message 
                };
            }
        } catch (error) {
            console.error('🚨 Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
            };
        }
    };

    const logout = () => {
        console.log('👋 Logging out user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete API.defaults.headers.common['Authorization'];
        setUser(null);
        window.location.href = '/';
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};