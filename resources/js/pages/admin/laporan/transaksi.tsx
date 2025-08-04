import React, { useState, FormEvent } from 'react';

import { format } from 'date-fns';
import { Head, Link, router } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppContent } from '@/components/app-content';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FileDown } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';

interface ProdukTransaksi {
    produk_id: number;
    nama_produk: string;
    jumlah: number;
    harga: number;
    ongkir: number;
    total: number;
    tanggal: string;
}

interface Transaksi {
    id: number;
    kode_invoice: string;
    tanggal: string;
    nama_pelanggan: string;
    total_belanja: number;
    total_ongkir: number;
    total_keseluruhan: number;
    status_pembayaran: string;
    status_transaksi: string;
    detail_produk?: ProdukTransaksi[];
}

interface Summary {
    total_transaksi: number;
    total_pendapatan: number;
    total_pendapatan_dengan_ongkir: number;
    status_transaksi: {
        pending: number;
        proses: number;
        dikirim: number;
        selesai: number;
        batal: number;
    };
}

interface PageProps {
    transaksi: Transaksi[];
    summary: Summary;
    filter: {
        date_start: string;
        date_end: string;
    };
    produk_terjual: ProdukTransaksi[];
    nama_toko: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard-dev',
    },
    {
        title: 'Laporan',
        href: '#',
    },
    {
        title: 'Transaksi',
        href: '/admin/laporan/transaksi',
    },
];

const getStatusTransaksiBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="bg-yellow-500">Pending</Badge>;
        case 'proses':
            return <Badge className="bg-blue-500">Diproses</Badge>;
        case 'dikirim':
            return <Badge className="bg-indigo-500">Dikirim</Badge>;
        case 'selesai':
            return <Badge className="bg-green-500">Selesai</Badge>;
        case 'batal':
            return <Badge className="bg-red-500">Dibatalkan</Badge>;
        default:
            return <Badge className="bg-gray-500">{status}</Badge>;
    }
};

const getStatusPembayaranBadge = (status: string) => {
    switch (status) {
        case 'belum_bayar':
            return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Belum Bayar</Badge>;
        case 'sudah_bayar':
            return <Badge variant="outline" className="border-green-500 text-green-500">Sudah Bayar</Badge>;
        case 'expired':
            return <Badge variant="outline" className="border-red-500 text-red-500">Expired</Badge>;
        default:
            return <Badge variant="outline" className="border-gray-500 text-gray-500">{status}</Badge>;
    }
};

export default function LaporanTransaksi({ transaksi, summary, filter }: PageProps) {
    const [dateStart, setDateStart] = useState<Date | undefined>(
        filter.date_start ? new Date(filter.date_start) : undefined
    );
    const [dateEnd, setDateEnd] = useState<Date | undefined>(
        filter.date_end ? new Date(filter.date_end) : undefined
    );

    // Filter hanya transaksi dengan status selesai
    const transaksiSelesai = transaksi.filter(item => item.status_transaksi === 'selesai');
    
    // Hitung total
    const totalJumlah = transaksiSelesai.length;
    const totalBelanja = transaksiSelesai.reduce((sum, item) => sum + (Number(item.total_belanja) || 0), 0);
    const totalOngkir = transaksiSelesai.reduce((sum, item) => sum + (Number(item.total_ongkir) || 0), 0);
    const totalKeseluruhan = transaksiSelesai.reduce((sum, item) => sum + (Number(item.total_keseluruhan) || 0), 0);

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/laporan/transaksi', { 
            date_start: dateStart ? format(dateStart, 'yyyy-MM-dd') : '', 
            date_end: dateEnd ? format(dateEnd, 'yyyy-MM-dd') : '' 
        });
    };

    const handleDownloadPDF = () => {
        const date_start = dateStart ? format(dateStart, 'yyyy-MM-dd') : '';
        const date_end = dateEnd ? format(dateEnd, 'yyyy-MM-dd') : '';
        window.open(`/admin/laporan/transaksi/pdf?date_start=${date_start}&date_end=${date_end}`, '_blank');
    };

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID').format(angka);
    };

    const formatTanggal = (tanggal: string) => {
        return new Date(tanggal).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="Laporan Transaksi" />
                <div className="flex h-full w-full flex-1 flex-col gap-6 bg-gray-50/50 p-4 font-sans sm:p-6 lg:p-8 dark:bg-gray-900/90">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Transaksi</h1>
                        <Button onClick={handleDownloadPDF} variant="outline" className="mt-2 sm:mt-0">
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>

                    {/* Filter */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Laporan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Tanggal Mulai</Label>
                                    <DatePicker date={dateStart} onDateChange={setDateStart} placeholder="Pilih tanggal mulai" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Tanggal Akhir</Label>
                                    <DatePicker date={dateEnd} onDateChange={setDateEnd} placeholder="Pilih tanggal akhir" />
                                </div>
                                <Button type="submit">Terapkan Filter</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Summary Cards Removed */}

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Transaksi Selesai</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-auto">
                                <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Tanggal
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Produk
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Jumlah
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Harga
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Ongkir
                                            </th>
                                            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                        {(() => {
                                            // Clonar y procesar los datos primero
                                            const processedData = transaksiSelesai.map(item => ({
                                                ...item,
                                                detail_produk: item.detail_produk ? [...item.detail_produk] : [],
                                            }));
                                            
                                            return processedData.flatMap((item) => {
                                                if (item.detail_produk && item.detail_produk.length > 0) {
                                                    return item.detail_produk.map((produk, idx) => (
                                                        <tr key={`${item.id}-${idx}`}>
                                                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                                {formatTanggal(item.tanggal)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                                                {produk.nama_produk}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-center">
                                                                {produk.jumlah}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(produk.harga)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(item.total_ongkir / (item.detail_produk.length || 1))}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(produk.harga * produk.jumlah + (item.total_ongkir / (item.detail_produk.length || 1)))}
                                                            </td>
                                                        </tr>
                                                    ));
                                                } else {
                                                    return [
                                                        <tr key={item.id}>
                                                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                                {formatTanggal(item.tanggal)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                                                                Tanpa detail
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-center">
                                                                1
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(item.total_belanja)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(item.total_ongkir)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                                                                Rp {formatRupiah(item.total_keseluruhan)}
                                                            </td>
                                                        </tr>
                                                    ];
                                                }
                                            });
                                        })()}
                                        
                                        {/* Baris Total */}
                                        <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                                            <td className="px-3 py-2" colSpan={2}>Total</td>
                                            <td className="px-3 py-2 text-center">{totalJumlah}</td>
                                            <td className="px-3 py-2 text-right">Rp {formatRupiah(totalBelanja)}</td>
                                            <td className="px-3 py-2 text-right">Rp {formatRupiah(totalOngkir)}</td>
                                            <td className="px-3 py-2 text-right">Rp {formatRupiah(totalKeseluruhan)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppContent>
        </AppShell>
    );
}
