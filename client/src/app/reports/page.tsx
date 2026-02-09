"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { FileDown, FileText, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { authFetch } from '@/utils/apiUtils';

interface InventoryItem {
    name: string;
    category: string;
    make?: string;
    serialNumber: string;
    quantity: number;
    location?: string;
    primaryRemarks?: string;
    secondaryRemarks?: string;
    status: 'Available' | 'Issued' | 'Damaged';
    assignedTo?: string;
    purchaseDate?: string;
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);

    const handleExport = async (type: string) => {
        setLoading(true);
        try {
            let data: any[] = [];
            let fileName = '';

            if (type === 'Stock Summary') {
                fileName = 'Stock_Summary_Report';
                const res = await authFetch('/api/reports/inventory-summary');
                const result = await res.json();
                if (result.success) {
                    data = result.data.map((item: any) => ({
                        Category: item._id,
                        'Total Stock': item.totalQuantity,
                        'Item Count': item.count
                    }));
                }
            } else if (type === 'Issued Items') {
                fileName = 'Issued_Items_Report';
                // Using existing inventory endpoint for now as it has assignment data, 
                // but ideally would be /api/reports/assignments if created.
                // Filter client side for now to match verified backend features or use specific endpoint if I made one.
                // I made /api/reports/low-stock but not /assignments explicit in plan, checking...
                // Only low-stock and inventory-summary were in reportRoutes.js.
                // So for issued items, we will still filter from main inventory or add endpoint.
                // To keep it simple and consistent with current backend:
                const res = await authFetch('/api/inventory');
                const result = await res.json();
                if (result.success) {
                    data = result.data
                        .filter((item: any) => item.status === 'Issued' || (item.assignments && item.assignments.length > 0))
                        .map((item: any) => ({
                            'Item Name': item.name,
                            Category: item.category,
                            'Serial Number': item.serialNumber,
                            'Assigned To': item.assignments?.map((a: any) => a.employeeName).join(', ') || 'N/A',
                            'Status': item.status
                        }));
                }
            } else if (type === 'Low Stock') {
                fileName = 'Low_Stock_Report';
                const res = await authFetch('/api/reports/low-stock');
                const result = await res.json();
                if (result.success) {
                    data = result.data.map((item: any) => ({
                        'Item Name': item.name,
                        Category: item.category,
                        Quantity: item.quantity,
                        Status: item.status,
                        Location: item.location || 'N/A'
                    }));
                }
            }

            if (data.length === 0) {
                alert(`No data found for ${type} report.`);
                return;
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report");
            XLSX.writeFile(wb, `${fileName}.xlsx`);

        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Reports</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Generate and export inventory reports</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Modified to clarify it downloads Excel mostly, but kept original titles as requested, just updated functionality */}
                <div style={cardStyle}>
                    <div style={iconWrapperStyle}>
                        <FileText size={24} color="var(--primary)" />
                    </div>
                    <h3 style={titleStyle}>Stock Summary Report</h3>
                    <p style={descStyle}>Detailed report of current stock levels per category.</p>
                    <button onClick={() => handleExport('Stock Summary')} style={buttonStyle} disabled={loading}>
                        <FileDown size={18} />
                        {loading ? 'Loading...' : 'Download Excel'}
                    </button>
                </div>

                <div style={cardStyle}>
                    <div style={iconWrapperStyle}>
                        <BarChart2 size={24} color="var(--success)" />
                    </div>
                    <h3 style={titleStyle}>Issued Items Report</h3>
                    <p style={descStyle}>Log of all items currently issued to employees.</p>
                    <button onClick={() => handleExport('Issued Items')} style={buttonStyle} disabled={loading}>
                        <FileDown size={18} />
                        {loading ? 'Loading...' : 'Download Excel'}
                    </button>
                </div>

                <div style={cardStyle}>
                    <div style={iconWrapperStyle}>
                        <FileText size={24} color="var(--warning)" />
                    </div>
                    <h3 style={titleStyle}>Low Stock Alert Report</h3>
                    <p style={descStyle}>Items that have fallen below the reorder threshold.</p>
                    <button onClick={() => handleExport('Low Stock')} style={buttonStyle} disabled={loading}>
                        <FileDown size={18} />
                        {loading ? 'Loading...' : 'Download Excel'}
                    </button>
                </div>

            </div>
        </DashboardLayout>
    );
}

const cardStyle = {
    background: 'var(--surface)',
    padding: '1.5rem',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start'
};

const iconWrapperStyle = {
    background: 'var(--background)',
    padding: '0.75rem',
    borderRadius: '50%',
    marginBottom: '1rem'
};

const titleStyle = {
    fontSize: '1.125rem',
    marginBottom: '0.5rem',
    color: 'var(--text-main)'
};

const descStyle = {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    lineHeight: '1.5'
};

const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    background: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500,
    color: 'var(--text-main)',
    transition: 'background 0.2s',
    width: '100%',
    justifyContent: 'center'
};
