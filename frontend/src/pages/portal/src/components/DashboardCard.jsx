import React from 'react';

function DashboardCard({ title, value, icon, action }) {
    return (
        <div 
            className={`bg-slate-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${action ? 'cursor-pointer' : ''}`} 
            onClick={action}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
                {icon && <div className="p-2 bg-slate-200 rounded-full">{React.cloneElement(icon, { size: 24 })}</div>}
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    );
}

export default DashboardCard;