<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Display a listing of the admin users.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $query = User::with('admin')->where('role', 'admin');
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhereHas('admin', function($q) use ($search) {
                      $q->where('nama_lengkap', 'like', "%{$search}%")
                        ->orWhere('no_telepon', 'like', "%{$search}%");
                  });
            });
        }
        
        $admins = $query->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at->format('d M Y'),
                    'admin' => $user->admin ? [
                        'nama_lengkap' => $user->admin->nama_lengkap,
                        'jabatan' => $user->admin->jabatan,
                        'no_telepon' => $user->admin->no_telepon,
                    ] : null,
                ];
            });

        return Inertia::render('admin/users/index', [
            'admins' => $admins,
        ]);
    }

    /**
     * Show the form for creating a new admin user.
     */
    public function create()
    {
        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created admin user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'jabatan' => ['required', 'string', 'in:admin,owner'],
            'no_telepon' => ['required', 'string', 'max:20'],
            'deskripsi_jabatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'string', 'in:0,1'],
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'admin',
                'is_active' => isset($validated['is_active']) ? $validated['is_active'] === '1' : true,
            ]);

            $adminData = [
                'nama_lengkap' => $validated['nama_lengkap'],
                'jabatan' => $validated['jabatan'],
                'no_telepon' => $validated['no_telepon'],
                'deskripsi_jabatan' => $validated['deskripsi_jabatan'] ?? null,
            ];



            $user->admin()->create($adminData);

            DB::commit();

            return redirect()->route('admin.users.index')
                ->with('success', 'Admin berhasil ditambahkan');
                
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating admin: ' . $e->getMessage());
            return back()->with('error', 'Gagal menambahkan admin. Silakan coba lagi.');
        }
    }

    /**
     * Display the specified admin user.
     */
    public function show(User $user)
    {
        $user->load('admin');
        
        return Inertia::render('admin/users/show', [
            'admin' => [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at->format('d M Y'),
                'updated_at' => $user->updated_at->format('d M Y'),
                'admin' => $user->admin ? [
                    'nama_lengkap' => $user->admin->nama_lengkap,
                    'jabatan' => $user->admin->jabatan,
                    'no_telepon' => $user->admin->no_telepon,
                    'foto_profil' => $user->admin->foto_profil,
                    'deskripsi_jabatan' => $user->admin->deskripsi_jabatan,
                ] : null,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified admin user.
     */
    public function edit(User $user)
    {
        $user->load('admin');
        
        return Inertia::render('admin/users/edit', [
            'admin' => [
                'user_id' => $user->user_id,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'admin' => $user->admin ? [
                    'nama_lengkap' => $user->admin->nama_lengkap,
                    'jabatan' => $user->admin->jabatan,
                    'no_telepon' => $user->admin->no_telepon,
                    'deskripsi_jabatan' => $user->admin->deskripsi_jabatan,
                ] : null,
            ],
        ]);
    }

    /**
     * Update the specified admin user in storage.
     */
    public function update(Request $request, User $user)
    {
        // Log the incoming request data
        \Log::info('Update request for user_id: ' . $user->user_id, [
            'request_data' => $request->all(),
            'method' => $request->method()
        ]);
        
      
        $rules = [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->user_id, 'user_id'),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'jabatan' => ['required', 'string', 'in:admin,owner'],
            'no_telepon' => ['required', 'string', 'max:20'],
            'deskripsi_jabatan' => ['nullable', 'string'],
            'is_active' => ['nullable', 'string', 'in:0,1'],
        ];
        
        $validated = $request->validate($rules);
        

        try {
            DB::beginTransaction();

            $userData = [];
            

            if (isset($validated['email'])) {
                $userData['email'] = $validated['email'];
            }
            
            if (isset($validated['is_active'])) {
                $userData['is_active'] = $validated['is_active'] === '1';
            }

            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            if (!empty($userData)) {
                $user->update($userData);
            }

            $adminData = [];
            
            if (isset($validated['nama_lengkap'])) {
                $adminData['nama_lengkap'] = $validated['nama_lengkap'];
            }
            
            if (isset($validated['jabatan'])) {
                $adminData['jabatan'] = $validated['jabatan'];
            }
            
            if (isset($validated['no_telepon'])) {
                $adminData['no_telepon'] = $validated['no_telepon'];
            }
            
            if (isset($validated['deskripsi_jabatan'])) {
                $adminData['deskripsi_jabatan'] = $validated['deskripsi_jabatan'];
            }

            if ($user->admin) {
                $admin = $user->admin;
                
                foreach ($adminData as $key => $value) {
                    $admin->{$key} = $value;
                }
                
                $saveResult = $admin->save();
                
            } else {
                $admin = $user->admin()->create($adminData);
                
            }

            DB::commit();

            return redirect()->route('admin.users.index')
                ->with('success', 'Data admin berhasil diperbarui');
                
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating admin: ' . $e->getMessage());
            return back()->with('error', 'Gagal memperbarui data admin. Silakan coba lagi.');
        }
    }

    /**
     * Remove the specified admin user from storage.
     */
    public function destroy(User $user)
    {
        if (auth()->id() === $user->user_id) {
            return back()->with('error', 'Tidak dapat menghapus akun sendiri');
        }

        try {
            DB::beginTransaction();

            if ($user->admin?->foto_profil) {
                Storage::disk('public')->delete($user->admin->foto_profil);
            }
            if ($user->admin) {
                $user->admin()->delete();
            }

            $user->delete();

            DB::commit();

            return redirect()->route('admin.users.index')
                ->with('success', 'Admin berhasil dihapus');
                
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting admin: ' . $e->getMessage());
            return back()->with('error', 'Gagal menghapus admin. Silakan coba lagi.');
        }
    }
}
