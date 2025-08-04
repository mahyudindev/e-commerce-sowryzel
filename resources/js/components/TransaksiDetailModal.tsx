import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatRupiah, formatDate } from '@/lib/utils';

// Re-defining interfaces here for now. Ideally, these would be in a shared types file.
interface ProdukGambar {
    url: string;
}

interface Produk {
    produk_id: number;
    nama_produk: string;
    gambar: ProdukGambar[];
}

interface DetailTransaksi {
    id_detail_transaksi: number;
    produk: Produk;
    jumlah: number;
    harga_satuan: number;
    subtotal: number;
}

export interface Transaksi {
    id_transaksi: number;
    invoice_id: string;
    tanggal_transaksi: string;
    total_keseluruhan: number;
    status_pembayaran: 'unpaid' | 'paid' | 'failed' | 'expired';
    status_transaksi: 'pending' | 'dikemas' | 'dikirim' | 'selesai' | 'batal';
    nomor_resi?: string | null;
    metode_pembayaran: string | null;
    detail_transaksi: DetailTransaksi[];
    snap_token?: string | null;
    snap_redirect_url?: string | null;
}

interface TransaksiDetailModalProps {
    transaksi: Transaksi | null;
    isOpen: boolean;
    onClose: () => void;
}

// Simplified status badge for modal, or import from index if refactored
const ModalTransaksiStatusBadge: React.FC<{ statusPembayaran: Transaksi['status_pembayaran']; statusTransaksi: Transaksi['status_transaksi'] }> = ({ statusPembayaran, statusTransaksi }) => {
    if (statusTransaksi === 'batal') {
        return <Badge variant="destructive" className="text-xs px-2 py-0.5">Dibatalkan</Badge>;
    }
    if (statusPembayaran === 'unpaid' && statusTransaksi === 'pending') {
        return <Badge variant="destructive" className="text-xs px-2 py-0.5">Menunggu Pembayaran</Badge>;
    }
    if (statusPembayaran === 'paid') {
        if (statusTransaksi === 'pending') {
            return <Badge variant="secondary" className="text-xs px-2 py-0.5">Menunggu Diproses</Badge>;
        }
        if (statusTransaksi === 'dikemas') {
            return <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-yellow-500 text-white hover:bg-yellow-600">Pesanan Dikemas</Badge>;
        }
        if (statusTransaksi === 'dikirim') {
            return <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-500 text-white hover:bg-blue-600">Pesanan Dikirim</Badge>;
        }
        if (statusTransaksi === 'selesai') {
            return <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500 hover:bg-green-600">Selesai</Badge>;
        }
    }
    if (statusPembayaran === 'failed') {
        return <Badge variant="destructive" className="text-xs px-2 py-0.5">Pembayaran Gagal</Badge>;
    }
    if (statusPembayaran === 'expired') {
        return <Badge variant="destructive" className="text-xs px-2 py-0.5">Pembayaran Kadaluarsa</Badge>;
    }
    return <Badge className="text-xs px-2 py-0.5">{statusPembayaran} - {statusTransaksi}</Badge>;
};

export default function TransaksiDetailModal({ transaksi, isOpen, onClose }: TransaksiDetailModalProps) {
    if (!transaksi) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
            <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="pt-6 px-6">
                    <DialogTitle className="text-2xl">Detail Transaksi</DialogTitle>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{transaksi.invoice_id}</span>
                        <span>{formatDate(transaksi.tanggal_transaksi)}</span>
                    </div>
                </DialogHeader>
                
                <div className="px-6 py-2 flex-grow overflow-y-auto space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium">Status</h4>
                        <ModalTransaksiStatusBadge statusPembayaran={transaksi.status_pembayaran} statusTransaksi={transaksi.status_transaksi} />
                    </div>
                    
                    {transaksi.metode_pembayaran && (
                        <div className="space-y-1">
                             <h4 className="text-sm font-medium">Metode Pembayaran</h4>
                             <p className="text-sm text-muted-foreground">{transaksi.metode_pembayaran}</p>
                        </div>
                    )}

                    {transaksi.nomor_resi && (transaksi.status_transaksi === 'dikirim' || transaksi.status_transaksi === 'selesai') && (
                        <div className="space-y-1">
                                <h4 className="text-sm font-medium">Nomor Resi Pengiriman</h4>
                                <p className="text-sm text-muted-foreground font-semibold">{transaksi.nomor_resi}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-medium mb-2">Item Dibeli</h4>
                        <div className="space-y-3">
                            {transaksi.detail_transaksi.map((item) => (
                                <div key={item.id_detail_transaksi} className="flex items-start space-x-3 p-3 border rounded-md bg-muted/20">
                                    <img 
                                        src={item.produk.gambar?.[0]?.url || 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=Produk'}
                                        alt={item.produk.nama_produk} 
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded object-cover border"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; 
                                            target.src = 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=Produk';
                                        }}
                                    />
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-foreground leading-tight">{item.produk.nama_produk}</p>
                                        <p className="text-xs text-muted-foreground">{item.jumlah} x {formatRupiah(item.harga_satuan)}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">{formatRupiah(item.subtotal)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex justify-between items-center">
                        <p className="text-base font-medium text-foreground">Total Keseluruhan</p>
                        <p className="text-xl font-bold text-primary">{formatRupiah(transaksi.total_keseluruhan)}</p>
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6 pt-2 sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
