import React, { useState, FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppContent } from '@/components/app-content';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FileDown } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataItem {
    month?: number;
    month_name?: string;
    date?: string;
    day?: number;
    pendapatan: number;
    pendapatan_dengan_ongkir: number;
}

interface Summary {
    total_pendapatan: number;
    total_pendapatan_dengan_ongkir: number;
}

interface PageProps {
    data: DataItem[];
    labels: string[];
    summary: Summary;
    filter: {
        period: 'daily' | 'monthly';
        year: number;
        month?: number;
        month_name?: string;
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
        title: 'Pendapatan',
        href: '/admin/laporan/pendapatan',
    },
];

export default function LaporanPendapatan({ data, labels, summary, filter }: PageProps) {
    const [period, setPeriod] = useState<'daily' | 'monthly'>(filter.period);
    const [year, setYear] = useState(filter.year.toString());
    const [month, setMonth] = useState(filter.month ? filter.month.toString() : '1');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' }
    ];

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/laporan/pendapatan', { 
            period, 
            year,
            ...(period === 'daily' ? { month } : {})
        });
    };

    const handleDownloadPDF = () => {
        window.open(`/admin/laporan/pendapatan/pdf?period=${period}&year=${year}${period === 'daily' ? `&month=${month}` : ''}`, '_blank');
    };

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID').format(angka);
    };

    // Prepare chart data
    const chartData = data.map((item) => ({
        name: period === 'daily' ? `Hari ${item.day}` : item.month_name,
        'Pendapatan': item.pendapatan,
        'Dengan Ongkir': item.pendapatan_dengan_ongkir,
    }));

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="Laporan Pendapatan" />
                <div className="flex h-full w-full flex-1 flex-col gap-6 bg-gray-50/50 p-4 font-sans sm:p-6 lg:p-8 dark:bg-gray-900/90">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Pendapatan</h1>
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
                            <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col gap-2 flex-1">
                                    <Label htmlFor="period">Periode</Label>
                                    <Select value={period} onValueChange={(value: 'daily' | 'monthly') => setPeriod(value)}>
                                        <SelectTrigger id="period">
                                            <SelectValue placeholder="Pilih periode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Harian</SelectItem>
                                            <SelectItem value="monthly">Bulanan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="flex flex-col gap-2 flex-1">
                                    <Label htmlFor="year">Tahun</Label>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger id="year">
                                            <SelectValue placeholder="Pilih tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {period === 'daily' && (
                                    <div className="flex flex-col gap-2 flex-1">
                                        <Label htmlFor="month">Bulan</Label>
                                        <Select value={month} onValueChange={setMonth}>
                                            <SelectTrigger id="month">
                                                <SelectValue placeholder="Pilih bulan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                <div className="flex items-end">
                                    <Button type="submit">Terapkan Filter</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Total Pendapatan (tanpa ongkir)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">Rp {formatRupiah(summary.total_pendapatan)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Total Pendapatan (dengan ongkir)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">Rp {formatRupiah(summary.total_pendapatan_dengan_ongkir)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Grafik Pendapatan {period === 'daily' 
                                    ? `Harian - ${filter.month_name} ${filter.year}` 
                                    : `Bulanan - Tahun ${filter.year}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 70
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45} 
                                            textAnchor="end"
                                            interval={0}
                                            height={70}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `Rp ${(value/1000).toLocaleString('id-ID')}k`}
                                        />
                                        <Tooltip 
                                            formatter={(value: any) => [`Rp ${formatRupiah(value)}`, 'Pendapatan']}
                                            contentStyle={{
                                                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                                borderColor: '#374151',
                                                borderRadius: '0.75rem',
                                                color: '#f9fafb',
                                            }}
                                            labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="Pendapatan" fill="#8884d8" name="Pendapatan (tanpa ongkir)" />
                                        <Bar dataKey="Dengan Ongkir" fill="#82ca9d" name="Pendapatan (dengan ongkir)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Pendapatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                {period === 'daily' ? 'Tanggal' : 'Bulan'}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Pendapatan (tanpa ongkir)
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                                Pendapatan (dengan ongkir)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                        {data.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {period === 'daily' 
                                                        ? `${item.day} ${filter.month_name} ${filter.year}`
                                                        : item.month_name
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(item.pendapatan)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(item.pendapatan_dengan_ongkir)}
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
