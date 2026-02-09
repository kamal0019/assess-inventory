"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage('Email sent! check the server terminal for the link.');
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)'
            }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Forgot Password</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message && (
                    <div style={{ padding: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                            color: 'var(--text-main)',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            fontWeight: 500
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <Link href="/login" style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '0.875rem' }}>
                        Back to Login
                    </Link>
                </form>
            </div>
        </div>
    );
}
