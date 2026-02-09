"use client";

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import InventoryForm from '@/components/InventoryForm';
import { Plus, Search, Edit2, Trash2, Filter, Upload, Eye, X, ArrowLeft } from 'lucide-react';
import styles from '../Inventory.module.css'; // Adjust import path
import * as XLSX from 'xlsx';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/utils/apiUtils';

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

export default function InventoryCategoryPage() {
    const params = useParams();
    const router = useRouter();
    // Decode category from URL (it might be URI encoded)
    const category = decodeURIComponent(params.category as string);

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchItems();
    }, [category]);

    const fetchItems = async () => {
        try {
            const res = await authFetch('/api/inventory');
            const data = await res.json();
            if (data.success) {
                // Filter items by category on client side for now. 
                // Ideal: Filter on API side /api/inventory?category=...
                const allItems: InventoryItem[] = data.data;
                const filtered = allItems.filter(item => item.category.trim().toLowerCase() === category.trim().toLowerCase());
                setItems(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await authFetch(`/api/inventory/${id}`, { method: 'DELETE' });
                fetchItems();
            } catch (error) {
                console.error('Failed to delete item:', error);
            }
        }
    };

    const handleSave = async (formData: any) => {
        try {
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `/api/inventory/${editingItem._id}` : '/api/inventory';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchItems();
                setIsFormOpen(false);
            } else {
                const err = await res.json();
                alert(`Failed to save item: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to save item:', error);
            alert('Failed to save item. Check console for details.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Normalize keys to match schema
                const formattedData = data.map((item: any) => ({
                    name: item['Item Name'] || item['name'] || 'Unknown Item',
                    make: item['Make'] || item['make'] || '',
                    category: item['Category'] || item['category'] || category || 'Other',
                    serialNumber: item['Serial Number'] || item['serialNumber'] || `SN-${Math.random().toString(36).substr(2, 9)}`,
                    quantity: item['Quantity'] || item['quantity'] || 1,
                    location: item['LOCATION'] || item['Location'] || item['location'] || '',
                    primaryRemarks: item['Primary Remarks'] || item['primaryRemarks'] || '',
                    secondaryRemarks: item['SECONDRY REMARKS'] || item['secondaryRemarks'] || '',
                    status: item['Status'] || item['status'] || 'Available',
                    assignedTo: item['Assigned To'] || item['assignedTo'] || '',
                }));

                if (formattedData.length > 0) {
                    const res = await authFetch('/api/inventory/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formattedData)
                    });

                    const result = await res.json();
                    if (result.success) {
                        alert(`Successfully imported ${result.count} items.`);
                        fetchItems();
                    } else {
                        alert('Import failed: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Error parsing file. Please check format.');
            }
        };
        reader.readAsBinaryString(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <Link href="/inventory" style={{ textDecoration: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 style={{ marginBottom: 0 }}>{category} Inventory</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button className={styles.importButton} onClick={() => fileInputRef.current?.click()}>
                        <Upload size={20} />
                        Import Excel
                    </button>
                    <button className={styles.addButton} onClick={handleCreate}>
                        <Plus size={20} />
                        Add Item
                    </button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBar}>
                    <Search size={20} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder={`Search ${category}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className={styles.filterButton}>
                    <Filter size={20} />
                    Filter
                </button>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading {category}...</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Make</th>
                                <th>Category</th>
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
                                    <td>{item.make || '-'}</td>
                                    <td>{item.category}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{item.serialNumber}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.location || '-'}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => setViewingItem(item)} title="View Details"><Eye size={16} /></button>
                                            <button onClick={() => handleEdit(item)} title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(item._id)} title="Delete"><Trash2 size={16} color="var(--danger)" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No {category} items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {isFormOpen && (
                <InventoryForm
                    initialData={editingItem}
                    defaultCategory={category}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

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
