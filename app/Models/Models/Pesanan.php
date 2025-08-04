<?php

namespace App\Models\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pesanan extends Model
{
    use HasFactory;

    protected $table = 'pesanans';
    protected $primaryKey = 'pesanan_id';

    protected $fillable = [
        'pelanggan_id',
        'invoice_id',
        'total_belanja',
        'biaya_pengiriman',
        'total_keseluruhan',
        'status_pesanan',
        'status_pembayaran',
        'metode_pembayaran',
        'snap_token',
        'alamat_pengiriman_json',
        'catatan_pelanggan',
    ];

    protected $casts = [
        'alamat_pengiriman_json' => 'array',
        'total_belanja' => 'decimal:2',
        'biaya_pengiriman' => 'decimal:2',
        'total_keseluruhan' => 'decimal:2',
    ];

    public function pelanggan()
    {
        return $this->belongsTo(\App\Models\Pelanggan::class, 'pelanggan_id', 'pelanggan_id');
    }

    public function detailPesanans()
    {
        return $this->hasMany(\App\Models\Models\DetailPesanan::class, 'pesanan_id', 'pesanan_id');
    }
}
