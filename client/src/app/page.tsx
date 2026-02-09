"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OverviewCard from '@/components/OverviewCard';
import StockChart from '@/components/StockChart';
import { Package, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/utils/apiUtils';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [stats, setStats] = useState({
    totalQuantity: 0,
    availableStock: 0,
    totalIssued: 0,
    lowStockCount: 0,
    employeeCount: 0,
    outlinerCount: 0
  });

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Still fetching full inventory for the chart to keep it visual
  // In a larger app, you'd want a specific /api/dashboard/chart endpoint
  const [chartData, setChartData] = useState<{ name: string; quantity: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Stats
      const statsRes = await authFetch('/api/dashboard/stats');
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      // 2. Fetch Activity
      const activityRes = await authFetch('/api/dashboard/activity');
      const activityData = await activityRes.json();
      if (activityData.success) {
        setActivities(activityData.data);
      }

      // 3. Fetch Inventory for Chart (Visual distribution)
      const invRes = await authFetch('/api/inventory');
      const invData = await invRes.json();

      if (invData.success) {
        const items: any[] = invData.data;
        const categoryMap: { [key: string]: number } = {};
        items.forEach(item => {
          const cat = item.category || 'Other';
          categoryMap[cat] = (categoryMap[cat] || 0) + (item.quantity || 0);
        });
        const newChartData = Object.keys(categoryMap).map(key => ({
          name: key,
          quantity: categoryMap[key]
        }));
        setChartData(newChartData);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const overviewData = [
    { title: 'Total Stock', value: stats.totalQuantity.toLocaleString(), icon: Package, color: 'var(--primary)' },
    { title: 'Available', value: stats.availableStock.toLocaleString(), icon: CheckCircle, color: 'var(--success)' },
    { title: 'Issued', value: stats.totalIssued.toLocaleString(), icon: Clock, color: 'var(--warning)' },
    { title: 'Low Stock', value: stats.lowStockCount.toLocaleString(), icon: AlertTriangle, color: 'var(--danger)' },
  ];

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '1.875rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to AssessInventory Manager</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <Link href="/items" style={{ textDecoration: 'none' }}>
            <OverviewCard {...overviewData[0]} />
          </Link>
          <Link href="/items?status=Available" style={{ textDecoration: 'none' }}>
            <OverviewCard {...overviewData[1]} />
          </Link>
          <Link href="/items?status=Issued" style={{ textDecoration: 'none' }}>
            <OverviewCard {...overviewData[2]} />
          </Link>
          <Link href="/items?lowStock=true" style={{ textDecoration: 'none' }}>
            <OverviewCard {...overviewData[3]} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard...</div>
          ) : (
            <StockChart data={chartData} />
          )}

          <div style={{
            background: 'var(--surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            minHeight: '400px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activities.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No recent activity.</p>
              ) : (
                activities.map((log: any) => (
                  <div key={log._id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{
                      background: 'var(--background)',
                      padding: '0.5rem',
                      borderRadius: '50%',
                      height: 'fit-content'
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>{log.description}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.createdAt).toLocaleString()} • {log.performedBy}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
