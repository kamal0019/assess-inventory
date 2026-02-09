"use client";

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { authFetch } from '@/utils/apiUtils';

interface IssuedItem {
    _id: string;
    name: string;
    serialNumber: string;
    category: string;
}

interface ReturnItemModalProps {
    recipientName: string;
    issuedItems: IssuedItem[];
    onClose: () => void;
}

export default function ReturnItemModal({ recipientName, issuedItems, onClose }: ReturnItemModalProps) {
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleSelect = (id: string) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItemIds(issuedItems.map(i => i._id));
        } else {
            setSelectedItemIds([]);
        }
    };

    const handleReturn = async () => {
        if (selectedItemIds.length === 0) return;

        if (!confirm(`Are you sure you want to return ${selectedItemIds.length} items from ${recipientName}?`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authFetch('/api/inventory/bulk-return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemIds: selectedItemIds,
                    returnedBy: recipientName,
                    returnDate: new Date()
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Successfully returned ${data.data.length} items.`);
                // Refresh to update UI
                window.location.reload();
            } else {
                alert(data.error || 'Failed to return items');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Return error:', error);
            alert('Error returning items');
            setIsSubmitting(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h3>Return Items from {recipientName}</h3>
                    <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                </div>

                <div style={contentStyle}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Select the items to return to inventory (Status will become Available).
                    </p>

                    <div style={listHeaderStyle}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={selectedItemIds.length === issuedItems.length && issuedItems.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                            Select All
                        </label>
                        <span>{selectedItemIds.length} selected</span>
                    </div>

                    <div style={listContainerStyle}>
                        {issuedItems.map(item => (
                            <div key={item._id} style={listItemStyle}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItemIds.includes(item._id)}
                                        onChange={() => handleToggleSelect(item._id)}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{item.category} - {item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SN: {item.serialNumber}</div>
                                    </div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={footerStyle}>
                    <button onClick={onClose} style={secondaryButtonStyle} disabled={isSubmitting}>Cancel</button>
                    <button
                        onClick={handleReturn}
                        style={{ ...primaryButtonStyle, opacity: selectedItemIds.length === 0 || isSubmitting ? 0.5 : 1 }}
                        disabled={selectedItemIds.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Returning...' : `Return ${selectedItemIds.length} Items`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Styles
const overlayStyle = {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalStyle = {
    background: 'var(--surface)',
    padding: '2rem',
    borderRadius: 'var(--radius)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    boxShadow: 'var(--shadow)'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '1rem'
};

const closeButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)'
};

const contentStyle = {
    flex: 1,
    overflowY: 'hidden' as const,
    display: 'flex',
    flexDirection: 'column' as const
};

const listHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    padding: '0.5rem',
    background: 'var(--background)',
    borderRadius: 'var(--radius)',
    borderBottom: '1px solid var(--border)'
};

const listContainerStyle = {
    overflowY: 'auto' as const,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    maxHeight: '300px'
};

const listItemStyle = {
    padding: '0.75rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    background: 'var(--surface)'
};

const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)'
};

const primaryButtonStyle = {
    background: '#dc2626', // Red
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500
};

const secondaryButtonStyle = {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontWeight: 500
};
