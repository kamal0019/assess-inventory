import { LucideIcon } from 'lucide-react';
import styles from './OverviewCard.module.css';

interface OverviewCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string;
}

const OverviewCard = ({ title, value, icon: Icon, trend, color = 'var(--primary)' }: OverviewCardProps) => {
    return (
        <div className={styles.card}>
            <div className={styles.iconWrapper} style={{ backgroundColor: `${color}20`, color: color }}>
                <Icon size={24} />
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.value}>{value}</p>
                {trend && <span className={styles.trend}>{trend}</span>}
            </div>
        </div>
    );
};

export default OverviewCard;
