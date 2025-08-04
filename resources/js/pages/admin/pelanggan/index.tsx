import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Eye, Search, Trash2, Loader2 } from 'lucide-react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

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
    pelanggan: {
        pelanggan_id: number;
        nama_lengkap: string;
        no_telepon: string;
        alamat: string;
        tipe_alamat: string;
    } | null;
}

interface PelangganIndexProps {
    pelanggans: {
        data: Pelanggan[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        current_page: number;
        last_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Pelanggan',
        href: '/admin/pelanggan',
    },
];

export default function PelangganIndex({ pelanggans }: PelangganIndexProps) {
    const { auth } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [pelangganToDelete, setPelangganToDelete] = useState<Pelanggan | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.pelanggan.index'),
            { search: searchTerm },
            { preserveState: true }
        );
    };

    const confirmDelete = (pelanggan: Pelanggan) => {
        setPelangganToDelete(pelanggan);
        setIsDeleteModalOpen(true);
    };

    const deletePelanggan = () => {
        if (!pelangganToDelete) return;
        
        setIsDeleting(true);
        router.delete(route('admin.pelanggan.destroy', pelangganToDelete.user_id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success('Pelanggan berhasil dihapus');
            },
            onError: () => {
                toast.error('Gagal menghapus pelanggan');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const maskEmail = (email: string) => {
        if (!email) return '-';
        const [username, domain] = email.split('@');
        if (!username || !domain) return email; // handle invalid email format
        const maskedUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 2));
        return `${maskedUsername}@${domain}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Pelanggan" />
            
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Daftar Pelanggan</h2>
                        <p className="text-muted-foreground">
                            Kelola data pelanggan
                        </p>
                    </div>
                    <div></div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Cari pelanggan..."
                                        className="pl-8 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" size="sm">
                                    <Search className="mr-2 h-4 w-4" />
                                    Cari
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>No. Telepon</TableHead>
                                            <TableHead>Alamat</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Terdaftar</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pelanggans.data.length > 0 ? (
                                            pelanggans.data.map((pelanggan) => (
                                                <TableRow key={pelanggan.user_id} className="border-b transition-colors hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="font-medium">
                                                                {pelanggan.pelanggan?.nama_lengkap || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell title={pelanggan.email}>
                                                        {maskEmail(pelanggan.email)}
                                                    </TableCell>
                                                    <TableCell>{pelanggan.pelanggan?.no_telepon || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate">
                                                            {pelanggan.pelanggan?.alamat || '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant={pelanggan.is_active ? 'default' : 'secondary'}
                                                            className={`${pelanggan.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}
                                                        >
                                                            {pelanggan.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(pelanggan.created_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end space-x-2">
                                                            <Button variant="outline" size="sm" asChild className="h-8 px-2">
                                                                <Link href={route('admin.pelanggan.show', pelanggan.user_id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => confirmDelete(pelanggan)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                                                    Tidak ada data pelanggan
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pelanggans.last_page > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(pelanggans.links[0].url || '')}
                                disabled={!pelanggans.links[0].url}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(pelanggans.links[pelanggans.links.length - 1].url || '')}
                                disabled={!pelanggans.links[pelanggans.links.length - 1].url}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Pelanggan</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus pelanggan ini? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                                Batal
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={deletePelanggan}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    'Hapus'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
