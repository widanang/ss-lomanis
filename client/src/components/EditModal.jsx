import React, { useState, useEffect } from 'react';

const EditModal = ({ isOpen, onClose, rowData, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // When rowData changes, update the form
    setFormData(rowData || {});
  }, [rowData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Record</h2>
        <div className="space-y-4">
          {Object.keys(formData).map(key => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">{key}</label>
              <input
                type={key === 'COD Amount' ? 'number' : 'text'}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                disabled={key === 'AWB'} // AWB should not be editable
                className="mt-1 block w-full p-2 border border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal; 