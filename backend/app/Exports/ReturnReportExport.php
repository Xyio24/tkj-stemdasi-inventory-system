<?php

namespace App\Exports;

use App\Models\Borrowing;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ReturnReportExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    public function __construct(
        private readonly ?string $dateFrom = null,
        private readonly ?string $dateTo = null,
    ) {}

    public function query()
    {
        return Borrowing::query()
            ->with(['user', 'returnApprovedBy', 'borrowingItems.item'])
            ->where('status', 'returned')
            ->when($this->dateFrom, fn ($q) => $q->whereDate('return_approved_at', '>=', $this->dateFrom))
            ->when($this->dateTo,   fn ($q) => $q->whereDate('return_approved_at', '<=', $this->dateTo))
            ->orderBy('return_approved_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Peminjaman',
            'Nama Peminjam',
            'Barang Dikembalikan',
            'Kondisi Kembali',
            'Tanggal Pinjam',
            'Tanggal Kembali (Rencana)',
            'Tanggal Kembali (Aktual)',
            'Dikonfirmasi Oleh',
            'Catatan Pengembalian',
        ];
    }

    /** @param Borrowing $borrowing */
    public function map($borrowing): array
    {
        static $no = 0;
        $no++;

        $conditionMap = [
            'baik'         => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat'  => 'Rusak Berat',
        ];

        $itemDetails = $borrowing->borrowingItems->map(function ($bi) use ($conditionMap) {
            $condition = $conditionMap[$bi->item_condition_in ?? ''] ?? '-';
            return $bi->item->name . ' (' . ($bi->returned_quantity ?? $bi->quantity) . ' - ' . $condition . ')';
        })->implode(', ');

        $conditions = $borrowing->borrowingItems
            ->map(fn ($bi) => $conditionMap[$bi->item_condition_in ?? ''] ?? '-')
            ->unique()
            ->implode(', ');

        return [
            $no,
            $borrowing->code,
            $borrowing->user?->name ?? '-',
            $itemDetails ?: '-',
            $conditions ?: '-',
            $borrowing->borrow_date?->format('d/m/Y') ?? '-',
            $borrowing->expected_return_date?->format('d/m/Y') ?? '-',
            $borrowing->return_approved_at?->format('d/m/Y H:i') ?? '-',
            $borrowing->returnApprovedBy?->name ?? '-',
            $borrowing->return_notes ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF059669']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Laporan Pengembalian';
    }
}
