import { Link, router, usePage } from '@inertiajs/react';
import { ShoppingCart, X, Loader2, Plus, Minus, Trash2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Product as Produk, ProductImage as ProdukGambar } from '@/types';

interface ExtendedProdukGambar extends ProdukGambar {
    path: string;
    url: string;
}

interface CartItem {
    id_keranjang: number;
    produk: {
        produk_id: number;
        nama_produk: string;
        harga: number;
        stok: number;
        gambar: Array<{
            path: string;
            url: string;
        }>;
    };
    jumlah: number;
    subtotal: number;
    harga_satuan: number;
}

interface KeranjangData {
    data: CartItem[];
    total: number;
}

interface PageProps extends InertiaPageProps {
    keranjang?: KeranjangData;
}

interface CartDropdownProps {
    keranjang?: {
        data: CartItem[];
        total: number;
    };
    data: CartItem[];
    total: number;
}

export default function CartDropdown({ keranjang: propKeranjang }: CartDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const pageKeranjang = usePage<PageProps>().props.keranjang;
    const keranjang = propKeranjang || pageKeranjang;
    
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (keranjang?.data) {
            setItems(keranjang.data);
            setTotal(keranjang.data.length);
        } else {
            setItems([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [keranjang]);

    const reloadCart = async () => {
        if (isLoading || isUpdating) return;
        
        try {
            setIsLoading(true);
            
            // Gunakan Inertia untuk me-reload data keranjang tanpa navigasi
            await router.reload({
                only: ['keranjang'],
                onSuccess: (page: any) => {
                    // Type assertion untuk mengatasi masalah tipe
                    const typedPage = page as { props: { keranjang?: KeranjangData } };
                    const keranjang = typedPage.props.keranjang;
                    if (keranjang) {
                        setItems(keranjang.data || []);
                        setTotal(keranjang.total || 0);
                    }
                }
            });
        } catch (error) {
            console.error('Error in reloadCart:', error);
            toast.error('Terjadi kesalahan saat memuat keranjang');
        } finally {
            setIsLoading(false);
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const flash = (window as any).flash;
        if (flash) {
            if (flash.message) {
                toast.success(flash.message);
            }
            if (flash.error) {
                toast.error(flash.error);
            }
        }
    }, []);

    useEffect(() => {
        reloadCart();
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isOpen && !target.closest('.cart-dropdown')) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const updateQuantity = async (id: number, change: number) => {
        try {
            const itemIndex = items.findIndex(i => i.id_keranjang === id);
            if (itemIndex === -1) return;
            
            const item = items[itemIndex];
            const newQuantity = item.jumlah + change;
            
            // Validasi jumlah minimal
            if (newQuantity < 1) return;
            
            // Validasi stok
            if (newQuantity > item.produk.stok) {
                toast.error(`Stok tersisa: ${item.produk.stok}`);
                return;
            }
            
            // Simpan state lama untuk rollback jika diperlukan
            const oldItems = [...items];
            
            // Update UI secara langsung (optimistic update)
            const updatedItems = [...items];
            const updatedItem = {
                ...item,
                jumlah: newQuantity,
                subtotal: newQuantity * item.harga_satuan
            };
            updatedItems[itemIndex] = updatedItem;
            
            // Update state items dan total
            setItems(updatedItems);
            const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Kirim permintaan update ke server
            setIsUpdating(true);
            
            try {
                await router.put(route('pelanggan.keranjang.update', id), {
                    jumlah: newQuantity,
                    _method: 'put'
                }, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        // Tidak perlu update state lagi karena sudah diupdate secara optimistic
                        toast.success('Jumlah produk berhasil diperbarui');
                    },
                    onError: (errors) => {
                        // Rollback ke state sebelumnya jika error
                        setItems(oldItems);
                        const oldTotal = oldItems.reduce((sum, item) => sum + item.subtotal, 0);
                        toast.error(errors.message || 'Gagal memperbarui jumlah produk');
                    }
                });
            } catch (error: any) {
                // Rollback ke state sebelumnya jika terjadi error
                setItems(oldItems);
                const oldTotal = oldItems.reduce((sum, item) => sum + item.subtotal, 0);
                toast.error(error?.response?.data?.message || 'Terjadi kesalahan saat memperbarui keranjang');
            } finally {
                setIsUpdating(false);
            }
        } catch (error) {
            console.error('Error in updateQuantity:', error);
            toast.error('Terjadi kesalahan saat memperbarui keranjang');
        }
    };



    return (
        <div className="relative cart-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                aria-label="Keranjang belanja"
            >
                <ShoppingCart className="h-6 w-6" />
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {total}
                    </span>
                )}
            </button>


            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Keranjang Belanja</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-8 text-center">
                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Keranjang belanja kosong</p>
                            </div>
                        ) : (
                            <>
                                <div className="max-h-96 overflow-y-auto space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id_keranjang} className="flex gap-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={item.produk.gambar[0]?.url || '/images/placeholder-product.jpg'}
                                                    alt={item.produk.nama_produk}
                                                    className="h-16 w-16 rounded object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {item.produk.nama_produk}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0,
                                                    }).format(item.harga_satuan)}
                                                </p>
                                                <div className="flex items-center mt-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id_keranjang, -1)}
                                                        disabled={isUpdating}
                                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="mx-2 text-sm">{item.jumlah}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id_keranjang, 1)}
                                                        disabled={isUpdating || item.jumlah >= item.produk.stok}
                                                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white disabled:opacity-50"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-medium">Total</span>
                                        <span className="font-bold">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(
                                                items.reduce((sum, item) => sum + item.subtotal, 0)
                                            )}
                                        </span>
                                    </div>
                                    <Link
                                        href={route('pelanggan.keranjang.index')}
                                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Lihat Keranjang
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
