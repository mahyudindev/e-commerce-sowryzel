<?php

namespace App\Http\Controllers;

use App\Models\Keranjang;
use App\Models\Produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KeranjangController extends Controller
{
    public function index(Request $request)
    {
        $keranjang = $this->getFormattedKeranjang();
        
        $response = [
            'data' => $keranjang['data'],
            'total' => $keranjang['total']
        ];
        
        return Inertia::render('pelanggan/keranjang/index', [
            'keranjang' => $response['data'],
            'total' => $response['total']
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'produk_id' => 'required|exists:produk,produk_id',
            'jumlah' => 'required|integer|min:1'
        ]);

        $produk = Produk::findOrFail($request->produk_id);

        if ($produk->stok < $request->jumlah) {
            return back()->withErrors([
                'stok' => 'Stok produk tidak mencukupi. Stok tersisa: ' . $produk->stok
            ]);
        }

        $keranjang = Keranjang::where('user_id', Auth::id())
            ->where('produk_id', $produk->produk_id)
            ->first();

        if ($keranjang) {
            $newJumlah = $keranjang->jumlah + $request->jumlah;
            
            if ($produk->stok < $newJumlah) {
                return back()->withErrors([
                    'stok' => 'Jumlah melebihi stok yang tersedia. Stok tersisa: ' . $produk->stok
                ]);
            }
            
            $keranjang->jumlah = $newJumlah;
            $keranjang->harga_satuan = $produk->harga;
            $keranjang->hitungSubtotal();
            $keranjang->save();
        } else {
            $keranjang = new Keranjang([
                'user_id' => Auth::id(),
                'produk_id' => $produk->produk_id,
                'harga_satuan' => $produk->harga,
                'jumlah' => $request->jumlah
            ]);
            $keranjang->hitungSubtotal();
            $keranjang->save();
        }

        if ($request->header('X-Inertia')) {
            return back()->with([
                'message' => 'Produk berhasil ditambahkan ke keranjang'
            ]);
        }
        
        return redirect()->back()->with([
            'message' => 'Produk berhasil ditambahkan ke keranjang'
        ]);
    }

    public function update(Request $request, $id)
    {
        $keranjang = Keranjang::where('id_keranjang', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'jumlah' => 'required|integer|min:1'
        ]);

        $produk = $keranjang->produk;
        if ($request->jumlah > $produk->stok) {
            return back()->withErrors([
                'stok' => 'Jumlah melebihi stok yang tersedia. Stok tersisa: ' . $produk->stok
            ]);
        }

        $keranjang->update([
            'jumlah' => $request->jumlah,
            'harga_satuan' => $produk->harga,
            'subtotal' => $produk->harga * $request->jumlah
        ]);

        // Ambil data keranjang terbaru untuk dikembalikan
        $keranjang->load(['produk', 'produk.gambar']);
        
        $keranjang = $this->getFormattedKeranjang();
        
        if ($request->header('X-Inertia')) {
            return back()->with([
                'message' => 'Keranjang berhasil diperbarui'
            ]);
        }

        return redirect()->back()->with([
            'message' => 'Keranjang berhasil diperbarui'
        ]);
    }

    public function destroy($id)
    {
        $keranjang = Keranjang::where('id_keranjang', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $keranjang->delete();
        
        $keranjang = $this->getFormattedKeranjang();
        
        if (request()->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'data' => $keranjang['data'],
                'total' => $keranjang['total']
            ]);
        }
        
        return redirect()->back()->with([
            'message' => 'Item berhasil dihapus dari keranjang',
            'keranjang' => $keranjang['data'],
            'total' => $keranjang['total']
        ]);
    }
    
    /**
     * Hapus beberapa item dari keranjang sekaligus
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*' => 'required|integer|exists:keranjang,id_keranjang,user_id,' . auth()->id()
        ]);

        Keranjang::whereIn('id_keranjang', $request->items)
            ->where('user_id', Auth::id())
            ->delete();

        $keranjang = $this->getFormattedKeranjang();
        
        if ($request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'data' => $keranjang['data'],
                'total' => $keranjang['total']
            ]);
        }
        
        return redirect()->back()->with([
            'message' => 'Item berhasil dihapus dari keranjang',
            'keranjang' => $keranjang['data'],
            'total' => $keranjang['total']
        ]);
    }

    /**
     * Get formatted keranjang data
     */
    private function getFormattedKeranjang()
    {
        $keranjang = Keranjang::with(['produk', 'produk.gambar'])
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

    protected function getTotalKeranjang()
    {
        return Keranjang::where('user_id', Auth::id())->count();
    }
}
