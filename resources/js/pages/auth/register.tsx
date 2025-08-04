import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    email: string;
    password: string;
    password_confirmation: string;
    nama_lengkap: string;
    no_telepon: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        email: '',
        password: '',
        password_confirmation: '',
        nama_lengkap: '',
        no_telepon: ''
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-1">
                        <div className="grid gap-2">
                            <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                            <Input
                                id="nama_lengkap"
                                type="text"
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
                            <Label htmlFor="no_telepon">Nomor Telepon</Label>
                            <Input
                                id="no_telepon"
                                type="tel"
                                className="mt-1 block w-full"
                                value={data.no_telepon}
                                onChange={(e) => setData('no_telepon', e.target.value)}
                                required
                                autoComplete="tel"
                                placeholder="081234567890"
                            />
                            <InputError className="mt-2" message={errors.no_telepon} />
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
                                placeholder="name@example.com"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                className="mt-1 block w-full"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                            />
                            <InputError className="mt-2" message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                className="mt-1 block w-full"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                            />
                            <InputError className="mt-2" message={errors.password_confirmation} />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Setelah registrasi, Anda akan diarahkan untuk melengkapi data profil Anda.
                    </p>

                    <Button type="submit" className="mt-6 w-full" tabIndex={10} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Create account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
