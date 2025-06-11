import React, { useState, useEffect } from 'react';
import apiRequest from '../api/api';

const ManualStatsPage = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(user.username); // Default to current user
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [codPackages, setCodPackages] = useState('');
    const [pickupCount, setPickupCount] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch users only if the current user is an admin
        if (user.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    const userList = await apiRequest('/api/users');
                    setUsers(userList);
                } catch (err) {
                    console.error("Failed to fetch users:", err);
                }
            };
            fetchUsers();
        }
    }, [user.role]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = {
            username: selectedUser,
            date,
            cod_packages: parseInt(codPackages, 10),
            pickup_count: parseInt(pickupCount, 10),
        };

        try {
            await apiRequest('/api/manual-stats', 'POST', payload);
            setSuccess('Data submitted successfully!');
            // Clear form
            setCodPackages('');
            setPickupCount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (value) => 
        `w-full p-3 bg-gray-100 border-2 rounded-md focus:outline-none transition-colors ` + 
        (value ? 'border-green-400' : 'border-gray-200 focus:border-fuchsia-500');

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-yellow-400">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Input Manual Stats</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {user.role === 'admin' && (
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Select User
                        </label>
                        <select
                            id="user-select"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full p-3 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-fuchsia-500"
                        >
                            <option value="">Select a user</option>
                            {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full p-3 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-fuchsia-500"
                    />
                </div>

                <div>
                    <label htmlFor="cod-packages" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of COD Packages
                    </label>
                    <input
                        type="number"
                        id="cod-packages"
                        value={codPackages}
                        onChange={(e) => setCodPackages(e.target.value)}
                        placeholder="e.g., 15"
                        required
                        className={inputClass(codPackages)}
                    />
                </div>

                <div>
                    <label htmlFor="pickup-count" className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup / First Mile Count
                    </label>
                    <input
                        type="number"
                        id="pickup-count"
                        value={pickupCount}
                        onChange={(e) => setPickupCount(e.target.value)}
                        placeholder="e.g., 20"
                        required
                        className={inputClass(pickupCount)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:bg-fuchsia-300 transition-all"
                >
                    {loading ? 'Submitting...' : 'Submit Data'}
                </button>

                {success && <p className="text-green-600 bg-green-100 p-3 rounded-md text-center">{success}</p>}
                {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
            </form>
        </div>
    );
};

export default ManualStatsPage; 