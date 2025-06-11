import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import apiRequest from '../api/api';

// Page Imports
import UploadPage from './UploadPage';
import PickupLayer from './PickupLayer';
import DeliveryLayer from './DeliveryLayer';
import UserRecap from './UserRecap';
import AdminPage from './AdminPage';
import ManualStatsPage from './ManualStatsPage';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard = ({ auth, onLogout }) => {
  const [pickupData, setPickupData] = useState([]);
  const [deliveryData, setDeliveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recapData, setRecapData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
            onLogout(); // Token is invalid or expired, force logout
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPickupData(data.pickupData || []);
      setDeliveryData(data.deliveryData || []);
    } catch (e) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [auth.token]);

  useEffect(() => {
    const fetchRecapData = async () => {
      try {
        const data = await apiRequest('/api/recap');
        setRecapData(data);
      } catch (error) {
        console.error("Failed to fetch recap data:", error);
      }
    };

    fetchRecapData();
  }, []);

  const NavItem = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <nav className="bg-white dark:bg-slate-800 shadow-md">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">Logistics Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NavItem to="/">Upload</NavItem>
            <NavItem to="/pickup">Pickup</NavItem>
            <NavItem to="/delivery">Delivery</NavItem>
            <NavItem to="/recap">User Recap</NavItem>
            <NavItem to="/manual-stats">Manual Stats</NavItem>
            {auth.role === 'admin' && <NavItem to="/admin">Admin</NavItem>}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Welcome, {auth.username} ({auth.role})</span>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm font-medium"
            >
              Logout
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-6">
        {loading && <p className="text-center">Loading data...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && (
            <Routes>
                <Route path="/" element={<UploadPage onUpload={fetchData} token={auth.token}/>} />
                <Route path="/pickup" element={<PickupLayer data={pickupData} onUpdate={fetchData} token={auth.token} auth={auth} />} />
                <Route path="/delivery" element={<DeliveryLayer data={deliveryData} onUpdate={fetchData} token={auth.token} auth={auth} />} />
                <Route path="/recap" element={<UserRecap pickupData={pickupData} deliveryData={deliveryData} />} />
                <Route path="/manual-stats" element={<ManualStatsPage token={auth.token} />} />
                {auth.role === 'admin' && <Route path="/admin" element={<AdminPage token={auth.token} />} />}
          </Routes>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 