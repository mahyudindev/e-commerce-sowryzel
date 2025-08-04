<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ulasan extends Model
{
    protected $table = 'ulasan';
    protected $primaryKey = 'ulasan_id';

    protected $appends = ['nama_pengguna_samaran'];

    protected $fillable = [
        'produk_id',
        'user_id',
        'rating',
        'komentar',
        'detail_transaksi_id',
    ];

    /**
     * Get the product that owns the review.
     */
    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_id', 'produk_id');
    }

    /**
     * Get the user that created the review.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Get the sanitized name of the user who created the review.
     *
     * @return string
     */
    public function getNamaPenggunaSamaranAttribute()
    {
      
        $namaLengkap = $this->user?->pelanggan?->nama_lengkap;


        if (!$namaLengkap) {
            return 'Pengguna';
        }

        if (mb_strlen($namaLengkap) <= 2) {
            return $namaLengkap;
        }

        $length = mb_strlen($namaLengkap);
        $firstChar = mb_substr($namaLengkap, 0, 1);
        $lastChar = mb_substr($namaLengkap, -1, 1);
        $middle = str_repeat('*', $length - 2);

        return $firstChar . $middle . $lastChar;
    }
}
