import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: number;
}

export function PageContainer({ children, maxWidth = 900 }: PageContainerProps) {
  return <div style={{ maxWidth, margin: '0 auto' }}>{children}</div>;
}
