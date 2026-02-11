'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TwoFactorModal from '@/components/TwoFactorModal';

export default function SettingsPage() {
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const { enable2FA, verify2FA, disable2FA, user, updateUser } = useAuth();

    // Initialize state from user object
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // Sync local state with user context when it loads
    useEffect(() => {
        if (user) {
            setIs2FAEnabled(!!user.is2FAEnabled);
        }
    }, [user]);

    const handleEnable2FA = async () => {
        try {
            const data = await enable2FA();
            if (data.success) {
                setQrCodeUrl(data.qrCode);
                setSecret(data.secret);
                setIs2FAModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to generate 2FA", error);
        }
    };

    const handleVerify2FA = async (otp: string) => {
        const data = await verify2FA(otp);
        if (data.success) {
            setIs2FAEnabled(true);
            // Update context
            updateUser({ is2FAEnabled: true });
            alert("2FA Enabled Successfully");
        } else {
            throw new Error("Invalid OTP");
        }
    };

    const handleDisable2FA = async () => {
        if (confirm("Are you sure you want to disable 2FA?")) {
            await disable2FA();
            setIs2FAEnabled(false);
            // Update context
            updateUser({ is2FAEnabled: false });
            alert("2FA Disabled");
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-main)' }}>Settings</h1>

            {/* Security Section */}
            <div style={{
                backgroundColor: 'var(--surface)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                maxWidth: '600px',
                marginBottom: '2rem',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Security</h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Two-Factor Authentication</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Add an extra layer of security to your account.</p>
                    </div>
                    {is2FAEnabled ? (
                        <button
                            onClick={handleDisable2FA}
                            style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '0.625rem 1.25rem',
                                borderRadius: 'var(--radius)',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                cursor: 'pointer'
                            }}
                        >
                            Disable 2FA
                        </button>
                    ) : (
                        <button
                            onClick={handleEnable2FA}
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                padding: '0.625rem 1.25rem',
                                borderRadius: 'var(--radius)',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Enable 2FA
                        </button>
                    )}
                </div>
            </div>

            {/* Admin Details Section (Only for Admins) */}
            {user?.role === 'Admin' ? (
                <div style={{
                    backgroundColor: 'var(--surface)',
                    padding: '2rem',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    maxWidth: '600px',
                    marginBottom: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Admin Details</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Name</p>
                            <p style={{ fontWeight: 500 }}>{user.name}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</p>
                            <p style={{ fontWeight: 500 }}>{user.email}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role</p>
                            <p style={{ fontWeight: 500, color: 'var(--primary)' }}>{user.role}</p>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border)',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}>
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <p>Changing password or other settings requires admin privileges. Contact system administrator.</p>
                </div>
            )}

            <TwoFactorModal
                isOpen={is2FAModalOpen}
                onClose={() => setIs2FAModalOpen(false)}
                qrCodeUrl={qrCodeUrl}
                secret={secret}
                onVerify={handleVerify2FA}
            />
        </div>
    );
}
