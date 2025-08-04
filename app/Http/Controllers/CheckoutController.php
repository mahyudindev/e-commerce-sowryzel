<?php

namespace App\Http\Controllers;

use App\Models\Keranjang; // Pastikan Keranjang di-import
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckoutController extends Controller
{
    /**
     * Menampilkan halaman checkout dengan item yang dipilih.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $selectedItemIds = $request->input('items', []);

        $user = Auth::user();
        $pelanggan = $user->pelanggan;

        $customerData = [
            'nama_lengkap' => $pelanggan->nama_lengkap ?? '',
            'no_telepon' => $pelanggan->no_telepon ?? '',
            'alamat' => $pelanggan->alamat ?? '',
            'kode_pos' => $pelanggan->kode_pos ?? '',
        ];

        if (empty($selectedItemIds)) {
            return Inertia::render('pelanggan/checkout/index', [
                'checkoutItems' => [],
                'totalHarga' => 0,
                'totalBerat' => 0,
                'customerData' => $customerData,
            ]);
        }

        $checkoutItems = Keranjang::with(['produk', 'produk.gambar'])
            ->whereIn('id_keranjang', $selectedItemIds)
            ->where('user_id', Auth::id())
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
                        'berat' => (float) $item->produk->berat,
                        'gambar' => $item->produk->gambar ? $item->produk->gambar->map(function($gambar) {
                            return [
                                'path' => $gambar->path,
                                'url' => asset('storage/' . $gambar->path)
                            ];
                        })->toArray() : [],
                    ]
                ];
            })
            ->filter()
            ->values();

        $totalHarga = $checkoutItems->sum('subtotal');
        
        $totalBerat = $checkoutItems->sum(function($item) {
            $beratProduk = $item['produk']['berat'] ?? 0;
            return $beratProduk * $item['jumlah'];
        });

        return Inertia::render('pelanggan/checkout/index', [
            'checkoutItems' => $checkoutItems,
            'totalHarga' => (float) $totalHarga,
            'totalBerat' => (float) $totalBerat,
            'customerData' => $customerData,
        ]);
    }
}
