import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import AppLayout from '../../../layouts/app-layout';

import { type BreadcrumbItem, type DetailTransaksi, type ProdukSimple, type AlamatPelangganSimple } from '../../../types.ts';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, PackageCheck, Save, Truck } from 'lucide-react';
import { FormEvent, useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

// Enums from index.tsx or types.ts
import { TransaksiStatusAdmin, PembayaranStatusAdmin, statusTransaksiLabels, statusPembayaranLabels } from './index';

interface PelangganDetail {
  pelanggan_id: number;
  nama_pelanggan: string;
  email: string;
  nomor_telepon: string;
}

interface DetailTransaksiAdmin extends DetailTransaksi {
  produk: ProdukSimple;
}

interface AdminTransaksiDetail {
  id_transaksi: number;
  invoice_id: string;
  pelanggan: PelangganDetail;
  tanggal_transaksi: string; // Or Date
  total_belanja: number;
  biaya_pengiriman: number;
  total_keseluruhan: number;
  status_pembayaran: PembayaranStatusAdmin;
  status_transaksi: TransaksiStatusAdmin;
  metode_pembayaran: string | null;
  midtrans_transaction_id: string | null;
  nomor_resi: string | null;
  catatan_pelanggan: string | null;
  detail_transaksis: DetailTransaksiAdmin[];
  alamat_pengiriman: AlamatPelangganSimple; // Assuming this structure
  // Add transaction history if available
}

interface User {
  id: number;
  name: string;
  email: string;
  // Add other user properties as needed
}

interface Auth {
  user: User | null; // Or your specific User type
}

interface Props {
  auth: Auth;
  transaksi: AdminTransaksiDetail;
  statusTransaksiOptions: { value: TransaksiStatusAdmin, label: string }[];
  currentStatus: TransaksiStatusAdmin;
}

export default function Show({ auth, transaksi, statusTransaksiOptions, currentStatus }: Props) {
  // console.log('Transaksi Prop:', transaksi);
  // console.log('Status Options:', statusTransaksiOptions);
  // console.log('Current Status from prop:', currentStatus);
  if (!transaksi) {
    // A basic fallback if transaksi is somehow not provided, though Inertia usually ensures this
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <p>Data transaksi tidak ditemukan atau sedang memuat...</p>
        </div>
      </AppLayout>
    );
  }
  const transaksiIdForLink = transaksi.id_transaksi;
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Admin',
      href: '/admin/dashboard',
    },
    {
      title: 'Transaksi',
      href: '/admin/transaksi',
    },
    {
      title: `#${transaksi.invoice_id}`,
      href: route('admin.transaksi.show', { transaksi: transaksi.id_transaksi }),
    },
  ];

  const { data, setData, post, patch, errors, processing, recentlySuccessful, reset } = useForm({
    status_transaksi: transaksi.status_transaksi,
    nomor_resi: transaksi.nomor_resi || '',
  });

  useEffect(() => {
    if (recentlySuccessful) {
      toast.success('Status Transaksi Diperbarui', {
        description: `Status transaksi #${transaksi.invoice_id} berhasil diperbarui.`
      });
      // Potentially refresh data or rely on Inertia to provide updated prop
      // router.reload({ only: ['transaksi'] }); // If you want to ensure data is fresh
    }
  }, [recentlySuccessful, transaksi.invoice_id]);

  const handleSubmitStatus = (e: FormEvent) => {
    e.preventDefault();
    patch(route('admin.transaksi.updateStatus', { transaksi: transaksi.id_transaksi }), {
      preserveScroll: true,
      // onSuccess: () => { /* Handled by useEffect */ }
    });
  };

  const canUpdateResi = data.status_transaksi === 'dikemas' || data.status_transaksi === 'dikirim';
  const resiRequired = data.status_transaksi === 'dikirim' && !data.nomor_resi;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Detail Transaksi #${transaksi.invoice_id}`} />
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link href={route('admin.transaksi.index')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Detail Transaksi #{transaksi.invoice_id}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Umum</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Invoice ID:</strong> {transaksi.invoice_id}</div>
                <div><strong>Tanggal Transaksi:</strong> {new Date(transaksi.tanggal_transaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div><strong>Status Pembayaran:</strong> <span className="font-semibold">{statusPembayaranLabels[transaksi.status_pembayaran]}</span></div>
                <div><strong>Metode Pembayaran:</strong> {transaksi.metode_pembayaran || '-'}</div>
                <div><strong>Total Belanja:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(transaksi.total_belanja)}</div>
                <div><strong>Biaya Pengiriman:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(transaksi.biaya_pengiriman)}</div>
                <div className="font-bold text-base"><strong>Total Keseluruhan:</strong> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(transaksi.total_keseluruhan)}</div>
                {transaksi.catatan_pelanggan && <div className="md:col-span-2"><strong>Catatan Pelanggan:</strong> <p className='italic'>{transaksi.catatan_pelanggan}</p></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan & Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Nama Pelanggan:</strong> {transaksi.pelanggan.nama_pelanggan}</div>
                <div><strong>Email:</strong> {transaksi.pelanggan.email}</div>
                <div><strong>Telepon:</strong> {transaksi.pelanggan.nomor_telepon}</div>
                <div className="md:col-span-2">
                  <strong>Alamat Pengiriman:</strong>
                  <address className="not-italic mt-1 p-3 bg-muted/50 rounded-md">
                    {transaksi.alamat_pengiriman.nama_penerima}<br />
                    {transaksi.alamat_pengiriman.nomor_telepon}<br />
                    {transaksi.alamat_pengiriman.alamat_lengkap}<br />
                    {transaksi.alamat_pengiriman.kecamatan}, {transaksi.alamat_pengiriman.kota}<br />
                    {transaksi.alamat_pengiriman.provinsi} {transaksi.alamat_pengiriman.kode_pos}
                    {transaksi.alamat_pengiriman.label_alamat && ` (${transaksi.alamat_pengiriman.label_alamat})`}
                    {transaksi.alamat_pengiriman.catatan_kurir && <p className='text-xs mt-1'>Catatan u/ Kurir: {transaksi.alamat_pengiriman.catatan_kurir}</p>}
                  </address>
                  {transaksi.id_transaksi && (
                  <a 
                    href={route('admin.transaksi.shippingLabelPdf', { transaksi: transaksi.id_transaksi })}
                    target="_blank" 
                    className="mantine-Button-root mantine-Button-filled mantine-Button-md bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mt-4 inline-block no-underline"
                    // download // Optional: uncomment if direct download behavior is preferred over new tab opening first
                  >
                    Download PDF Label
                  </a>
                )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Item</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaksi.detail_transaksis.map(item => (
                      <TableRow key={item.id_detail_transaksi}>
                        <TableCell>
                          <div className="font-medium">{item.produk.nama_produk}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.produk.kode_produk}</div>
                        </TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.harga_satuan)}</TableCell>
                        <TableCell className="text-center">{item.jumlah}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmitStatus}>
              <Card>
                <CardHeader>
                  <CardTitle>Update Status & Resi</CardTitle>
                  <CardDescription>Ubah status transaksi dan masukkan nomor resi jika tersedia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status_transaksi">Status Transaksi Saat Ini</Label>
                    <Input id="current_status_transaksi" value={statusTransaksiLabels[transaksi.status_transaksi]} readOnly className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label htmlFor="new_status_transaksi">Ubah Status Ke</Label>
                    <Select 
                      value={data.status_transaksi} 
                      onValueChange={(value) => setData('status_transaksi', value as TransaksiStatusAdmin)}
                      disabled={processing || transaksi.status_transaksi === 'selesai' || transaksi.status_transaksi === 'batal'}
                    >
                      <SelectTrigger id="new_status_transaksi" className="mt-1">
                        <SelectValue placeholder="Pilih status baru" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusTransaksiOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} 
                            // Logic to disable past statuses or invalid transitions can be added here
                            // disabled={/* some condition based on transaksi.status_transaksi and option.value */}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status_transaksi && <p className="text-sm text-red-600 mt-1">{errors.status_transaksi}</p>}
                  </div>
                  
                  {(data.status_transaksi === 'dikemas' || data.status_transaksi === 'dikirim') && (
                    <div>
                      <Label htmlFor="nomor_resi">Nomor Resi</Label>
                      <Input 
                        id="nomor_resi" 
                        value={data.nomor_resi} 
                        onChange={(e) => setData('nomor_resi', e.target.value)} 
                        placeholder="Masukkan nomor resi pengiriman"
                        className="mt-1"
                        disabled={processing || data.status_transaksi !== 'dikemas' && data.status_transaksi !== 'dikirim'}
                      />
                      {errors.nomor_resi && <p className="text-sm text-red-600 mt-1">{errors.nomor_resi}</p>}
                      {resiRequired && <p className="text-sm text-yellow-600 mt-1">Nomor resi wajib diisi untuk status 'Dikirim'.</p>}
                    </div>
                  )}

                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    disabled={processing || data.status_transaksi === transaksi.status_transaksi && data.nomor_resi === (transaksi.nomor_resi || '') || transaksi.status_transaksi === 'selesai' || transaksi.status_transaksi === 'batal'}
                  >
                    {processing ? 'Menyimpan...' : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
