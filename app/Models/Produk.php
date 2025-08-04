<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Produk extends Model
{
    use SoftDeletes;

    protected $table = 'produk';
    protected $primaryKey = 'produk_id';
    public $incrementing = true;
    
    protected $fillable = [
        'kode_produk',
        'nama_produk',
        'deskripsi',
        'harga',
        'stok',
        'berat',
        'kategori',
        'status_aktif'
    ];

    protected $casts = [
        'harga' => 'decimal:2',
        'berat' => 'decimal:2',
        'status_aktif' => 'boolean',
        'stok' => 'integer'
    ];

    protected $appends = ['rating', 'ulasan_count', 'terjual'];

    public function gambar()
    {
        return $this->hasMany(ProdukGambar::class, 'produk_id');
    }

    public function detailTransaksis()
    {
        return $this->hasMany(DetailTransaksi::class, 'produk_id', 'produk_id');
    }

    public function ulasan()
    {
        return $this->hasMany(Ulasan::class, 'produk_id', 'produk_id');
    }

    public function getGambarUtamaAttribute()
    {
        return $this->gambar()->where('is_thumbnail', true)->first() 
            ?? $this->gambar()->first();
    }

    public function getRatingAttribute()
    {
        return round($this->ulasan->avg('rating'), 1) ?? 0.0;
    }

    public function getUlasanCountAttribute()
    {
        return $this->ulasan->count();
    }

    public function getTerjualAttribute()
    {
        if (!$this->relationLoaded('detailTransaksis')) {
            return 0;
        }

        return $this->detailTransaksis
            ->where('transaksi.status_transaksi', 'selesai')
            ->sum('jumlah');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->kode_produk)) {
                $model->kode_produk = 'PRD-' . date('Ymd');
                
                $count = self::where('kode_produk', 'like', $model->kode_produk . '%')->count();
                if ($count > 0) {
                    $model->kode_produk .= '-' . ($count + 1);
                }
            }
        });
    }
}
