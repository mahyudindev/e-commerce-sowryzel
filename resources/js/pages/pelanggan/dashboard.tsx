import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ProductCard } from '@/components/product-card';
import { ProductDetailModal } from '@/components/product-detail-modal';
import { HomeCarousel } from '@/components/home-carousel';
import { AppTopbarHeader } from '@/components/app-topbar-header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Product } from '@/types/product';

interface PageProps extends InertiaPageProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        page?: number;
    };
    keranjang?: {
        data: Array<{
            id_keranjang: number;
            jumlah: number;
            subtotal: number;
            harga_satuan: number;
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
        }>;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Beranda',
        href: '/',
    },
];

export default function Dashboard() {
    const { products, filters, keranjang } = usePage<PageProps>().props;
    const [search, setSearch] = useState<string>(filters?.search || '');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const productList: Product[] = Array.isArray(products?.data) ? products.data : [];
    const currentPage: number = products?.current_page || 1;
    const lastPage: number = products?.last_page || 1;
    const totalProducts: number = products?.total || 0;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('pelanggan.dashboard'), { search }, { 
            preserveState: true,
            replace: true,
            only: ['products', 'filters']
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('pelanggan.dashboard'), { 
            ...filters, 
            page,
            search: filters.search || ''
        }, { 
            preserveState: true,
            replace: true,
            only: ['products', 'filters']
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
        try {
            await router.post(route('pelanggan.keranjang.store'), {
                produk_id: product.produk_id,
                jumlah: quantity,
                _token: (window as any).csrfToken || ''
            }, {
                preserveScroll: true,
                preserveState: true,
                headers: {
                    'X-CSRF-TOKEN': (window as any).csrfToken || ''
                }
            });
            
            toast.success(`${product.nama_produk} berhasil ditambahkan ke keranjang`);
            

            if (selectedProduct?.produk_id === product.produk_id) {
                setIsModalOpen(false);
            }
            
            return true;
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            

            if (error.response?.status === 401) {
                return false;
            }
            

            if (error.response?.data?.stok) {
                toast.error(error.response.data.stok);
            } else {
                toast.error('Gagal menambahkan produk ke keranjang');
            }
            
            throw error;
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
            <Head title="Produk" />
            
            <AppTopbarHeader 
                breadcrumbs={breadcrumbs} 
                keranjang={keranjang}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <HomeCarousel 
                        autoSlideInterval={2500}
                        slides={[
                            {
                                id: 1,
                                image: '/images/1.png',
                                title: 'Eksklusif',
                                description: 'Temukan gaya sempurna untuk aktivitas harianmu dengan koleksi terbaik kami',
                                link: '/products/tote-bag-1'
                            },
                            {
                                id: 2,
                                image: '/images/2.png',
                                title: 'Koleksi Terbaru',
                                description: 'Produk terbaru dengan kualitas terbaik untuk penampilan maksimal',
                                link: '/products/new-arrivals'
                            },
                            {
                                id: 3,
                                image: '/images/3.png',
                                title: 'Diskon Spesial',
                                description: 'Dapatkan penawaran terbatas untuk produk pilihan',
                                link: '/products/special-offers'
                            }
                        ]}
                    />
                </div>

                {/* <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Temukan Produk Terbaik</h1>
                    <p className="text-muted-foreground mt-2">Pilih produk favorit Anda dan nikmati pengalaman berbelanja yang menyenangkan</p>
                </div> */}

                {products.data.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Tidak ada produk yang ditemukan</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {productList.map((product) => (
                                <div 
                                    key={product.produk_id} 
                                    className="cursor-pointer"
                                    onClick={() => handleViewProduct(product)}
                                >
                                    <ProductCard
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                </div>
                            ))}
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
                                {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
}
