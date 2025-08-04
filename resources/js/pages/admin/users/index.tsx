import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Search, Trash2, MoreHorizontal, Shield, UserPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type PageProps = {
    auth: {
        user: {
            user_id: number;
        };
    };
};

interface AdminUser {
    user_id: number;
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    admin: {
        nama_lengkap: string;
        jabatan: string;
        no_telepon: string;
        foto_profil?: string;
    } | null;
}

interface AdminUserIndexProps {
    admins: {
        data: AdminUser[];
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
        title: 'Admin Users',
        href: '/admin/users',
    },
];

export default function AdminUserIndex({ admins }: AdminUserIndexProps) {
    const { auth } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.users.index'),
            { search: searchTerm },
            { preserveState: true }
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    const confirmDelete = (user: AdminUser) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const deleteUser = () => {
        if (!userToDelete) return;
        
        setIsDeleting(true);
        router.delete(route('admin.users.destroy', userToDelete.user_id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success('Admin user deleted successfully');
            },
            onError: () => {
                setDeleteError('Failed to delete admin user');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        ) : (
            <Badge variant="outline">Inactive</Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Users" />
            
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        {/* <h2 className="text-2xl font-bold tracking-tight">Admin Users</h2>
                        <p className="text-muted-foreground">
                            Manage admin accounts and permissions
                        </p> */}
                    </div>
                    <Button asChild>
                        <Link href={route('admin.users.create')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Admin
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Cari admin berdasarkan nama atau email..."
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
                                            <TableHead>Jabatan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Login Terakhir</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.data.length > 0 ? (
                                            admins.data.map((admin) => (
                                                <TableRow key={admin.user_id} className="border-b transition-colors hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center space-x-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarFallback className="text-xs">
                                                                    {admin.admin ? getInitials(admin.admin.nama_lengkap) : 'A'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{admin.admin?.nama_lengkap || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {admin.email}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        <div className="flex items-center">
                                                            <Shield className={`h-4 w-4 mr-2 ${
                                                                admin.admin?.jabatan === 'owner' ? 'text-purple-500' : 'text-blue-500'
                                                            }`} />
                                                            {admin.admin?.jabatan === 'admin' ? 'Admin' : 
                                                             admin.admin?.jabatan === 'owner' ? 'Owner' : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant={admin.is_active ? 'default' : 'secondary'} 
                                                            className={`capitalize ${admin.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}
                                                        >
                                                            {admin.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="p-4 align-middle">
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
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2 justify-end">
                                                            <Button variant="outline" size="sm" asChild className="h-8 px-2">
                                                                <Link href={route('admin.users.show', admin.user_id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button variant="outline" size="sm" asChild className="h-8 px-2">
                                                                <Link href={route('admin.users.edit', admin.user_id)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => {
                                                                    if (admin.user_id !== auth.user.user_id) {
                                                                        setUserToDelete(admin);
                                                                        setIsDeleteModalOpen(true);
                                                                    } else {
                                                                        toast.error('Tidak dapat menghapus akun sendiri');
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="p-4 text-center text-muted-foreground">
                                                    No admin users found
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
                {admins.last_page > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(admins.links[0].url || '')}
                                disabled={!admins.links[0].url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(admins.links[admins.links.length - 1].url || '')}
                                disabled={!admins.links[admins.links.length - 1].url}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Admin</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus admin ini? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                                Batal
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={deleteUser}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
