import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { 
  Laptop, 
  Search, 
  Brain, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: Search,
    title: 'Pilih Gejala',
    description: 'Pilih gejala-gejala kerusakan yang dialami laptop Anda dari daftar yang tersedia.',
  },
  {
    icon: Brain,
    title: 'Analisis Cerdas',
    description: 'Sistem akan menganalisis gejala menggunakan metode Forward Chaining & Certainty Factor.',
  },
  {
    icon: FileText,
    title: 'Hasil Diagnosa',
    description: 'Dapatkan hasil diagnosa lengkap dengan tingkat keyakinan dan solusi perbaikan.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Cepat & Akurat',
    description: 'Hasil diagnosa dalam hitungan detik dengan tingkat akurasi tinggi.',
  },
  {
    icon: Shield,
    title: 'Terpercaya',
    description: 'Dibangun berdasarkan pengetahuan pakar teknisi laptop berpengalaman.',
  },
  {
    icon: Clock,
    title: '24/7 Tersedia',
    description: 'Akses kapan saja, dimana saja tanpa perlu menunggu teknisi.',
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern">
        <div className="absolute inset-0 gradient-dark opacity-[0.02] dark:opacity-10" />
        <div className="container relative py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Laptop className="h-4 w-4" />
                Sistem Pakar Diagnosa Laptop
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Diagnosa Kerusakan Laptop{' '}
              <span className="text-gradient">Cerdas & Akurat</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl"
            >
              Sistem pakar berbasis AI yang membantu Anda mendiagnosa kerusakan laptop 
              menggunakan metode Forward Chaining dan Certainty Factor dengan tingkat keyakinan terukur.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" asChild className="shadow-glow">
                <Link to="/konsultasi">
                  Mulai Diagnosa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {!user && (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">Daftar Gratis</Link>
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Kerja</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tiga langkah mudah untuk mendapatkan diagnosa kerusakan laptop Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="relative h-full border-border/50 hover:shadow-lg transition-shadow">
                  <div className="absolute -top-4 left-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-md">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  <CardHeader className="pt-10">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Langkah {index + 1}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mengapa SIPAKAR LAPTOP?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Keunggulan sistem pakar kami dibandingkan metode diagnosa konvensional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <Card className="gradient-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <CheckCircle2 className="h-12 w-12 mx-auto mb-6 opacity-90" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Siap Mendiagnosa Laptop Anda?
                </h2>
                <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                  Mulai konsultasi sekarang dan dapatkan solusi untuk masalah laptop Anda dalam hitungan detik.
                </p>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/konsultasi">
                    Mulai Konsultasi Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
