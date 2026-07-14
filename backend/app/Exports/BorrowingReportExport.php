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

class BorrowingReportExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    public function __construct(
        private readonly ?string $dateFrom = null,
        private readonly ?string $dateTo = null,
        private readonly ?string $status = null,
    ) {}

    public function query()
    {
        return Borrowing::query()
            ->with(['user', 'approvedBy', 'items.item'])
            ->when($this->dateFrom, fn ($q) => $q->whereDate('borrow_date', '>=', $this->dateFrom))
            ->when($this->dateTo,   fn ($q) => $q->whereDate('borrow_date', '<=', $this->dateTo))
            ->when($this->status,   fn ($q) => $q->where('status', $this->status))
            ->orderBy('borrow_date', 'desc');
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Peminjaman',
            'Nama Peminjam',
            'Barang Dipinjam',
            'Jumlah Item',
            'Tujuan Peminjaman',
            'Tanggal Pinjam',
            'Tanggal Rencana Kembali',
            'Status',
            'Disetujui Oleh',
            'Tanggal Disetujui',
            'Tanggal Dibuat',
        ];
    }

    /** @param Borrowing $borrowing */
    public function map($borrowing): array
    {
        static $no = 0;
        $no++;

        $itemNames = $borrowing->items
            ->map(fn ($bi) => $bi->item->name . ' (' . $bi->quantity . ')')
            ->implode(', ');

        $statusMap = [
            'pending'   => 'Menunggu',
            'approved'  => 'Disetujui',
            'rejected'  => 'Ditolak',
            'returning' => 'Pengembalian',
            'returned'  => 'Dikembalikan',
            'cancelled' => 'Dibatalkan',
        ];

        return [
            $no,
            $borrowing->code,
            $borrowing->user?->name ?? '-',
            $itemNames ?: '-',
            $borrowing->items->sum('quantity'),
            $borrowing->purpose,
            $borrowing->borrow_date?->format('d/m/Y') ?? '-',
            $borrowing->expected_return_date?->format('d/m/Y') ?? '-',
            $statusMap[$borrowing->status instanceof \App\Enums\BorrowingStatus ? $borrowing->status->value : (string) $borrowing->status] ?? (string) $borrowing->status,
            $borrowing->approvedBy?->name ?? '-',
            $borrowing->approved_at?->format('d/m/Y H:i') ?? '-',
            $borrowing->created_at->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Laporan Peminjaman';
    }
}
