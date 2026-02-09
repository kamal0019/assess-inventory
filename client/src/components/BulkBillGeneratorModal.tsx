"use client";

import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Download } from 'lucide-react';
import { authFetch } from '@/utils/apiUtils';

interface IssuedItem {
    _id: string;
    name: string; // Model
    serialNumber: string;
    category: string;
    make?: string;
    purchaseDate?: string;
}

interface BillGeneratorModalProps {
    recipientName: string;
    recipientId: string;
    recipientType: 'Employee' | 'Outliner';
    issuedItems: IssuedItem[];
    onClose: () => void;
}

interface GroupedItem {
    id: string; // Composite key
    name: string;
    make: string;
    category: string;
    quantity: number;
    rate: number;
    remark: string;
    selected: boolean;
    originalItems: IssuedItem[]; // Keep track of which items are in this group
}

export default function BulkBillGeneratorModal({ recipientName, recipientId, recipientType, issuedItems, onClose }: BillGeneratorModalProps) {
    // Group items on init
    const initialGroups = useMemo(() => {
        const groups: { [key: string]: GroupedItem } = {};

        issuedItems.forEach(item => {
            const key = item.category;
            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    name: "Various", // Generalized
                    make: "Various", // Generalized
                    category: item.category,
                    quantity: 0,
                    rate: 0,
                    remark: '',
                    selected: true,
                    originalItems: []
                };
            }
            groups[key].quantity += 1;
            groups[key].originalItems.push(item);
        });

        return Object.values(groups);
    }, [issuedItems]);

    const [groupedItems, setGroupedItems] = useState<GroupedItem[]>(initialGroups);
    const [verifierName, setVerifierName] = useState('Jaspreet Singh');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

    // Bulk Issue State
    const [newCategory, setNewCategory] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [issuing, setIssuing] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    useEffect(() => {
        // Fetch inventory to get categories
        const fetchCategories = async () => {
            try {
                const res = await authFetch('/api/inventory');
                const data = await res.json();
                if (data.success) {
                    const items: any[] = data.data;
                    const cats = Array.from(new Set(items.map(i => i.category))).sort();
                    setAvailableCategories(cats);
                }
            } catch (error) {
                console.error('Failed to fetch categories', error);
            }
        };
        fetchCategories();
    }, []);

    const handleBulkIssue = async () => {
        if (!newCategory || !newQuantity) {
            alert('Please select category and quantity');
            return;
        }

        setIssuing(true);
        try {
            const res = await authFetch('/api/inventory/bulk-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: newCategory,
                    quantity: parseInt(newQuantity),
                    recipientName: recipientName,
                    recipientId: recipientId,
                    recipientType: recipientType
                })
            });
            const data = await res.json();

            if (data.success && data.data.length > 0) {
                // Add new items to groupedItems
                const items: IssuedItem[] = data.data;
                const category = items[0].category;

                const existingGroupIndex = groupedItems.findIndex(g => g.category === category);

                if (existingGroupIndex >= 0) {
                    const updatedGroups = [...groupedItems];
                    updatedGroups[existingGroupIndex].quantity += items.length;
                    updatedGroups[existingGroupIndex].originalItems.push(...items);
                    setGroupedItems(updatedGroups);
                } else {
                    const newGroup: GroupedItem = {
                        id: `${category}-${Date.now()}`,
                        name: "Various",
                        make: "Various",
                        category: category,
                        quantity: items.length,
                        rate: 0,
                        remark: '',
                        selected: true,
                        originalItems: items
                    };
                    setGroupedItems([...groupedItems, newGroup]);
                }

                setNewCategory('');
                setNewQuantity('');
                alert(`Successfully issued ${items.length} items!`);
            } else {
                alert(data.error || 'Failed to issue items');
            }
        } catch (error) {
            console.error('Issue error:', error);
            alert('Error issuing items');
        } finally {
            setIssuing(false);
        }
    };

    const handleToggleSelect = (index: number) => {
        const newItems = [...groupedItems];
        newItems[index].selected = !newItems[index].selected;
        setGroupedItems(newItems);
    };

    const handleRateChange = (index: number, value: string) => {
        const newItems = [...groupedItems];
        newItems[index].rate = parseFloat(value) || 0;
        setGroupedItems(newItems);
    };

    const handleRemarkChange = (index: number, value: string) => {
        const newItems = [...groupedItems];
        newItems[index].remark = value;
        setGroupedItems(newItems);
    };

    const calculateTotal = () => {
        return groupedItems
            .filter(item => item.selected)
            .reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    };

    const generatePDF = async () => {
        const itemsToProcess = groupedItems.filter(item => item.selected);

        // Save to DB
        // For the DB, do we save grouped items or individual items with prices?
        // The Bill model now has 'quantity'. We can save the grouped items directly.
        // But 'serialNumber' field in Bill model is single string. We can leave it empty or put "Bulk".
        // Or we can list duplicate rows in DB? No, saving as grouped seems cleaner for this "Bulk" type bill.

        try {
            const total = calculateTotal();

            await authFetch('/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: {
                        name: recipientName,
                        type: recipientType,
                        id: recipientId
                    },
                    items: itemsToProcess.map(item => ({
                        name: item.name,
                        serialNumber: "", // No SN for bulk bill
                        category: item.category,
                        make: item.make,
                        quantity: item.quantity,
                        price: item.rate, // Unit Rate
                        remark: item.remark
                    })),
                    totalAmount: total,
                    verifiedBy: {
                        name: verifierName,
                        date: billDate
                    }
                })
            });
        } catch (err) {
            console.error('Error saving bill:', err);
        }

        const doc = new jsPDF();

        // --- Header ---
        doc.setTextColor(59, 130, 246); // Blue color
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ASSESSINFRA TECHNOLOGY PVT.LTD', 105, 15, { align: 'center' });

        doc.setTextColor(0, 0, 0); // Black color
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('I Am Here by that, I am Receiving', 14, 30);

        // --- Table ---
        const tableBody = itemsToProcess.map((item, index) => {
            // Construct Particulars
            // Format: Category only if requested
            let particulars = `Category: ${item.category}`;

            // We can append "Various Makes" if needed, but keeping it simple as per request
            // particular += `\n(Various Makes/Models)`;

            const tRate = item.rate * item.quantity;

            return [
                index + 1,
                particulars,
                item.quantity,
                `Rs. ${item.rate.toLocaleString()}`,
                `Rs. ${tRate.toLocaleString()}`, // T.Rate
                item.remark || ''
            ];
        });

        autoTable(doc, {
            startY: 45,
            head: [['S. No.', 'Particulars', 'Quantity', 'Rate', 'T.Rate', 'Remark']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center'
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                cellPadding: 4,
                valign: 'top',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { cellWidth: 60 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 25 },
                4: { halign: 'center', cellWidth: 30 },
                5: { cellWidth: 35 }
            },
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            foot: [
                ['', 'Total', '', '', `Rs. ${calculateTotal().toLocaleString()}`, '']
            ],
            footStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            }
        });

        // --- Footer ---
        const finalY = (doc as any).lastAutoTable.finalY + 20;

        if (finalY > 250) doc.addPage();

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`From Assessinfra Technology, with No defect on (${billDate}) for Office Use Purpose.`, 14, finalY);

        // Signatures
        const sigY = finalY + 30;

        // Verified By
        doc.setLineWidth(0.5);
        doc.line(14, sigY, 80, sigY);
        doc.text(`Verified By: -`, 30, sigY + 5);

        doc.setFont('helvetica', 'bold');
        doc.text(`Name: - ${verifierName}`, 14, sigY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: - ${billDate}`, 14, sigY + 22);
        doc.text(`Place: - Assessinfra Technology`, 14, sigY + 29);
        doc.text(`Contact No.:- 9636872742`, 14, sigY + 36);

        // Received By
        doc.line(130, sigY, 196, sigY);
        doc.text(`Received By: -`, 150, sigY + 5);

        doc.setFont('helvetica', 'bold');
        doc.text(`Name:-`, 130, sigY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date:- ${billDate}`, 130, sigY + 22);
        doc.text(`Place:- Assessinfra Technology`, 130, sigY + 29);
        doc.text(`Contact No.:-`, 130, sigY + 36);

        doc.save(`${recipientName}_BulkBill_${billDate}.pdf`);

        // Refresh the page to reset state and update inventory
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2>Generate Bulk Bill</h2>
                    <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                </div>

                <div style={controlsStyle}>
                    <div style={inputGroup}>
                        <label>Verified By (Admin Name)</label>
                        <input
                            value={verifierName}
                            onChange={e => setVerifierName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={inputGroup}>
                        <label>Bill Date</label>
                        <input
                            type="date"
                            value={billDate}
                            onChange={e => setBillDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Bulk Issue Section */}
                <div style={bulkIssueSectionStyle}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Add Items to Bill & Issue</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Select Category</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ width: '100px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                            <input
                                type="number"
                                placeholder="Qty"
                                value={newQuantity}
                                onChange={e => setNewQuantity(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={handleBulkIssue}
                            disabled={issuing}
                            style={{ ...primaryButtonStyle, height: '38px', opacity: issuing ? 0.7 : 1 }}
                        >
                            {issuing ? 'Adding...' : 'Add & Issue'}
                        </button>
                    </div>
                </div>

                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Select</th>
                                <th style={thStyle}>Particulars</th>
                                <th style={thStyle}>Qty</th>
                                <th style={thStyle}>Rate (₹)</th>
                                <th style={thStyle}>T.Rate (₹)</th>
                                <th style={thStyle}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td style={tdStyle}>
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => handleToggleSelect(index)}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 500 }}>{item.category}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Various Makes/Models</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={item.rate}
                                            onChange={e => handleRateChange(index, e.target.value)}
                                            style={tableInputStyle}
                                            disabled={!item.selected}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        Rs. {(item.rate * item.quantity).toLocaleString()}
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="text"
                                            value={item.remark}
                                            onChange={e => handleRemarkChange(index, e.target.value)}
                                            style={tableInputStyle}
                                            disabled={!item.selected}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={footerStyle}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                        Total: ₹{calculateTotal().toLocaleString()}
                    </div>
                    <button onClick={generatePDF} style={downloadButtonStyle}>
                        <Download size={18} />
                        Download Bulk PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

// Reuse styles (copied from BillGeneratorModal)
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
    maxWidth: '900px', // Slightly wider for extra columns
    maxHeight: '90vh',
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

const controlsStyle = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const
};

const inputGroup = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    flex: 1
};

const inputStyle = {
    padding: '0.5rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--text-main)'
};

const tableContainer = {
    overflowY: 'auto' as const,
    flex: 1,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const
};

const thStyle = {
    textAlign: 'left' as const,
    padding: '0.75rem',
    background: 'var(--background)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky' as const,
    top: 0
};

const tdStyle = {
    padding: '0.75rem',
    borderBottom: '1px solid var(--border)'
};

const tableInputStyle = {
    width: '100%',
    padding: '0.25rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--text-main)'
};

const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)'
};

const downloadButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
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

const bulkIssueSectionStyle = {
    background: 'var(--background)',
    padding: '1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)'
};
