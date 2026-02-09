'use client';
import { useState } from 'react';

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeUrl: string; // The URL for the QR code
    secret: string; // The text secret
    onVerify: (otp: string) => Promise<void>;
}

export default function TwoFactorModal({ isOpen, onClose, qrCodeUrl, secret, onVerify }: TwoFactorModalProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onVerify(otp);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Verification failed');
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)' }}>
                    Setup Two-Factor Authentication
                </h2>

                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.5' }}>
                        Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
                    </p>

                    {qrCodeUrl && (
                        <div style={{
                            background: 'white',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            marginBottom: '1rem'
                        }}>
                            <img src={qrCodeUrl} alt="2FA QR Code" width={200} height={200} style={{ display: 'block' }} />
                        </div>
                    )}

                    <div style={{
                        background: 'var(--background)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Secret Key</p>
                        <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)' }}>{secret}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Enter 6-digit Code
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                fontSize: '1rem',
                                outline: 'none',
                                backgroundColor: 'var(--background)',
                                color: 'var(--text-main)',
                                textAlign: 'center',
                                letterSpacing: '0.25rem'
                            }}
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius)',
                                border: 'none',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
