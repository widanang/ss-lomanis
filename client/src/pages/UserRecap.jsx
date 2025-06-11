import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import apiRequest from '../api/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const UserRecap = ({ user }) => {
    const [recapData, setRecapData] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch recap data and users in parallel
                const [recap, userList] = await Promise.all([
                    apiRequest('/api/recap'),
                    user.role === 'admin' ? apiRequest('/api/users') : Promise.resolve([])
                ]);
                setRecapData(recap);
                if (user.role === 'admin') {
                    setUsers(userList);
                }
            } catch (err) {
                setError('Failed to load data. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.role]);
    
    // ... (rest of the component logic is about rendering and doesn't need API calls)
    const filteredData = useMemo(() => {
        if (selectedUser === 'All') {
            return recapData;
        }
        return recapData.filter(item => item.username === selectedUser);
    }, [recapData, selectedUser]);

    const aggregatedData = useMemo(() => {
        return filteredData.reduce((acc, curr) => {
            acc.pickup_count += curr.pickup_count;
            acc.delivery_success_count += curr.delivery_success_count;
            acc.delivery_failed_count += curr.delivery_failed_count;
            acc.total_cod += curr.total_cod;
            return acc;
        }, {
            pickup_count: 0,
            delivery_success_count: 0,
            delivery_failed_count: 0,
            total_cod: 0
        });
    }, [filteredData]);

    const deliveryChartData = {
        labels: ['Success', 'Failed'],
        datasets: [
            {
                label: 'Delivery Status',
                data: [aggregatedData.delivery_success_count, aggregatedData.delivery_failed_count],
                backgroundColor: [
                    'rgba(22, 163, 74, 0.7)', // green-600
                    'rgba(220, 38, 38, 0.7)'  // red-600
                ],
                borderColor: [
                    'rgba(22, 163, 74, 1)',
                    'rgba(220, 38, 38, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const barChartData = {
        labels: ['Recap'],
        datasets: [
            {
                label: 'Pickup',
                data: [aggregatedData.pickup_count],
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500
            },
            {
                label: 'Delivery Success',
                data: [aggregatedData.delivery_success_count],
                backgroundColor: 'rgba(22, 163, 74, 0.7)', // green-600
            },
            {
                label: 'Delivery Failed',
                data: [aggregatedData.delivery_failed_count],
                backgroundColor: 'rgba(220, 38, 38, 0.7)', // red-600
            },
        ],
    };

    if (loading) return <p className="text-center">Loading recap...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-purple-600">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">User Recap</h2>
                {user.role === 'admin' && (
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md"
                    >
                        <option value="All">All Users</option>
                        {users.map(u => (
                            <option key={u.id} value={u.username}>{u.username}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Pickups" value={aggregatedData.pickup_count} color="blue" />
                <StatCard title="Deliveries Success" value={aggregatedData.delivery_success_count} color="green" />
                <StatCard title="Deliveries Failed" value={aggregatedData.delivery_failed_count} color="red" />
                <StatCard title="Total COD" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(aggregatedData.total_cod)} color="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">Delivery Performance</h3>
                    <div className="w-full h-64 flex justify-center items-center">
                       <Doughnut data={deliveryChartData} options={{ maintainAspectRatio: false }}/>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-center">Activity Overview</h3>
                     <div className="w-full h-64 flex justify-center items-center">
                        <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color }) => {
    const colors = {
        blue: 'border-blue-500 bg-blue-50',
        green: 'border-green-500 bg-green-50',
        red: 'border-red-500 bg-red-50',
        purple: 'border-purple-500 bg-purple-50',
    };
    return (
        <div className={`p-4 rounded-lg border-l-4 ${colors[color]}`}>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

export default UserRecap; 