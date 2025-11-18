import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { user } = useAuth();

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header with Navigation */}
            <header style={{ 
                padding: '1rem 2rem', 
                backgroundColor: '#2c3e50', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <Link to="/" style={{ 
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
                
                <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!user ? (
                        <>
                            <Link to="/login" style={{ 
                                padding: '0.6rem 1.2rem', 
                                backgroundColor: '#3498db', 
                                color: 'white', 
                                textDecoration: 'none', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#2980b9';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#3498db';
                            }}>
                                Login
                            </Link>
                            <Link to="/register" style={{ 
                                padding: '0.6rem 1.2rem', 
                                backgroundColor: '#27ae60', 
                                color: 'white', 
                                textDecoration: 'none', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#219652';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#27ae60';
                            }}>
                                Register
                            </Link>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#ecf0f1' }}>
                                Welcome, {user.name}
                            </span>
                            <Link to="/dashboard" style={{ 
                                padding: '0.6rem 1.2rem', 
                                backgroundColor: '#3498db', 
                                color: 'white', 
                                textDecoration: 'none', 
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}>
                                Dashboard
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin/users" style={{ 
                                    padding: '0.6rem 1.2rem', 
                                    backgroundColor: '#e67e22', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Hero Section */}
            <section style={{ 
                flex: '1', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative'
            }}>
                
                {/* Main Content */}
                <div style={{ 
                    maxWidth: '600px', 
                    position: 'relative',
                    zIndex: 2
                }}>
                    <h1 style={{ 
                        fontSize: '3rem', 
                        marginBottom: '1.5rem', 
                        color: 'white',
                        fontWeight: '700'
                    }}>
                        Municipal Tax Management System
                    </h1>
                    <p style={{ 
                        fontSize: '1.2rem', 
                        marginBottom: '3rem', 
                        opacity: 0.9,
                        lineHeight: '1.6'
                    }}>
                        Streamline your municipal tax collection and management with our comprehensive digital solution. 
                        Easy payments, real-time tracking, and efficient administration.
                    </p>
                    
                    {!user ? (
                        <div style={{ 
                            display: 'flex', 
                            gap: '1.5rem', 
                            justifyContent: 'center', 
                            flexWrap: 'wrap'
                        }}>
                            <Link to="/login" style={{
                                padding: '1.2rem 2.5rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: '#667eea',
                                textDecoration: 'none',
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                border: '2px solid white',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                minWidth: '180px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                            }}>
                                👤 User Login
                            </Link>
                            <Link to="/login" style={{
                                padding: '1.2rem 2.5rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: '#667eea',
                                textDecoration: 'none',
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                border: '2px solid white',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                minWidth: '180px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                            }}>
                                🛡️ Admin Login
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/dashboard" style={{
                                padding: '1.2rem 2.5rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: '#667eea',
                                textDecoration: 'none',
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                border: '2px solid white',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                minWidth: '200px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                            }}>
                                Go to Dashboard
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin/users" style={{
                                    padding: '1.2rem 2.5rem',
                                    backgroundColor: 'rgba(255,165,0,0.9)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    fontSize: '1.1rem',
                                    border: '2px solid rgba(255,165,0,0.9)',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                    minWidth: '200px'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = '#e67e22';
                                    e.target.style.transform = 'translateY(-3px)';
                                    e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255,165,0,0.9)';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                                }}>
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Features Section */}
                {!user && (
                    <div style={{ 
                        marginTop: '5rem', 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                        gap: '2rem', 
                        maxWidth: '1000px', 
                        width: '100%',
                        position: 'relative',
                        zIndex: 2
                    }}>
                        
                        <div style={{ 
                            padding: '2rem', 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Easy Tax Payments</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.5', fontSize: '0.95rem' }}>
                                Pay property and water taxes online with multiple payment options. Get instant receipts and track payment history.
                            </p>
                        </div>

                        <div style={{ 
                            padding: '2rem', 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Real-time Tracking</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.5', fontSize: '0.95rem' }}>
                                Monitor tax status, view pending payments, and access detailed reports from your dashboard.
                            </p>
                        </div>

                        <div style={{ 
                            padding: '2rem', 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Secure & Reliable</h3>
                            <p style={{ opacity: 0.9, lineHeight: '1.5', fontSize: '0.95rem' }}>
                                Your data is protected with enterprise-grade security measures and complete privacy protection.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{ 
                padding: '2rem', 
                backgroundColor: '#2c3e50', 
                color: 'white', 
                textAlign: 'center',
                borderTop: '2px solid #34495e'
            }}>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                    &copy; 2024 Municipal Tax Management System. All rights reserved.
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    A digital initiative for transparent and efficient tax administration
                </p>
            </footer>
        </div>
    );
};

export default Home;