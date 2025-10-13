"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  Calendar,
  CreditCard,
  CheckSquare,
  Briefcase,
  Kanban,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Settings,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
    color: 'text-chatwell-green'
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
    color: 'text-chatwell-blue'
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    color: 'text-chatwell-purple'
  },
  {
    title: 'Fluxo de Caixa',
    href: '/contas',
    icon: CreditCard,
    color: 'text-chatwell-red'
  },
  {
    title: 'Tarefas',
    href: '/tarefas',
    icon: CheckSquare,
    color: 'text-chatwell-green'
  },
  {
    title: 'Serviços',
    href: '/servicos',
    icon: Briefcase,
    color: 'text-chatwell-blue'
  },
  {
    title: 'Kanban',
    href: '/kanban',
    icon: Kanban,
    color: 'text-chatwell-purple'
  },
  {
    title: 'Lista de Compras',
    href: '/compras',
    icon: ShoppingCart,
    color: 'text-chatwell-green'
  },
  {
    title: 'Gastos Empresariais',
    href: '/gastos-empresariais',
    icon: TrendingUp,
    color: 'text-chatwell-blue'
  },
  {
    title: 'Gastos Pessoais',
    href: '/gastos-pessoais',
    icon: TrendingDown,
    color: 'text-chatwell-red'
  },
];

const accountItems = [
  {
    title: 'Perfil',
    href: '/perfil',
    icon: User,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
];

interface NavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Navigation({ isOpen, onToggle }: NavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold gradient-text">
              Chatwell Pro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema de Gestão
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100",
                        isActive
                          ? "bg-gradient-to-r from-slate-100 to-slate-50 text-gray-900 border-l-4 border-chatwell-green"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-chatwell-green" : item.color)} />
                      {item.title}
                      {isActive && (
                        <Badge variant="green" className="ml-auto text-xs">
                          Ativo
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Conta
                </p>
                <div className="space-y-1">
                  {accountItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100",
                          isActive
                            ? "bg-gradient-to-r from-slate-100 to-slate-50 text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-gray-900"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}