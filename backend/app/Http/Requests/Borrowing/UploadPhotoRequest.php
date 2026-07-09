<?php

namespace App\Http\Requests\Borrowing;

use Illuminate\Foundation\Http\FormRequest;

class UploadPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'type' => 'required|in:borrow,return',
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'File foto bukti wajib diunggah.',
            'photo.image' => 'File yang diunggah harus berupa gambar.',
            'photo.mimes' => 'Format foto yang diizinkan hanya: jpeg, png, jpg, webp.',
            'photo.max' => 'Ukuran foto maksimal adalah 5 MB.',
            'type.required' => 'Tipe foto bukti wajib disertakan.',
            'type.in' => 'Tipe foto tidak valid, harus salah satu dari: borrow, return.',
        ];
    }
}
