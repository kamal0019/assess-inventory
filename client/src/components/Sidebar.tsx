"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FileText, Settings, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Outliners', href: '/outliners', icon: Users }, // Using Users icon for now
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.logoHeader}>
                <div className={styles.logo}>
                    <Package size={28} />
                    <span>AssessInventory</span>
                </div>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>
            </div>
            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            onClick={onClose}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className={styles.footer}>
                <button
                    onClick={handleLogout}
                    className={styles.navItem}
                    style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
                <div style={{
                    marginTop: '1rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    opacity: 0.7
                }}>
                    © 2026 All Rights Reserved<br />KP Inventory
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
