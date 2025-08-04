import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { X, ShoppingCart, ChevronLeft, ChevronRight, Loader2, Check, Minus, Plus, Star } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { toast } from 'sonner';

interface ProductDetailModalProps {
    product: Product | null;
    open: boolean;
    onClose: () => void;
    onAddToCart?: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({ product, open, onClose, onAddToCart }: ProductDetailModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        if (open) {
            setQuantity(1);
            setActiveImageIndex(0);
            setIsAdded(false);
        }
    }, [open, product]);

    if (!product) return null;

    const mainImage = product.gambar?.[activeImageIndex] || product.gambar?.[0];
    const mainImageUrl = mainImage?.url || (mainImage?.path ? `/storage/${mainImage.path}` : '');

    const handleAddToCart = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (onAddToCart) {
            onAddToCart(product, quantity);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
            setQuantity(1);
            return;
        }

        try {
            setIsAddingToCart(true);
            
            router.post(route('pelanggan.keranjang.store'), {
                produk_id: product.produk_id,
                jumlah: quantity,
            }, {
                onSuccess: () => {
                    setIsAdded(true);
                    toast.success('Produk berhasil ditambahkan ke keranjang');
                    setTimeout(() => setIsAdded(false), 2000);
                    setQuantity(1);
                },
                onError: (errors) => {
                    if (errors.stok) {
                        toast.error(errors.stok);
                    } else {
                        toast.error('Gagal menambahkan ke keranjang');
                    }
                },
                preserveScroll: true,
                onFinish: () => {
                    setIsAddingToCart(false);
                }
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Terjadi kesalahan saat menambahkan ke keranjang');
            setIsAddingToCart(false);
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://via.placeholder.com/800x800?text=No+Image';
        target.className = 'w-full h-full object-contain bg-gray-100 dark:bg-gray-800';
    };

    const handlePrevImage = () => {
        if (!product.gambar) return;
        setActiveImageIndex(prev => (prev === 0 ? product.gambar.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        if (!product.gambar) return;
        setActiveImageIndex(prev => (prev === product.gambar.length - 1 ? 0 : prev + 1));
    };

    const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPosition({ x, y });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-5xl p-0 overflow-hidden h-[90vh] flex flex-row">
                <DialogTitle className="sr-only">{product.nama_produk}</DialogTitle>
                <DialogDescription className="sr-only">
                    Detail untuk {product.nama_produk}
                </DialogDescription>
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-20 rounded-full p-1.5 bg-white/80 backdrop-blur-sm hover:bg-gray-100 transition-colors"
                >
                    <X className="h-5 w-5 text-gray-600" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Left Column: Image Gallery */}
                <div className="w-2/5 relative bg-gray-50 flex flex-col p-6 overflow-y-auto">
                    <div 
                        className="relative aspect-square overflow-hidden rounded-lg bg-white flex-shrink-0"
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        onMouseMove={handleImageMouseMove}
                    >
                        {mainImage ? (
                            <img 
                                src={mainImageUrl}
                                alt={product.nama_produk}
                                className={cn(
                                    "w-full h-full object-contain transition-transform duration-300",
                                    isZoomed ? "scale-150" : "scale-100"
                                )}
                                style={{
                                    transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center',
                                }}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-gray-400">No image available</span>
                            </div>
                        )}

                        {product.gambar.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors z-10"
                                >
                                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors z-10"
                                >
                                    <ChevronRight className="h-5 w-5 text-gray-700" />
                                </button>
                            </>
                        )}
                    </div>

                    {product.gambar.length > 1 && (
                        <div className="mt-4 flex-shrink-0">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {product.gambar.map((img, index) => {
                                    const imgUrl = img.url || (img.path ? `/storage/${img.path}` : '');
                                    return (
                                        <button
                                            key={img.gambar_id || index}
                                            onClick={() => setActiveImageIndex(index)}
                                            className={cn(
                                                "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                                                activeImageIndex === index 
                                                    ? "border-primary ring-2 ring-primary ring-offset-1" 
                                                    : "border-transparent hover:border-gray-300"
                                            )}
                                        >
                                            {imgUrl ? (
                                                <img 
                                                    src={imgUrl}
                                                    alt={`${product.nama_produk} ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={handleImageError}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-xs text-gray-400">{index + 1}</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Product Info & Reviews */}
                <div className="w-3/5 p-6 md:p-8 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{product.nama_produk}</h1>
                            <div className="flex items-center flex-wrap gap-x-3 text-sm text-gray-600 mt-2">
                                <div className="flex items-center gap-x-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-gray-800">{product.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <span>{product.ulasan_count || 0} Ulasan</span>
                                <span className="text-gray-300">|</span>
                                <span>{product.terjual || 0} Terjual</span>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold text-primary">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.harga)}
                                </span>
                                {product.stok > 0 ? (
                                    <span className="ml-3 text-sm font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Stok: {product.stok}</span>
                                ) : (
                                    <span className="ml-3 text-sm font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">Stok Habis</span>
                                )}
                            </div>
                        </div>

                        {product.deskripsi && (
                            <div className="pt-4 border-t border-gray-200 mt-4">
                                <h3 className="text-base font-semibold text-gray-900">Deskripsi Produk</h3>
                                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{product.deskripsi}</p>
                            </div>
                        )}

                        <form onSubmit={handleAddToCart} className="pt-6 border-t border-gray-200 mt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-800">Jumlah</span>
                                <div className="flex items-center space-x-2">
                                    <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => setQuantity(prev => Math.max(1, prev - 1))} disabled={quantity <= 1 || product.stok === 0}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center text-base font-medium">{quantity}</span>
                                    <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" onClick={() => setQuantity(prev => Math.min(product.stok, prev + 1))} disabled={product.stok === 0 || quantity >= product.stok}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button type="submit" size="lg" className="w-full mt-6 py-6 text-base font-medium" disabled={isAddingToCart || product.stok === 0}>
                                {isAddingToCart ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menambahkan...</>
                                ) : isAdded ? (
                                    <><Check className="mr-2 h-5 w-5" />Ditambahkan</>
                                ) : (
                                    <><ShoppingCart className="mr-2 h-5 w-5" />{product.stok > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}</>
                                )}
                            </Button>
                        </form>

                        <div className="pt-6 border-t border-gray-200 mt-6 space-y-2">
                            <div>
                                <h4 className="font-semibold text-gray-900">Kategori</h4>
                                <p className="text-sm text-gray-600">{product.kategori || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Berat</h4>
                                <p className="text-sm text-gray-600">{product.berat ? `${product.berat} gram` : '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product Reviews Section */}
                    <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-bold text-gray-900">Ulasan Produk</h3>
                        <div className="mt-6 divide-y divide-gray-200">
                            {product.ulasan && product.ulasan.length > 0 ? (
                                product.ulasan.map((review) => (
                                    <div key={review.ulasan_id} className="py-6 flex items-start space-x-4">
                                        <Avatar>
                                            <AvatarFallback>{review.nama_pengguna_samaran.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">{review.nama_pengguna_samaran}</p>
                                                <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        fill={i < review.rating ? 'currentColor' : 'none'}
                                                    />
                                                ))}
                                            </div>
                                            {review.komentar && <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{review.komentar}</p>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6">
                                    <p className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}