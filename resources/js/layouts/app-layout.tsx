import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppTopbarLayout from '@/layouts/app-topbar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { auth } = usePage().props as any;
    const userRole = auth?.user?.role;
    
    const Layout = userRole === 'pelanggan' ? AppTopbarLayout : AppSidebarLayout;
    
    return (
        <Layout breadcrumbs={breadcrumbs} {...props}>
            {children}
        </Layout>
    );
}
