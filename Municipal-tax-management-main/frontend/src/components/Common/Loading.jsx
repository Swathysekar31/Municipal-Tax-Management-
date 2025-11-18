import React from 'react';

const Loading = ({ size = 'medium', message = 'Loading...' }) => {
    const sizes = {
        small: '1rem',
        medium: '2rem',
        large: '3rem'
    };

    const spinnerStyle = {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        width: sizes[size],
        height: sizes[size],
        animation: 'spin 1s linear infinite'
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            <p style={{ marginTop: '1rem', color: '#666' }}>{message}</p>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

// Loading overlay for full page
export const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <Loading size="large" message={message} />
        </div>
    );
};

// Inline loading spinner
export const InlineLoading = () => {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <span>Loading...</span>
        </div>
    );
};

export default Loading;