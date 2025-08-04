import { type BreadcrumbItem, type SharedData } from '@/types';
import { Combobox, Transition } from '@headlessui/react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, Fragment } from 'react';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { provinces } from '@/data/provinces';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type PelangganProfileForm = {
    nama_lengkap: string;
    email: string;
    no_telepon: string;
    alamat: string;
    kode_pos: string;
}

type AdminProfileForm = {
    nama_lengkap: string;
    email: string;
    no_telepon: string;
    jabatan: string;
    deskripsi_jabatan: string;
}

type ProfileForm = PelangganProfileForm | AdminProfileForm;

type UserRole = 'pelanggan' | 'admin' | 'owner';

export default function Profile({ 
    mustVerifyEmail, 
    status, 
    userRole, 
    profileData 
}: { 
    mustVerifyEmail: boolean; 
    status?: string; 
    userRole: UserRole; 
    profileData: any;
}) {
    const { auth } = usePage<SharedData>().props;
    
    const initialFormData: Record<string, any> = {
        nama_lengkap: profileData?.nama_lengkap || auth.user.nama || '',
        email: auth.user.email || '',
        no_telepon: profileData?.no_telepon || '',
        alamat: profileData?.alamat || '',
        kode_pos: profileData?.kode_pos || '',
        jabatan: profileData?.jabatan || (userRole === 'owner' ? 'Owner' : 'Admin'),
        deskripsi_jabatan: profileData?.deskripsi_jabatan || ''
    };
    
    console.log('Initial form data:', initialFormData);
    
    if (userRole === 'pelanggan') {
        initialFormData.alamat = profileData?.alamat || '';
        initialFormData.kode_pos = profileData?.kode_pos || '';
    } else if (userRole === 'admin' || userRole === 'owner') {
        initialFormData.jabatan = profileData?.jabatan || (userRole === 'owner' ? 'Owner' : 'Admin');
        initialFormData.deskripsi_jabatan = profileData?.deskripsi_jabatan || '';
    }
    
    const { data, setData, errors, processing, recentlySuccessful } = useForm(initialFormData);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData: Record<string, any> = {
            nama_lengkap: data.nama_lengkap || '',
            email: data.email || '',
            no_telepon: data.no_telepon || '',
        };

        if (userRole === 'pelanggan') {
            formData.alamat = data.alamat || '';
            formData.kode_pos = data.kode_pos || '';
        } else if (userRole === 'admin' || userRole === 'owner') {
            formData.jabatan = userRole === 'owner' ? 'Owner' : (data.jabatan || 'Admin');
            formData.deskripsi_jabatan = data.deskripsi_jabatan || '';
        }

        const formDataToSend = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                const stringValue = String(value);
                formDataToSend.append(key, stringValue);
            }
        });
        
        formDataToSend.append('_method', 'PATCH');

        router.post(route('profile.update'), formDataToSend, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Profil berhasil diperbarui');
            },
            onError: (errors) => {
                console.error('Error updating profile:', errors);
                if (errors.email) {
                    toast.error(errors.email);
                } else {
                    toast.error('Gagal memperbarui profil. Silakan periksa data yang dimasukkan.');
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-6">
                            <h3 className="text-lg font-medium">Informasi Akun</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Input
                                        id="role"
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                        value={userRole}
                                        readOnly
                                        disabled
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                                    <Input
                                        id="nama_lengkap"
                                        className="mt-1 block w-full"
                                        value={data.nama_lengkap}
                                        onChange={(e) => setData('nama_lengkap', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Nama lengkap"
                                    />
                                    <InputError className="mt-2" message={errors.nama_lengkap} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <InputError className="mt-2" message={errors.email} />
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="no_telepon">Nomor Telepon</Label>
                                <Input
                                    id="no_telepon"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    value={data.no_telepon}
                                    onChange={(e) => setData('no_telepon', e.target.value)}
                                    required
                                    autoComplete="tel"
                                    placeholder="08xxxxxxxxxx"
                                />
                                <InputError className="mt-2" message={errors.no_telepon} />
                            </div>
                            

                            
                            {/* Role-specific fields */}
                            {userRole === 'pelanggan' && (
                                <>
                                    <h3 className="text-lg font-medium mt-4">Informasi Alamat</h3>
                                    <div className="grid gap-2">
                                        <Label htmlFor="alamat">Alamat Lengkap</Label>
                                        <Input
                                            id="alamat"
                                            className="mt-1 block w-full min-h-[80px]"
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            required
                                            placeholder="Alamat lengkap"
                                        />
                                        <InputError className="mt-2" message={errors.alamat} />
                                    </div>
                                    
                                    <div className="grid gap-4 sm:grid-cols-1">
                                        <div className="grid gap-2">
                                            <Label htmlFor="kode_pos">Kode Pos</Label>
                                            <Input
                                                id="kode_pos"
                                                className="mt-1 block w-full"
                                                value={data.kode_pos}
                                                onChange={(e) => setData('kode_pos', e.target.value)}
                                                placeholder="Kode pos"
                                            />
                                            <InputError className="mt-2" message={errors.kode_pos} />
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {(userRole === 'admin' || userRole === 'owner') && (
                                <>
                                    <h3 className="text-lg font-medium mt-4">Informasi Jabatan</h3>
                                    <div className="grid gap-2">
                                        <Label htmlFor="jabatan">Jabatan</Label>
                                        <div className="mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-input text-sm">
                                            {userRole === 'owner' ? 'Owner' : 
                                             userRole === 'admin' ? data.jabatan || 'Admin' : 
                                             'Pelanggan'}
                                        </div>
                                        <InputError className="mt-2" message={errors.jabatan} />
                                    </div>
                                    
                                    <div className="grid gap-2">
                                        <Label htmlFor="deskripsi_jabatan">Deskripsi Jabatan</Label>
                                        <Input
                                            id="deskripsi_jabatan"
                                            className="mt-1 block w-full min-h-[80px]"
                                            value={data.deskripsi_jabatan}
                                            onChange={(e) => setData('deskripsi_jabatan', e.target.value)}
                                            placeholder="Deskripsi jabatan"
                                        />
                                        <InputError className="mt-2" message={errors.deskripsi_jabatan} />
                                    </div>
                                </>
                            )}
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
