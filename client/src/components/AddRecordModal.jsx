import React, { useState, useEffect } from 'react';

const AddRecordModal = ({ isOpen, onClose, onSubmit, dataType }) => {
  const isPickup = dataType === 'pickup';
  const initialPickupState = {
    AWB: '',
    Nama: '',
    Alamat: '',
    'No. HP': '',
    Tanggal: new Date().toISOString().split('T')[0],
  };
  const initialDeliveryState = {
    AWB: '',
    Status: 'Terkirim',
    'COD Amount': 0,
    Tanggal: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState(isPickup ? initialPickupState : initialDeliveryState);

  useEffect(() => {
    // Reset form data when modal opens or dataType changes
    if (isOpen) {
      setFormData(isPickup ? initialPickupState : initialDeliveryState);
    }
  }, [isOpen, dataType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
          Add New {isPickup ? 'Pickup' : 'Delivery'} Record
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {Object.keys(formData).map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{key}</label>
                {key === 'Status' ? (
                   <select
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option>Terkirim</option>
                    <option>Gagal</option>
                    <option>Proses</option>
                  </select>
                ) : (
                  <input
                    type={key === 'Tanggal' ? 'date' : key.includes('Amount') ? 'number' : 'text'}
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal; 