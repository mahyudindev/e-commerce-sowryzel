import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '../../../components/ui/new-pagination';
import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem, type PaginatedData } from '../../../types'; // Re-affirming import
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

// Define your new status enums here for clarity if they differ from customer ones or add to types.ts
export type TransaksiStatusAdmin = 'pending' | 'dikemas' | 'dikirim' | 'selesai' | 'batal';
export type PembayaranStatusAdmin = 'unpaid' | 'paid' | 'pending' | 'failed' | 'expired' | 'cancelled' | 'denied';

interface PelangganSimple {
  id: number;
  nama_lengkap: string;
  no_telepon?: string;
  email?: string | null;
}

interface AdminTransaksiListItem {
  id_transaksi: number;
  invoice_id: string;
  pelanggan: PelangganSimple;
  tanggal_transaksi: string; 
  total_keseluruhan: number;
  status_pembayaran: PembayaranStatusAdmin;
  status_transaksi: TransaksiStatusAdmin;
}

interface Props {
  transaksi: PaginatedData<AdminTransaksiListItem>;
  filters: {
    search?: string;
    status_transaksi?: TransaksiStatusAdmin | 'all';
    per_page?: number;
  };
  // Add options for filters if needed, e.g., distinct statuses from backend
  statusTransaksiOptions: TransaksiStatusAdmin[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin',
    href: '/admin/dashboard',
  },
  {
    title: 'Transaksi',
    href: '/admin/transaksi',
  },
];

export const statusTransaksiLabels: Record<TransaksiStatusAdmin, string> = {
  pending: 'Pending',
  dikemas: 'Dikemas',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  batal: 'Batal',
};

export const statusPembayaranLabels: Record<PembayaranStatusAdmin, string> = {
  unpaid: 'Belum Dibayar',
  paid: 'Dibayar',
  pending: 'Menunggu Pembayaran',
  failed: 'Gagal',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan (Pembayaran)',
  denied: 'Ditolak',
};

export default function Index({ transaksi, filters, statusTransaksiOptions }: Props) {
  const [perPage, setPerPage] = useState(filters.per_page?.toString() || '10');
  const [search, setSearch] = useState(filters.search || '');
  const [filterStatusTransaksi, setFilterStatusTransaksi] = useState(filters.status_transaksi || 'all');

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    router.get('/admin/transaksi', {
      search,
      status_transaksi: filterStatusTransaksi,
      per_page: perPage
    }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manajemen Transaksi" />
      
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Daftar Transaksi</CardTitle>
              <CardDescription>
                Kelola transaksi pelanggan yang masuk ke toko Anda.
              </CardDescription>
            </div>
            {/* Admin typically don't create transactions, they manage existing ones */}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-end gap-4 mb-6">
              <div className="md:col-span-2 lg:col-span-1">
                <label htmlFor="search" className="text-sm font-medium">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Cari Invoice ID atau Nama Pelanggan..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status_transaksi" className="text-sm font-medium">Status Transaksi</label>
                <Select value={filterStatusTransaksi} onValueChange={(value) => setFilterStatusTransaksi(value as TransaksiStatusAdmin | 'all')}>
                  <SelectTrigger id="status_transaksi">
                    <SelectValue placeholder="Semua Status Transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {statusTransaksiOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {statusTransaksiLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label htmlFor="per_page" className="text-sm font-medium">Per Halaman</label>
                    <Select value={perPage} onValueChange={setPerPage}>
                    <SelectTrigger id="per_page">
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
                <Button type="submit" className="w-full sm:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status Pembayaran</TableHead>
                    <TableHead className="text-center">Status Transaksi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksi.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Tidak ada transaksi yang ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transaksi.data.map((item: AdminTransaksiListItem) => (
                      <TableRow key={item.id_transaksi}>
                        <TableCell className="font-medium">{item.invoice_id}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {item.pelanggan ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{item.pelanggan.nama_lengkap}</span>
                              {item.pelanggan.email && (
                                <span className="text-xs text-muted-foreground">{item.pelanggan.email}</span>
                              )}
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_keseluruhan)}</TableCell>
                        <TableCell className="text-center">
                          {/* Basic badge - can be improved with colors later */}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full`}>
                            {statusPembayaranLabels[item.status_pembayaran]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full`}>
                            {statusTransaksiLabels[item.status_transaksi]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.transaksi.show', { transaksi: item.id_transaksi })}>
                              <Eye className="mr-2 h-4 w-4" /> Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {transaksi.data.length} dari {transaksi.total} transaksi
              </div>
              
              <Pagination>
                <PaginationContent>
                  {transaksi.links.map((link, index) => {
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
      </div>
    </AppLayout>
  );
}
