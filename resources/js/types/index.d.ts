export * from './product';
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { Page as InertiaPage } from '@inertiajs/core';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badgeCount?: number;
    badgeBlinking?: boolean;
}

// Extend the Inertia Page type with our custom page props
declare module '@inertiajs/core' {
    interface PageProps {
        [key: string]: unknown;
    }
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    pendingTransaksiCount?: number; // Count of pending transactions
    [key: string]: unknown;
}

export interface User {
    user_id: number;
    email: string;
    role: 'pelanggan' | 'admin';
    is_active: boolean;
    last_login: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    avatar?: string;
    pelanggan?: Pelanggan;
    admin?: Admin;
    nama?: string;
}

export interface Pelanggan {
    pelanggan_id: number;
    user_id: number;
    nama_lengkap: string;
    no_telepon: string;
    foto_profil?: string;
    alamat: string;
    tipe_alamat: 'Rumah' | 'Kantor' | 'Kos';
    kota?: string;
    kode_pos?: string;
    created_at: string;
    updated_at: string;
}

export interface Admin {
    admin_id: number;
    user_id: number;
    nama_lengkap: string;
    no_telepon: string;
    jabatan: 'admin' | 'owner';
    deskripsi_jabatan?: string;
    created_at: string;
    updated_at: string;
}

export interface Produk {
    produk_id: number;
    kode_produk: string;
    nama_produk: string;
    deskripsi?: string;
    harga: number;
    berat: number;
    kategori?: string;
    stok: number;
    aktif: boolean;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ProdukGambar {
    gambar_id: number;
    produk_id: number;
    nama_file: string;
    url: string;
    ukuran: number;
    urutan: number;
    is_thumbnail: boolean;
    created_at: string;
    updated_at: string;
}
