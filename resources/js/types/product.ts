export interface ProductImage {
    gambar_id: number;
    produk_id: number;
    nama_file: string;
    path: string;
    url: string;
    is_thumbnail: boolean;
    urutan: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedProducts {
  data: Product[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface Ulasan {
    ulasan_id: number;
    rating: number;
    komentar: string | null;
    nama_pengguna_samaran: string;
    created_at: string;
}

export interface Product {
    produk_id: number;
    kode_produk: string;
    nama_produk: string;
    deskripsi: string;
    harga: number;
    harga_asli?: number; // Original price for showing discounts
    stok: number;
    berat: number;
    kategori: string;
    status_aktif: boolean;
    terjual?: number;
    ulasan?: Ulasan[]; // Number of items sold
    created_at: string;
    updated_at: string;
    gambar: ProductImage[];
    rating: number;
    ulasan_count: number;
}

export interface ProductFilters {
    search?: string;
    page?: number;
}

export interface PageProps {
    products: PaginatedProducts;
    filters: ProductFilters;
    [key: string]: any;
}
