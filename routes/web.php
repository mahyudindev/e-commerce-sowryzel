<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\HomeController;

use App\Http\Controllers\CartController;
use App\Http\Controllers\UlasanController;

use App\Http\Controllers\Admin\ProdukController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DebugDashboardController;
use App\Http\Middleware\CheckRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Http\Controllers\TransaksiController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Welcome page (public)
Route::get('/', function () {
    $products = \App\Models\Produk::with(['gambar' => function($query) {
        $query->orderBy('urutan', 'asc');
    }, 'ulasan.user.pelanggan', 'detailTransaksis.transaksi'])
    ->where('status_aktif', true)
    ->orderBy('created_at', 'desc')
    ->paginate(12);


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
                    'urutan' => $gambar->urutan,
                ];
            })->toArray()
        ];
    });

    return Inertia::render('welcome', [
        'products' => [
            'data' => $formattedProducts,
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'total' => $products->total(),
        ]
    ]);
})->name('welcome');


Route::get('/home', [HomeController::class, 'index'])
    ->name('home')
    ->middleware('auth');


Route::get('/produk/{product:slug}', [ProdukController::class, 'show'])->name('produk.show');


Route::get('/storage/produk/{filename}', function ($filename) {
    $path = 'produk/' . $filename;
    
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }
    
    return response()->file(Storage::disk('public')->path($path), [
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('filename', '.*');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard redirection based on user role
    Route::get('admin/dashboard-dev', function (Request $request) {
        return match($request->user()->role) {
            'admin' => redirect()->route('admin.dashboard-dev'),
            'owner' => redirect()->route('owner.dashboard-dev'),
            'pelanggan' => redirect()->route('pelanggan.dashboard-dev'),
            default => redirect()->route('home'),
        };
    })->name('dashboard-dev');


    Route::prefix('owner')
        ->middleware('role:owner')
        ->group(function () {
            Route::get('/dashboard-dev', function () {
                return Inertia::render('owner/dashboard-dev');
            })->name('owner.dashboard');
            

        });

    Route::prefix('pelanggan')
        ->middleware('role:pelanggan')
        ->group(function () {
            Route::get('/dashboard', [HomeController::class, 'index'])
                ->name('pelanggan.dashboard');
            
            // Cart routes
            Route::prefix('keranjang')->group(function () {
                Route::get('/', [\App\Http\Controllers\KeranjangController::class, 'index'])->name('pelanggan.keranjang.index');
                Route::post('/', [\App\Http\Controllers\KeranjangController::class, 'store'])->name('pelanggan.keranjang.store');
                Route::put('/{id}', [\App\Http\Controllers\KeranjangController::class, 'update'])->name('pelanggan.keranjang.update');
                Route::delete('/{id}', [\App\Http\Controllers\KeranjangController::class, 'destroy'])->name('pelanggan.keranjang.destroy');
                Route::delete('/', [\App\Http\Controllers\KeranjangController::class, 'destroyMultiple'])->name('pelanggan.keranjang.destroy-multiple');
            });
            

            Route::get('/checkout', [\App\Http\Controllers\CheckoutController::class, 'index'])
                ->name('checkout');

            // Pesanan (Order) routes
            Route::post('/transaksi', [TransaksiController::class, 'store'])->name('transaksi.store');
            Route::get('/transaksi/finish', [TransaksiController::class, 'finish'])->name('pelanggan.transaksi.finish');
            Route::get('/transaksi', [TransaksiController::class, 'index'])->name('pelanggan.transaksi.index');
            Route::get('/transaksi/{invoice_id}', [TransaksiController::class, 'show'])->name('pelanggan.transaksi.show'); // Assuming you'll create a show method
            Route::post('/transaksi/{transaksi}/terima', [TransaksiController::class, 'tandaiSebagaiSelesai'])->name('pelanggan.transaksi.terima');
            Route::post('/transaksi/{transaksi_id}/retry-payment', [TransaksiController::class, 'retryPayment'])->name('pelanggan.transaksi.retry-payment');
                
            Route::post('/ulasan/batch', [UlasanController::class, 'storeBatch'])->name('ulasan.store.batch');

        });

    Route::prefix('admin')
        ->middleware('role:admin')
        ->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
            Route::get('/dashboard-dev', [DebugDashboardController::class, 'index'])->name('admin.dashboard-dev');

            // Laporan routes
            Route::prefix('laporan')->group(function () {
                Route::get('/transaksi', [\App\Http\Controllers\Admin\LaporanController::class, 'transaksi'])->name('laporan.transaksi');
                Route::get('/transaksi/pdf', [\App\Http\Controllers\Admin\LaporanController::class, 'transaksiPDF'])->name('laporan.transaksi.pdf');
                
                Route::get('/pendapatan', [\App\Http\Controllers\Admin\LaporanController::class, 'pendapatan'])->name('laporan.pendapatan');
                Route::get('/pendapatan/pdf', [\App\Http\Controllers\Admin\LaporanController::class, 'pendapatanPDF'])->name('laporan.pendapatan.pdf');
                
                Route::get('/produk', [\App\Http\Controllers\Admin\LaporanController::class, 'produk'])->name('laporan.produk');
                Route::get('/produk/pdf', [\App\Http\Controllers\Admin\LaporanController::class, 'produkPDF'])->name('laporan.produk.pdf');
            });

            // Pesanan (Order) routes
            Route::post('/transaksi/{transaksi}/update-status', [TransaksiController::class, 'updateStatus'])->name('admin.transaksi.updateStatus');
        });
});

/*
|--------------------------------------------------------------------------
| Additional Route Files
|--------------------------------------------------------------------------
*/
// Midtrans Notification Handler
Route::post('/midtrans/notification', [TransaksiController::class, 'notificationHandler'])->name('midtrans.notification');

require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
require __DIR__.'/settings.php';