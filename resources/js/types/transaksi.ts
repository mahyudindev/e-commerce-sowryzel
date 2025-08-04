export interface ProdukGambar {
    url: string;
}

export interface Produk {
    produk_id: number;
    nama_produk: string;
    gambar: ProdukGambar[];
}

export interface Ulasan {
    rating: number;
    komentar: string;
    created_at: string;
}

export interface DetailTransaksi {
    id_detail_transaksi: number;
    produk: Produk;
    jumlah: number;
    harga_satuan: number;
    subtotal: number;
    ulasan_exists?: boolean;
    ulasan?: Ulasan;
}

export interface Transaksi {
    id_transaksi: number;
    transaksi_id: number; // Adding this field to match the database column name
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
