import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 SIPAKAR LAPTOP. Sistem Pakar Diagnosa Kerusakan Laptop.</p>
          <p className="mt-1">Menggunakan metode Forward Chaining & Certainty Factor</p>
        </div>
      </footer>
    </div>
  );
}
