import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import SyncManager from '@/components/providers/SyncManager';

export const metadata: Metadata = {
    title: 'Priority Matrix - AI 아이젠하워 매트릭스',
    description: '아이젠하워 매트릭스 기반의 효율적인 할일 관리 솔루션',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <AuthProvider>
                    <SyncManager />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
