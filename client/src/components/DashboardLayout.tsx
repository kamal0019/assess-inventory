"use client";

import { useState } from 'react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.mobileHeader}`}>
                <div className={styles.logoAndMenu}>
                    <button onClick={toggleSidebar} className={styles.menuButton}>
                        <Menu size={24} />
                    </button>
                    <span className={styles.mobileLogo}>AssessInventory</span>
                </div>
            </div>

            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
