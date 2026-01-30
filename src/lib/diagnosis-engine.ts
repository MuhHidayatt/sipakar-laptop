// Certainty Factor Diagnosis Engine
// Menggunakan Forward Chaining dan Certainty Factor

interface Rule {
  kode_gejala: string;
  kode_kerusakan: string;
  cf: number;
}

interface Kerusakan {
  kode_kerusakan: string;
  nama_kerusakan: string;
  solusi: string;
}

interface DiagnosisResult {
  kode_kerusakan: string;
  nama_kerusakan: string;
  nilai_cf: number;
  persentase: number;
  solusi: string;
  gejala_terkait: string[];
}

/**
 * Kombinasi CF menggunakan rumus:
 * CFcombine = CF1 + CF2 × (1 − CF1)
 */
function combineCF(cf1: number, cf2: number): number {
  return cf1 + cf2 * (1 - cf1);
}

/**
 * Proses diagnosa menggunakan Forward Chaining dan Certainty Factor
 */
export function diagnose(
  selectedGejala: string[],
  rules: Rule[],
  kerusakanList: Kerusakan[]
): DiagnosisResult[] {
  // Map untuk menyimpan CF gabungan per kerusakan
  const cfPerKerusakan: Map<string, { cf: number; gejala: string[] }> = new Map();

  // Forward Chaining: cocokkan gejala dengan rules
  for (const kodeGejala of selectedGejala) {
    // Cari semua rule yang memiliki gejala ini
    const matchingRules = rules.filter(rule => rule.kode_gejala === kodeGejala);

    for (const rule of matchingRules) {
      const existing = cfPerKerusakan.get(rule.kode_kerusakan);
      
      if (existing) {
        // Kombinasikan CF jika sudah ada
        existing.cf = combineCF(existing.cf, rule.cf);
        if (!existing.gejala.includes(kodeGejala)) {
          existing.gejala.push(kodeGejala);
        }
      } else {
        // Inisialisasi CF baru
        cfPerKerusakan.set(rule.kode_kerusakan, {
          cf: rule.cf,
          gejala: [kodeGejala],
        });
      }
    }
  }

  // Konversi ke array hasil
  const results: DiagnosisResult[] = [];
  
  cfPerKerusakan.forEach((data, kodeKerusakan) => {
    const kerusakan = kerusakanList.find(k => k.kode_kerusakan === kodeKerusakan);
    
    if (kerusakan) {
      results.push({
        kode_kerusakan: kodeKerusakan,
        nama_kerusakan: kerusakan.nama_kerusakan,
        nilai_cf: data.cf,
        persentase: Math.round(data.cf * 100),
        solusi: kerusakan.solusi,
        gejala_terkait: data.gejala,
      });
    }
  });

  // Urutkan berdasarkan CF tertinggi
  results.sort((a, b) => b.nilai_cf - a.nilai_cf);

  return results;
}

/**
 * Interpretasi tingkat keyakinan berdasarkan nilai CF
 */
export function interpretCF(cf: number): {
  label: string;
  color: 'destructive' | 'warning' | 'success';
} {
  if (cf >= 0.8) {
    return { label: 'Sangat Yakin', color: 'success' };
  } else if (cf >= 0.6) {
    return { label: 'Cukup Yakin', color: 'success' };
  } else if (cf >= 0.4) {
    return { label: 'Kemungkinan', color: 'warning' };
  } else {
    return { label: 'Kurang Yakin', color: 'destructive' };
  }
}
