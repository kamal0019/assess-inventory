"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Filter, ArrowRight, Plus } from 'lucide-react';
import styles from './Inventory.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/utils/apiUtils';

interface InventoryItem {
    _id: string;
    category: string;
    quantity: number;
}

interface CategorySummary {
    name: string;
    totalQuantity: number;
}

export default function InventoryPage() {
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const router = useRouter();

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            router.push(`/inventory/${encodeURIComponent(newCategoryName.trim())}`);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await authFetch('/api/inventory');
            const data = await res.json();
            if (data.success) {
                const items: InventoryItem[] = data.data;

                // Aggregate by category
                const catMap = new Map<string, number>();
                items.forEach(item => {
                    const cat = item.category.trim();
                    const qty = item.quantity || 0;
                    catMap.set(cat, (catMap.get(cat) || 0) + qty);
                });

                const summary: CategorySummary[] = Array.from(catMap.entries()).map(([name, totalQuantity]) => ({
                    name,
                    totalQuantity
                }));

                setCategories(summary);
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className={styles.header}>
                <div>
                    <h1>Inventory Summary</h1>
                    <p>Overview of assets by category</p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBar}>
                    <Search size={20} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.filterButton}>
                        <Filter size={20} />
                        Filter
                    </button>
                    <button
                        className={styles.filterButton}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                        onClick={() => setShowAddCategory(true)}
                    >
                        <Plus size={20} />
                        Add Category
                    </button>
                </div>
            </div>

            {showAddCategory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius)',
                        width: '400px', maxWidth: '90%', position: 'relative',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Add New Category</h2>
                        <input
                            type="text"
                            placeholder="Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                                marginBottom: '1rem',
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowAddCategory(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.tableContainer}>
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading inventory...</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Item Name (Category)</th>
                                <th>Category</th>
                                <th>Total Qty</th>
                                <th style={{ width: '100px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((cat) => (
                                <tr
                                    key={cat.name}
                                    onClick={() => router.push(`/inventory/${encodeURIComponent(cat.name)}`)}
                                    style={{ cursor: 'pointer' }}
                                    className={styles.rowHover} // Assuming rowHover style exists or browsers handle hover on tr
                                >
                                    <td><strong>{cat.name}</strong></td>
                                    <td>{cat.name}</td>
                                    <td>
                                        <span style={{
                                            background: 'var(--primary)', color: 'white',
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            fontSize: '0.875rem', fontWeight: 600
                                        }}>
                                            {cat.totalQuantity}
                                        </span>
                                    </td>
                                    <td>
                                        <ArrowRight size={20} color="var(--text-secondary)" />
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No categories found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
