<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ulasan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class UlasanController extends Controller
{
    public function storeBatch(Request $request)
    {
        Log::info('Ulasan Store Batch Request:', $request->all());

        $validator = Validator::make($request->all(), [
            'reviews' => 'required|array',
            'reviews.*.produk_id' => 'required|exists:produk,produk_id',
            'reviews.*.detail_transaksi_id' => 'required|exists:detail_transaksi,detail_transaksi_id',
            'reviews.*.rating' => 'required|integer|min:1|max:5',
            'reviews.*.komentar' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $user = Auth::user();

        foreach ($request->reviews as $reviewData) {
            // Pastikan detail transaksi ini milik user yang sedang login
            $detailTransaksi = \App\Models\DetailTransaksi::with('transaksi')
                ->find($reviewData['detail_transaksi_id']);

            if (!$detailTransaksi || $detailTransaksi->transaksi->pelanggan_id !== $user->pelanggan->pelanggan_id) {
                // Lewati atau berikan error jika tidak sesuai
                continue;
            }

            Ulasan::updateOrCreate(
                [
                    'detail_transaksi_id' => $reviewData['detail_transaksi_id'],
                ],
                [
                    'user_id' => $user->user_id,
                    'produk_id' => $reviewData['produk_id'],
                    'rating' => $reviewData['rating'],
                    'komentar' => $reviewData['komentar'] ?? null,
                ]
            );
        }

        return redirect()->back()->with('success', 'Ulasan berhasil disimpan.');
    }

    //
}
