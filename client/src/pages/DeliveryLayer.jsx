import React from 'react';
import DataTable from '../components/DataTable';

const DeliveryLayer = ({ user }) => {

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
        <div className="border-t-4 border-teal-500 p-6">
            <h2 className="text-2xl font-bold mb-4">Delivery Data</h2>
            <DataTable
                dataType="delivery"
                columnsConfig={columnsConfig}
                userRole={user.role}
            />
        </div>
    );
};

export default DeliveryLayer;
