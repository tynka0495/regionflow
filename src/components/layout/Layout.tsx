import type { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Layout({ title, subtitle, actions, children }: LayoutProps) {
  return (
    <main className="layout">
      <header className="layout-header">
        <div>
          <h1 className="layout-title">{title}</h1>
          {subtitle && <p className="layout-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="layout-actions">{actions}</div>}
      </header>
      <div className="layout-content">{children}</div>
    </main>
  );
}
