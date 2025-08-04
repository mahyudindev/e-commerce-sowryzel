export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface AlamatPelangganSimple {
  id_alamat_pelanggan?: number; // Optional, might not always be present
  nama_penerima: string;
  nomor_telepon: string;
  alamat_lengkap: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kode_pos: string;
  label_alamat?: string | null;
  catatan_kurir?: string | null;
  is_utama?: boolean;
}

export interface ProdukSimple {
  produk_id: number;
  nama_produk: string;
  kode_produk: string;
  // Add other simple product fields if needed, e.g., thumbnail URL
  gambar_thumbnail?: string | null;
}

export interface DetailTransaksi {
  id_detail_transaksi: number;
  transaksi_id: number;
  produk_id: number;
  jumlah: number;
  harga_satuan: number; // Harga satuan saat transaksi
  subtotal: number;
  // produk?: ProdukSimple; // Can be included here or in a more specific type like DetailTransaksiAdmin
}

// You can add other globally used types here, for example:
// export type UserRole = 'admin' | 'pelanggan';

// Interface for paginated responses (generic)
export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}
