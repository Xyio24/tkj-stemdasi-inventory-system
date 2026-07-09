/**
 * GeneratedAvatar
 *
 * Menampilkan avatar inisial nama dengan warna background
 * yang di-generate dari hash email. Tidak memerlukan file gambar.
 *
 * Props:
 *   name  — nama lengkap user
 *   email — email user (dipakai untuk menentukan warna)
 *   size  — ukuran avatar dalam px (default: 40)
 *   className — tambahan class Tailwind opsional
 */

interface GeneratedAvatarProps {
    name: string;
    email: string;
    size?: number;
    className?: string;
}

// 8 warna background yang cukup kontras dengan teks putih
const COLORS = [
    '#4F46E5', // indigo-600
    '#0891B2', // cyan-600
    '#059669', // emerald-600
    '#D97706', // amber-600
    '#DC2626', // red-600
    '#9333EA', // purple-600
    '#0284C7', // sky-600
    '#65A30D', // lime-600
];

/**
 * Hitung warna dari email menggunakan sum charCode % jumlah warna.
 */
function getColorFromEmail(email: string): string {
    const sum = email
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLORS[sum % COLORS.length];
}

/**
 * Ambil 1–2 huruf inisial dari nama.
 * Contoh: "Budi Santoso" → "BS", "Budi" → "B"
 */
function getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
}

export default function GeneratedAvatar({
    name,
    email,
    size = 40,
    className = '',
}: GeneratedAvatarProps) {
    const bgColor = getColorFromEmail(email);
    const initials = getInitials(name);
    const fontSize = Math.round(size * 0.38);

    return (
        <div
            className={`inline-flex items-center justify-center rounded-full select-none font-semibold text-white shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: bgColor,
                fontSize,
            }}
            aria-label={`Avatar ${name}`}
        >
            {initials}
        </div>
    );
}
