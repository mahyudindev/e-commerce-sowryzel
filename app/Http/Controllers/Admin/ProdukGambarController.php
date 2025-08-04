<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use App\Models\ProdukGambar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProdukGambarController extends Controller
{
    /**
     * Upload product image.
     */
    public function store(Request $request, Produk $produk)
    {
        $request->validate([
            'gambar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_thumbnail' => 'sometimes|boolean'
        ]);

        try {
            DB::beginTransaction();

            $file = $request->file('gambar');
            $filename = Str::random(20) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('produk', $filename, 'public');

            $isThumbnail = $request->boolean('is_thumbnail', $produk->gambar()->count() === 0);

            // Jika mengatur gambar baru sebagai thumbnail, reset thumbnail sebelumnya
            if ($isThumbnail) {
                $produk->gambar()->update(['is_thumbnail' => false]);
            }

            $gambar = $produk->gambar()->create([
                'nama_file' => $file->getClientOriginalName(),
                'path' => $path,
                'is_thumbnail' => $isThumbnail,
                'urutan' => $produk->gambar()->count() + 1
            ]);

            DB::commit();

            return back()->with('success', 'Gambar berhasil diunggah');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal mengunggah gambar: ' . $e->getMessage());
        }
    }

    /**
     * Set image as thumbnail.
     */
    public function setThumbnail(Produk $produk, ProdukGambar $gambar)
    {
        if ($gambar->produk_id !== $produk->produk_id) {
            return back()->with('error', 'Gambar tidak ditemukan untuk produk ini');
        }

        try {
            DB::beginTransaction();

            // Reset semua thumbnail
            $produk->gambar()->update(['is_thumbnail' => false]);
            
            // Set thumbnail baru
            $gambar->update(['is_thumbnail' => true]);

            DB::commit();

            return back()->with('success', 'Thumbnail berhasil diubah');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal mengubah thumbnail: ' . $e->getMessage());
        }
    }

    /**
     * Reorder product images.
     */
    public function reorder(Request $request, Produk $produk)
    {
        $request->validate([
            'gambar_ids' => 'required|array',
            'gambar_ids.*' => 'exists:produk_gambar,gambar_id,produk_id,' . $produk->produk_id
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->gambar_ids as $index => $gambarId) {
                $produk->gambar()
                    ->where('gambar_id', $gambarId)
                    ->update(['urutan' => $index + 1]);
            }

            DB::commit();

            return back()->with('success', 'Urutan gambar berhasil diperbarui');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui urutan gambar: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified image.
     */
    public function destroy(Produk $produk, ProdukGambar $gambar)
    {
        if ($gambar->produk_id !== $produk->produk_id) {
            return back()->with('error', 'Gambar tidak ditemukan untuk produk ini');
        }

        try {
            DB::beginTransaction();

            // Hapus file fisik
            if (Storage::disk('public')->exists($gambar->path)) {
                Storage::disk('public')->delete($gambar->path);
            }

            $gambar->delete();

            // Jika yang dihapus adalah thumbnail, set gambar pertama sebagai thumbnail baru
            if ($gambar->is_thumbnail && $produk->gambar()->count() > 0) {
                $produk->gambar()
                    ->where('gambar_id', '!=', $gambar->gambar_id)
                    ->orderBy('urutan')
                    ->first()
                    ?->update(['is_thumbnail' => true]);
            }

            DB::commit();

            return back()->with('success', 'Gambar berhasil dihapus');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus gambar: ' . $e->getMessage());
        }
    }
}
