import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import AdminForm from './form';

interface EditAdminProps {
    admin: {
        user_id: number;
        email: string;
        is_active: boolean;
        admin: {
            nama_lengkap: string;
            jabatan: string;
            no_telepon: string;
            deskripsi_jabatan?: string;
        } | null;
    };
}

const breadcrumbs = (id: number): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Admin Users',
        href: '/admin/users',
    },
    {
        title: 'Edit Admin',
        href: `/admin/users/${id}/edit`,
    },
];

export default function EditAdmin({ admin }: EditAdminProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(admin.user_id)}>
            <Head title="Edit Admin User" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Edit Admin: {admin.admin?.nama_lengkap || admin.email}
                        </h2>
                        <p className="text-muted-foreground">
                            Update admin user details
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin Information</CardTitle>
                        <CardDescription>
                            Update the details below to modify this admin user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminForm admin={admin} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
