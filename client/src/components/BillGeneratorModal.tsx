"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Download, Calendar } from 'lucide-react';
import { authFetch } from '@/utils/apiUtils';

interface IssuedItem {
    _id: string;
    name: string;
    serialNumber: string;
    category: string;
    make?: string;
    purchaseDate?: string;
}

interface BillGeneratorModalProps {
    recipientName: string;
    recipientId: string;
    recipientType: string;
    recipientContact?: string;
    issuedItems: IssuedItem[];
    onClose: () => void;
}

export default function BillGeneratorModal({ recipientName, recipientType, recipientId, recipientContact, issuedItems, onClose }: BillGeneratorModalProps) {
    const [selectedItems, setSelectedItems] = useState(
        issuedItems.map(item => ({
            ...item,
            selected: true,
            price: 0,
            remark: ''
        }))
    );
    const [verifierName, setVerifierName] = useState('Jaspreet Singh');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

    const handleToggleSelect = (index: number) => {
        const newItems = [...selectedItems];
        newItems[index].selected = !newItems[index].selected;
        setSelectedItems(newItems);
    };

    const handlePriceChange = (index: number, value: string) => {
        const newItems = [...selectedItems];
        newItems[index].price = parseFloat(value) || 0;
        setSelectedItems(newItems);
    };

    const handleRemarkChange = (index: number, value: string) => {
        const newItems = [...selectedItems];
        newItems[index].remark = value;
        setSelectedItems(newItems);
    };

    const calculateTotal = () => {
        return selectedItems
            .filter(item => item.selected)
            .reduce((sum, item) => sum + item.price, 0);
    };

    const generatePDF = async () => {
        // Save to DB first
        try {
            const itemsToSave = selectedItems.filter(item => item.selected);
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
                    items: itemsToSave.map(item => ({
                        name: item.name,
                        serialNumber: item.serialNumber,
                        category: item.category,
                        make: item.make,
                        price: item.price,
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

        // Format date to DD-MM-YYYY
        const [year, month, day] = billDate.split('-');
        const formattedDate = `${day}-${month}-${year}`;

        // --- Header ---
        // Removed dark rect

        doc.setTextColor(59, 130, 246); // Blue color for company name
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ASSESSINFRA TECHNOLOGY PVT.LTD', 105, 15, { align: 'center' });

        doc.setTextColor(0, 0, 0); // Black color for rest
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`I Am ${recipientName} Here by that, I am Receiving,`, 14, 30);

        // --- Table ---
        const tableBody = selectedItems
            .filter(item => item.selected)
            .map((item, index) => {
                // Construct Particulars
                let particulars = `Make: ${item.make || 'N/A'}\n\n`;
                particulars += `Model: ${item.name}\n`;
                particulars += `Category: ${item.category}\n`;
                particulars += `Sr. No: ${item.serialNumber}`;

                return [
                    index + 1,
                    particulars,
                    "1", // Quantity
                    `Rs. ${item.price.toLocaleString()}`, // Rate column
                    item.remark || ''
                ];
            });

        autoTable(doc, {
            startY: 45,
            head: [['S. No.', 'Particulars', 'Quantity', 'Rate', 'Remark']],
            body: tableBody,
            theme: 'grid', // Keeps grid lines
            headStyles: {
                fillColor: [255, 255, 255], // White background
                textColor: [0, 0, 0], // Black text
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center'
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255], // White background
                cellPadding: 4,
                valign: 'top',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { cellWidth: 80 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 30 },
                4: { cellWidth: 45 }
            },
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            foot: [
                ['', 'Total', '', `Rs. ${calculateTotal().toLocaleString()}`, '']
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

        // Check if we need a new page for footer
        if (finalY > 250) {
            doc.addPage();
        }

        doc.setTextColor(0, 0, 0); // Black text
        doc.setFontSize(10);
        doc.text(`From Assessinfra Technology, with No defect on (${formattedDate}) for Office Use Purpose.`, 14, finalY);

        // Signatures
        const sigY = finalY + 30;

        // Verified By
        doc.setLineWidth(0.5);
        doc.line(14, sigY, 80, sigY); // Underline
        doc.text(`Verified By: -`, 30, sigY + 5);

        doc.setFont('helvetica', 'bold');
        doc.text(`Name: - ${verifierName}`, 14, sigY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: - ${formattedDate}`, 14, sigY + 22);
        doc.text(`Place: - Assessinfra Technology`, 14, sigY + 29);
        doc.text(`Contact No.:- 9636872742`, 14, sigY + 36);

        // Received By
        doc.line(130, sigY, 196, sigY); // Underline
        doc.text(`Received By: -`, 150, sigY + 5);

        doc.setFont('helvetica', 'bold');
        doc.text(`Name:- ${recipientName}`, 130, sigY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date:- ${formattedDate}`, 130, sigY + 22);
        doc.text(`Place:- Assessinfra Technology`, 130, sigY + 29);
        doc.text(`Contact No.:- ${recipientContact || ''}`, 130, sigY + 36);

        doc.save(`${recipientName}_Bill_${billDate}.pdf`);
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <h2>Generate Bill</h2>
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

                <div style={tableContainer}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Select</th>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>Price (₹)</th>
                                <th style={thStyle}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item, index) => (
                                <tr key={item._id}>
                                    <td style={tdStyle}>
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => handleToggleSelect(index)}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.serialNumber}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={e => handlePriceChange(index, e.target.value)}
                                            style={tableInputStyle}
                                            disabled={!item.selected}
                                        />
                                    </td>
                                    <td style={tdStyle}>
                                        <input
                                            type="text"
                                            value={item.remark}
                                            onChange={e => handleRemarkChange(index, e.target.value)}
                                            placeholder="e.g. With Adapter"
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
                        Download PDF
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
    maxWidth: '800px',
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
