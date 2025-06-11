import React from 'react';
import DataTable from '../components/DataTable';

const PickupLayer = ({ user }) => {

    const columnsConfig = [
        { Header: 'ID', accessor: 'id' },
        { Header: 'Tanggal', accessor: 'tanggal' },
        { Header: 'AWB', accessor: 'awb' },
        { Header: 'Asal', accessor: 'asal' },
        { Header: 'Tujuan', accessor: 'tujuan' },
        { Header: 'Status', accessor: 'status' },
        { Header: 'User', accessor: 'username' },
    ];

    return (
        <div className="border-t-4 border-fuchsia-600 p-6">
            <h2 className="text-2xl font-bold mb-4">Pickup Data</h2>
            <DataTable
                dataType="pickup"
                columnsConfig={columnsConfig}
                userRole={user.role}
            />
        </div>
    );
};

export default PickupLayer; 