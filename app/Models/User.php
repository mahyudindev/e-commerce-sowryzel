<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;
    
    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'user_id';
    

    
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['nama'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'is_active',
        'last_login_at',
    ];
    
    /**
     * The attributes that should be guarded.
     *
     * @var array<string>
     */
    protected $guarded = [];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }
    
    /**
     * Get the pelanggan record associated with the user.
     */
    public function pelanggan()
    {
        return $this->hasOne(Pelanggan::class, 'user_id', 'user_id');
    }
    
    /**
     * Get the admin record associated with the user.
     */
    public function admin()
    {
        return $this->hasOne(Admin::class, 'user_id', 'user_id');
    }

    /**
     * Get the reviews for the user.
     */
    public function ulasan()
    {
        return $this->hasMany(Ulasan::class, 'user_id', 'user_id');
    }
    
    /**
     * Check if the user is a pelanggan.
     */
    public function isPelanggan()
    {
        return $this->role === 'pelanggan';
    }
    
    /**
     * Check if the user is an admin.
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }
    
    /**
     * Get the user's name from the pelanggan relationship.
     *
     * @return string|null
     */
    public function getNamaAttribute()
    {
        return $this->pelanggan ? $this->pelanggan->nama_lengkap : null;
    }
}
