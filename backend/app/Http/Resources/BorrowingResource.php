<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'status' => $this->status,
            'purpose' => $this->purpose,
            'notes' => $this->notes,
            'borrow_date' => $this->borrow_date->format('Y-m-d'),
            'expected_return_date' => $this->expected_return_date->format('Y-m-d'),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'returned_at' => $this->returned_at?->toIso8601String(),
            'return_approved_at' => $this->return_approved_at?->toIso8601String(),
            'return_notes' => $this->return_notes,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'role' => $this->user->role,
                    'avatar' => $this->user->avatar,
                ];
            }),
            'approved_by' => $this->whenLoaded('approvedBy', function () {
                return [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                    'role' => $this->approvedBy->role,
                ];
            }),
            'return_approved_by' => $this->whenLoaded('returnApprovedBy', function () {
                return [
                    'id' => $this->returnApprovedBy->id,
                    'name' => $this->returnApprovedBy->name,
                    'role' => $this->returnApprovedBy->role,
                ];
            }),
            'items' => $this->whenLoaded('items', function () {
                // Ambil returnConditions via borrowingItems jika sudah di-load
                $returnConditionsMap = [];
                if ($this->relationLoaded('borrowingItems')) {
                    foreach ($this->borrowingItems as $bi) {
                        if ($bi->relationLoaded('returnConditions')) {
                            $returnConditionsMap[$bi->id] = $bi->returnConditions->map(fn ($rc) => [
                                'id'        => $rc->id,
                                'condition' => $rc->condition,
                                'quantity'  => $rc->quantity,
                                'notes'     => $rc->notes,
                            ])->values();
                        }
                    }
                }

                return $this->items->map(function ($item) use ($returnConditionsMap) {
                    $pivotId = $item->pivot->id;
                    return [
                        'id'                 => $item->id,
                        'name'               => $item->name,
                        'slug'               => $item->slug,
                        'brand'              => $item->brand,
                        'model'              => $item->model,
                        'image'              => $item->image,
                        'type'               => $item->type,
                        'quantity'           => $item->pivot->quantity,
                        'returned_quantity'  => $item->pivot->returned_quantity,
                        'item_condition_out' => $item->pivot->item_condition_out,
                        'item_condition_in'  => $item->pivot->item_condition_in,
                        'borrowing_item_id'  => $pivotId,
                        'notes'              => $item->pivot->notes,
                        'return_conditions'  => $returnConditionsMap[$pivotId] ?? [],
                    ];
                });
            }),
            'photos' => $this->whenLoaded('photos', function () {
                return $this->photos->map(function ($photo) {
                    // path disimpan sebagai path relatif terhadap disk 'public',
                    // contoh: "borrowings/{id}/{type}/filename.jpg"
                    // Bangun full URL: APP_URL + "/storage/" + path
                    // Fallback untuk data lama yang mungkin sudah berisi URL parsial.
                    $path = $photo->path;
                    if (str_starts_with($path, '/storage/')) {
                        $url = config('app.url') . $path;
                    } elseif (str_starts_with($path, 'storage/')) {
                        $url = config('app.url') . '/' . $path;
                    } elseif (str_starts_with($path, 'http')) {
                        $url = $path;
                    } else {
                        // Path relatif disk public → tambahkan /storage/ prefix
                        $url = config('app.url') . '/storage/' . $path;
                    }

                    return [
                        'id'            => $photo->id,
                        'type'          => $photo->type,
                        'path'          => $photo->path,
                        'url'           => $url,
                        'original_name' => $photo->original_name,
                        'uploaded_at'   => $photo->created_at->toIso8601String(),
                    ];
                });
            }),
        ];
    }
}
