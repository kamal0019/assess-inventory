"use client";
import { useState } from 'react';
import { authFetch } from '@/utils/apiUtils';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState(''); // Not used by backend yet but good practice to verify
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // Note: Identify confirmation of current password would ideally happen here or on backend
            // For now, we update directly as per existing route structure
            const res = await authFetch('/api/settings/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                }, 2000);
            } else {
                setError(data.error || 'Failed to update password');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--surface)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '450px',
                color: 'var(--text-main)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    Change Password
                </h2>

                {success ? (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        borderRadius: 'var(--radius)',
                        textAlign: 'center',
                        marginBottom: '1rem'
                    }}>
                        Password updated successfully!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Current Password - Optional visuals since backend endpoint assumes auth token is enough proof currently */}
                        {/* <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Current Password</label>
                            <input 
                                type="password" 
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="Enter current password"
                            />
                        </div> */}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="Enter new password"
                                required
                                minLength={6}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={cancelButtonStyle}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...primaryButtonStyle,
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: 'var(--background)',
    color: 'var(--text-main)',
};

const cancelButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const primaryButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
};
