import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../../components/ui/dialog';
import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem, type Produk } from '../../../types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, PackagePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../../../components/ui/new-pagination';
import { toast } from 'sonner';

interface ProdukGambar {
  gambar_id: number;
  produk_id: number;
  nama_file: string;
  path: string;
  is_thumbnail: boolean;
  urutan: number;
}

interface ProdukData extends Produk {
  gambar: ProdukGambar[];
  status_aktif?: boolean;
}

interface Props {
  produk: {
    data: ProdukData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
  };
  filters: {
    search?: string;
    kategori?: string;
    per_page?: number;
  };
  kategoriOptions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin',
    href: '/admin/dashboard',
  },
  {
    title: 'Produk',
    href: '/admin/produk',
  },
];

export default function Index({ produk, filters, kategoriOptions }: Props) {
  const [perPage, setPerPage] = useState(filters.per_page?.toString() || '10');
  const [search, setSearch] = useState(filters.search || '');
  const [kategori, setKategori] = useState(filters.kategori || '');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    router.get('/admin/produk', { search, kategori, per_page: perPage }, { preserveState: true });
  };
  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };
  const handleDelete = () => {
    if (!productToDelete) return;
    
    router.delete(`/admin/produk/${productToDelete}`, {
      onSuccess: () => {
        toast.success("Produk Dihapus", {
          description: "Produk berhasil dihapus dari sistem."
        });
        setDeleteModalOpen(false);
        setProductToDelete(null);
      },
      onError: () => {
        toast.error("Gagal Menghapus", {
          description: "Terjadi kesalahan saat menghapus produk."
        });
      }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manajemen Produk" />
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Daftar Produk</CardTitle>
              <CardDescription>
                Kelola produk yang tersedia di toko Anda
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/produk/create">
                <PackagePlus className="mr-2 h-4 w-4" />
                Tambah Produk
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari nama atau kode produk..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-[180px]">
                <label className="text-sm font-medium">Kategori</label>
                <Select value={kategori} onValueChange={setKategori}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoriOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[100px]">
                <label className="text-sm font-medium">Per Halaman</label>
                <Select value={perPage} onValueChange={setPerPage}>
                  <SelectTrigger>
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Cari
              </Button>
            </form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produk.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada produk yang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    produk.data.map((item) => (
                      <TableRow key={item.produk_id}>
                        <TableCell className="font-medium">{item.kode_produk}</TableCell>
                        <TableCell>
                          {item.gambar && item.gambar.length > 0 && item.gambar.find(img => img.is_thumbnail) ? (
                            <img 
                              src={`/storage/${item.gambar.find(img => img.is_thumbnail)?.path}`}
                              alt={item.nama_produk} 
                              className="h-12 w-12 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Error';
                              }}
                            />
                          ) : item.gambar && item.gambar.length > 0 ? (
                            <img 
                              src={`/storage/${item.gambar[0].path}`}
                              alt={item.nama_produk} 
                              className="h-12 w-12 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Error';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.nama_produk}</TableCell>
                        <TableCell>{item.kategori || '-'}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(item.harga)}
                        </TableCell>
                        <TableCell className="text-center">{item.stok}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.status_aktif // Mengkonversi ke boolean untuk memastikan konsistensi
                              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {item.status_aktif ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/produk/${item.produk_id}`}>
                                <span className="sr-only">Lihat</span>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/produk/${item.produk_id}/edit`}>
                                <span className="sr-only">Edit</span>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete(item.produk_id)}
                            >
                              <span className="sr-only">Hapus</span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {produk.data.length} dari {produk.total} produk
              </div>
              
              <Pagination>
                <PaginationContent>
                  {produk.links.map((link, index) => {
                    if (!link.label) return null;
                    
                    const key = `pagination-${index}-${link.label.replace(/[^a-z0-9]/gi, '')}`;
                    const isActive = link.active;
                    const isDisabled = !link.url || link.url === '#';
                    const isPrevious = link.label.includes('Previous');
                    const isNext = link.label.includes('Next');
                    const isEllipsis = link.label === '...';
                    
                    if (isPrevious) {
                      return (
                        <PaginationItem key={key}>
                          <PaginationPrevious 
                            href={isDisabled ? '#' : (link.url || '#')} 
                            className={isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            onClick={(e) => isDisabled && e.preventDefault()}
                          />
                        </PaginationItem>
                      );
                    }
                    
                    if (isNext) {
                      return (
                        <PaginationItem key={key}>
                          <PaginationNext 
                            href={isDisabled ? '#' : (link.url || '#')}
                            className={isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            onClick={(e) => isDisabled && e.preventDefault()}
                          />
                        </PaginationItem>
                      );
                    }
                    
                    if (isEllipsis) {
                      return (
                        <PaginationItem key={key}>
                          <PaginationEllipsis className="text-muted-foreground" />
                        </PaginationItem>
                      );
                    }
                    
                    return (
                      <PaginationItem key={key}>
                        <PaginationLink 
                          href={link.url || '#'} 
                          isActive={isActive}
                          className={isDisabled ? 'pointer-events-none' : 'cursor-pointer'}
                          onClick={(e) => isDisabled && e.preventDefault()}
                        >
                          {link.label}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Batal</Button>
              <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
