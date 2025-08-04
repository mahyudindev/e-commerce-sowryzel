import { Breadcrumbs } from '@/components/breadcrumbs';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Search, User, LogOut, Settings, ArrowLeft, ReceiptText } from 'lucide-react';
import CartDropdown from './CartDropdown';
import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { router } from '@inertiajs/react';

// Fungsi debounce sederhana
type Timeout = ReturnType<typeof setTimeout>;

const useDebounce = () => {
    const timeoutRef = useRef<Timeout | null>(null);
    
    const debounce = useCallback((callback: () => void, delay: number) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            callback();
            timeoutRef.current = null;
        }, delay);
    }, []);
    
    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    
    return { debounce, cancel };
};

interface AppTopbarHeaderProps {
    breadcrumbs?: BreadcrumbItemType[];
    backHref?: string;
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
    onRemoveMultiple?: (ids: number[]) => void;
}

export function AppTopbarHeader({ breadcrumbs = [], keranjang, onRemoveMultiple, backHref }: AppTopbarHeaderProps) {
    const { auth } = usePage().props as any;
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const initialLoad = useRef(true);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const toggleProfileDropdown = () => {
        setProfileDropdownOpen(!profileDropdownOpen);
    };

    const performSearch = useCallback((query: string = '') => {
        setIsSearching(true);
        router.get(
            route('pelanggan.dashboard'),
            { search: query.trim() || undefined },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSearching(false),
                onError: () => setIsSearching(false),
            }
        );
    }, []);

    // Inisialisasi debounce
    const { debounce, cancel } = useDebounce();

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        if (value.trim()) {
            debounce(() => {
                performSearch(value);
            }, 500);
        } else {
            cancel();
            performSearch('');
        }
    };

    // Handle form submission (for accessibility and explicit search)
    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }
        // Cancel any pending debounced search
        cancel();
        performSearch(searchQuery);
    };
    
    // Handle search when pressing Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            cancel();
            performSearch(searchQuery);
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            cancel();
            performSearch('');
            if (searchInputRef.current) {
                searchInputRef.current.blur();
            }
        }
    };

    // Clear search when clicking the clear button (x) in the input
    const handleClearSearch = (e: React.MouseEvent) => {
        e.preventDefault();
        setSearchQuery('');
        cancel();
        performSearch('');
    };
    return (
        <header className="sticky top-0 z-50 w-full rounded-b-md bg-white shadow-sm dark:bg-gray-950">
            <div className="w-full px-4">
                <div className="flex h-16 items-center justify-between py-2">
                    {/* Back Button, Logo and Navigation */}
                    <div className="flex items-center space-x-4 md:space-x-8"> {/* Adjusted space for back button */} 
                        {backHref && (
                            <Link 
                                href={backHref} 
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                aria-label="Kembali"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </Link>
                        )}
                        <Link 
                            href={route('pelanggan.dashboard')} 
                            className="flex items-center space-x-2 group transition-all duration-200"
                        >
                            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                                <img 
                                    src="/images/logo.png" 
                                    alt="SOWRYZEL" 
                                    className="h-6 w-6 object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = 'https://placehold.co/24/2563EB/ffffff?text=SZ';
                                    }}
                                />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                SOWRYZEL
                            </span>
                        </Link>
                        
                        <nav className="hidden md:flex items-center space-x-1 border-l border-gray-200 dark:border-gray-700 pl-6 h-8">
                            <Link 
                                href={route('pelanggan.dashboard')}
                                className="relative px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors duration-200 group"
                            >
                                <span className="relative z-10">Beranda</span>
                                <span className="absolute inset-x-1 -bottom-1 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
                            </Link>
                        </nav>
                    </div>

                    {/* Search and User Actions */}
                    <div className="flex items-center space-x-4">
                        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Cari produk..."
                                    className="w-64 h-9 rounded-full border border-gray-300 bg-gray-50 pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSearching}
                                    aria-label="Cari produk"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Hapus pencarian"
                                    >
                                        ×
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${isSearching ? 'text-primary' : 'text-gray-500 hover:text-primary'} transition-colors`}
                                    disabled={isSearching}
                                    onClick={handleSearchSubmit}
                                >
                                    {isSearching ? (
                                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </form>
                        <div className="flex items-center space-x-4">
                            <Link
                                href={route('pelanggan.transaksi.index')}
                                className="relative p-2 text-gray-700 hover:text-primary transition-colors"
                                aria-label="Daftar Transaksi"
                            >
                                <ReceiptText className="h-5 w-5" />
                            </Link>
                            <div className="relative">
                                <CartDropdown 
                                    keranjang={keranjang} 
                                    data={keranjang?.data || []} 
                                    total={keranjang?.total || 0}
                                    onRemoveMultiple={onRemoveMultiple}
                                />
                            </div>
                        </div>
                        
                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                className="flex items-center space-x-2 rounded-full border border-gray-300 bg-gray-50 p-1 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                                onClick={toggleProfileDropdown}
                            >
                                {auth?.user?.avatar ? (
                                    <img src={auth.user.avatar} alt="Profile" className="h-7 w-7 rounded-full" />
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </div>
                                )}
                            </button>
                            
                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                                    <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                                        <p className="font-medium">{auth?.user?.nama}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{auth?.user?.email}</p>
                                    </div>
                                    <Link 
                                        href="/settings/profile" 
                                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setProfileDropdownOpen(false)}
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                    <Link 
                                        href="/logout" 
                                        method="post" 
                                        as="button" 
                                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setProfileDropdownOpen(false)}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </header>
    );
}
