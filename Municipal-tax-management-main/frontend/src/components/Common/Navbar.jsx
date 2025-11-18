import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav style={{ 
            padding: '1rem 2rem', 
            backgroundColor: '#2c3e50', 
            borderBottom: '1px solid #34495e',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                maxWidth: '1200px', 
                margin: '0 auto' 
            }}>
                <Link to={user ? (user.role === 'admin' ? "/admin/overview" : "/dashboard") : "/"} 
                      style={{ 
                          textDecoration: 'none', 
                          color: 'white', 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                      }}>
                    <span>🏛️</span>
                    Municipal Tax System
                </Link>
                
                {user && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.5rem', 
                        color: 'white',
                        fontSize: '14px'
                    }}>
                        <span>Welcome, <strong>{user.name}</strong> ({user.role})</span>
                        
                        {user.role !== 'admin' ? (
                            <Link to="/dashboard" style={{ 
                                textDecoration: 'none', 
                                color: '#3498db',
                                fontWeight: '600',
                                padding: '8px 16px',
                                borderRadius: '5px',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }}>
                                📋 Dashboard
                            </Link>
                        ) : null}
                        
                        <Link to="/change-password" style={{ 
                            textDecoration: 'none', 
                            color: '#f39c12',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }}>
                            🔒 Change Password
                        </Link>
                        
                        <button onClick={handleLogout} style={{ 
                            padding: '8px 16px', 
                            border: 'none', 
                            backgroundColor: '#e74c3c', 
                            color: 'white', 
                            borderRadius: '5px', 
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}>
                            🚪 Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;