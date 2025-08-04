import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRegisterClick: () => void;
    onLoginSuccess?: () => void;
}

export default function LoginModal({ open, onOpenChange, onRegisterClick, onLoginSuccess }: LoginModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onSuccess: () => {
                reset();
                onOpenChange(false);
                if (onLoginSuccess) onLoginSuccess();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Login</DialogTitle>
                </DialogHeader>
                <form className="flex flex-col gap-4" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', checked as boolean)}
                            />
                            <Label>Remember me</Label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-4">
                        {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Login'}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Button variant="link" onClick={onRegisterClick} className="p-0 h-auto">
                            Register
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
