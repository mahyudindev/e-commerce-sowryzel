<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use App\Models\ProdukGambar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProdukController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $kategori = $request->input('kategori');

        $query = Produk::with(['gambar' => function($query) {
            $query->orderBy('urutan', 'asc');
        }])
        ->when($search, function($q) use ($search) {
            $q->where('nama_produk', 'like', "%{$search}%")
              ->orWhere('kode_produk', 'like', "%{$search}%");
        })
        ->when($kategori && $kategori !== 'all', function($q) use ($kategori) {
            $q->where('kategori', $kategori);
        })
        ->orderBy('created_at', 'desc');

        $produk = $query->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/produk/index', [
            'produk' => $produk,
            'filters' => $request->only(['search', 'kategori', 'per_page']),
            'kategoriOptions' => Produk::select('kategori')->distinct()->pluck('kategori')->filter()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/produk/create', [
            'kategoriOptions' => Produk::select('kategori')->distinct()->pluck('kategori')->filter()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:200',
            'deskripsi' => 'nullable|string',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'berat' => 'required|numeric|min:0',
            'kategori' => 'required|string|max:100',
            'aktif' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            if (isset($validated["aktif"])) {
                $validated["status_aktif"] = $validated["aktif"];
                unset($validated["aktif"]);
            }
            
            $produk = Produk::create($validated);

            if ($request->hasFile('gambar')) {
                $this->handleUploadGambar($request, $produk);
            }

            DB::commit();

            return redirect()->route('admin.produk.index')
                ->with('success', 'Produk berhasil ditambahkan');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menambahkan produk: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Produk $produk)
    {
        return Inertia::render('admin/produk/show', [
            'produk' => $produk->load(['gambar' => function($query) {
                $query->orderBy('urutan', 'asc');
            }])
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Produk $produk)
    {
        return Inertia::render('admin/produk/edit', [
            'produk' => $produk->load('gambar'),
            'kategoriOptions' => Produk::select('kategori')->distinct()->pluck('kategori')->filter()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'nama_produk' => 'required|string|max:200',
            'deskripsi' => 'nullable|string',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'berat' => 'required|numeric|min:0',
            'kategori' => 'required|string|max:100',
            'aktif' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            if (isset($validated["aktif"])) {
                $validated["status_aktif"] = $validated["aktif"];
                unset($validated["aktif"]);
            }
            
            $produk->update($validated);
            
            if ($request->hasFile('gambar')) {
                $this->handleUploadGambar($request, $produk);
            }

            DB::commit();

            return redirect()->route('admin.produk.index')
                ->with('success', 'Produk berhasil diperbarui');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui produk: ' . $e->getMessage());
        }
    }

    /**
     * Upload product images.
     */
    public function uploadImage(Request $request, Produk $produk)
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
    public function reorderImages(Request $request, Produk $produk)
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
    public function deleteImage(Produk $produk, ProdukGambar $gambar)
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

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Produk $produk)
    {
        try {
            DB::beginTransaction();
            
            // Hapus gambar terkait
            foreach ($produk->gambar as $gambar) {
                Storage::delete('public/produk/' . $gambar->file_gambar);
                $gambar->delete();
            }

            $produk->delete();

            DB::commit();

            return redirect()->route('admin.produk.index')
                ->with('success', 'Produk berhasil dihapus');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus produk: ' . $e->getMessage());
        }
    }
    
    /**
     * Handle upload gambar produk
     */
    private function handleUploadGambar(Request $request, Produk $produk)
    {
        if (!$request->hasFile('gambar')) {
            return;
        }
        
        $gambarFiles = $request->file('gambar');
        if (!is_array($gambarFiles)) {
            $gambarFiles = [$gambarFiles];
        }
        
        foreach ($gambarFiles as $index => $gambarFile) {
            // Generate nama unik untuk file
            $namaFile = Str::uuid() . '.' . $gambarFile->extension();
            
            // Simpan file ke storage (menggunakan format yang sama dengan uploadImage)
            $path = $gambarFile->storeAs('produk', $namaFile, 'public');
            
            // Hitung urutan berikutnya
            $urutanTerakhir = $produk->gambar()->max('urutan') ?? 0;
            
            // Cek batas maksimal gambar (4 gambar per produk)
            $jumlahGambarSaatIni = $produk->gambar()->count();
            if ($jumlahGambarSaatIni + $index >= 4) {
                // Lewati jika sudah mencapai batas 4 gambar
                continue;
            }
            
            // Simpan data gambar ke database
            $produk->gambar()->create([
                'nama_file' => $namaFile,
                'path' => $path, // Menggunakan path yang dikembalikan oleh storeAs
                'urutan' => $urutanTerakhir + $index + 1,
                'is_thumbnail' => ($index === 0 && $urutanTerakhir === 0) ? true : false,
            ]);
        }
    }
    
    /**
     * Upload gambar produk via AJAX/API (endpoint terpisah untuk upload gambar)
     */
    public function uploadGambar(Request $request, Produk $produk)
    {
        // Hanya validasi gambar, jangan validasi field produk lainnya
        $request->validate([
            'gambar' => 'required|array',
            'gambar.*' => 'image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);
        
        try {
            DB::beginTransaction();
            
            $this->handleUploadGambar($request, $produk);
            
            DB::commit();
            
            // Return JSON response untuk AJAX request
            return response()->json([
                'success' => true,
                'message' => 'Gambar produk berhasil ditambahkan'
            ]);
                
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah gambar: ' . $e->getMessage()
            ], 422);
        }
    }
}
