<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ItemImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with('category', 'images');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        $items = $query->orderBy('name')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'      => 'required|exists:categories,id',
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'brand'            => 'nullable|string|max:100',
            'model'            => 'nullable|string|max:100',
            'type'             => 'sometimes|in:non_consumable,consumable',
            'stock_total'      => 'required|integer|min:0',
            'stock_minimum'    => 'required|integer|min:1',
            'condition'        => 'required|in:baik,rusak_ringan,rusak_berat',
            'location'         => 'nullable|string|max:100',
            'is_available'     => 'boolean',
            'cover_image'      => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'gallery_images.*' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
        ], [
            'type.in' => 'Jenis barang tidak valid. Pilih non_consumable atau consumable.',
        ]);

        $validated['slug']       = Str::slug($validated['name']) . '-' . uniqid();
        $validated['stock']      = $validated['stock_total'];
        $validated['stock_baik'] = $validated['stock_total']; // Stok awal semua dianggap baik

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('items/covers', 'public');
            $validated['image'] = $path;
        }

        $item = Item::create($validated);

        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $index => $image) {
                $path = $image->store("items/{$item->id}/gallery", 'public');
                ItemImage::create([
                    'item_id' => $item->id,
                    'path' => $path,
                    'order' => $index
                ]);
            }
        }

        $item->load('category', 'images');

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil ditambahkan',
            'data' => $item
        ], 201);
    }

    public function show(Item $item)
    {
        $item->load('category', 'images');
        return response()->json([
            'success' => true,
            'data' => $item
        ]);
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'category_id'      => 'required|exists:categories,id',
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'brand'            => 'nullable|string|max:100',
            'model'            => 'nullable|string|max:100',
            'type'             => 'sometimes|in:non_consumable,consumable',
            'stock_total'      => 'required|integer|min:0',
            'stock_minimum'    => 'required|integer|min:1',
            'condition'        => 'required|in:baik,rusak_ringan,rusak_berat',
            'location'         => 'nullable|string|max:100',
            'is_available'     => 'boolean',
            'cover_image'      => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'gallery_images.*' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
        ], [
            'type.in' => 'Jenis barang tidak valid. Pilih non_consumable atau consumable.',
        ]);

        // Untuk non_consumable: sesuaikan stock berdasarkan perubahan stock_total
        // Untuk consumable: stock_total tidak berubah dengan perubahan stock aktif, abaikan diff
        $itemType = $validated['type'] ?? $item->type;
        if ($itemType !== 'consumable') {
            $stockDiff           = $validated['stock_total'] - $item->stock_total;
            $validated['stock']  = max(0, $item->stock + $stockDiff);
            $validated['stock_baik'] = max(0, $item->stock_baik + $stockDiff);
        } else {
            // Untuk consumable, jangan ubah stock dan stock_baik melalui stock_total
            unset($validated['stock'], $validated['stock_baik']);
        }
        
        if ($request->has('name') && $request->name !== $item->name) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . uniqid();
        }

        if ($request->hasFile('cover_image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $path = $request->file('cover_image')->store('items/covers', 'public');
            $validated['image'] = $path;
        }

        $item->update($validated);

        if ($request->hasFile('gallery_images')) {
            $lastOrder = $item->images()->max('order') ?? 0;
            foreach ($request->file('gallery_images') as $index => $image) {
                $path = $image->store("items/{$item->id}/gallery", 'public');
                ItemImage::create([
                    'item_id' => $item->id,
                    'path' => $path,
                    'order' => $lastOrder + $index + 1
                ]);
            }
        }

        $item->load('category', 'images');

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diperbarui',
            'data' => $item
        ]);
    }

    public function destroy(Item $item)
    {
        // Delete cover image
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }
        
        // Delete gallery directory
        Storage::disk('public')->deleteDirectory("items/{$item->id}");

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }

    public function destroyImage(Item $item, ItemImage $image)
    {
        if ($image->item_id !== $item->id) {
            return response()->json(['success' => false, 'message' => 'Invalid image'], 403);
        }

        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Gambar berhasil dihapus'
        ]);
    }
}
