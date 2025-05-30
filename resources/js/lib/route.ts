import { type NavItem } from '@/types';
import { CopyPlus, LayoutGrid } from 'lucide-react';
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Categories',
        href: '/category',
        icon: CopyPlus,
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: CopyPlus,
    },
    {
        title: 'Products',
        href: '/products',
        icon: CopyPlus,
    },
    {
        title: 'Purchase Order',
        href: '/purchase-order',
        icon: CopyPlus,
    },
];

export { mainNavItems };
