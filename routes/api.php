<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RajaOngkirController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Di sini Anda dapat mendaftarkan rute API untuk aplikasi Anda. Rute-rute
| ini dimuat oleh RouteServiceProvider dan semuanya akan
| ditugaskan ke grup middleware "api". Buat sesuatu yang hebat!
|
*/


Route::prefix('rajaongkir')->group(function () {
    Route::get('/provinces', [RajaOngkirController::class, 'getProvinces'])->name('api.rajaongkir.provinces');
    Route::get('/cities', [RajaOngkirController::class, 'getCities'])->name('api.rajaongkir.cities'); // Membutuhkan province_id sebagai query parameter
    Route::post('/shipping-cost', [RajaOngkirController::class, 'calculateShippingCost'])->name('api.rajaongkir.shipping-cost');
});

Route::get('/test-route', function () {
    return response()->json(['message' => 'Test Wey']);
});

