import { useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormEvent } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
    email: string;
    password: string;
    password_confirmation: string;
    nama_lengkap: string;
    jabatan: string;
    no_telepon: string;
    deskripsi_jabatan: string;
    is_active: string;
    [key: string]: string;
}

interface AdminFormProps {
    admin?: {
        user_id?: number;
        email: string;
        is_active: boolean;
        admin?: {
            nama_lengkap: string;
            jabatan: string;
            no_telepon: string;
            deskripsi_jabatan?: string;
        } | null;
    };
}

export default function AdminForm({ admin }: AdminFormProps) {


    const { data, setData, processing, errors } = useForm<FormData>({
        email: admin?.email || '',
        password: '',
        password_confirmation: '',
        nama_lengkap: admin?.admin?.nama_lengkap || '',
        jabatan: admin?.admin?.jabatan || 'admin',
        no_telepon: admin?.admin?.no_telepon || '',
        deskripsi_jabatan: admin?.admin?.deskripsi_jabatan || '',
        is_active: admin?.is_active ? '1' : '0',
    });

    const isEdit = !!admin?.user_id;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        const isEdit = !!admin?.user_id;


        formData.append('email', data.email);
        

        if (data.password) {
            formData.append('password', data.password);
            formData.append('password_confirmation', data.password_confirmation);
        }
        
        formData.append('nama_lengkap', data.nama_lengkap);
        formData.append('jabatan', data.jabatan);
        formData.append('no_telepon', data.no_telepon);
        
        if (data.deskripsi_jabatan) {
            formData.append('deskripsi_jabatan', data.deskripsi_jabatan);
        }
        
        formData.append('is_active', data.is_active);



        const requestUrl = admin?.user_id
            ? route('admin.users.update', admin.user_id)
            : route('admin.users.store');

        if (admin?.user_id) {
            formData.append('_method', 'PUT');
        }

        router.post(requestUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    admin?.user_id
                        ? 'Admin berhasil diperbarui'
                        : 'Admin berhasil ditambahkan'
                );
                

            },
            onError: (errors) => {
                toast.error('Terjadi kesalahan. Silakan periksa form kembali.');
                console.error('Form submission errors:', errors);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                    <Input
                        id="nama_lengkap"
                        value={data.nama_lengkap}
                        onChange={(e) => setData('nama_lengkap', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        required
                    />
                    {errors.nama_lengkap && (
                        <p className="text-sm text-red-500">{errors.nama_lengkap}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        {isEdit ? 'New Password' : 'Password'}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder={isEdit ? 'Leave blank to keep current password' : ''}
                        required={!isEdit}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        {isEdit ? 'Confirm New Password' : 'Confirm Password'}
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        required={!isEdit}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Select
                        value={data.jabatan}
                        onValueChange={(value) => setData('jabatan', value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.jabatan && (
                        <p className="text-sm text-red-500">{errors.jabatan}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="no_telepon">Nomor Telepon</Label>
                    <Input
                        id="no_telepon"
                        value={data.no_telepon}
                        onChange={(e) => setData('no_telepon', e.target.value)}
                        placeholder="Contoh: 081234567890"
                        required
                    />
                    {errors.no_telepon && (
                        <p className="text-sm text-red-500">{errors.no_telepon}</p>
                    )}
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="deskripsi_jabatan">Deskripsi Jabatan</Label>
                    <textarea
                        id="deskripsi_jabatan"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={data.deskripsi_jabatan}
                        onChange={(e) => setData('deskripsi_jabatan', e.target.value)}
                        placeholder="Masukkan deskripsi jabatan"
                        rows={3}
                    />
                    {errors.deskripsi_jabatan && (
                        <p className="text-sm text-red-500">{errors.deskripsi_jabatan}</p>
                    )}
                </div>

                <div className="flex items-center space-x-2 pt-4">
                    <Switch
                        id="is_active"
                        checked={data.is_active === '1'}
                        onCheckedChange={(checked: boolean) => setData('is_active', checked ? '1' : '0')}
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4 md:col-span-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
