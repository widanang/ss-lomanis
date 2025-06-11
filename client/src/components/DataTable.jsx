import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import EditModal from './EditModal';
import AddRecordModal from './AddRecordModal';
import { FaEdit, FaTrash, FaPlus, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const DataTable = ({
  dataType,
  columnsConfig,
  userRole,
}) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState(columnsConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterDate, setFilterDate] = useState('');
  const [globalFilter, setGlobalFilter] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiRequest = async (endpoint, method = 'GET', body = null) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
    };

    const options = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData) {
        } else {
            headers['Content-Type'] = 'application/json';
        }
        options.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    if (response.status === 204) { // No Content for DELETE
        return;
    }

    return response.json();
  };


  const fetchData = useCallback(async (page, date, searchTerm) => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({ page, limit: 10, date, search: searchTerm });
      const result = await apiRequest(`/api/${dataType}?${queryParams}`);
      setData(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [dataType]);

  useEffect(() => {
    fetchData(currentPage, filterDate, globalFilter);
  }, [fetchData, currentPage, filterDate, globalFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await apiRequest(`/api/${dataType}/${id}`, 'DELETE');
        fetchData(currentPage, filterDate, globalFilter); // Refresh data
      } catch (err) {
        setError(`Failed to delete record: ${err.message}`);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (updatedRecord) => {
    try {
      await apiRequest(`/api/${dataType}/${updatedRecord.id}`, 'PUT', updatedRecord);
      fetchData(currentPage, filterDate, globalFilter);
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error('Failed to update record:', err);
      alert(`Failed to update record: ${err.message}`);
    }
  };

  const handleAdd = async (newRecord) => {
    try {
      await apiRequest(`/api/${dataType}`, 'POST', newRecord);
      // Go to first page to see the new record, clear filters
      setCurrentPage(1);
      setFilterDate('');
      setGlobalFilter('');
      fetchData(1, '', '');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add record:', err);
      alert(`Failed to add record: ${err.message}`);
    }
  };

  const handleDateChange = (e) => {
    setCurrentPage(1);
    setFilterDate(e.target.value);
  };

  const handleGlobalFilterChange = (e) => {
    const value = e.target.value || "";
    setGlobalFilter(value);
    setCurrentPage(1); // Reset to first page on new search
  };


  const tableColumns = useMemo(() => {
        const baseColumns = columnsConfig.map(col => ({
            accessorKey: col.accessor,
            header: col.Header,
            cell: info => info.getValue(),
        }));

        if (userRole === 'admin') {
            return [
                ...baseColumns,
                {
                    id: 'actions',
                    header: 'Actions',
                    cell: ({ row }) => (
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(row.original)} className="p-1 text-blue-600 hover:text-blue-800">
                                <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(row.original.id)} className="p-1 text-red-600 hover:text-red-800">
                                <FaTrash />
                            </button>
                        </div>
                    ),
                },
            ];
        }
        return baseColumns;
    }, [columnsConfig, userRole]);


  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
        pagination: {
            pageIndex: currentPage - 1,
            pageSize: 10
        },
        globalFilter,
    },
    onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
            const newPaginationState = updater({ pageIndex: currentPage - 1, pageSize: 10 });
            setCurrentPage(newPaginationState.pageIndex + 1);
        } else {
            setCurrentPage(updater.pageIndex + 1);
        }
    },
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={handleGlobalFilterChange}
                    placeholder="Search all columns..."
                    className="p-2 border border-gray-300 rounded-md"
                />
                <input
                    type="date"
                    value={filterDate}
                    onChange={handleDateChange}
                    className="p-2 border border-gray-300 rounded-md"
                />
            </div>
            {userRole === 'admin' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center px-4 py-2 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
              >
                <FaPlus className="mr-2" />
                Add Record
              </button>
            )}
        </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                        <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                        ))}
                    </tr>
                    ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                        ))}
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

        <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
                Page{' '}
                <strong>
                    {currentPage} of {totalPages}
                </strong>
            </span>
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1 border rounded-md disabled:opacity-50"
                >
                    <FaAngleDoubleLeft/>
                </button>
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1 border rounded-md disabled:opacity-50"
                >
                    <FaChevronLeft/>
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1 border rounded-md disabled:opacity-50"
                >
                    <FaChevronRight/>
                </button>
                <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="p-1 border rounded-md disabled:opacity-50"
                >
                    <FaAngleDoubleRight/>
                </button>
            </div>
        </div>

      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          recordData={selectedRecord}
          onSave={handleUpdate}
          fields={columnsConfig.filter(c => c.accessor !== 'id')}
        />
      )}

      {isAddModalOpen && (
        <AddRecordModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAdd}
            fields={columnsConfig.filter(c => c.accessor !== 'id')}
        />
      )}
    </div>
  );
};

export default DataTable;