"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, User, Briefcase, MapPin } from 'lucide-react';

interface EmployeeDetail {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
    contact?: string;
    department?: string;
    designation?: string;
    status: string;
    issuedItems: Array<{
        _id: string;
        name: string;
        serialNumber: string;
        category: string;
        purchaseDate?: string;
    }>;
}

import BillGeneratorModal from '@/components/BillGeneratorModal';
import BulkBillGeneratorModal from '@/components/BulkBillGeneratorModal';

import ReturnItemModal from '@/components/ReturnItemModal';

import { authFetch } from '@/utils/apiUtils';

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showBulkBillModal, setShowBulkBillModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await authFetch(`/api/employees/${id}`);
                const data = await res.json();
                if (data.success) {
                    setEmployee(data.data);
                } else {
                    alert(data.error);
                    router.push('/employees');
                }
            } catch (error) {
                console.error('Failed to fetch employee details', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchEmployee();
    }, [id, router]);

    if (loading) return <DashboardLayout><p>Loading...</p></DashboardLayout>;
    if (!employee) return <DashboardLayout><p>Employee not found</p></DashboardLayout>;

    return (
        <DashboardLayout>
            <div style={headerStyle}>
                <button onClick={() => router.back()} style={backButtonStyle}>
                    <ArrowLeft size={20} />
                    Back to Employees
                </button>
            </div>

            <div style={splitLayout}>
                {/* Profile Section */}
                <div style={profileCardStyle}>
                    <div style={profileHeader}>
                        <div style={avatarLarge}>
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{employee.name}</h2>
                        <span style={badgeStyle}>{employee.status}</span>
                    </div>

                    <div style={infoGrid}>
                        <InfoItem icon={User} label="Employee ID" value={employee.employeeId} />
                        <InfoItem icon={Briefcase} label="Department" value={employee.department || 'N/A'} />
                        <InfoItem icon={Briefcase} label="Designation" value={employee.designation || 'N/A'} />
                        <InfoItem icon={Mail} label="Email" value={employee.email} />
                        <InfoItem icon={Phone} label="Contact" value={employee.contact || 'N/A'} />
                    </div>
                </div>

                {/* Issued Items Section */}
                <div style={itemsSectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Issued Inventory</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowReturnModal(true)} style={dangerButtonStyle}>
                                Return Items
                            </button>
                            <button onClick={() => setShowBulkBillModal(true)} style={successButtonStyle}>
                                Generate Bulk Bill
                            </button>
                            <button onClick={() => setShowBillModal(true)} style={primaryButtonStyle}>
                                Generate Bill
                            </button>
                        </div>
                    </div>
                    {employee.issuedItems.length === 0 ? (
                        <div style={emptyStateStyle}>
                            <p>No items currently assigned to this employee.</p>
                        </div>
                    ) : (
                        <div style={tableContainerStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Item Name</th>
                                        <th style={thStyle}>Serial Number</th>
                                        <th style={thStyle}>Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employee.issuedItems.map(item => (
                                        <tr key={item._id}>
                                            <td style={tdStyle}>{item.name}</td>
                                            <td style={tdStyle}>{item.serialNumber}</td>
                                            <td style={tdStyle}>{item.category}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showBillModal && (
                <BillGeneratorModal
                    recipientName={employee.name}
                    recipientId={employee._id}
                    recipientType="Employee"
                    issuedItems={employee.issuedItems}
                    onClose={() => setShowBillModal(false)}
                />
            )}

            {showBulkBillModal && employee && (
                <BulkBillGeneratorModal
                    recipientName={employee.name}
                    recipientId={employee._id}
                    recipientType="Employee"
                    issuedItems={employee.issuedItems}
                    onClose={() => setShowBulkBillModal(false)}
                />
            )}

            {showReturnModal && employee && (
                <ReturnItemModal
                    recipientName={employee.name}
                    issuedItems={employee.issuedItems}
                    onClose={() => setShowReturnModal(false)}
                />
            )}
        </DashboardLayout>
    );
}

const dangerButtonStyle = {
    background: '#dc2626', // Red
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500
};

const primaryButtonStyle = {
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500
};

const successButtonStyle = {
    background: 'var(--success)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div style={infoItemStyle}>
        <div style={iconBox}>
            <Icon size={18} />
        </div>
        <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</p>
            <p style={{ fontWeight: 500 }}>{value}</p>
        </div>
    </div>
);

const headerStyle = {
    marginBottom: '2rem'
};

const backButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '1rem'
};

const splitLayout = {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '2rem',
    alignItems: 'start'
};

const profileCardStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    padding: '2rem',
    boxShadow: 'var(--shadow)',
    textAlign: 'center' as const
};

const profileHeader = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '2rem'
};

const avatarLarge = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
};

const badgeStyle = {
    background: 'var(--success-bg)',
    color: 'var(--success)',
    padding: '0.25rem 1rem',
    borderRadius: '999px',
    fontSize: '0.875rem',
    fontWeight: 600
};

const infoGrid = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    textAlign: 'left' as const
};

const infoItemStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
};

const iconBox = {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'var(--background)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)'
};

const itemsSectionStyle = {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    padding: '2rem',
    boxShadow: 'var(--shadow)'
};

const emptyStateStyle = {
    padding: '3rem',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    background: 'var(--background)',
    borderRadius: 'var(--radius)',
    border: '1px dashed var(--border)'
};

const tableContainerStyle = {
    overflowX: 'auto' as const
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const
};

const thStyle = {
    textAlign: 'left' as const,
    padding: '1rem',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
};

const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--border)'
};
