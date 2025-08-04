<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pelanggan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PelangganController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $query = User::with('pelanggan')
            ->where('role', 'pelanggan');
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhereHas('pelanggan', function($q) use ($search) {
                      $q->where('nama_lengkap', 'like', "%{$search}%")
                        ->orWhere('no_telepon', 'like', "%{$search}%");
                  });
            });
        }
        
        $pelanggans = $query->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at->format('d M Y'),
                    'pelanggan' => $user->pelanggan ? [
                        'pelanggan_id' => $user->pelanggan->pelanggan_id,
                        'nama_lengkap' => $user->pelanggan->nama_lengkap,
                        'no_telepon' => $user->pelanggan->no_telepon,
                        'alamat' => $user->pelanggan->alamat,
                        'tipe_alamat' => $user->pelanggan->tipe_alamat,
                    ] : null,
                ];
            });

        return Inertia::render('admin/pelanggan/index', [
            'pelanggans' => $pelanggans,
        ]);
    }

    public function show(User $user)
    {
        $user->load('pelanggan');
        
        return Inertia::render('admin/pelanggan/show', [
            'pelanggan' => [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at ? $user->created_at->format('d M Y') : null,
                'updated_at' => $user->updated_at ? $user->updated_at->format('d M Y') : null,
                'pelanggan' => $user->pelanggan ? [
                    'pelanggan_id' => $user->pelanggan->pelanggan_id,
                    'nama_lengkap' => $user->pelanggan->nama_lengkap,
                    'no_telepon' => $user->pelanggan->no_telepon,
                    'alamat' => $user->pelanggan->alamat,
                    'tipe_alamat' => $user->pelanggan->tipe_alamat,
                    'kota' => $user->pelanggan->kota,
                    'kode_pos' => $user->pelanggan->kode_pos,
                ] : null,
            ],
        ]);
    }

    public function edit(User $user)
    {
        $user->load('pelanggan');
        
        return Inertia::render('admin/pelanggan/edit', [
            'pelanggan' => [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'pelanggan' => $user->pelanggan ? [
                    'nama_lengkap' => $user->pelanggan->nama_lengkap,
                    'no_telepon' => $user->pelanggan->no_telepon,
                    'alamat' => $user->pelanggan->alamat,
                    'tipe_alamat' => $user->pelanggan->tipe_alamat,
                    'kota' => $user->pelanggan->kota,
                    'kode_pos' => $user->pelanggan->kode_pos,
                ] : null,
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $rules = [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email,' . $user->user_id . ',user_id',
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'no_telepon' => ['required', 'string', 'max:20'],
            'alamat' => ['required', 'string'],
            'tipe_alamat' => ['required', 'string', 'in:Rumah,Kantor,Kos'],
            'kota' => ['nullable', 'string'],
            'kode_pos' => ['nullable', 'string', 'max:10'],
            'is_active' => ['required', 'boolean'],
        ];
        
        $validated = $request->validate($rules);

        try {
            DB::beginTransaction();

            $userData = [
                'email' => $validated['email'],
                'is_active' => $validated['is_active'],
            ];

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            $user->update($userData);

            $pelangganData = [
                'nama_lengkap' => $validated['nama_lengkap'],
                'no_telepon' => $validated['no_telepon'],
                'alamat' => $validated['alamat'],
                'tipe_alamat' => $validated['tipe_alamat'],
                'kota' => $validated['kota'] ?? null,
                'kode_pos' => $validated['kode_pos'] ?? null,
            ];

            if ($user->pelanggan) {
                $user->pelanggan()->update($pelangganData);
            } else {
                $user->pelanggan()->create($pelangganData);
            }

            DB::commit();

            return redirect()->route('admin.pelanggan.index')
                ->with('success', 'Data pelanggan berhasil diperbarui');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memperbarui data pelanggan. Silakan coba lagi.');
        }
    }

    public function destroy(User $user)
    {
        try {
            DB::beginTransaction();

            if ($user->pelanggan) {
                $user->pelanggan()->delete();
            }

            $user->delete();

            DB::commit();

            return redirect()->route('admin.pelanggan.index')
                ->with('success', 'Pelanggan berhasil dihapus');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus pelanggan. Silakan coba lagi.');
        }
    }
}
