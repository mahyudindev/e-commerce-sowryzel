import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Package, Clock, CheckCircle, MoreVertical } from 'lucide-react';
import { Head, usePage, Link } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import { AppShell } from '@/components/app-shell';
import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';

interface DashboardData {
    totalPendapatan: number;
    totalPendapatanDenganOngkir: number;
    totalTransaksi: number;
    totalBarang: number;
    transaksiPending: number;
    transaksiSukses: number;
    pendapatanPerBulan: Array<{
        name: string;
        Pendapatan: number;
    }>;
    recentTransactions: Array<{
        id: number;
        invoice: string;
        customer: string;
        date: string;
        amount: string;
        status: string;
    }>;
    persentasePendapatan: string;
    persentaseTransaksi: string;
    persentaseBarang: string;
    persentasePending: string;
    persentaseSukses: string;
}

interface PageProps {
    dashboardData?: DashboardData;
}

// === HELPER COMPONENTS ===
type StatusType = 'Sukses' | 'Pending' | 'Gagal' | string;

const StatusBadge = ({ status }: { status: StatusType }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case 'Sukses':
            return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>Sukses</span>;
        case 'Pending':
            return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}>Pending</span>;
        case 'Gagal':
            return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>Gagal</span>;
        default:
            return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
};


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'E-Commerce Dashboard',
        href: '/admin/dashboard',
    },
];

export default function ECommerceDashboard() {
    const { dashboardData: propsDashboardData } = usePage<{props: PageProps}>().props;
    
    const defaultData: DashboardData = {
        totalPendapatan: 0,
        totalPendapatanDenganOngkir: 0,
        totalTransaksi: 0,
        totalBarang: 0,
        transaksiPending: 0,
        transaksiSukses: 0,
        pendapatanPerBulan: [],
        recentTransactions: [],
        persentasePendapatan: '0%',
        persentaseTransaksi: '0%',
        persentaseBarang: '0%',
        persentasePending: '0%',
        persentaseSukses: '0%'
    };
    
    const dashboardData: DashboardData = propsDashboardData ? propsDashboardData as unknown as DashboardData : defaultData;
    
    console.log('Dashboard Data from backend:', dashboardData);
    
    const summaryData = [
        {
            icon: DollarSign,
            title: 'Pendapatan (tanpa ongkir)',
            value: `Rp ${new Intl.NumberFormat('id-ID').format(dashboardData.totalPendapatan || 0)}`,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-500/10',
            href: null,
        },
        {
            icon: DollarSign,
            title: 'Pendapatan + Ongkir',
            value: `Rp ${new Intl.NumberFormat('id-ID').format(dashboardData.totalPendapatanDenganOngkir || 0)}`,
            iconColor: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            href: null,
        },
        {
            icon: ShoppingBag,
            title: 'Total Transaksi',
            value: new Intl.NumberFormat('id-ID').format(dashboardData.totalTransaksi || 0),
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            href: '/admin/transaksi',
        },
        {
            icon: Package,
            title: 'Total Produk',
            value: new Intl.NumberFormat('id-ID').format(dashboardData.totalBarang || 0),
            iconColor: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10',
            href: '/admin/produk',
        },
        {
            icon: Clock,
            title: 'Transaksi Pending',
            value: new Intl.NumberFormat('id-ID').format(dashboardData.transaksiPending || 0),
            iconColor: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            href: '/admin/transaksi?status_transaksi=pending',
        },
        {
            icon: CheckCircle,
            title: 'Transaksi Sukses',
            value: new Intl.NumberFormat('id-ID').format(dashboardData.transaksiSukses || 0),
            iconColor: 'text-green-500',
            bgColor: 'bg-green-500/10',
            href: '/admin/transaksi?status_transaksi=selesai',
        },
    ];
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <Head title="E-Commerce Dashboard" />
                <div className="flex h-full w-full flex-1 flex-col gap-6 bg-gray-50/50 p-4 font-sans sm:p-6 lg:p-8 dark:bg-gray-900/90">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-commerce Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1 sm:mt-0">Selamat datang kembali, Admin!</p>
                    </div>

                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3">
                {summaryData.slice(0, 3).map((item, index) => {
                    // Wrapper component - Card akan menjadi link jika item.href tidak null
                    const CardWrapper = ({ children }: { children: React.ReactNode }) => {
                        return item.href ? (
                            <Link href={item.href} className="cursor-pointer">
                                {children}
                            </Link>
                        ) : (
                            <>{children}</>
                        );
                    };
                    
                    return (
                        <CardWrapper key={index}>
                            <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${item.href ? 'hover:-translate-y-1 hover:cursor-pointer' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className={`rounded-lg p-3 ${item.bgColor}`}>
                                        <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                                    </div>
                                    {item.href && (
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Klik untuk detail</span>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                                </div>

                            </div>
                        </CardWrapper>
                    );
                })}
                    </div>

                    {/* Second row of summary cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3">
                {summaryData.slice(3).map((item, index) => {
                    // Wrapper component - Card akan menjadi link jika item.href tidak null
                    const CardWrapper = ({ children }: { children: React.ReactNode }) => {
                        return item.href ? (
                            <Link href={item.href} className="cursor-pointer">
                                {children}
                            </Link>
                        ) : (
                            <>{children}</>
                        );
                    };
                    
                    return (
                        <CardWrapper key={index + 3}>
                            <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${item.href ? 'hover:-translate-y-1 hover:cursor-pointer' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className={`rounded-lg p-3 ${item.bgColor}`}>
                                        <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                                    </div>
                                    {item.href && (
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Klik untuk detail</span>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                                </div>

                            </div>
                        </CardWrapper>
                    );
                })}
                    </div>

                    {/* Main Content Area: Chart and Recent Transactions */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Revenue Chart */}
                        <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Grafik Pendapatan</h2>
                            <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={(dashboardData as DashboardData).pendapatanPerBulan || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value)/1000)}k`}/>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(31, 41, 55, 0.8)', // bg-gray-800 with opacity
                                        borderColor: '#374151',
                                        borderRadius: '0.75rem',
                                        color: '#f9fafb',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                    labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                                    formatter={(value, name) => [`Rp ${new Intl.NumberFormat('id-ID').format(Number(value))}`, name]}
                                />
                                <Area type="monotone" dataKey="Pendapatan" stroke="#8884d8" fillOpacity={1} fill="url(#colorPendapatan)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Transaksi Terkini</h2>
                            <div className="flow-root">
                                <ul role="list" className="-my-4 divide-y divide-gray-200 dark:divide-gray-700">
                                    {((dashboardData as DashboardData).recentTransactions || []).map((transaction: any) => (
                                        <li key={transaction.id} className="flex items-center space-x-4 py-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{transaction.customer}</p>
                                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">{transaction.invoice} - {transaction.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900 dark:text-white">{transaction.amount}</p>
                                                <StatusBadge status={transaction.status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </AppContent>
        </AppShell>
    );
}
