"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Search, Filter, Eye, AlertTriangle, X } from 'lucide-react';
import { authFetch } from '@/utils/apiUtils';
import Link from 'next/link';
import styles from '../inventory/Inventory.module.css';

interface InventoryItem {
    _id: string;
    name: string;
    category: string;
    make?: string;
    serialNumber: string;
    quantity: number;
    location?: string;
    status: 'Available' | 'Issued' | 'Damaged';
    assignedTo?: string;
    assignments?: { employeeName: string; quantity: number; date?: string }[];
    primaryRemarks?: string;
    secondaryRemarks?: string;
}

function ItemsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const filterStatus = searchParams.get('status');
    const filterLowStock = searchParams.get('lowStock') === 'true';

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [filterStatus, filterLowStock]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/inventory');
            const data = await res.json();
            if (data.success) {
                let filtered: InventoryItem[] = data.data;

                if (filterStatus) {
                    filtered = filtered.filter(i => i.status === filterStatus);
                }

                if (filterLowStock) {
                    filtered = filtered.filter(i => i.quantity < 5);
                }

                setItems(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`);
        setShowFilterMenu(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPageTitle = () => {
        if (filterLowStock) return 'Low Stock Items';
        if (filterStatus) return `${filterStatus} Items`;
        return 'All Items';
    };

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 style={{ marginBottom: 0 }}>{getPageTitle()}</h1>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBar}>
                    <Search size={20} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <button
                        className={styles.filterButton}
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        style={{ background: (filterStatus || filterLowStock) ? 'var(--primary)' : 'var(--surface)', color: (filterStatus || filterLowStock) ? 'white' : 'var(--text-main)' }}
                    >
                        <Filter size={20} />
                        Filter
                        {(filterStatus || filterLowStock) && <X size={16} onClick={(e) => { e.stopPropagation(); router.push('/items'); }} />}
                    </button>

                    {showFilterMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 10,
                            minWidth: '200px',
                            padding: '0.5rem'
                        }}>
                            <div style={{ padding: '0.5rem', fontWeight: 600, borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>Status</div>
                            <div
                                onClick={() => toggleFilter('status', 'Available')}
                                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius)', background: filterStatus === 'Available' ? 'var(--background)' : 'transparent' }}
                            >
                                Available
                            </div>
                            <div
                                onClick={() => toggleFilter('status', 'Issued')}
                                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius)', background: filterStatus === 'Issued' ? 'var(--background)' : 'transparent' }}
                            >
                                Issued
                            </div>
                            <div
                                onClick={() => toggleFilter('status', 'Damaged')}
                                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius)', background: filterStatus === 'Damaged' ? 'var(--background)' : 'transparent' }}
                            >
                                Damaged
                            </div>

                            <div style={{ padding: '0.5rem', fontWeight: 600, borderBottom: '1px solid var(--border)', margin: '0.5rem 0' }}>Stock</div>
                            <div
                                onClick={() => toggleFilter('lowStock', filterLowStock ? null : 'true')}
                                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius)', background: filterLowStock ? 'var(--background)' : 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <AlertTriangle size={16} color="var(--warning)" />
                                Low Stock
                            </div>
                            <div
                                onClick={() => router.push('/items')}
                                style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 'var(--radius)', color: 'var(--danger)', marginTop: '0.5rem', borderTop: '1px solid var(--border)' }}
                            >
                                Clear All Filters
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading items...</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Make</th>
                                <th>Serial No.</th>
                                <th>Qty</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item._id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.category}</td>
                                    <td>{item.make || '-'}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{item.serialNumber}</td>
                                    <td style={{ fontWeight: item.quantity < 5 ? 'bold' : 'normal', color: item.quantity < 5 ? 'var(--danger)' : 'inherit' }}>
                                        {item.quantity}
                                    </td>
                                    <td>{item.location || '-'}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => setViewingItem(item)} title="View Details"><Eye size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {viewingItem && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <button onClick={() => setViewingItem(null)} style={closeButtonStyle}>
                            <X size={24} color="var(--text-secondary)" />
                        </button>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.5rem' }}>{viewingItem.name}</h2>

                        <div style={detailsGrid}>
                            <DetailRow label="Make" value={viewingItem.make} />
                            <DetailRow label="Category" value={viewingItem.category} />
                            <DetailRow label="Serial Number" value={viewingItem.serialNumber} />
                            <DetailRow label="Quantity" value={viewingItem.quantity.toString()} />
                            <DetailRow label="Location" value={viewingItem.location} />
                            <DetailRow label="Status" value={viewingItem.status} />

                            {/* Display Assignments logic */}
                            {viewingItem.status !== 'Available' && (
                                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                                    <p style={labelStyle}>Assignments</p>
                                    {(viewingItem.assignments && viewingItem.assignments.length > 0) ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            {viewingItem.assignments.map((assign: any, i: number) => (
                                                <div key={i} style={{
                                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                                    color: 'var(--primary)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span style={{ fontWeight: 500 }}>{assign.employeeName}</span>
                                                    <span style={{ opacity: 0.7 }}>({assign.quantity})</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Legacy fallback
                                        viewingItem.assignedTo ? (
                                            <p style={{ color: 'var(--text-main)', marginTop: '0.25rem' }}>{viewingItem.assignedTo}</p>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>No assignments listed.</p>
                                        )
                                    )}
                                </div>
                            )}

                            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                <p style={labelStyle}>Primary Remarks</p>
                                <div style={remarksBox}>{viewingItem.primaryRemarks || 'N/A'}</div>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={labelStyle}>Secondary Remarks</p>
                                <div style={remarksBox}>{viewingItem.secondaryRemarks || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

const DetailRow = ({ label, value }: { label: string, value?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{value || '-'}</span>
    </div>
);

const modalOverlayStyle = {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
};

const modalStyle = {
    background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)',
    width: '600px', maxWidth: '90%', position: 'relative' as const,
    boxShadow: 'var(--shadow-lg)',
    maxHeight: '90vh',
    overflowY: 'auto' as const
};

const closeButtonStyle = {
    position: 'absolute' as const, top: '1rem', right: '1rem',
    background: 'none', border: 'none', cursor: 'pointer'
};

const detailsGrid = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'
};

const labelStyle = {
    fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)'
};

const remarksBox = {
    background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)',
    color: 'var(--text-main)', marginTop: '0.5rem', minHeight: '60px', whiteSpace: 'pre-wrap' as const
};

export default function ItemsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ItemsContent />
        </Suspense>
    );
}
