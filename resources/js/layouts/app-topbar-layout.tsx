import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppTopbarHeader } from '@/components/app-topbar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppTopbarLayoutProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItem[];
    onRemoveMultiple?: (ids: number[]) => void;
    backHref?: string;
}

export default function AppTopbarLayout({ children, breadcrumbs = [], onRemoveMultiple, backHref }: AppTopbarLayoutProps) {
    return (
        <AppShell variant="header">
            <AppContent variant="header">
                <AppTopbarHeader breadcrumbs={breadcrumbs} onRemoveMultiple={onRemoveMultiple} backHref={backHref} />
                {children}
            </AppContent>
        </AppShell>
    );
}
