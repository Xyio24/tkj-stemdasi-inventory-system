<?php

namespace App\Http\Requests\Borrowing;

use Illuminate\Foundation\Http\FormRequest;

class RejectBorrowingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => 'required|string|min:10',
        ];
    }

    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Alasan penolakan pengajuan wajib diisi.',
            'rejection_reason.min' => 'Alasan penolakan minimal harus berisi 10 karakter.',
        ];
    }
}
