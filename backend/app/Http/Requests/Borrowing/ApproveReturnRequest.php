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
            'return_notes'                                => 'nullable|string',

            'items'                                       => 'required|array|min:1',
            'items.*.borrowing_item_id'                   => 'required|integer|exists:borrowing_items,id',

            // Setiap item harus punya minimal satu entry kondisi
            'items.*.return_conditions'                   => 'required|array|min:1',
            'items.*.return_conditions.*.condition'       => 'required|in:baik,rusak_ringan,rusak_berat,hilang,terpakai',
            'items.*.return_conditions.*.quantity'        => 'required|integer|min:1',
            'items.*.return_conditions.*.notes'           => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                                        => 'Detail barang yang dikembalikan wajib disertakan.',
            'items.array'                                           => 'Format detail barang harus berupa list.',
            'items.min'                                             => 'Minimal satu barang harus disertakan.',
            'items.*.borrowing_item_id.required'                    => 'ID item peminjaman wajib disertakan.',
            'items.*.borrowing_item_id.exists'                      => 'Item peminjaman tidak valid.',
            'items.*.return_conditions.required'                    => 'Kondisi pengembalian wajib diisi untuk setiap barang.',
            'items.*.return_conditions.array'                       => 'Format kondisi pengembalian harus berupa list.',
            'items.*.return_conditions.min'                         => 'Minimal satu kondisi pengembalian harus diisi.',
            'items.*.return_conditions.*.condition.required'        => 'Jenis kondisi barang wajib diisi.',
            'items.*.return_conditions.*.condition.in'              => 'Kondisi barang tidak valid. Pilih salah satu: baik, rusak_ringan, rusak_berat, hilang, terpakai.',
            'items.*.return_conditions.*.quantity.required'         => 'Jumlah per kondisi wajib diisi.',
            'items.*.return_conditions.*.quantity.integer'          => 'Jumlah per kondisi harus berupa angka.',
            'items.*.return_conditions.*.quantity.min'              => 'Jumlah per kondisi minimal 1.',
        ];
    }
}
