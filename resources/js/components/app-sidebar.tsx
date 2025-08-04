import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types/index';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, ShoppingCart, Users, Package, UserRoundCog, FileText, BarChart4, FileBarChart, Receipt } from 'lucide-react';
import AppLogo from './app-logo';

// dataMasterItems can remain here as it doesn't use hooks
const dataMasterItems: NavItem[] = [
    {
        title: 'Admin',
        href: '/admin/users',
        icon: UserRoundCog,
    },
    {
        title: 'Pelanggan',
        href: '/admin/pelanggan',
        icon: Users,
    },
    {
        title: 'Produk',
        href: '/admin/produk',
        icon: Package,
    },
];

// Laporan items
const laporanItems: NavItem[] = [
    {
        title: 'Laporan Transaksi',
        href: '/admin/laporan/transaksi',
        icon: Receipt,
    },
    {
        title: 'Laporan Produk',
        href: '/admin/laporan/produk',
        icon: FileBarChart,
    },
];

export function AppSidebar() {
    const { props } = usePage<SharedData>();
    const pendingTransaksiCount = props.pendingTransaksiCount || 0;
    
    // Mostrar información de depuración en la consola
    console.log('User data:', props.auth?.user);
    console.log('Admin data:', props.auth?.user?.admin);
    console.log('Role:', props.auth?.user?.role);
    console.log('Jabatan:', props.auth?.user?.admin?.jabatan);
    
    // Verificar si el usuario es owner
    const isOwner = props.auth?.user?.admin?.jabatan === 'owner';

    // Solo Dashboard para owners, Dashboard y Transaksi para otros roles
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/admin/dashboard-dev',
            icon: LayoutGrid,
        },
        ...(!isOwner ? [{
            title: 'Transaksi',
            href: '/admin/transaksi',
            icon: ShoppingCart,
            badgeCount: pendingTransaksiCount,
            badgeBlinking: pendingTransaksiCount > 0,
        }] : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="admin/dashboard-dev" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                
                {/* Solo mostrar Data Master si no es owner */}
                {!isOwner && (
                    <>
                        <div className="px-3 py-2">
                            <div className="h-px bg-sidebar-border" />
                        </div>
                        
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Data Master</SidebarGroupLabel>
                            <SidebarMenu>
                                {dataMasterItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon className="mr-2 size-4" />}
                                                {item.title}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </>
                )}

                <div className="px-3 py-2">
                    <div className="h-px bg-sidebar-border" />
                </div>
                
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Laporan</SidebarGroupLabel>
                    <SidebarMenu>
                        {laporanItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon className="mr-2 size-4" />}
                                        {item.title}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}