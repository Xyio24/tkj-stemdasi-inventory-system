<?php

namespace App\Http\Requests\Borrowing;

use Illuminate\Foundation\Http\FormRequest;

class ApproveReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'return_notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.borrowing_item_id' => 'required|exists:borrowing_items,id',
            'items.*.returned_quantity' => 'required|integer|min:0',
            'items.*.item_condition_in' => 'required|in:baik,rusak_ringan,rusak_berat',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Detail barang yang dikembalikan wajib disertakan.',
            'items.array' => 'Format detail barang harus berupa list.',
            'items.*.borrowing_item_id.required' => 'ID item peminjaman wajib disertakan.',
            'items.*.borrowing_item_id.exists' => 'Item peminjaman tidak valid.',
            'items.*.returned_quantity.required' => 'Jumlah barang yang dikembalikan wajib diisi.',
            'items.*.returned_quantity.integer' => 'Jumlah barang yang dikembalikan harus berupa angka.',
            'items.*.returned_quantity.min' => 'Jumlah barang yang dikembalikan minimal adalah 0.',
            'items.*.item_condition_in.required' => 'Kondisi barang saat kembali wajib diisi.',
            'items.*.item_condition_in.in' => 'Kondisi barang tidak valid, harus salah satu dari: baik, rusak_ringan, rusak_berat.',
        ];
    }
}
