"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [requires2FA, setRequires2FA] = useState(false);
    const [otp, setOtp] = useState('');
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // CAPTCHA State
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');

    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing characters like I, 1, O, 0
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(result);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const images = [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Warehouse 1
        "https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Warehouse/Logistics
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Tech/Server Room (Abstract Inventory)
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Modern Architecture/Corporate
        "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Warehouse Shelves
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const { login, user } = useAuth();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!requires2FA) {
            if (captchaInput.toUpperCase() !== captchaCode) {
                setError('Incorrect CAPTCHA. Please try again.');
                generateCaptcha(); // Refresh CAPTCHA on failure
                setCaptchaInput('');
                return;
            }
        }

        try {
            if (requires2FA) {
                await login(email, password, otp);
            } else {
                const response = await login(email, password);
                if (response && response.requires2FA) {
                    setRequires2FA(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
            if (!requires2FA) {
                generateCaptcha(); // Refresh CAPTCHA on failed login
                setCaptchaInput('');
            }
        }
    };

    // Use context error if available
    const { error: authError } = useAuth();
    useEffect(() => {
        if (authError) setError(authError);
    }, [authError]);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Left Side - Image Slideshow */}
            <div style={{
                flex: '1',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000', // Black background to prevent white flashes
                overflow: 'hidden'
            }}>
                {images.map((img, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: currentImageIndex === index ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                            zIndex: currentImageIndex === index ? 1 : 0
                        }}
                    >
                        <img
                            src={img}
                            alt={`Slide ${index + 1}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {/* Optional overlay for better text contrast if needed, mostly for aesthetics here */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.1)'
                        }} />
                    </div>
                ))}
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)',
                padding: '2rem',
                zIndex: 10 // Ensure form stays on top
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '3rem',
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        color: 'var(--primary)', marginBottom: '2rem',
                        fontSize: '1.75rem', fontWeight: 700
                    }}>
                        <LayoutDashboard size={40} />
                        <span>AssessInventory</span>
                    </div>

                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 600 }}>Welcome Back</h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please enter your details to sign in.</p>

                    <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {!requires2FA ? (
                            <>
                                <div>
                                    <label style={labelStyle}>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={inputStyle}
                                        placeholder="admin@assessinfra.com"
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={inputStyle}
                                        placeholder="• • • • • • • •"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '2.2rem',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                    <a href="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
                                        Forgot Password?
                                    </a>
                                </div>

                                {/* CAPTCHA Section */}
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-end'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Security Code</label>
                                        <input
                                            type="text"
                                            value={captchaInput}
                                            onChange={(e) => setCaptchaInput(e.target.value)}
                                            required
                                            style={{ ...inputStyle, textTransform: 'uppercase' }}
                                            placeholder="Enter Code"
                                            maxLength={6}
                                        />
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: 'var(--background)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        padding: '0.5rem',
                                        height: '46px'
                                    }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '1.25rem',
                                            letterSpacing: '0.25rem',
                                            color: 'var(--text-main)',
                                            userSelect: 'none',
                                            fontFamily: 'monospace',
                                            padding: '0 0.5rem'
                                        }}>
                                            {captchaCode}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={generateCaptcha}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Refresh CAPTCHA"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label style={labelStyle}>Two-Factor Authentication Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                    style={inputStyle}
                                    placeholder="Enter 6-digit code"
                                    autoFocus
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Open your authenticator app to view your authentication code.
                                </p>
                            </div>
                        )}

                        {error && <div style={{
                            padding: '0.75rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>{error}</div>}

                        <button type="submit" style={buttonStyle}>
                            {requires2FA ? 'Verify' : 'Sign In'}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    fontSize: '1rem',
    outline: 'none',
    background: 'var(--background)',
    color: 'var(--text-main)'
};

const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem'
};
