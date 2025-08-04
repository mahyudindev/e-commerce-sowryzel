import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleSwitch } from '../../../components/ui/toggle-switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from "@inertiajs/react";
import React, { DragEvent, FormEvent, useRef, useState, useEffect } from "react";
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ProdukGambar = {
  gambar_id: number;
  produk_id: number;
  nama_file: string;
  path: string;
  is_thumbnail: boolean;
  urutan: number;
  url: string;
};

interface Produk {
  produk_id: number;
  nama_produk: string;
  deskripsi: string;
  harga: number;
  stok: number;
  aktif: boolean;
  gambar: ProdukGambar[];
  status_aktif?: boolean;
  kode_produk: string;
  berat: number;
  kategori: string;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  produk: Produk;
}

export default function Edit({ produk: initialProduk }: Props) {
  const [produk, setProduk] = useState<Produk>({
    ...initialProduk,
    gambar: initialProduk.gambar || []
  });
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gambarToDelete, setGambarToDelete] = useState<ProdukGambar | null>(null);
  
  const [draggedImage, setDraggedImage] = useState<ProdukGambar | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [gambarBaru, setGambarBaru] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetUploadStatus = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Status upload direset secara manual');
  };
  
  useEffect(() => {
    if (uploadProgress === 100 && isUploading) {
      console.log('Upload 100%, setting timer to reset status...');
      const timer = setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadIndex(null);
        console.log('Status upload direset oleh useEffect setelah 3 detik');
        
        setProduk(prevState => ({ ...prevState }));
      }, 3000); 
      
      return () => clearTimeout(timer);
    }
  }, [uploadProgress, isUploading]);
  
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
      title: produk.nama_produk,
      href: `/admin/produk/${produk.produk_id}`,
    },
    {
      title: 'Edit',
      href: `/admin/produk/${produk.produk_id}/edit`,
    },
  ];

  const { data, setData, put, processing, errors } = useForm({
    kode_produk: produk.kode_produk,
    nama_produk: produk.nama_produk,
    deskripsi: produk.deskripsi || '',
    harga: parseFloat(produk.harga.toString()),
    berat: parseFloat(produk.berat.toString()),
    kategori: produk.kategori || '',
    stok: parseInt(produk.stok.toString(), 10),
    aktif: Boolean(produk.status_aktif ?? produk.aktif),
  });
  
  const maksGambar = 4;
  const jumlahGambarSaatIni = Array.isArray(produk.gambar) ? produk.gambar.length : 0;
  const sisaSlotGambar = Math.max(0, maksGambar - jumlahGambarSaatIni);
  const handleDeleteGambar = async () => {
    if (!gambarToDelete) return;
    
    try {
      const gambarId = gambarToDelete.gambar_id;
      const produkId = produk.produk_id;
      const gambarLama = [...produk.gambar];
      
      setProduk(prev => ({
        ...prev,
        gambar: prev.gambar.filter(g => g.gambar_id !== gambarId)
      }));
      setProduk(prev => ({
        ...prev,
        gambar: prev.gambar.filter(g => g.gambar_id !== gambarId)
      }));
      
     
      const deleteUrl = `/admin/produk/${produkId}/gambar/${gambarId}`;
      console.log(`Mencoba hapus gambar via router.visit dengan URL: ${deleteUrl}`);
      
      router.visit(deleteUrl, { 
        method: 'delete',
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          console.log('Delete success via router.visit');
          toast.success("Gambar berhasil dihapus", {
            description: "Gambar produk telah dihapus dari galeri"
          });
        },
        onError: (errors) => {
          console.error('Delete errors:', errors);
        }
      });
      
    } catch (error) {
      console.error('Error dalam fungsi delete:', error);
      toast.error("Terjadi kesalahan tak terduga", {
        description: "Operasi hapus gambar gagal"
      });
    } finally {
      
      setShowDeleteDialog(false);
      setGambarToDelete(null);
    }
  };
  
  const handleSetThumbnail = async (gambar: ProdukGambar) => {
    try {
      await axios.put(`/admin/produk/${produk.produk_id}/gambar/${gambar.gambar_id}/set-thumbnail`, {}, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json'
        }
      });
      
      setProduk(prev => ({
        ...prev,
        gambar: prev.gambar.map(g => ({
          ...g,
          is_thumbnail: g.gambar_id === gambar.gambar_id
        }))
      }));
      
      toast.success("Thumbnail diperbarui", {
        description: "Thumbnail produk berhasil diubah"
      });
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      toast.error("Gagal mengubah thumbnail", {
        description: "Terjadi kesalahan saat mengubah thumbnail"
      });
    }
  };
  
  const setThumbnail = async (gambar: ProdukGambar) => {
    try {
      const updatedGambar = produk.gambar.map(g => ({
        ...g,
        is_thumbnail: g.gambar_id === gambar.gambar_id
      }));
      
      setProduk(prevState => {
        const updatedState = {
          ...prevState,
          gambar: updatedGambar
        };
        return updatedState;
      });
      
      const response = await axios.post(
        `/admin/produk/${produk.produk_id}/set-thumbnail/${gambar.gambar_id}`,
        {},
        {
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        }
      );
      
      toast.success("Thumbnail berhasil diatur", {
        description: "Thumbnail produk telah diatur"
      });
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      toast.error("Gagal mengatur thumbnail", {
        description: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  const handleDragStart = (gambar: ProdukGambar) => {
    setDraggedImage(gambar);
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetGambar: ProdukGambar) => {
    if (draggedImage && draggedImage.gambar_id !== targetGambar.gambar_id) {
      setThumbnail(draggedImage);
    }
    setIsDragging(false);
    setDraggedImage(null);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedImage(null);
  };
  
  const uploadGambar = async (filesOrEvent: FileList | React.ChangeEvent<HTMLInputElement>) => {
    const files = 'target' in filesOrEvent ? filesOrEvent.target.files : filesOrEvent;
    if (!files || files.length === 0) {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(null);
      return;
    }
    
    const jumlahGambarSaatIni = Array.isArray(produk.gambar) ? produk.gambar.length : 0;
    
    if (jumlahGambarSaatIni >= maksGambar) {
      toast.error("Batas maksimal gambar tercapai", {
        description: `Batas maksimal ${maksGambar} gambar per produk sudah tercapai.`
      });
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(null);
      return;
    }
    
    const totalGambar = jumlahGambarSaatIni + files.length;
    if (totalGambar > maksGambar) {
      toast.error("Jumlah gambar melebihi batas", {
        description: `Anda hanya dapat menambahkan ${sisaSlotGambar} gambar lagi.`
      });
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(null);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0); 
    
    for (let i = 0; i < files.length; i++) {
      setCurrentUploadIndex(i);
      
      const file = files[i];
    
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Gambar terlalu besar", {
          description: "Ukuran gambar maksimal 2MB"
        });
        continue; 
      }
      
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('gambar', file);
      
      try {
        
        if (produk.gambar.length === 0) {
          formData.append('is_thumbnail', '1'); 
        } else {
          formData.append('is_thumbnail', '0'); 
        }
        
        const uploadUrl = `/admin/produk/${produk.produk_id}/upload`;
        
        const response = await axios.post(
          uploadUrl,
          formData,
          {
            headers: {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              'Accept': 'application/json',
            },
            onUploadProgress: (progressEvent) => {
              const total = progressEvent.total || progressEvent.loaded || 1;
              const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
              setUploadProgress(isNaN(percentCompleted) ? 0 : percentCompleted);
              
            }
          }
        );
        
        
        
        resetUploadStatus();
        
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          
          
          
          resetUploadStatus();
          
          toast.success('Gambar berhasil diupload', { duration: 3000 });
          
          
          window.location.reload();
          
          return;
        }
        
        if (response.data && response.data.data) {
          const responseData = response.data.data;
          const newImage: ProdukGambar = {
            gambar_id: responseData.gambar_id,
            produk_id: responseData.produk_id,
            nama_file: responseData.nama_file,
            path: responseData.path,
            is_thumbnail: Boolean(responseData.is_thumbnail),
            urutan: responseData.urutan || 0,
            url: `/storage/${responseData.path}`
          };
          
          
          
          setProduk(prevState => {
            const existingImages = Array.isArray(prevState.gambar) ? prevState.gambar : [];
            return {
              ...prevState,
              gambar: [...existingImages, newImage]
            };
          });
          
          setTimeout(() => {
            setProduk(current => ({ ...current }));
          }, 100);
          
          toast.success("Upload berhasil", {
            description: "Gambar produk berhasil ditambahkan"
          });
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        
        resetUploadStatus();
        
        let errorMessage = "Terjadi kesalahan saat mengupload gambar";
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          
          if (error.response?.data?.errors) {
            const validationErrors = error.response.data.errors;
            const errorDetails = Object.values(validationErrors)
              .map(fieldErrors => (Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors))
              .join('\n');
            
            if (errorDetails) {
              errorMessage = errorDetails;
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error("Gagal upload", {
          description: errorMessage
        });
      }
    }
    
    
    resetUploadStatus();
    
    const currentGambarLength = Array.isArray(produk.gambar) ? produk.gambar.length : 0;
    if (currentGambarLength === jumlahGambarSaatIni) {
      try {
        const refreshResponse = await axios.get(`/admin/produk/${produk.produk_id}/edit`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (refreshResponse.data && refreshResponse.data.produk) {
          setProduk(refreshResponse.data.produk);
        }
      } catch (refreshError) {
        console.error('Gagal mengambil data produk terbaru:', refreshError);
      }
    }
  }; 
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    put(`/admin/produk/${produk.produk_id}`, {
      onSuccess: () => {
        toast.success("Berhasil disimpan", {
          description: "Data produk berhasil diperbarui"
        });
      },
    });
  };
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Produk: ${produk.nama_produk}`} />
      <div className="py-6 space-y-6">
        <div className="flex items-center">
          <Link href="/admin/produk">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <h1 className="text-xl font-semibold">
            Edit Produk: {produk.nama_produk}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Produk</CardTitle>
                <CardDescription>
                  Informasi dasar tentang produk yang akan dijual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kode_produk">Kode Produk</Label>
                    <Input
                      id="kode_produk"
                      value={data.kode_produk}
                      onChange={(e) => setData('kode_produk', e.target.value)}
                    />
                    {errors.kode_produk && (
                      <p className="text-sm text-red-500">{errors.kode_produk}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nama_produk">Nama Produk</Label>
                    <Input
                      id="nama_produk"
                      value={data.nama_produk}
                      onChange={(e) => setData('nama_produk', e.target.value)}
                    />
                    {errors.nama_produk && (
                      <p className="text-sm text-red-500">{errors.nama_produk}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={data.deskripsi}
                    onChange={(e) => setData('deskripsi', e.target.value)}
                    rows={5}
                  />
                  {errors.deskripsi && (
                    <p className="text-sm text-red-500">{errors.deskripsi}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="harga">Harga (Rp)</Label>
                    <Input
                      id="harga"
                      type="number"
                      min="0"
                      step="1000"
                      value={data.harga}
                      onChange={(e) => setData('harga', parseFloat(e.target.value))}
                    />
                    {errors.harga && (
                      <p className="text-sm text-red-500">{errors.harga}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="berat">Berat (gram)</Label>
                    <Input
                      id="berat"
                      type="number"
                      min="0"
                      value={data.berat}
                      onChange={(e) => setData('berat', parseFloat(e.target.value))}
                    />
                    {errors.berat && (
                      <p className="text-sm text-red-500">{errors.berat}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stok">Stok</Label>
                    <Input
                      id="stok"
                      type="number"
                      min="0"
                      value={data.stok}
                      onChange={(e) => setData('stok', parseInt(e.target.value, 10))}
                    />
                    {errors.stok && (
                      <p className="text-sm text-red-500">{errors.stok}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori</Label>
                    <Input
                      id="kategori"
                      value={data.kategori}
                      onChange={(e) => setData('kategori', e.target.value)}
                    />
                    {errors.kategori && (
                      <p className="text-sm text-red-500">{errors.kategori}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aktif" className="block mb-2">Status</Label>
                    <div className="flex items-center space-x-2">
                      <ToggleSwitch
                        id="aktif"
                        checked={data.aktif}
                        onChange={(checked: boolean) => setData('aktif', checked)}
                      />
                      <Label htmlFor="aktif" className="cursor-pointer">
                        {data.aktif ? 'Aktif' : 'Tidak Aktif'}
                      </Label>
                    </div>
                    {errors.aktif && (
                      <p className="text-sm text-red-500">{errors.aktif}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gambar Produk</CardTitle>
                <CardDescription>
                  Kelola gambar untuk produk ini. Anda dapat mengunggah maksimal 4 gambar produk.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tampilkan progress upload jika sedang upload */}
                  {isUploading && (
                    <div className="w-full mb-4">  
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          {uploadProgress === 100 ? 'Memproses...' : 'Mengupload...'}
                        </span>
                        <span className="text-sm font-medium">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-300 ${uploadProgress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {produk.gambar && produk.gambar.length > 0 && produk.gambar.map((gambar: ProdukGambar) => (
                      <div 
                        key={gambar.gambar_id}
                        className={`relative rounded-md overflow-hidden border ${
                          gambar.is_thumbnail ? 'border-blue-500 border-2' : 'border-gray-200'
                        } group`}
                        draggable
                        onDragStart={() => handleDragStart(gambar)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(gambar)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="relative pt-[100%]">
                          <img 
                            src={`/storage/${gambar.path}`}
                            alt={gambar.nama_file}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(e) => {
                              console.log('Gambar gagal dimuat:', e);
                              e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Error';
                            }}
                          />
                          
                          {/* Badge thumbnail */}
                          {gambar.is_thumbnail && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                              Thumbnail
                            </div>
                          )}
                        </div>
                        
                        {/* Overlay dengan tombol aksi */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {/* Tombol set thumbnail */}
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="text-xs"
                              onClick={() => setThumbnail(gambar)}
                              disabled={gambar.is_thumbnail}
                            >
                              {gambar.is_thumbnail ? 'Thumbnail' : 'Set Thumbnail'}
                            </Button>
                            
                            {/* Tombol hapus */}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => {
                                setGambarToDelete(gambar);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {sisaSlotGambar > 0 && (
                      <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md p-4 h-full min-h-[150px]">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading || jumlahGambarSaatIni >= maksGambar}
                          className="mb-2"
                        >
                          {isUploading ? 'Mengupload...' : 'Tambah Gambar'}
                        </Button>
                        
                        <div className="text-xs text-gray-500 text-center">
                          {isUploading ? (
                            <div>Mengupload gambar...</div>
                          ) : (
                            <div>
                              Format: JPG, PNG, GIF<br />
                              Max 2MB
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    id="upload-gambar"
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        uploadGambar(e.target.files);
                      }
                    }}
                    accept="image/*"
                  />
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {sisaSlotGambar > 0 
                      ? `Anda dapat menambahkan ${sisaSlotGambar} gambar lagi (maksimal ${maksGambar} gambar per produk).`
                      : 'Anda telah mencapai batas maksimal gambar. Hapus beberapa gambar untuk menambahkan yang baru.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={processing}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Gambar</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus gambar ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          {gambarToDelete && (
            <div className="my-4 flex justify-center">
              <div className="relative h-32 w-32 rounded-md overflow-hidden border">
                <img 
                  src={`/storage/${gambarToDelete.path}`}
                  alt={gambarToDelete.nama_file}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    console.log('Gambar gagal dimuat:', e);
                    e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Error';
                  }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setGambarToDelete(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGambar}
            >
              Hapus Gambar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

