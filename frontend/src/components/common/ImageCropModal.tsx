import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    /** Object URL dari file yang dipilih user */
    imageSrc: string;
    onConfirm: (croppedFile: File) => void;
    onCancel: () => void;
    /** Aspect ratio crop area. Default 1 (square). Gunakan undefined untuk bebas. */
    aspect?: number;
    /** Judul modal. Default 'Sesuaikan Foto' */
    title?: string;
    /** Nama file output. Default 'photo.jpg' */
    outputFilename?: string;
}

// ─── Canvas Helper ────────────────────────────────────────────────────────────

/**
 * Mengambil area crop dari gambar original dan mengembalikan Blob.
 * Menggunakan HTMLCanvasElement untuk rendering — tidak butuh library tambahan.
 */
async function getCroppedBlob(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', reject);
        img.src = imageSrc;
    });

    const canvas  = document.createElement('canvas');
    const ctx     = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context tidak tersedia.');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Canvas sementara untuk rotasi
    canvas.width  = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);
    ctx.drawImage(
        image,
        safeArea / 2 - image.width / 2,
        safeArea / 2 - image.height / 2,
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Canvas output sesuai ukuran crop
    canvas.width  = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y),
    );

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Gagal membuat blob dari canvas.'));
            },
            'image/jpeg',
            0.92,
        );
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageCropModal({ imageSrc, onConfirm, onCancel, aspect, title = 'Sesuaikan Foto', outputFilename = 'photo.jpg' }: Props) {
    const [crop, setCrop]             = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom]             = useState(1);
    const [rotation, setRotation]     = useState(0);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedArea) return;
        setIsProcessing(true);
        try {
            const blob = await getCroppedBlob(imageSrc, croppedArea, rotation);
            const file = new File([blob], outputFilename, { type: 'image/jpeg' });
            onConfirm(file);
        } catch {
            // error sudah di-handle oleh parent via onError mutation
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = () => setRotation((r) => (r + 90) % 360);

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="relative bg-neutral-950" style={{ height: 300 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        cropShape={aspect === 1 ? 'round' : 'rect'}
                        showGrid={aspect !== 1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                {/* Controls */}
                <div className="px-5 py-4 space-y-3 border-t border-neutral-200 dark:border-neutral-800">
                    {/* Zoom slider */}
                    <div className="flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 text-neutral-400 shrink-0" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 accent-indigo-600 cursor-pointer"
                            aria-label="Zoom"
                        />
                        <ZoomIn className="w-4 h-4 text-neutral-400 shrink-0" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRotate}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            Putar
                        </button>

                        <div className="flex-1" />

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                        >
                            {isProcessing ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            Gunakan Foto
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
