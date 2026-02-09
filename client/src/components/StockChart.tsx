"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './StockChart.module.css';

interface StockChartProps {
    data: { name: string; quantity: number }[];
}

const StockChart = ({ data }: StockChartProps) => {
    return (
        <div className={styles.chartContainer}>
            <h3 className={styles.title}>Stock Overview</h3>
            <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="name"
                            stroke="var(--text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--text-secondary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--background)' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <Bar dataKey="quantity" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StockChart;
