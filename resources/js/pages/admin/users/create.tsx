import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import AdminForm from './form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Admin Users',
        href: '/admin/users',
    },
    {
        title: 'Create Admin',
        href: '/admin/users/create',
    },
];

export default function CreateAdmin() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Admin User" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Create Admin User</h2>
                        <p className="text-muted-foreground">
                            Add a new admin user to the system
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin Information</CardTitle>
                        <CardDescription>
                            Fill in the details below to create a new admin user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminForm />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
