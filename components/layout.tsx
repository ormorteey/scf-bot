interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="flex w-full flex-1 flex-col h-screen overflow-auto">
      {children}
    </main>
  );
}
