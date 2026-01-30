import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Laptop, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Laptop className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
            SIPAKAR LAPTOP
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Beranda
          </Link>
          <Link 
            to="/konsultasi" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Konsultasi
          </Link>
          {user && (
            <Link 
              to="/riwayat" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Riwayat
            </Link>
          )}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:flex"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="max-w-[100px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Masuk</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?mode=signup">Daftar</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border"
          >
            <div className="container py-4 space-y-4">
              <nav className="flex flex-col gap-2">
                <Link 
                  to="/" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Beranda
                </Link>
                <Link 
                  to="/konsultasi" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Konsultasi
                </Link>
                {user && (
                  <Link 
                    to="/riwayat" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Riwayat
                  </Link>
                )}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              <div className="flex items-center justify-between px-3 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {theme === 'light' ? (
                    <><Moon className="h-4 w-4 mr-2" /> Dark Mode</>
                  ) : (
                    <><Sun className="h-4 w-4 mr-2" /> Light Mode</>
                  )}
                </Button>

                {user ? (
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Keluar
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      Masuk
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
