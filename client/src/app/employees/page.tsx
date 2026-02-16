"use client";

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, Search, User, Edit2, Trash2, Upload } from 'lucide-react';
import { read, utils } from 'xlsx';
import { authFetch } from '@/utils/apiUtils';

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
    status: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // Track editing state
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        employeeId: '',
        email: '',
        contact: '',
        department: '',
        designation: '',
        password: '' // Keep password in type but empty string
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await authFetch('/api/employees');
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setNewEmployee({
            name: '',
            employeeId: '',
            email: '',
            contact: '',
            department: '',
            designation: '',
            password: ''
        });
        setShowModal(true);
    };

    const handleEdit = (emp: Employee) => {
        setEditingId(emp._id);
        setNewEmployee({
            name: emp.name,
            employeeId: emp.employeeId,
            email: (emp as any).email || '',
            contact: (emp as any).contact || '',
            department: emp.department,
            designation: (emp as any).designation || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation if button is inside Link
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            const res = await authFetch(`/api/employees/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchEmployees();
            } else {
                alert('Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = utils.sheet_to_json(ws);

            let successCount = 0;
            let failCount = 0;

            for (const row of data) {
                // Map Excel columns to Employee object
                // Expected format: Name, EmployeeID, Email, Contact, Department, Designation
                const newEmp = {
                    name: row['Name'] || row['name'],
                    employeeId: row['Employee ID'] || row['employeeId'] || row['EmployeeID'],
                    email: row['Email'] || row['email'],
                    contact: row['Contact'] || row['contact'],
                    department: row['Department'] || row['department'],
                    designation: row['Designation'] || row['designation'],
                    password: ''
                };

                if (newEmp.name && newEmp.employeeId && newEmp.email) {
                    if (!newEmp.password) {
                        delete (newEmp as any).password;
                    }

                    try {
                        const res = await authFetch('/api/employees', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newEmp)
                        });
                        if (res.ok) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (err) {
                        failCount++;
                    }
                } else {
                    failCount++;
                }
            }

            alert(`Import finished.\nSuccess: ${successCount}\nFailed: ${failCount}`);
            fetchEmployees();
            // Reset input
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/employees/${editingId}` : '/api/employees';
            const method = editingId ? 'PUT' : 'POST';

            const payload = { ...newEmployee };
            if (!payload.password) {
                delete (payload as any).password;
            }

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const errorData = JSON.parse(text);
                    alert(errorData.error || 'Request failed');
                } catch {
                    alert(`Request failed with status ${res.status}: ${text.substring(0, 50)}...`);
                }
                return;
            }

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchEmployees();
                setEditingId(null);
                setNewEmployee({
                    name: '',
                    employeeId: '',
                    email: '',
                    contact: '',
                    department: '',
                    designation: '',
                    password: ''
                });
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Failed to save employee', error);
        }
    };

    return (
        <DashboardLayout>
            <div style={headerStyle}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Employees</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage employee records</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={secondaryButtonStyle}>
                        <Upload size={20} />
                        Import Excel
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                    </label>
                    <button onClick={handleOpenCreate} style={primaryButtonStyle}>
                        <UserPlus size={20} />
                        Add Employee
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={gridStyle}>
                    {employees.map(emp => (
                        <div key={emp._id} style={{ position: 'relative' }}>
                            {/* Wrap Link content but keep buttons outside or managed */}
                            <Link href={`/employees/${emp._id}`} style={cardStyle}>
                                <div style={initialsStyle}>
                                    {emp.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={nameStyle}>{emp.name}</h3>
                                    <p style={idStyle}>{emp.employeeId}</p>
                                    <p style={deptStyle}>{emp.department}</p>
                                </div>
                                <div style={{ alignSelf: 'center' }}>
                                    <span style={{ ...statusBadge, background: emp.status === 'Active' ? 'var(--success-bg)' : 'var(--error-bg)', color: emp.status === 'Active' ? 'var(--success)' : 'var(--error)' }}>
                                        {emp.status}
                                    </span>
                                </div>
                            </Link>

                            {/* Action Buttons */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(emp); }}
                                    style={iconButtonStyle}
                                    title="Edit"
                                >
                                    <Edit2 size={18} color="var(--text-main)" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, emp._id)}
                                    style={{ ...iconButtonStyle, color: 'var(--danger)' }}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h2>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
                        <form onSubmit={handleSubmit} style={formStyle}>
                            <input
                                placeholder="Full Name"
                                value={newEmployee.name}
                                onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                style={inputStyle}
                                required
                            />
                            <input
                                placeholder="Employee ID"
                                value={newEmployee.employeeId}
                                onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                                style={inputStyle}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newEmployee.email}
                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                style={inputStyle}
                                required
                            />
                            <input
                                placeholder="Contact Number"
                                value={newEmployee.contact}
                                onChange={e => setNewEmployee({ ...newEmployee, contact: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Department"
                                value={newEmployee.department}
                                onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Designation"
                                value={newEmployee.designation}
                                onChange={e => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                                style={inputStyle}
                            />

                            <div style={modalActionsStyle}>
                                <button type="button" onClick={() => setShowModal(false)} style={cancelButtonStyle}>Cancel</button>
                                <button type="submit" style={submitButtonStyle}>
                                    {editingId ? 'Update Employee' : 'Create Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}


const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
};

const primaryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--primary)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500
};

const secondaryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--surface)',
    color: 'var(--text-main)',
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    fontWeight: 500
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
};

const cardStyle = {
    display: 'flex',
    gap: '1rem',
    background: 'var(--surface)',
    padding: '1.5rem',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s',
    cursor: 'pointer'
} as React.CSSProperties;

const initialsStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold'
};

const nameStyle = {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.25rem'
};

const idStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem'
};

const deptStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-main)',
    background: 'var(--background)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    display: 'inline-block'
};

const statusBadge = {
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600
};

const modalOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginTop: '1.5rem'
};

const inputStyle = {
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--text-main)'
};

const modalActionsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1rem'
};

const cancelButtonStyle = {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'var(--text-main)'
};

const submitButtonStyle = {
    padding: '0.75rem 1.5rem',
    background: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    color: 'white'
};

const iconButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};
