import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProductCard } from '@/components/product-card';
import { HomeCarousel } from '@/components/home-carousel';
import { ProductDetailModal } from '@/components/product-detail-modal';
import LoginModal from '@/components/auth/login-modal';
import type { Product, PageProps as ProductPageProps } from '@/types/product';


interface PageProps extends ProductPageProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
    } | null;
  };
  products: {
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
  };
}





const Welcome: React.FC = () => {
  const { auth, products: initialProducts = { data: [], current_page: 1, last_page: 1, total: 0 } } = usePage<PageProps>().props;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const handleAddToCart = async (product: Product) => {
    try {
      await router.post(route('keranjang.store'), {
        produk_id: product.produk_id,
        jumlah: 1
      });
      toast.success(`${product.nama_produk} berhasil ditambahkan ke keranjang`);
      return true;
    } catch (error: any) {
      console.error('Failed to add to cart', error);
      if (error.response?.status === 401) {
        // Unauthorized - show login modal
        setPendingProduct(product);
        setIsLoginModalOpen(true);
        return false;
      }
      throw error;
    }
  };

  const handleLoginSuccess = async () => {
    setIsLoginModalOpen(false);
    if (pendingProduct) {
      await handleAddToCart(pendingProduct);
      setPendingProduct(null);
    }
  };

  const handleRegisterClick = () => {
    setIsLoginModalOpen(false);
    router.visit(route('register'));
  };

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(initialProducts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = {
      ...initialProducts,
      data: initialProducts.data.filter((product: Product) => {
        const matchesName = product.nama_produk.toLowerCase().includes(query);
        const matchesDescription = product.deskripsi && product.deskripsi.toLowerCase().includes(query);
        
        // Handle kategori safely
        let matchesCategory = false;
        if (product.kategori) {
          if (typeof product.kategori === 'string') {
            matchesCategory = product.kategori.toLowerCase().includes(query);
          } else if (product.kategori && typeof product.kategori === 'object') {
            const kategori = product.kategori as { nama_kategori?: string };
            if (kategori.nama_kategori) {
              matchesCategory = kategori.nama_kategori.toLowerCase().includes(query);
            }
          }
        }
        
        return matchesName || matchesDescription || matchesCategory;
      }),
    };
    setFilteredProducts(filtered);
  }, [searchQuery, initialProducts]);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Head title="Welcome" />

      <header className="sticky top-0 z-50 w-full border-b border-[#19140014] bg-white/80 backdrop-blur-sm dark:border-[#3E3E3A] dark:bg-[#0A0A0A]/80">
        <div className="container flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 ml-4">
            <img 
              src="/images/logo.png" 
              alt="SOWRYZEL Logo" 
              className="h-8 w-auto" 
              onError={(e) => {
                // Fallback if logo fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/150x40/000000/ffffff?text=SOWRYZEL';
              }}
            />
            <span className="text-xl font-bold text-[#1b1b18] dark:text-[#EDEDEC] hidden sm:inline">
              SOWRYZEL
            </span>
          </Link>

          {/* Search Bar */}
          <div className="relative w-full max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari produk..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            {auth.user ? (
              <Link
                href={route('pelanggan.dashboard')}
                className="inline-flex items-center justify-center rounded-sm bg-[#1b1b18] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#191501e6] dark:bg-[#EDEDEC] dark:text-[#0A0A0A] dark:hover:bg-[#f2f2f0]"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href={route('login')}
                  className="inline-flex items-center justify-center rounded-sm border border-[#19140035] px-5 py-1.5 text-sm font-medium leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                  Login
                </Link>
                <Link
                  href={route('register')}
                  className="inline-flex items-center justify-center rounded-sm bg-blue-600 px-5 py-1.5 text-sm font-medium leading-normal text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  Daftar
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <HomeCarousel 
            autoSlideInterval={2500}
            slides={[
              {
                id: 1,
                image: '/images/1.png',
                title: 'Tas Tote Eksklusif',
                description: 'Temukan gaya sempurna untuk aktivitas harianmu dengan koleksi terbaik kami',
                link: '/products/tote-bag-1'
              },
              {
                id: 2,
                image: '/images/2.png',
                title: 'Tren 2025',
                description: 'Tampil stylish dengan desain terkini yang selalu up-to-date',
                link: '/products/tote-bag-2'
              },
              {
                id: 3,
                image: '/images/3.png',
                title: 'Edisi Spesial',
                description: 'Koleksi terbatas dengan bahan premium dan desain eksklusif',
                link: '/products/tote-bag-3'
              }
            ]}
          />
        </div>

        <main className="container py-4 px-4">
          {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
          
          <LoginModal 
            open={isLoginModalOpen} 
            onOpenChange={setIsLoginModalOpen}
            onRegisterClick={handleRegisterClick}
            onLoginSuccess={handleLoginSuccess}
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Produk Terbaru</h2>
          {/* Product Grid */}
          {searchQuery && filteredProducts.data.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Tidak ada produk yang cocok dengan pencarian Anda</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Tampilkan semua produk
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(searchQuery ? filteredProducts : initialProducts).data?.length > 0 ? (
                  (searchQuery ? filteredProducts : initialProducts).data.map((product: Product) => (
                    <div key={product.produk_id} className="cursor-pointer">
                      <div onClick={() => handleViewProduct(product)}>
                        <ProductCard
                          product={product}
                          onAddToCart={handleAddToCart}
                          onRequireLogin={() => {
                            setPendingProduct(product);
                            setIsLoginModalOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Tidak ada produk yang tersedia saat ini</p>
                  </div>
                )}
              </div>
            </>
          )}

          
          {/* Pagination */}
          {initialProducts?.last_page > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                {Array.from({ length: initialProducts.last_page }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={route('welcome', { page })}
                    className={`px-3 py-1 rounded-md ${
                      initialProducts.current_page === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    preserveScroll
                  >
                    {page}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Product Detail Modal */}
          <ProductDetailModal
            product={selectedProduct}
            open={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onAddToCart={async (product: Product, quantity: number = 1) => {
              if (!auth.user) {
                setPendingProduct(product);
                setIsProductModalOpen(false);
                setIsLoginModalOpen(true);
                return;
              }
              
              try {
                await router.post(route('keranjang.store'), {
                  produk_id: product.produk_id,
                  jumlah: quantity
                });
                toast.success(`${product.nama_produk} ditambahkan ke keranjang`);
                setIsProductModalOpen(false);
              } catch (error) {
                console.error('Failed to add to cart', error);
              }
            }}
          />
        </main>
      </main>

    </div>
  );
};

export default Welcome;
