<?php

namespace App\Exports;

use App\Models\Item;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class InventoryReportExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    public function __construct(
        private readonly ?int $categoryId = null,
        private readonly ?string $condition = null,
    ) {}

    public function query()
    {
        return Item::query()
            ->with('category')
            ->when($this->categoryId, fn ($q) => $q->where('category_id', $this->categoryId))
            ->when($this->condition,  fn ($q) => $q->where('condition', $this->condition))
            ->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Barang',
            'Kategori',
            'Brand',
            'Model',
            'Stok Tersedia',
            'Total Stok',
            'Stok Minimum',
            'Kondisi',
            'Lokasi',
            'Status',
            'Tanggal Ditambahkan',
        ];
    }

    /** @param Item $item */
    public function map($item): array
    {
        static $no = 0;
        $no++;

        $conditionMap = [
            'baik'         => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat'  => 'Rusak Berat',
        ];

        $condition = is_string($item->condition)
            ? ($conditionMap[$item->condition] ?? $item->condition)
            : ($conditionMap[$item->condition->value ?? ''] ?? '-');

        return [
            $no,
            $item->name,
            $item->category?->name ?? '-',
            $item->brand ?? '-',
            $item->model ?? '-',
            $item->stock,
            $item->stock_total,
            $item->stock_minimum,
            $condition,
            $item->location ?? '-',
            $item->is_available ? 'Aktif' : 'Nonaktif',
            $item->created_at->format('d/m/Y'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF0284C7']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Laporan Inventaris';
    }
}
