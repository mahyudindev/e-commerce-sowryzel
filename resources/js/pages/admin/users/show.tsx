import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Phone, Mail, Calendar, User, Briefcase, Info } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface AdminShowProps {
    admin: {
        user_id: number;
        email: string;
        is_active: boolean;
        last_login_at: string | null;
        created_at: string;
        admin: {
            nama_lengkap: string;
            jabatan: string;
            no_telepon: string;
            foto_profil?: string | null;
            deskripsi_jabatan?: string;
        };
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
        title: 'Admin Details',
        href: `/admin/users/${id}`,
    },
];

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function ShowAdmin({ admin }: AdminShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs(admin.user_id)}>
            <Head title={`Admin: ${admin.admin?.nama_lengkap || admin.email}`} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {admin.admin?.nama_lengkap || 'Admin Details'}
                        </h2>
                        <p className="text-muted-foreground">
                            View and manage admin user details
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.users.edit', admin.user_id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Admin
                        </Link>
                    </Button>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-6 md:space-y-0">
                        <div className="relative">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32">
                                {admin.admin.foto_profil ? (
                                    <AvatarImage 
                                        src={`/storage/${admin.admin.foto_profil}`} 
                                        alt={admin.admin.nama_lengkap} 
                                    />
                                ) : (
                                    <AvatarFallback className="text-2xl">
                                        {admin.admin.nama_lengkap
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-2xl font-bold">{admin.admin.nama_lengkap}</h1>
                            <div className="flex flex-col items-center space-y-2 text-muted-foreground md:flex-row md:space-x-4 md:space-y-0">
                                <div className="flex items-center">
                                    <Briefcase className="mr-1 h-4 w-4" />
                                    <span className="capitalize">{admin.admin.jabatan}</span>
                                </div>
                                <Badge variant={admin.is_active ? 'default' : 'secondary'} className="w-fit">
                                    {admin.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-lg">
                                    <User className="mr-2 h-5 w-5" />
                                    Informasi Akun
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Mail className="mr-2 h-4 w-4" />
                                        <span>Email</span>
                                    </div>
                                    <p className="text-sm">{admin.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Phone className="mr-2 h-4 w-4" />
                                        <span>Nomor Telepon</span>
                                    </div>
                                    <p className="text-sm">{admin.admin.no_telepon}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>Terakhir Login</span>
                                    </div>
                                    <p className="text-sm">
                                        {admin.last_login_at 
                                            ? (() => {
                                                try {
                                                    const date = new Date(admin.last_login_at);
                                                    const options: Intl.DateTimeFormatOptions = {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    };
                                                    return date.toLocaleDateString('id-ID', options);
                                                } catch (error) {
                                                    return 'Format tanggal tidak valid';
                                                }
                                              })()
                                            : 'Belum pernah login'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>Tanggal Bergabung</span>
                                    </div>
                                    <p className="text-sm">
                                        {new Date(admin.created_at).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-lg">
                                    <Info className="mr-2 h-5 w-5" />
                                    Informasi Jabatan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            <span>Jabatan</span>
                                        </div>
                                        <p className="capitalize">{admin.admin.jabatan}</p>
                                    </div>
                                    {admin.admin.deskripsi_jabatan && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Info className="mr-2 h-4 w-4" />
                                                <span>Deskripsi Jabatan</span>
                                            </div>
                                            <p className="whitespace-pre-line text-sm">
                                                {admin.admin.deskripsi_jabatan}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
