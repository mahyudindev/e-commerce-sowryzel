import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface KonfirmasiPesananDiterimaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    invoiceId: string;
}

export default function KonfirmasiPesananDiterimaModal(
    { isOpen, onClose, onConfirm, invoiceId }: KonfirmasiPesananDiterimaModalProps
) {
    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Pesanan Diterima</DialogTitle>
                    <DialogDescription className="pt-2">
                        Apakah Anda yakin ingin menandai pesanan dengan nomor invoice <span className="font-semibold">{invoiceId}</span> sebagai telah diterima dan selesai?
                        Tindakan ini tidak dapat diurungkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-4 sm:justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="button" variant="default" onClick={() => {
                        onConfirm();
                        onClose(); // Close modal after confirmation
                    }} className="bg-green-600 hover:bg-green-700">
                        Ya, Tandai Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
