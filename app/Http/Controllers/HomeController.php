<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = 12;
        $search = $request->input('search');
        
        $products = Produk::with(['gambar' => function($query) {
            $query->orderBy('urutan', 'asc');
        }, 'ulasan.user.pelanggan', 'detailTransaksis.transaksi'])
        ->where('status_aktif', true)
        ->when($search, function($query) use ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_produk', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%")
                  ->orWhere('kategori', 'like', "%{$search}%");
            });
        })
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);
        
        $formattedProducts = $products->getCollection()->map(function ($product) {
            return [
                'produk_id' => $product->produk_id,
                'kode_produk' => $product->kode_produk,
                'nama_produk' => $product->nama_produk,
                'deskripsi' => $product->deskripsi,
                'harga' => (float)$product->harga,
                'stok' => (int)$product->stok,
                'berat' => (float)$product->berat,
                'kategori' => $product->kategori,
                'status_aktif' => (bool)$product->status_aktif,
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at,
                'rating' => $product->rating,
                'ulasan_count' => $product->ulasan_count,
                'terjual' => $product->terjual,
                'ulasan' => $product->ulasan,
                'gambar' => $product->gambar->map(function ($gambar) {
                    return [
                        'gambar_id' => $gambar->gambar_id,
                        'produk_id' => $gambar->produk_id,
                        'nama_file' => $gambar->nama_file,
                        'path' => $gambar->path,
                        'url' => asset('storage/' . $gambar->path),
                        'is_thumbnail' => (bool)$gambar->is_thumbnail,
                        'urutan' => (int)$gambar->urutan,
                        'created_at' => $gambar->created_at,
                        'updated_at' => $gambar->updated_at,
                    ];
                })->toArray(),
            ];
        });
        
        $products->setCollection($formattedProducts);

        $keranjang = null;
        if (auth()->check()) {
            $keranjang = $this->getFormattedKeranjang();
        }

        $view = $request->routeIs('pelanggan.dashboard') ? 'pelanggan/dashboard' : 'dashboard';
        
        return Inertia::render($view, [
            'products' => [
                'data' => $products->items(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
            'filters' => [
                'search' => $search,
                'page' => $request->input('page', 1)
            ],
            'keranjang' => $keranjang
        ]);
    }

    /**
     * Get formatted keranjang data
     */
    private function getFormattedKeranjang()
    {
        $keranjang = \App\Models\Keranjang::with(['produk', 'produk.gambar'])
            ->where('user_id', auth()->id())
            ->get()
            ->map(function($item) {
                if (!$item->produk) {
                    return null;
                }
                
                return [
                    'id_keranjang' => $item->id_keranjang,
                    'jumlah' => (int) $item->jumlah,
                    'subtotal' => (float) $item->subtotal,
                    'harga_satuan' => (float) $item->harga_satuan,
                    'produk' => [
                        'produk_id' => $item->produk->produk_id,
                        'nama_produk' => $item->produk->nama_produk,
                        'harga' => (float) $item->produk->harga,
                        'stok' => (int) $item->produk->stok,
                        'gambar' => $item->produk->gambar ? $item->produk->gambar->map(function($gambar) {
                            return [
                                'path' => $gambar->path,
                                'url' => asset('storage/' . $gambar->path)
                            ];
                        })->toArray() : []
                    ]
                ];
            })
            ->filter()
            ->values();
            
        $total = $keranjang->sum(function($item) {
            return $item['subtotal'];
        });
            
        return [
            'data' => $keranjang,
            'total' => (float) $total
        ];
    }
}
