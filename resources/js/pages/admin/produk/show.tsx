import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import AppLayout from '../../../layouts/app-layout';
import { type BreadcrumbItem, type Product as Produk } from '../../../types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, PackageCheck, Pencil, XCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  produk: Produk & {
    gambar: ProdukGambar[];
  };
}

// Define ProdukGambar type
interface ProdukGambar {
  gambar_id: number;
  produk_id: number;
  nama_file: string;
  path: string;
  is_thumbnail: boolean;
  urutan: number;
}


function SortableImage({ gambar }: { gambar: ProdukGambar }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: gambar.gambar_id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative border rounded-md overflow-hidden ${gambar.is_thumbnail ? 'ring-2 ring-primary' : ''}`}
      {...attributes}
      {...listeners}
    >
      <img 
        src={`/storage/${gambar.path}`} 
        alt={gambar.nama_file}
        className="w-full h-32 object-cover"
        onError={(e) => {
          console.log('Gambar gagal dimuat:', e);
          e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Error';
        }}
      />
      {gambar.is_thumbnail && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs px-2 py-0.5">
          Thumbnail
        </div>
      )}
    </div>
  );
}

function ImageActions({ gambar, onSetThumbnail, onDeleteImage }: {
  gambar: ProdukGambar,
  onSetThumbnail: (id: number) => void,
  onDeleteImage: (id: number) => void
}) {
  return (
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
      {!gambar.is_thumbnail && (
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => onSetThumbnail(gambar.gambar_id)}
          title="Jadikan Thumbnail"
        >
          <PackageCheck className="h-4 w-4" />
        </Button>
      )}
      <Button 
        size="sm" 
        variant="destructive" 
        onClick={() => onDeleteImage(gambar.gambar_id)}
        title="Hapus Gambar"
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Show({ produk }: Props) {
  const [images, setImages] = useState<ProdukGambar[]>(produk.gambar);

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
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item: ProdukGambar) => item.gambar_id === active.id);
        const newIndex = items.findIndex((item: ProdukGambar) => item.gambar_id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        const ordenData = newOrder.map((item, index) => ({
          gambar_id: item.gambar_id,
          urutan: index + 1
        }));
        
        router.post(`/admin/produk/${produk.produk_id}/reorder-images`, {
          images: ordenData
        }, {
          onSuccess: () => {
            toast.success("Urutan Diperbarui", {
              description: "Urutan gambar produk berhasil diperbarui."
            });
          }
        });
        
        return newOrder;
      });
    }
  };

  const handleSetThumbnail = (id: number) => {
    router.post(`/admin/produk/${produk.produk_id}/set-thumbnail/${id}`, {}, {
      onSuccess: () => {
        setImages(prev => prev.map(img => ({
          ...img,
          is_thumbnail: img.gambar_id === id
        })));
        
        toast.success("Thumbnail Diperbarui", {
          description: "Thumbnail produk berhasil diperbarui."
        });
      }
    });
  };

  const handleDeleteImage = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus gambar ini?')) {
      router.delete(`/admin/produk/${produk.produk_id}/gambar/${id}`, {
        onSuccess: () => {
          setImages(prev => prev.filter(img => img.gambar_id !== id));
          
          toast.success("Gambar Dihapus", {
            description: "Gambar produk berhasil dihapus."
          });
        }
      });
    }
  };



  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Produk: ${produk.nama_produk}`} />
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/produk">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{produk.nama_produk}</h1>
            {produk.status_aktif ? (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                Non-aktif
              </span>
            )}
          </div>
          <Button asChild>
            <Link href={`/admin/produk/${produk.produk_id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Produk
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {/* Detail Produk - 3 kolom */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Detail Produk</CardTitle>
              <CardDescription>
                Informasi lengkap tentang produk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kode Produk</p>
                  <p className="font-medium">{produk.kode_produk}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                  <p>{produk.kategori || '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                <p className="whitespace-pre-line">{produk.deskripsi || 'Tidak ada deskripsi'}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Harga</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(produk.harga)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Berat</p>
                  <p>{produk.berat} gram</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stok</p>
                  <p>{produk.stok} unit</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
                  <p>{new Date(produk.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</p>
                  <p>{new Date(produk.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gambar Produk - 2 kolom */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Gambar Produk</CardTitle>
              <CardDescription>
                Atur gambar produk dan thumbnail
              </CardDescription>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    Belum ada gambar untuk produk ini
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToParentElement]}
                >
                  <SortableContext items={images.map(img => img.gambar_id)}>
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((gambar) => (
                        <div key={gambar.gambar_id} className="relative group">
                          <SortableImage gambar={gambar} />
                          <ImageActions 
                            gambar={gambar}
                            onSetThumbnail={handleSetThumbnail}
                            onDeleteImage={handleDeleteImage}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  Klik pada tombol <strong>PackageCheck</strong> untuk mengatur gambar sebagai thumbnail.
                  Klik pada tombol <strong>XCircle</strong> untuk menghapus gambar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
