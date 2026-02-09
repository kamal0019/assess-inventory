"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { authFetch } from '@/utils/apiUtils';

interface InventoryItem {
    _id?: string;
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
}

interface InventoryFormProps {
    initialData?: InventoryItem | null;
    defaultCategory?: string;
    onSave: (data: InventoryItem) => Promise<void>;
    onCancel: () => void;
}

interface Employee {
    _id: string;
    name: string;
}

const InventoryForm = ({ initialData, defaultCategory, onSave, onCancel }: InventoryFormProps) => {
    const [formData, setFormData] = useState<InventoryItem>({
        name: '',
        category: defaultCategory || '',
        serialNumber: '',
        quantity: 1,
        status: 'Available',
        assignedTo: '',
    });
    const [assignees, setAssignees] = useState<{ employees: Employee[]; outliners: Employee[] }>({ employees: [], outliners: [] });
    const [issueQuantity, setIssueQuantity] = useState(1);

    useEffect(() => {
        if (initialData) {
            // Normalize status to ensure 'issued' matches 'Issued'
            const normalizedStatus = initialData.status.charAt(0).toUpperCase() + initialData.status.slice(1).toLowerCase();
            const validStatus = ['Available', 'Issued', 'Damaged'].includes(normalizedStatus) ? normalizedStatus : 'Available';

            setFormData({
                ...initialData,
                status: validStatus as 'Available' | 'Issued' | 'Damaged'
            });
        } else if (defaultCategory) {
            setFormData(prev => ({ ...prev, category: defaultCategory }));
        }
        fetchAssignees();
    }, [initialData, defaultCategory]);

    const fetchAssignees = async () => {
        try {
            const [empRes, outRes] = await Promise.all([
                authFetch('/api/employees'),
                authFetch('/api/outliners')
            ]);

            const empData = await empRes.json();
            const outData = await outRes.json();

            setAssignees({
                employees: empData.success ? empData.data : [],
                outliners: outData.success ? outData.data : []
            });
        } catch (error) {
            console.error('Failed to fetch assignees', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Split Logic: If status is Issued and we are issuing less than total quantity
        if (formData.status === 'Issued' && initialData && formData.quantity > 1 && issueQuantity < formData.quantity) {
            const splitData = {
                isSplit: true,
                originalId: initialData._id,
                itemToIssue: {
                    ...formData,
                    quantity: issueQuantity,
                    // Append random suffix to serial to avoid unique constraint error
                    serialNumber: `${formData.serialNumber}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
                },
                itemRemaining: {
                    ...initialData,
                    quantity: initialData.quantity - issueQuantity
                }
            };
            await onSave(splitData as any);
        } else {
            // Normal save
            await onSave(formData);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div style={{
                background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)',
                width: '500px', maxWidth: '90%', position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button onClick={onCancel} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} color="var(--text-secondary)" />
                </button>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    {initialData ? 'Edit Item' : 'Add New Item'}
                </h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Item Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Make</label>
                            <input type="text" name="make" value={formData.make || ''} onChange={handleChange} style={inputStyle} placeholder="e.g. Dell, HP" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="e.g. Laptop"
                            />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Serial Number</label>
                            <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} required style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Total Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Location</label>
                            <input type="text" name="location" value={formData.location || ''} onChange={handleChange} style={inputStyle} placeholder="e.g. Server Room" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={labelStyle}>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                                <option value="Available">Available</option>
                                <option value="Issued">Issued</option>
                                <option value="Damaged">Damaged</option>
                            </select>
                        </div>
                        {formData.status === 'Issued' && (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={labelStyle}>Assigned To</label>
                                <select name="assignedTo" value={formData.assignedTo || ''} onChange={handleChange} required style={inputStyle}>
                                    <option value="">Select Person</option>
                                    <optgroup label="Employees">
                                        {assignees.employees.map(emp => (
                                            <option key={`emp-${emp._id}`} value={emp.name}>{emp.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Outliners">
                                        {assignees.outliners.map(out => (
                                            <option key={`out-${out._id}`} value={out.name}>{out.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>

                    {formData.status === 'Issued' && formData.quantity > 1 && (
                        <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
                            <label style={{ ...labelStyle, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>
                                Quantity to Issue
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="number"
                                    value={issueQuantity}
                                    onChange={(e) => setIssueQuantity(Math.min(parseInt(e.target.value) || 1, formData.quantity))}
                                    min="1"
                                    max={formData.quantity}
                                    style={{ ...inputStyle, width: '100px' }}
                                />
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    / {formData.quantity} Items
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                Note: This will create a separate record for the issued items. The remaining {formData.quantity - issueQuantity} items will stay as they were before.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label style={labelStyle}>Primary Remarks</label>
                        <textarea name="primaryRemarks" value={formData.primaryRemarks || ''} onChange={handleChange} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label style={labelStyle}>Secondary Remarks</label>
                        <textarea name="secondaryRemarks" value={formData.secondaryRemarks || ''} onChange={handleChange} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onCancel} style={{ ...buttonStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                            Cancel
                        </button>
                        <button type="submit" style={{ ...buttonStyle, background: 'var(--primary)', color: 'white' }}>
                            {formData.status === 'Issued' && issueQuantity < formData.quantity ? 'Issue & Split' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const inputStyle = {
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '0.875rem'
};

const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
};

const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
};

export default InventoryForm;
