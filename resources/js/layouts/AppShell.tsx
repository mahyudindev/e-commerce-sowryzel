import React, { PropsWithChildren, ReactNode } from 'react';
import { User } from '@/types';
import { AppTopbarHeader } from '@/components/app-topbar-header';


interface AppShellProps extends PropsWithChildren {
    user: User | null;
    pageHeader?: ReactNode;
}

export default function AppShell({ user, pageHeader, children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <AppTopbarHeader />
            {pageHeader && (
                <header className="bg-white dark:bg-gray-800 shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {pageHeader}
                    </div>
                </header>
            )}
            <main>{children}</main>
        </div>
    );
}
