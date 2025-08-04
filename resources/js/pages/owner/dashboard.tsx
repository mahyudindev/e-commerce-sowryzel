import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Owner Dashboard',
        href: '/owner/dashboard',
    },
];

export default function OwnerDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Owner Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Business Overview</h2>
                        <p className="text-muted-foreground">View your business performance</p>
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Financial Reports</h2>
                        <p className="text-muted-foreground">Access financial statements</p>
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-4">
                        <h2 className="mb-2 text-lg font-semibold">Inventory</h2>
                        <p className="text-muted-foreground">Manage your products</p>
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border p-4">
                    <h2 className="mb-4 text-xl font-semibold">Business Insights</h2>
                    <div className="grid h-full place-items-center">
                        <p className="text-muted-foreground">Key business metrics and insights will appear here</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
