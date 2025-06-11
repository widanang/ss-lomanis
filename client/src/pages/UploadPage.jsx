import React, { useState } from 'react';
import * as xlsx from 'xlsx';

const UploadPage = ({ onUpload, token }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess('');
  };

  const handleDownloadTemplate = () => {
    // Define the data for the template
    const pickupData = [
      { AWB: 'JKT001', Nama: 'Budi Santoso', Alamat: 'Jl. Merdeka No. 10, Jakarta', 'No. HP': '081234567890', Tanggal: '2024-07-20', User: 'Andi' },
    ];
    const deliveryData = [
      { AWB: 'JKT001', Status: 'Terkirim', Tanggal: '2024-07-21', User: 'Budi', 'COD Amount': 50000 },
    ];

    // Create worksheets
    const pickupSheet = xlsx.utils.json_to_sheet(pickupData);
    const deliverySheet = xlsx.utils.json_to_sheet(deliveryData);

    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Append sheets to the workbook
    xlsx.utils.book_append_sheet(workbook, pickupSheet, 'Pickup');
    xlsx.utils.book_append_sheet(workbook, deliverySheet, 'Delivery');

    // Write the workbook and trigger download
    xlsx.writeFile(workbook, 'Logistics_Template.xlsx');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        let errorText = 'An unknown server error occurred.';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.error || errorData.message || 'Network response was not ok';
        } else {
            errorText = await response.text();
            if (!errorText) {
               errorText = `Server error: ${response.status} ${response.statusText}`;
            }
        }
        throw new Error(errorText);
      }

      const data = await response.json();
      onUpload(data);
      setSuccess('File uploaded and processed successfully!');
      setFile(null);
      document.getElementById('file-upload').value = null;
    } catch (err) {
      setError(err.message || 'Error uploading file. Check console for details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md border-t-4 border-amber-500">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Upload Excel File</h2>
        <button
          onClick={handleDownloadTemplate}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
        >
          Download Template
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select .xlsx file with "Pickup" and "Delivery" sheets.
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100
                       dark:file:bg-indigo-900/20 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:bg-slate-400 dark:disabled:bg-slate-600"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
};

export default UploadPage; 