import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, User, Calendar, Clock } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface PageProps extends Record<string, unknown> {
    auth: {
        user: {
            user_id: number;
        };
    };
}

interface Pelanggan {
    user_id: string;
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    pelanggan: {
        pelanggan_id: number;
        nama_lengkap: string;
        no_telepon: string;
        alamat: string;
        tipe_alamat: string;
        kota: string | null;
        kode_pos: string | null;
    } | null;
}

interface PelangganShowProps {
    pelanggan: Pelanggan;
}

const breadcrumbs = (id: string): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Pelanggan',
        href: '/admin/pelanggan',
    },
    {
        title: 'Detail Pelanggan',
        href: `/admin/pelanggan/${id}`,
    },
];

export default function PelangganShow({ pelanggan }: PelangganShowProps) {
    const { auth } = usePage<PageProps>().props;
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Belum pernah login';
        
        try {
            const date = new Date(dateString);
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
    };

    const maskEmail = (email: string) => {
        if (!email) return '-';
        const [username, domain] = email.split('@');
        if (!username || !domain) return email; 
        const maskedUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
        return `${maskedUsername}@${domain}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(pelanggan.user_id)}>
            <Head title={`Detail Pelanggan - ${pelanggan.pelanggan?.nama_lengkap || 'Tidak Diketahui'}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('admin.pelanggan.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {pelanggan.pelanggan?.nama_lengkap || 'Pelanggan'}
                            </h2>
                            <p className="text-muted-foreground">
                                Detail informasi pelanggan
                            </p>
                        </div>
                    </div>

                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
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
                                <p className="text-sm" title={pelanggan.email}>
                                    {maskEmail(pelanggan.email)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Status Akun</span>
                                </div>
                                <div>
                                    <Badge variant={pelanggan.is_active ? 'default' : 'secondary'} className={`${pelanggan.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {pelanggan.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Terakhir Login</span>
                                </div>
                                <p className="text-sm">
                                    {formatDate(pelanggan.last_login_at)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Tanggal Bergabung</span>
                                </div>
                                <p className="text-sm">
                                    {new Date(pelanggan.created_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <MapPin className="mr-2 h-5 w-5" />
                                Informasi Alamat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pelanggan.pelanggan ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Nama Lengkap</span>
                                        </div>
                                        <p className="text-sm">{pelanggan.pelanggan.nama_lengkap}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="mr-2 h-4 w-4" />
                                            <span>No. Telepon</span>
                                        </div>
                                        <p className="text-sm">{pelanggan.pelanggan.no_telepon || '-'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            <span>Alamat</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm">{pelanggan.pelanggan.alamat}</p>
                                            {pelanggan.pelanggan.kota && (
                                                <p className="text-sm text-muted-foreground">
                                                    {pelanggan.pelanggan.kota}
                                                    {pelanggan.pelanggan.kode_pos && `, ${pelanggan.pelanggan.kode_pos}`}
                                                </p>
                                            )}
                                            {pelanggan.pelanggan.tipe_alamat && (
                                                <Badge variant="outline" className="mt-1">
                                                    {pelanggan.pelanggan.tipe_alamat}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Data pelanggan tidak tersedia</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
