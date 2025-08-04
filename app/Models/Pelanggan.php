<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pelanggan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pelanggan';
    
    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'pelanggan_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'no_telepon',
        'alamat',
        'kode_pos',
    ];
    
    /**
     * The attributes that should be guarded.
     *
     * @var array<string>
     */
    protected $guarded = [];

    /**
     * Get the user that owns the pelanggan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
