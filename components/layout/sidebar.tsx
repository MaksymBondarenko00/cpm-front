'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Megaphone, Package, User, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/account', label: 'Account', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { account } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <nav className="flex-1 p-4">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {account && (
        <div className="border-t p-4">
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-semibold">${account.balance.toFixed(2)}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
