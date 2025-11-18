// import React, { useState } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// import API from '../../utils/api';
// import './Auth.css';

// const Login = () => {
//     const [formData, setFormData] = useState({
//         name: '',
//         phone_number: '',
//         password: '',
//         isAdmin: false
//     });
//     const [loading, setLoading] = useState(false);
//     const [message, setMessage] = useState('');

//     const { login } = useAuth();
//     const navigate = useNavigate();

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setMessage('');

//         try {
//             console.log('Login attempt:', formData);
            
//             const result = await login(formData);
//             console.log('Login result:', result);
            
//             if (result.success) {
//                 setMessage('✅ Login successful! Redirecting...');
                
//                 // Small delay to show success message
//                 setTimeout(() => {
//                     if (formData.isAdmin) {
//                         navigate('/admin/users');
//                     } else {
//                         navigate('/dashboard');
//                     }
//                 }, 1000);
//             } else {
//                 setMessage('❌ ' + result.message);
//             }
//         } catch (error) {
//             console.error('Login error:', error);
//             setMessage('❌ Login failed. Please try again.');
//         }
//         setLoading(false);
//     };

//     return (
//         <div className="auth-container">
//             <div className="auth-card">
//                 <h2>{formData.isAdmin ? 'Admin Login' : 'User Login'}</h2>
                
//                 <form onSubmit={handleSubmit} className="auth-form">
//                     <div className="form-group">
//                         <label>{formData.isAdmin ? 'Username' : 'Full Name'}</label>
//                         <input
//                             type="text"
//                             name="name"
//                             placeholder={formData.isAdmin ? 'Enter username' : 'Enter your full name'}
//                             value={formData.name}
//                             onChange={handleChange}
//                             required
//                         />
//                     </div>

//                     {!formData.isAdmin && (
//                         <div className="form-group">
//                             <label>Phone Number</label>
//                             <input
//                                 type="tel"
//                                 name="phone_number"
//                                 placeholder="Enter phone number"
//                                 value={formData.phone_number}
//                                 onChange={handleChange}
//                                 required
//                             />
//                         </div>
//                     )}

//                     <div className="form-group">
//                         <label>Password</label>
//                         <input
//                             type="password"
//                             name="password"
//                             placeholder="Enter password"
//                             value={formData.password}
//                             onChange={handleChange}
//                             required
//                         />
//                     </div>

//                     <div className="form-group checkbox-group">
//                         <label>
//                             <input
//                                 type="checkbox"
//                                 name="isAdmin"
//                                 checked={formData.isAdmin}
//                                 onChange={handleChange}
//                             />
//                             Login as Administrator
//                         </label>
//                     </div>

//                     {message && (
//                         <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
//                             {message}
//                         </div>
//                     )}

//                     <button type="submit" disabled={loading} className="auth-button">
//                         {loading ? 'Logging in...' : 'Login'}
//                     </button>
//                 </form>

//                 <div className="auth-links">
//                     {!formData.isAdmin && (
//                         <>
//                             <p>Don't have an account? <Link to="/register">Register here</Link></p>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../utils/api';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        password: '',
        isAdmin: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const result = await login(formData);

            if (result.success) {
                setMessage('✅ Login successful! Redirecting...');
                setTimeout(() => {
                    if (formData.isAdmin) {
                        navigate('/admin/users');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1000);
            } else {
                setMessage('❌ ' + result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('❌ Login failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{formData.isAdmin ? 'Admin Login' : 'User Login'}</h2>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>{formData.isAdmin ? 'Username' : 'Full Name'}</label>
                        <input
                            type="text"
                            name="name"
                            placeholder={formData.isAdmin ? 'Enter username' : 'Enter your full name'}
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {!formData.isAdmin && (
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                placeholder="Enter phone number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <div className="forgot-password-link">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
    <input
        type="checkbox"
        name="isAdmin"
        checked={formData.isAdmin}
        onChange={handleChange}
        id="isAdmin"
    />
    <label htmlFor="isAdmin">Login as Administrator</label>
</div>


                    {message && (
                        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="auth-button">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-links">
                    {!formData.isAdmin && (
                        <>
                            <p>Don't have an account? <Link to="/register">Register here</Link></p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
