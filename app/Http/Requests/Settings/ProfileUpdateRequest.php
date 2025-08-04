<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($this->user()->user_id, 'user_id'),
            ],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'no_telepon' => ['required', 'string', 'max:20'],
        ];
        
        if ($this->user()->isPelanggan()) {
            $rules = array_merge($rules, [
                'alamat' => ['required', 'string'],
                'kode_pos' => ['nullable', 'string', 'max:10'],
            ]);
        } elseif ($this->user()->isAdmin()) {
            $rules = array_merge($rules, [
                'jabatan' => ['required', 'string', 'max:100'],
                'deskripsi_jabatan' => ['nullable', 'string'],
            ]);
        }
        
        return $rules;
    }
}
