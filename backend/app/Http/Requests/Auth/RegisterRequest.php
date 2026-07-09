<?php

namespace App\Http\Requests\Auth;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],

            'password' => ['required', 'string', 'min:8', 'confirmed'],

            'class_id' => [
                'required',
                'integer',
                Rule::exists('student_classes', 'id')->where(function ($query) {
                    // Hanya kelas dari angkatan yang aktif
                    $activeYearIds = AcademicYear::where('is_active', true)->pluck('id');
                    $query->whereIn('academic_year_id', $activeYearIds);
                }),
            ],

            'absen_number' => [
                'required',
                'integer',
                'min:1',
                'max:99',
                // Unik per kelas — pastikan tidak ada user lain dengan absen+kelas sama
                Rule::unique('users', 'absen_number')->where(
                    fn ($query) => $query->where('class_id', $this->input('class_id'))
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'Nama lengkap wajib diisi.',
            'email.required'         => 'Email wajib diisi.',
            'email.email'            => 'Format email tidak valid.',
            'email.unique'           => 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.',
            'password.required'      => 'Password wajib diisi.',
            'password.min'           => 'Password minimal harus 8 karakter.',
            'password.confirmed'     => 'Konfirmasi password tidak cocok.',
            'class_id.required'      => 'Kelas wajib dipilih.',
            'class_id.exists'        => 'Kelas yang dipilih tidak valid atau bukan dari angkatan aktif.',
            'absen_number.required'  => 'Nomor absen wajib diisi.',
            'absen_number.integer'   => 'Nomor absen harus berupa angka.',
            'absen_number.min'       => 'Nomor absen minimal 1.',
            'absen_number.max'       => 'Nomor absen maksimal 99.',
            'absen_number.unique'    => 'Nomor absen ini sudah digunakan di kelas yang sama.',
        ];
    }
}
