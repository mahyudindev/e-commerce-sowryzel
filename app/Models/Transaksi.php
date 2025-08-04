<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    public const STATUS_TRANSAKSI_OPTIONS = [
        'pending' => 'Pending',
        'dikemas' => 'Dikemas',
        'dikirim' => 'Dikirim',
        'selesai' => 'Selesai',
        'batal' => 'Batal',
    ];

    public const ALLOWED_TRANSITIONS = [
        'pending' => ['dikemas', 'batal'],
        'dikemas' => ['dikirim', 'batal'],
        'dikirim' => ['selesai'], 
        'batal' => [], 
        'selesai' => [], 
    ];

    public const STATUS_PEMBAYARAN_OPTIONS = [
        'unpaid' => 'Belum Dibayar',
        'paid' => 'Dibayar',
        'pending' => 'Menunggu Pembayaran',
        'failed' => 'Gagal',
        'expired' => 'Kedaluwarsa',
        'cancelled' => 'Dibatalkan',
        'denied' => 'Ditolak',
    ];

    protected $table = 'transaksi';
    protected $primaryKey = 'transaksi_id';

    protected $fillable = [
        'pelanggan_id',
        'invoice_id',
        'total_belanja',
        'biaya_pengiriman',
        'total_keseluruhan',
        'status_transaksi',
        'status_pembayaran',
        'metode_pembayaran',
        'snap_token',
        'midtrans_transaction_id',
        'alamat_pengiriman_json',
        'catatan_pelanggan',
        'total_berat',
    ];

    protected $casts = [
        'total_belanja' => 'decimal:2',
        'biaya_pengiriman' => 'decimal:2',
        'total_keseluruhan' => 'decimal:2',
        'alamat_pengiriman_json' => 'array',
        'total_berat' => 'integer',
    ];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id', 'pelanggan_id');
    }

    public function detailTransaksis()
    {
        return $this->hasMany(DetailTransaksi::class, 'transaksi_id', 'transaksi_id');
    }
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
