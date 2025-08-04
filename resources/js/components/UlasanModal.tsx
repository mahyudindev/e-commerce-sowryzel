import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Transaksi } from '@/types/transaksi';
import { cn } from '@/lib/utils';

const StarRatingInput = ({ rating, setRating, readOnly = false }: { rating: number; setRating: (rating: number) => void; readOnly?: boolean }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        onClick={() => !readOnly && setRating(starValue)}
                        className={cn("focus:outline-none", { "cursor-default": readOnly })}
                        aria-label={`Set rating to ${starValue}`}
                    >
                        <Star
                            className={cn(
                                "h-6 w-6",
                                starValue <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
};

interface UlasanModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaksi: Transaksi | null;
}

interface ReviewData {
    produk_id: number;
    detail_transaksi_id: number;
    rating: number;
    komentar: string;
}

export default function UlasanModal({ isOpen, onClose, transaksi }: UlasanModalProps) {
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && transaksi) {
            const initialReviews = transaksi.detail_transaksi.map(item => ({
                produk_id: item.produk.produk_id,
                detail_transaksi_id: item.id_detail_transaksi,
                rating: item.ulasan?.rating || 0,
                komentar: item.ulasan?.komentar || '',
            }));
            setReviews(initialReviews);
        }
    }, [transaksi, isOpen]);

    const handleReviewChange = (detailTransaksiId: number, field: 'rating' | 'komentar', value: string | number) => {
        setReviews(currentReviews =>
            currentReviews.map(review =>
                review.detail_transaksi_id === detailTransaksiId
                    ? { ...review, [field]: value }
                    : review
            )
        );
    };

    const getReviewData = (detailTransaksiId: number) => {
        return reviews.find(r => r.detail_transaksi_id === detailTransaksiId) || { rating: 0, komentar: '' };
    };

    const reviewsToSubmit = reviews.filter(r => {
        const originalItem = transaksi?.detail_transaksi.find(d => d.id_detail_transaksi === r.detail_transaksi_id);
        return r.rating > 0 && !originalItem?.ulasan;
    });

    const canSubmit = reviewsToSubmit.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit) {
            const allReviewed = transaksi?.detail_transaksi.every(item => !!item.ulasan);
            if (allReviewed) {
                toast.info("Semua produk dalam transaksi ini sudah Anda ulas.");
            } else {
                toast.error("Silakan berikan rating minimal untuk satu produk yang belum diulas.");
            }
            return;
        }

        console.log("Data to be submitted:", reviewsToSubmit);

        router.post(route('ulasan.store.batch'), {
            reviews: reviewsToSubmit,
        } as any, {
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                toast.success("Ulasan berhasil dikirim!");
                onClose();
            },
            onError: (errors: any) => {
                console.error('Ulasan Submission Error:', errors);
                const errorMessages = Object.values(errors).join('\n');
                toast.error(`Gagal mengirim ulasan: ${errorMessages || 'Terjadi kesalahan.'}`);
            },
        });
    };

    if (!transaksi) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Beri Ulasan untuk Pesanan {transaksi.invoice_id}</DialogTitle>
                    <DialogDescription>
                        Bagikan pengalaman Anda dengan produk yang Anda beli untuk membantu pelanggan lain.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                        {transaksi.detail_transaksi.map((item) => (
                            <div key={item.id_detail_transaksi} className="p-4 border rounded-lg">
                                <div className="flex items-start space-x-4">
                                    <img
                                        src={item.produk.gambar?.[0]?.url || 'https://placehold.co/100x100'}
                                        alt={item.produk.nama_produk}
                                        className="w-20 h-20 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{item.produk.nama_produk}</h3>
                                        {item.ulasan ? (
                                            <div className="mt-2 text-sm bg-green-50 p-3 rounded-md">
                                                <p className="font-semibold text-green-700">Penilaian Anda:</p>
                                                <div className="flex items-center my-1">
                                                    <StarRatingInput rating={item.ulasan.rating} setRating={() => {}} readOnly />
                                                    <span className="ml-2 text-gray-600 text-xs">({new Date(item.ulasan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})</span>
                                                </div>
                                                <p className="mt-1 text-gray-700 italic">"{item.ulasan.komentar}"</p>
                                            </div>
                                        ) : (
                                            <div className="mt-2 space-y-2">
                                                <div>
                                                    <label className="text-sm font-medium">Rating</label>
                                                    <StarRatingInput
                                                        rating={getReviewData(item.id_detail_transaksi).rating}
                                                        setRating={(rating) => handleReviewChange(item.id_detail_transaksi, 'rating', rating)}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`komentar-${item.id_detail_transaksi}`} className="text-sm font-medium">Komentar (Opsional)</label>
                                                    <Textarea
                                                        id={`komentar-${item.id_detail_transaksi}`}
                                                        value={getReviewData(item.id_detail_transaksi).komentar}
                                                        onChange={(e) => handleReviewChange(item.id_detail_transaksi, 'komentar', e.target.value)}
                                                        placeholder="Bagaimana pendapat Anda tentang produk ini?"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={processing || !canSubmit}>Kirim Ulasan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
