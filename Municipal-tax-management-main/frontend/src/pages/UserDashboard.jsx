import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchData, setSearchData] = useState({
        taxType: 'Property Tax',
        district: '',
        wardNo: '',
        city: '',
        assessmentNumber: '',
        mobileNo: '',
        doorNo: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await API.get('/users/profile');
            setUserData(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
        setLoading(false);
    };

    const handleSearchChange = (e) => {
        setSearchData({
            ...searchData,
            [e.target.name]: e.target.value
        });
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchLoading(true);
        
        try {
            // Search based on user input
            let searchCriteria = {};
            
            if (searchData.assessmentNumber) {
                searchCriteria.assessmentNumber = searchData.assessmentNumber;
            } else if (searchData.mobileNo) {
                searchCriteria.phone_number = searchData.mobileNo;
            } else if (searchData.doorNo) {
                searchCriteria.door_no = searchData.doorNo;
            }

            // API call to search users
            const response = await API.post('/admin/search-users', searchCriteria);
            setSearchResults(response.data);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to mock data
            const mockResults = [
                {
                    _id: '1',
                    new_assessment_no: '001/1234567',
                    name: 'priya',
                    ward_no: '10',
                    street: 'Gandhi nagar',
                    city: 'City',
                    tax_details: {}
                }
            ];
            setSearchResults(mockResults);
            setShowSearchResults(true);
        }
        setSearchLoading(false);
    };

    const handleCancel = () => {
        setSearchData({
            taxType: 'Property Tax',
            district: '',
            wardNo: '',
            city: '',
            assessmentNumber: '',
            mobileNo: '',
            doorNo: ''
        });
        setShowSearchResults(false);
        setSearchResults([]);
    };

    const handleViewDetails = (user) => {
        if (searchData.taxType === 'Property Tax') {
            navigate('/property-tax', { state: { user } });
        } else {
            navigate('/water-tax', { state: { user } });
        }
    };

    if (loading) {
        return (
            <div className="user-dashboard">
                <div className="loading-container">Loading user data...</div>
            </div>
        );
    }

    return (
        <div className="user-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Assessment Search</h1>
                </div>
                <div className="header-right">
                    <div className="user-profile">
                        <div className="profile-pic">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="user-name">Welcome, {user?.name || 'User'}</span>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    {/* Tax Type Selection */}
                    <div className="form-group">
                        <label>Tax Type</label>
                        <div className="tax-type-buttons">
                            <button
                                type="button"
                                className={`tax-type-btn ${searchData.taxType === 'Property Tax' ? 'active' : ''}`}
                                onClick={() => setSearchData({...searchData, taxType: 'Property Tax'})}
                            >
                                Property Tax
                            </button>
                            <button
                                type="button"
                                className={`tax-type-btn ${searchData.taxType === 'Water Charges' ? 'active' : ''}`}
                                onClick={() => setSearchData({...searchData, taxType: 'Water Charges'})}
                            >
                                Water Charges
                            </button>
                        </div>
                    </div>

                    {/* Location Filters */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>District</label>
                            <input
                                type="text"
                                name="district"
                                value={searchData.district}
                                onChange={handleSearchChange}
                                placeholder="Enter district"
                            />
                        </div>
                        <div className="form-group">
                            <label>Ward No</label>
                            <input
                                type="text"
                                name="wardNo"
                                value={searchData.wardNo}
                                onChange={handleSearchChange}
                                placeholder="Enter ward number"
                            />
                        </div>
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                name="city"
                                value={searchData.city}
                                onChange={handleSearchChange}
                                placeholder="Enter city"
                            />
                        </div>
                    </div>

                    {/* Search Options */}
                    <div className="search-options">
                        <div className="option-group">
                            <label>Assessment Number</label>
                            <input
                                type="text"
                                name="assessmentNumber"
                                value={searchData.assessmentNumber}
                                onChange={handleSearchChange}
                                placeholder="Enter assessment number"
                            />
                        </div>
                        <div className="or-divider">OR</div>
                        <div className="option-group">
                            <label>Mobile No</label>
                            <input
                                type="text"
                                name="mobileNo"
                                value={searchData.mobileNo}
                                onChange={handleSearchChange}
                                placeholder="Enter mobile number"
                            />
                        </div>
                        <div className="or-divider">OR</div>
                        <div className="option-group">
                            <label>Door No</label>
                            <input
                                type="text"
                                name="doorNo"
                                value={searchData.doorNo}
                                onChange={handleSearchChange}
                                placeholder="Enter door number"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            type="submit" 
                            className="search-btn" 
                            disabled={searchLoading}
                        >
                            {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleCancel} 
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Search Results */}
            {showSearchResults && (
                <div className="search-results">
                    <h3>Search Results</h3>
                    {searchResults.length === 0 ? (
                        <div className="no-results">No users found</div>
                    ) : (
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Assessment Number</th>
                                    <th>Name</th>
                                    <th>Ward No</th>
                                    <th>City</th>
                                    <th>Street Name</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map((result, index) => (
                                    <tr key={result._id || index}>
                                        <td>{index + 1}</td>
                                        <td>{result.new_assessment_no || result.assessmentNumber}</td>
                                        <td>{result.name}</td>
                                        <td>{result.ward_no || result.wardNo}</td>
                                        <td>{result.city || result.city || 'City'}</td>
                                        <td>{result.street || result.streetName}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleViewDetails(result)}
                                                className="view-btn"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;