import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Góc Học Viên | Miora Académie',
  description: 'Blog, tips học tiếng Pháp, tài liệu miễn phí, thành tựu và feedback từ học viên Miora Académie. Cùng chinh phục tiếng Pháp!',
  openGraph: {
    title: 'Góc Học Viên | Miora Académie',
    description: 'Blog, tips học tiếng Pháp, tài liệu miễn phí và cảm hứng từ cộng đồng học viên Miora.',
    type: 'website',
  },
};

export default function StudentHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
