<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProdukGambar extends Model
{
    protected $table = 'produk_gambar'; 
    protected $primaryKey = 'gambar_id';
    public $incrementing = true;
    
    protected $fillable = [
        'produk_id',
        'nama_file',
        'path',
        'is_thumbnail',
        'urutan'
    ];

    protected $casts = [
        'is_thumbnail' => 'boolean',
        'urutan' => 'integer'
    ];

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class, 'produk_id', 'produk_id');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->path);
    }

    protected static function boot()
    {
        parent::boot();

        // Ketika gambar dihapus, hapus juga file fisiknya
        static::deleting(function ($gambar) {
            if (file_exists(storage_path('app/public/' . $gambar->path))) {
                unlink(storage_path('app/public/' . $gambar->path));
            }
        });
    }
}
