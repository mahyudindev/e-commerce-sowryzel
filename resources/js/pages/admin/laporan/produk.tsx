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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
// Chart functionality removed

interface ProdukTerlaku {
    produk_id: number;
    nama_produk: string;
    harga: number;
    total_terjual: number;
    total_pendapatan: number;
}

interface Summary {
    total_produk: number;
    total_terjual: number;
    total_pendapatan: number;
}

interface PageProps {
    produk_terlaku: ProdukTerlaku[];
    summary: Summary;
    filter: {
        date_start: string;
        date_end: string;
    };
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
        title: 'Produk',
        href: '/admin/laporan/produk',
    },
];

export default function LaporanProduk({ produk_terlaku, summary, filter }: PageProps) {
    const [dateStart, setDateStart] = useState<Date | undefined>(
        filter.date_start ? new Date(filter.date_start) : undefined
    );
    const [dateEnd, setDateEnd] = useState<Date | undefined>(
        filter.date_end ? new Date(filter.date_end) : undefined
    );

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/laporan/produk', { 
            date_start: dateStart ? format(dateStart, 'yyyy-MM-dd') : '', 
            date_end: dateEnd ? format(dateEnd, 'yyyy-MM-dd') : '' 
        });
    };

    const handleDownloadPDF = () => {
        const date_start = dateStart ? format(dateStart, 'yyyy-MM-dd') : '';
        const date_end = dateEnd ? format(dateEnd, 'yyyy-MM-dd') : '';
        window.open(`/admin/laporan/produk/pdf?date_start=${date_start}&date_end=${date_end}`, '_blank');
    };

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID').format(angka);
    };

    // No chart data needed

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="Laporan Produk" />
                <div className="flex h-full w-full flex-1 flex-col gap-6 bg-gray-50/50 p-4 font-sans sm:p-6 lg:p-8 dark:bg-gray-900/90">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Produk Terlaris</h1>
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Total Produk Terjual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.total_produk} produk</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Total Kuantitas Terjual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.total_terjual} item</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Total Pendapatan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">Rp {formatRupiah(summary.total_pendapatan)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart removed */}

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Produk Terjual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Produk
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Harga
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Total Terjual
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Total Pendapatan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                        {produk_terlaku.map((item) => (
                                            <tr key={item.produk_id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link href={`/admin/produk/${item.produk_id}`} className="text-blue-500 hover:underline">
                                                        {item.nama_produk}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(item.harga)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {item.total_terjual} item
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(item.total_pendapatan)}
                                                </td>
                                            </tr>
                                        ))}
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
