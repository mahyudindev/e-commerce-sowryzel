import AppShell from '@/layouts/AppShell';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User } from '@/types/index';
import { formatRupiah, formatDate } from '@/lib/utils';
import type { Transaksi } from '@/types/transaksi';

interface TransaksiIndexPageProps {
    transaksis: Transaksi[];
    activeTab: string;
    auth: { user: User | null };
}

const TransaksiStatusBadge: React.FC<{ statusPembayaran: Transaksi['status_pembayaran']; statusTransaksi: Transaksi['status_transaksi'] }> = ({ statusPembayaran, statusTransaksi }) => {
    if (statusPembayaran === 'paid') {
        if (statusTransaksi === 'pending') {
            return <Badge variant="secondary">Menunggu Diproses</Badge>;
        }
        if (statusTransaksi === 'dikemas') {
            return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pesanan Dikemas</Badge>;
        }
        if (statusTransaksi === 'dikirim') {
            return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Pesanan Dikirim</Badge>;
        }
        if (statusTransaksi === 'selesai') {
            return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Selesai</Badge>;
        }
    }
    if (statusPembayaran === 'failed') {
        return <Badge variant="destructive">Pembayaran Gagal</Badge>;
    }
    if (statusPembayaran === 'expired') {
        // Typically, an expired payment would also mean the transaction is cancelled/batal.
        // If it's expired but somehow not 'batal', this badge will show.
        return <Badge variant="destructive">Pembayaran Kadaluarsa</Badge>;
    }
    // Fallback for any unhandled combination
    return <Badge>{statusPembayaran} - {statusTransaksi}</Badge>;
};

import TransaksiDetailModal from '@/components/TransaksiDetailModal';
import KonfirmasiPesananDiterimaModal from '@/components/KonfirmasiPesananDiterimaModal';
import UlasanModal from '@/components/UlasanModal';

// Define window.snap for TypeScript
declare global {
    interface Window {
        snap: any; // You can define a more specific type if available from Midtrans
    }
}

export default function TransaksiIndexPage({ transaksis: initialTransaksis, activeTab: initialActiveTab, auth }: TransaksiIndexPageProps) {
    // Get Midtrans client key from environment
    const midtransClientKey = "SB-Mid-client-D1Ib_Yxs0Tdh-Xzy";
    
    // Load Midtrans script dynamically
    useEffect(() => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute('data-client-key', midtransClientKey);
            document.body.appendChild(script);
        }
    }, []);
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [transaksiToConfirm, setTransaksiToConfirm] = useState<Transaksi | null>(null);
    const [isUlasanModalOpen, setIsUlasanModalOpen] = useState(false);
    const [transaksiToReview, setTransaksiToReview] = useState<Transaksi | null>(null);

    const openModal = (transaksi: Transaksi) => {
        setSelectedTransaksi(transaksi);
        setIsModalOpen(true);
    };

    const openConfirmModal = (transaksi: Transaksi) => {
        console.log('Opening confirm modal for transaksi:', transaksi);
        console.log('ID Transaksi being set to state:', transaksi.id_transaksi);
        setTransaksiToConfirm(transaksi);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setTransaksiToConfirm(null);
    };

    const openUlasanModal = (transaksi: Transaksi) => {
        setTransaksiToReview(transaksi);
        setIsUlasanModalOpen(true);
    };

    const closeUlasanModal = () => {
        setIsUlasanModalOpen(false);
        setTransaksiToReview(null);
    };

    const processPesananDiterima = () => {
        if (!transaksiToConfirm) {
            console.error('transaksiToConfirm is null in processPesananDiterima. This should not happen.');
            return;
        }

        console.log('Full transaksiToConfirm object in processPesananDiterima:', transaksiToConfirm);
        console.log('Processing pesanan diterima for transaksi ID:', transaksiToConfirm.id_transaksi);
        
        const transaksiId = transaksiToConfirm.id_transaksi;
        if (transaksiId === null || transaksiId === undefined) {
            console.error('Transaksi ID is null or undefined. Aborting POST request.');
            alert('Terjadi kesalahan: ID Transaksi tidak valid. Silakan coba lagi atau hubungi dukungan.');
            return;
        }

        const routeParameters = [transaksiId];
        console.log('Parameters being passed to Ziggy route:', routeParameters);

        router.post(route('pelanggan.transaksi.terima', routeParameters), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Notifikasi sukses bisa ditangani oleh flash message dari Laravel
                closeConfirmModal();
            },
            onError: (errors) => {
                console.error('Error updating status:', errors);
                const errorMessages = Object.values(errors).join('\n');
                alert(`Gagal memperbarui status pesanan: ${errorMessages}. Silakan coba lagi.`);
                closeConfirmModal(); // Tutup modal juga jika error
            }
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTransaksi(null);
    };

    const filteredTransaksis = useMemo(() => {
        switch (activeTab) {
            case 'proses':
                return initialTransaksis.filter(t => t.status_pembayaran === 'paid' && (t.status_transaksi === 'pending' || t.status_transaksi === 'dikemas'));
            case 'dikirim':
                return initialTransaksis.filter(t => t.status_transaksi === 'dikirim');
            case 'selesai':
                return initialTransaksis.filter(t => t.status_transaksi === 'selesai');
            case 'semua':
            default:
                return initialTransaksis;
        }
    }, [activeTab, initialTransaksis]);

    const tabs = [
        { key: 'semua', label: 'Semua' },
        { key: 'proses', label: 'Diproses' },
        { key: 'dikirim', label: 'Dikirim' },
        { key: 'selesai', label: 'Selesai' },
    ];

    return (
        <AppShell user={auth.user}>
            <Head title="Daftar Transaksi">
            </Head>
            <div className="container mx-auto pt-0 pb-8 px-4 sm:px-6 lg:px-8 ">
                {/* <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Daftar Transaksi Saya</h1> */}

                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                                    ${activeTab === tab.key 
                                        ? 'border-primary text-primary dark:border-primary dark:text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {filteredTransaksis.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Tidak ada transaksi</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Belum ada transaksi yang sesuai dengan filter ini.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredTransaksis.map((transaksi) => (
                            <div key={transaksi.id_transaksi} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-primary">{transaksi.invoice_id}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal: {formatDate(transaksi.tanggal_transaksi)}</p>
                                        </div>
                                        <TransaksiStatusBadge statusPembayaran={transaksi.status_pembayaran} statusTransaksi={transaksi.status_transaksi} />
                                    </div>

                                    {transaksi.detail_transaksi.map((item) => (
                                        <div key={item.id_detail_transaksi} className="flex items-center space-x-4 py-3 border-t border-gray-100 dark:border-gray-700 first:border-t-0">
                                            <img 
                                                src={item.produk.gambar?.[0]?.url || 'https://placehold.co/100x100/e2e8f0/e2e8f0?text=Produk'} 
                                                alt={item.produk.nama_produk} 
                                                className="w-16 h-16 rounded object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null; 
                                                    target.src = 'https://placehold.co/100x100/e2e8f0/e2e8f0?text=Produk';
                                                }}
                                            />
                                            <div className="flex-grow">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{item.produk.nama_produk}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.jumlah} x {formatRupiah(item.harga_satuan)}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatRupiah(item.subtotal)}</p>
                                        </div>
                                    ))}
                                    
                                    <Separator className="my-4" />

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Metode Pembayaran: <span className="font-medium text-gray-800 dark:text-white">{transaksi.metode_pembayaran || '-'}</span></p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">Total: {formatRupiah(transaksi.total_keseluruhan)}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {transaksi.status_pembayaran === 'unpaid' && transaksi.snap_redirect_url && (
                                                <Button asChild variant="default" size="sm">
                                                    <a href={transaksi.snap_redirect_url} target="_blank" rel="noopener noreferrer">Bayar Sekarang</a>
                                                </Button>
                                            )}
                                            {(transaksi.status_pembayaran === 'unpaid' && !transaksi.snap_redirect_url) && (
                                                <Button 
                                                    variant="default" 
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={async () => {
                                                        try {
                                                            // Use direct URL instead of route helper
                                                            const url = `/pelanggan/transaksi/${transaksi.id_transaksi}/retry-payment`;
                                                            
                                                            // Get CSRF token
                                                            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                                                            
                                                            // Make POST request to get snap token
                                                            const response = await fetch(url, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'X-CSRF-TOKEN': csrfToken || '',
                                                                },
                                                            });
                                                            
                                                            const data = await response.json();
                                                            
                                                            if (data.success && data.snap_token) {
                                                                // Open Midtrans Snap modal
                                                                (window as any).snap.pay(data.snap_token, {
                                                                    onSuccess: function(result: any) {
                                                                        window.location.reload();
                                                                    },
                                                                    onPending: function(result: any) {
                                                                        window.location.reload();
                                                                    },
                                                                    onError: function(result: any) {
                                                                        alert('Pembayaran gagal: ' + result.status_message);
                                                                    },
                                                                    onClose: function() {
                                                                        alert('Anda menutup popup tanpa menyelesaikan pembayaran');
                                                                    }
                                                                });
                                                            } else {
                                                                alert('Gagal mendapatkan token pembayaran');
                                                            }
                                                        } catch (error) {
                                                            console.error('Error:', error);
                                                            alert('Terjadi kesalahan saat memproses pembayaran');
                                                        }
                                                    }}
                                                >
                                                    Bayar Ulang
                                                </Button>
                                            )}
                                        <Button variant="outline" size="sm" onClick={() => openModal(transaksi)}>
                                            Detail Transaksi
                                        </Button>
                                        {transaksi.status_transaksi === 'dikirim' && (
                                            <Button variant="default" size="sm" onClick={() => openConfirmModal(transaksi)} className="bg-green-600 hover:bg-green-700 text-white">
                                                Pesanan Diterima
                                            </Button>
                                        )}
                                        {transaksi.status_transaksi === 'selesai' && (
                                            <Button 
                                                variant="default" 
                                                size="sm" 
                                                onClick={() => openUlasanModal(transaksi)} 
                                                className={`${transaksi.detail_transaksi.some(item => item.ulasan_exists) ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                            >
                                                {transaksi.detail_transaksi.some(item => item.ulasan_exists) ? 'Lihat Penilaian Anda' : 'Beri Ulasan'}
                                            </Button>
                                        )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedTransaksi && (
                <TransaksiDetailModal
                    transaksi={selectedTransaksi}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            )}
            {transaksiToConfirm && (
                <KonfirmasiPesananDiterimaModal
                    isOpen={isConfirmModalOpen}
                    onClose={closeConfirmModal}
                    onConfirm={processPesananDiterima}
                    invoiceId={transaksiToConfirm.invoice_id}
                />
            )}
            {transaksiToReview && (
                <UlasanModal
                    isOpen={isUlasanModalOpen}
                    onClose={closeUlasanModal}
                    transaksi={transaksiToReview}
                />
            )}
        </AppShell>
    );
}
