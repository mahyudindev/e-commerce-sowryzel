<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PelangganController;
use App\Http\Controllers\Admin\ProdukController;
use App\Http\Controllers\Admin\ProdukGambarController;
use App\Http\Controllers\Admin\ProdukKategoriController;
use App\Http\Controllers\TransaksiController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Admin routes
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'role:admin'])
    ->group(function () {
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('admin/dashboard');
        })->name('dashboard');
        
        // Admin users management
        Route::resource('users', AdminController::class)->names('users');
        
        Route::resource('pelanggan', PelangganController::class)
            ->names('pelanggan')
            ->parameters(['pelanggan' => 'user'])
            ->except(['create', 'edit', 'store', 'update']);
        
        // Produk management
        Route::resource('produk', ProdukController::class);
        
        // Produk image management
        Route::prefix('produk/{produk}')->group(function () {
            Route::post('/upload', [ProdukGambarController::class, 'store'])->name('produk.upload');
            Route::put('/gambar', [ProdukController::class, 'uploadGambar'])->name('produk.upload-gambar');
            Route::post('/reorder-images', [ProdukGambarController::class, 'reorder'])->name('produk.reorder');
            Route::post('/set-thumbnail/{gambar}', [ProdukGambarController::class, 'setThumbnail'])->name('produk.set-thumbnail');
            Route::delete('/gambar/{gambar}', [ProdukGambarController::class, 'destroy'])->name('produk.delete-image');
        });

        Route::get('/transaksi', [TransaksiController::class, 'adminIndex'])->name('transaksi.index');
        Route::get('/transaksi/{transaksi:transaksi_id}', [TransaksiController::class, 'adminShow'])->name('transaksi.show');
        Route::patch('/transaksi/{transaksi:transaksi_id}/status', [TransaksiController::class, 'updateStatus'])->name('transaksi.updateStatus');
        Route::get('/transaksi/{transaksi:transaksi_id}/shipping-label-pdf', [TransaksiController::class, 'downloadShippingLabelPdf'])->name('transaksi.shippingLabelPdf');
    });
