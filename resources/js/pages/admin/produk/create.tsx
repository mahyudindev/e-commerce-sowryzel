import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { ToggleSwitch } from '../../../components/ui/toggle-switch';
import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem } from '../../../types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { toast } from 'sonner';


const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin',
    href: '/admin/dashboard',
  },
  {
    title: 'Produk',
    href: '/admin/produk',
  },
  {
    title: 'Tambah Produk',
    href: '/admin/produk/create',
  },
];

export default function Create() {
  const { data, setData, processing, errors, reset } = useForm({
    nama_produk: '',
    deskripsi: '',
    harga: '',
    berat: '',
    kategori: '',
    stok: '',
    aktif: true as boolean,
    gambar: [] as File[],
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    formData.append('nama_produk', data.nama_produk);
    formData.append('deskripsi', data.deskripsi);
    formData.append('harga', data.harga);
    formData.append('berat', data.berat);
    formData.append('kategori', data.kategori);
    formData.append('stok', data.stok);
    formData.append('aktif', data.aktif ? '1' : '0');
    
    if (data.gambar && data.gambar.length > 0) {
      Array.from(data.gambar).forEach((file, index) => {
        formData.append(`gambar[${index}]`, file);
      });
    }
    
    const loadingToastId = toast.loading("Mengirim data...", {
      description: "Sedang memproses data produk"
    });
    
    router.post('/admin/produk', formData, {
      onSuccess: () => {
        toast.dismiss(loadingToastId);
        
        toast.success("Berhasil disimpan", {
          description: "Produk baru berhasil ditambahkan"
        });
        reset();
      },
      onError: (errors: Record<string, string>) => {
        toast.dismiss(loadingToastId);
        
        toast.error("Gagal", {
          description: "Terjadi kesalahan saat menambahkan produk"
        });
        console.error('Form errors:', errors);
      },
      forceFormData: true
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Tambah Produk Baru" />
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tambah Produk Baru</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Detail Produk */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Produk</CardTitle>
                <CardDescription>
                  Informasi dasar produk yang akan ditampilkan ke pelanggan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_produk">Nama Produk <span className="text-red-500">*</span></Label>
                  <Input
                    id="nama_produk"
                    value={data.nama_produk}
                    onChange={e => setData('nama_produk', e.target.value)}
                    placeholder="Masukkan nama produk"
                    required
                  />
                  {errors.nama_produk && (
                    <p className="text-sm text-red-500">{errors.nama_produk}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi Produk</Label>
                  <Textarea
                    id="deskripsi"
                    value={data.deskripsi}
                    onChange={e => setData('deskripsi', e.target.value)}
                    placeholder="Masukkan deskripsi detail produk"
                    rows={4}
                  />
                  {errors.deskripsi && (
                    <p className="text-sm text-red-500">{errors.deskripsi}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Input
                    id="kategori"
                    value={data.kategori}
                    onChange={e => setData('kategori', e.target.value)}
                    placeholder="Masukkan kategori produk"
                  />
                  {errors.kategori && (
                    <p className="text-sm text-red-500">{errors.kategori}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informasi Harga dan Stok */}
            <Card>
              <CardHeader>
                <CardTitle>Harga dan Ketersediaan</CardTitle>
                <CardDescription>
                  Atur harga, stok, dan status produk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kode Produk</Label>
                  <div 
                    id="kode_produk"
                    className="flex items-center h-10 w-full rounded-md border border-input bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-muted-foreground"
                  >
                    Akan dibuat otomatis
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga">Harga (Rp) <span className="text-red-500">*</span></Label>
                  <Input
                    id="harga"
                    type="number"
                    value={data.harga}
                    onChange={e => setData('harga', e.target.value)}
                    placeholder="Masukkan harga produk"
                    min="0"
                    required
                  />
                  {errors.harga && (
                    <p className="text-sm text-red-500">{errors.harga}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="berat">Berat (gram) <span className="text-red-500">*</span></Label>
                    <Input
                      id="berat"
                      type="number"
                      value={data.berat}
                      onChange={e => setData('berat', e.target.value)}
                      placeholder="Berat dalam gram"
                      min="0"
                      required
                    />
                    {errors.berat && (
                      <p className="text-sm text-red-500">{errors.berat}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stok">Stok <span className="text-red-500">*</span></Label>
                    <Input
                      id="stok"
                      type="number"
                      value={data.stok}
                      onChange={e => setData('stok', e.target.value)}
                      placeholder="Jumlah stok tersedia"
                      min="0"
                      required
                    />
                    {errors.stok && (
                      <p className="text-sm text-red-500">{errors.stok}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <ToggleSwitch
                    id="aktif"
                    checked={Boolean(data.aktif)}
                    onChange={(checked) => setData('aktif', checked)}
                  />
                  <Label 
                    htmlFor="aktif" 
                    className="cursor-pointer"
                    onClick={() => setData('aktif', true)}
                  >
                    Produk Aktif
                  </Label>
                </div>
                {errors.aktif && (
                  <p className="text-sm text-red-500">{errors.aktif}</p>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Produk yang aktif akan ditampilkan di toko. Nonaktifkan jika produk sedang tidak dijual.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/produk">Batal</Link>
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? 'Menyimpan...' : 'Simpan Produk'}
            </Button>
          </div>
        </form>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Gambar Produk</CardTitle>
            <CardDescription>
              Tambahkan gambar produk (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div 
                className="flex items-center justify-center h-40 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => document.getElementById('upload-gambar')?.click()}
              >
                {data.gambar && data.gambar.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 w-full">
                    {Array.from(data.gambar).map((file, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index}`} 
                          className="h-24 w-full object-cover rounded-md"
                          onError={(e) => {
                            console.log('Gambar preview gagal dimuat:', e);
                            e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Preview';
                          }}
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newGambar = Array.from(data.gambar).filter((_, i) => i !== index);
                            setData('gambar', newGambar);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-center h-24 w-full border border-dashed rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Klik untuk mengunggah gambar</p>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF hingga 10MB</p>
                  </div>
                )}
              </div>
              <input
                id="upload-gambar"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    // Jika sudah ada file, gabungkan dengan yang baru
                    if (data.gambar && data.gambar.length > 0) {
                      const existingFiles = Array.from(data.gambar);
                      setData('gambar', [...existingFiles, ...newFiles]);
                    } else {
                      setData('gambar', newFiles);
                    }
                  }
                }}
                accept="image/*"
              />
              {errors.gambar && (
                <p className="text-sm text-red-500">{errors.gambar}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
