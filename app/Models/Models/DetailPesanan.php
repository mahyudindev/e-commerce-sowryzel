<?php

namespace App\Models\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DetailPesanan extends Model
{
    use HasFactory;

    protected $table = 'detail_pesanans';
    protected $primaryKey = 'detail_pesanan_id';

    protected $fillable = [
        'pesanan_id',
        'produk_id',
        'nama_produk',
        'jumlah',
        'harga_satuan',
        'subtotal',
    ];

    protected $casts = [
        'harga_satuan' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function pesanan()
    {
        return $this->belongsTo(\App\Models\Models\Pesanan::class, 'pesanan_id', 'pesanan_id');
    }

    public function produk()
    {
        return $this->belongsTo(\App\Models\Produk::class, 'produk_id', 'produk_id');
    }
}
