import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Loader2, Check } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import type { Product } from "@/types/product";
import { useState } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => Promise<boolean>;
  onRequireLogin?: () => void;
  onClick?: (product: Product) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export function ProductCard({ product, onClick, onRequireLogin, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const { errors } = usePage().props as { errors: { stok?: string } };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    if (onRequireLogin) {
      onRequireLogin();
      return;
    }

    try {
      setIsAdding(true);
      const success = await onAddToCart(product);
      
      if (success !== false) {
        // Tampilkan notifikasi sukses hanya jika tidak ada redirect ke login
        setIsAdded(true);
        toast.success('Produk berhasil ditambahkan ke keranjang');
        
        // Reset added state after 2 seconds
        setTimeout(() => {
          setIsAdded(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.response?.data?.stok) {
        toast.error(error.response.data.stok);
      } else {
        toast.error('Gagal menambahkan ke keranjang');
      }
    } finally {
      setIsAdding(false);
    }
  };
  const thumbnail = product.gambar?.find(img => img.is_thumbnail) || product.gambar?.[0];
  const imageUrl = thumbnail?.url || (thumbnail?.path ? `/storage/${thumbnail.path}` : '');
  
  // Calculate discount percentage if there's an original price
  const discountPercentage = product.harga_asli && product.harga_asli > product.harga
    ? Math.round(((product.harga_asli - product.harga) / product.harga_asli) * 100)
    : 0;

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer h-full flex flex-col w-full max-w-[260px] mx-auto"
      onClick={() => onClick?.(product)}
    >
      {/* Product Image */}
      <div className="relative pt-[100%] bg-gray-100">
        {imageUrl ? (
          <img 
            src={imageUrl}
            alt={product.nama_produk}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://via.placeholder.com/300x300?text=No+Image';
              target.className = 'absolute inset-0 w-full h-full object-cover';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{discountPercentage}%
          </div>
        )}
        
        {/* Stock Status */}
        {product.stok === 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Stok Habis
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
          {product.nama_produk}
        </h3>
        
        <div className="flex items-center flex-wrap gap-x-2 text-sm text-gray-500 mt-1">
          <div className="flex items-center gap-x-1">
            <StarRating rating={product.rating || 0} />
            <span className="text-gray-800 font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-gray-300">|</span>
          <span>{product.ulasan_count || 0} ulasan</span>
          <span className="text-gray-300">|</span>
          <span>{product.terjual || 0} terjual</span>
        </div>
        
        <div className="space-y-1 mt-auto">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.harga)}
            </span>
            {discountPercentage > 0 && product.harga_asli && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.harga_asli)}
              </span>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <Button 
            variant={isAdded ? 'outline' : 'default'}
            size="sm"
            className="w-full mt-2 p-0 h-8 relative overflow-hidden"
            onClick={handleAddToCart}
            disabled={isAdding || product.stok === 0}
            type="button"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menambahkan...
              </>
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Ditambahkan
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stok > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
