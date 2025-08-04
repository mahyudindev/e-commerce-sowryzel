<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'nama_lengkap' => 'required|string|max:255',
            'no_telepon' => 'required|string|max:20',
            'alamat' => 'nullable|string',
            'kode_pos' => 'nullable|string|max:10',
        ]);
        
        try {
            DB::beginTransaction();
            
            $userData = [
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'pelanggan',
                'is_active' => true
            ];
            
            $user = User::create($userData);
            
            $pelangganData = [
                'user_id' => $user->user_id,
                'nama_lengkap' => $request->nama_lengkap,
                'no_telepon' => $request->no_telepon,
                'alamat' => $request->alamat,
                'kode_pos' => $request->kode_pos,
            ];
            
            Pelanggan::create($pelangganData);
            
            DB::commit();
            
            event(new Registered($user));
            Auth::login($user);
            
            return to_route('pelanggan.dashboard');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            if (config('app.env') === 'local' || config('app.debug')) {
                return back()->withErrors([
                    'email' => 'Error: ' . $e->getMessage(),
                ]);
            }
            
            return back()->withErrors([
                'email' => 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.',
            ]);
        }
    }
}
