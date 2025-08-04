import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Minus, Trash2, ShoppingCart, Check, X, Heart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import AppTopbarLayout from '@/layouts/app-topbar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatRupiah } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PageProps {
    keranjang: any[];
    total: number;
    removeMultipleFromCart?: (ids: number[]) => void;
}

interface CartItem {
    id_keranjang: number;
    produk: {
        id: number;
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
}

interface CartPageProps extends PageProps {
    keranjang: CartItem[];
    total: number;
}

export default function Keranjang({ keranjang: initialKeranjang = [], total: initialTotal = 0, removeMultipleFromCart }: CartPageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [items, setItems] = useState<CartItem[]>(initialKeranjang || []);
    const [total, setTotal] = useState<number>(initialTotal || 0);
    
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<number[]>([]);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    
    const selectedSubtotal = items
        .filter(item => selectedItems.includes(item.id_keranjang))
        .reduce((sum, item) => sum + item.subtotal, 0);
        
    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            toast.error('Pilih setidaknya satu produk untuk checkout');
            return;
        }
        router.visit(route('checkout'), {
            data: { items: selectedItems },
            method: 'get',
        });
    };
    
    const confirmDelete = async () => {
        if (itemsToDelete.length === 0) {
            setShowDeleteModal(false);
            return;
        }
        
        setIsRemoving(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) throw new Error('CSRF token not found');
            
            const response = await fetch(route('pelanggan.keranjang.destroy-multiple'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Inertia': 'true',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    _method: 'DELETE',
                    items: itemsToDelete
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.message || 'Gagal menghapus produk dari keranjang');
            }
            
            const updatedItems = items.filter(item => !itemsToDelete.includes(item.id_keranjang));
            setItems(updatedItems);
            
            const newSelectedItems = selectedItems.filter(id => !itemsToDelete.includes(id));
            setSelectedItems(newSelectedItems);
            
            const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
            setTotal(newTotal);
            
            toast.success(`${itemsToDelete.length} produk berhasil dihapus dari keranjang`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus produk';
            toast.error(errorMessage);
            console.error('Error deleting items:', error);
            
            router.reload({ only: ['keranjang', 'total'] });
            
        } finally {
            setItemsToDelete([]);
            setShowDeleteModal(false);
            setIsRemoving(false);
            setIsBulkDelete(false);
        }
    };

    const handleRemoveMultiple = () => {
        if (selectedItems.length === 0) {
            toast.error('Pilih setidaknya satu produk untuk dihapus');
            return;
        }
        setItemsToDelete(selectedItems);
        setIsBulkDelete(true);
        setShowDeleteModal(true);
    };

    const toggleSelectItem = (id: number) => {
        setSelectedItems(prev => 
            prev.includes(id) 
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    };

    const updateQuantity = async (id: number, change: number) => {
        try {
            setIsUpdating(true);
            
            const itemIndex = items.findIndex(i => i.id_keranjang === id);
            if (itemIndex === -1) return;
            
            const item = items[itemIndex];
            const newQuantity = item.jumlah + change;
            
            if (newQuantity < 1) return;
            
            if (newQuantity > item.produk.stok) {
                toast.error(`Stok tersisa: ${item.produk.stok}`);
                return;
            }
            
            const updatedItems = [...items];
            const updatedItem = {
                ...item,
                jumlah: newQuantity,
                subtotal: newQuantity * item.produk.harga
            };
            updatedItems[itemIndex] = updatedItem;
            setItems(updatedItems);
            
            const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
            setTotal(newTotal);
            
            await router.put(route('pelanggan.keranjang.update', id), {
                jumlah: newQuantity,
                _method: 'put'
            }, {
                preserveScroll: true,
                preserveState: true,
                onError: (errors) => {
                    setItems([...items]);
                    setTotal(initialTotal);
                    
                    if (errors.stok) {
                        toast.error(errors.stok);
                    } else {
                        toast.error('Gagal memperbarui keranjang');
                    }
                }
            });
            
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error('Terjadi kesalahan saat memperbarui keranjang');
            
            setItems([...items]);
            setTotal(initialTotal);
        } finally {
            setIsUpdating(false);
        }
    };
    
    useEffect(() => {
        if (items.length > 0) {
            setSelectAll(selectedItems.length === items.length);
        } else {
            setSelectAll(false);
        }
    }, [selectedItems, items]);

    useEffect(() => {
        if (items.length === 0) {
            setSelectAll(false);
            setSelectedItems([]);
        }
    }, [items]);

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map(item => item.id_keranjang));
        }
    };

    // Hapus satu item
    const removeFromCart = (id: number) => {
        setItemsToDelete([id]);
        setIsBulkDelete(false);
        setShowDeleteModal(true);
    };

    if (isUpdating) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-center">Memperbarui keranjang...</p>
                </div>
            </div>
        );
    }

    return (
        <AppTopbarLayout 
            breadcrumbs={[
                { title: 'Beranda', href: route('pelanggan.dashboard') },
                { title: 'Keranjang', href: route('pelanggan.keranjang.index') }
            ]}
            onRemoveMultiple={handleRemoveMultiple}
            backHref={route('pelanggan.dashboard')}
        >
            <Head title="Keranjang Belanja" />
            
            {/* Loading Overlay */}
            {isUpdating && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="mt-2 text-center">Memperbarui keranjang...</p>
                    </div>
                </div>
            )}
            
            <div className="container mx-auto px-4 py-8">
                {items.length === 0 ? (
                    <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Keranjang belanja kosong</h3>
                        <p className="mt-1 text-gray-500">Tambahkan beberapa produk ke keranjang Anda</p>
                        <Link 
                            href={route('welcome')}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Mulai Berbelanja
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Daftar Produk */}
                        <div className="lg:col-span-8 space-y-4">
                            {items.map((item: CartItem) => (
                                <div key={item.id_keranjang} className="bg-white rounded-lg shadow-sm border p-4 flex items-center">
                                    {/* Checkbox */}
                                    <div className="mr-4">
                                        <Checkbox
                                            id={`item-${item.id_keranjang}`}
                                            checked={selectedItems.includes(item.id_keranjang)}
                                            onCheckedChange={() => toggleSelectItem(item.id_keranjang)}
                                            className="h-5 w-5 rounded border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:text-white focus:ring-green-400"
                                        />
                                    </div>
                                    {/* Image */}
                                    <img
                                        src={item.produk?.gambar?.[0]?.url || 'https://via.placeholder.com/100'}
                                        alt={item.produk?.nama_produk}
                                        className="h-20 w-20 object-cover rounded-md mr-4 flex-shrink-0"
                                    />
                                    {/* Product Info */}
                                    <div className="flex-grow">
                                        <h3 className="font-medium text-gray-900 truncate w-60 md:w-full">{item.produk?.nama_produk}</h3>
                                        <p className="text-sm text-gray-500">Rp {new Intl.NumberFormat('id-ID').format(item.produk?.harga)}</p>
                                    </div>

                                    {/* Price, Actions, Quantity */}
                                    <div className="flex flex-col items-end ml-4 flex-shrink-0 w-48">
                                        <div className="mb-2 text-right">
                                            <p className="text-lg font-semibold text-gray-900">Rp{new Intl.NumberFormat('id-ID').format(item.subtotal)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600" onClick={() => {
                                                setItemsToDelete([item.id_keranjang]);
                                                setIsBulkDelete(false); /* Ensure it's for single item */
                                                setShowDeleteModal(true);
                                            }}>
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                            <div className="flex items-center border border-gray-300 rounded">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateQuantity(item.id_keranjang, -1)}
                                                    disabled={item.jumlah <= 1}
                                                    className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-r-none disabled:opacity-50"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="px-3 py-1 text-sm border-l border-r w-10 text-center">{item.jumlah}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateQuantity(item.id_keranjang, 1)}
                                                    disabled={item.jumlah >= item.produk?.stok}
                                                    className="h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-l-none disabled:opacity-50"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Ringkasan Belanja */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-medium mb-4">Ringkasan Belanja</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Total Harga</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(selectedSubtotal)}</span>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between font-medium text-lg">
                                            <span>Total</span>
                                            <span>Rp {new Intl.NumberFormat('id-ID').format(selectedSubtotal)}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleCheckout}
                                        disabled={selectedItems.length === 0}
                                        className="w-full mt-4"
                                    >
                                        Lanjut ke Pembayaran
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus {itemsToDelete.length > 1 ? `${itemsToDelete.length} produk` : 'produk ini'} dari keranjang?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isRemoving}
                            type="button"
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isRemoving}
                            type="button"
                        >
                            {isRemoving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppTopbarLayout>
    );
}
