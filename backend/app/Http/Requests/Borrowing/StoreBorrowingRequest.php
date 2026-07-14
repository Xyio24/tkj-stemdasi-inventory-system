<?php

namespace App\Http\Requests\Borrowing;

use Illuminate\Foundation\Http\FormRequest;

class StoreBorrowingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Handled by policies or auth middleware, return true here
        return true;
    }

    public function rules(): array
    {
        return [
            'purpose' => 'required|string|min:5',
            'borrow_date' => 'required|date|after_or_equal:today',
            'expected_return_date' => 'required|date|after:borrow_date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'purpose.required' => 'Tujuan peminjaman wajib diisi.',
            'purpose.min' => 'Tujuan peminjaman minimal harus berisi 5 karakter.',
            'borrow_date.required' => 'Tanggal rencana pinjam wajib diisi.',
            'borrow_date.after_or_equal' => 'Tanggal rencana pinjam tidak boleh berada di masa lalu.',
            'expected_return_date.required' => 'Tanggal rencana kembali wajib diisi.',
            'expected_return_date.after' => 'Tanggal rencana kembali harus setelah tanggal rencana pinjam.',
            'items.required' => 'Minimal harus memilih satu barang untuk dipinjam.',
            'items.min' => 'Minimal harus memilih satu barang untuk dipinjam.',
            'items.*.item_id.required' => 'ID barang wajib disertakan.',
            'items.*.item_id.exists' => 'Barang yang dipilih tidak valid atau tidak ditemukan.',
            'items.*.quantity.required' => 'Jumlah barang wajib ditentukan.',
            'items.*.quantity.integer' => 'Jumlah barang harus berupa angka.',
            'items.*.quantity.min' => 'Jumlah barang minimal adalah 1.',
        ];
    }
}
