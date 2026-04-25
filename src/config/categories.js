export const HAZARD_GROUPS = [
    { id: 'fiziksel', label: 'Fiziksel Tehlikeler', icon: '🏗️' },
    { id: 'kimyasal', label: 'Kimyasal Tehlikeler', icon: '🧪' },
    { id: 'biyolojik', label: 'Biyolojik Tehlikeler', icon: '🦠' },
    { id: 'ergonomik', label: 'Ergonomik Tehlikeler', icon: '🧑‍🔧' },
    { id: 'psikososyal', label: 'Psikososyal Tehlikeler', icon: '🧠' },
    { id: 'operasyonel', label: 'Operasyonel / Havacılık', icon: '✈️' }
];

export const HAZARD_CATEGORIES = [
    { id: 'fod', label: 'FOD (Yabancı Madde Hasarı)', icon: '⚠️', color: '#EF4444', group: 'operasyonel' },
    { id: 'hangar', label: 'Hangar Güvenliği', icon: '🏭', color: '#F97316', group: 'fiziksel' },
    { id: 'apron', label: 'Apron / Pist Sahası', icon: '✈️', color: '#EAB308', group: 'operasyonel' },
    { id: 'atolye', label: 'Atölye / Bakım', icon: '🔧', color: '#8B5CF6', group: 'operasyonel' },
    { id: 'depo', label: 'Depo / Malzeme', icon: '📦', color: '#3B82F6', group: 'operasyonel' },
    { id: 'kimyasal', label: 'Kimyasal Maddeler', icon: '🧪', color: '#EC4899', group: 'kimyasal' },
    { id: 'elektrik', label: 'Elektrik / Enerji', icon: '⚡', color: '#F59E0B', group: 'fiziksel' },
    { id: 'yuksekte', label: 'Yüksekte Çalışma', icon: '🪜', color: '#DC2626', group: 'fiziksel' },
    { id: 'ergonomi', label: 'Ergonomi', icon: '🧑‍🔧', color: '#14B8A6', group: 'ergonomik' },
    { id: 'gurultu', label: 'Gürültü / Titreşim', icon: '🔊', color: '#6366F1', group: 'fiziksel' },
    { id: 'yangin', label: 'Yangın Güvenliği', icon: '🔥', color: '#EF4444', group: 'fiziksel' },
    { id: 'kkd', label: 'KKD Kullanımı', icon: '🦺', color: '#10B981', group: 'operasyonel' },
    { id: 'trafik', label: 'İç Trafik / Araç', icon: '🚗', color: '#0EA5E9', group: 'operasyonel' },
    { id: 'dusme', label: 'Düşme / Kayma', icon: '🚧', color: '#F97316', group: 'fiziksel' },
    { id: 'psikososyal', label: 'Psikososyal Riskler', icon: '🧠', color: '#A855F7', group: 'psikososyal' },
    { id: 'biyolojik', label: 'Biyolojik Riskler', icon: '🦠', color: '#22C55E', group: 'biyolojik' },
    { id: 'diger', label: 'Diğer', icon: '📋', color: '#64748B', group: 'operasyonel' }
];

export const OBSERVATION_AREAS = [
    'Hangar 1', 'Hangar 2', 'Hangar 3', 'Hangar 4',
    'Ana Bakım Ünitesi', 'Komponent Atölyesi', 'Boya Atölyesi',
    'Motor Atölyesi', 'Elektrik/Aviyonik Atölyesi',
    'İniş Takımı Atölyesi', 'Kompozit Atölyesi',
    'Depo A', 'Depo B', 'Kimyasal Depo',
    'Apron Sahası', 'Pist Kenarı',
    'Ofis Binası', 'Sosyal Tesisler',
    'Eğitim Merkezi', 'Diğer'
];

export const SEVERITY_LEVELS = [
    { id: 1, label: 'Düşük', color: '#22C55E', description: 'Küçük risk, düzeltici faaliyet planlanabilir' },
    { id: 2, label: 'Orta', color: '#EAB308', description: 'Orta risk, kısa sürede müdahale gerekir' },
    { id: 3, label: 'Yüksek', color: '#F97316', description: 'Yüksek risk, derhal düzeltici faaliyet' },
    { id: 4, label: 'Kritik', color: '#EF4444', description: 'Kritik risk, iş durdurulmalı' }
];

export const ACTION_STATUSES = [
    { id: 'planned', label: 'Planlandı', color: '#8B5CF6', icon: '📅' },
    { id: 'pending', label: 'Beklemede', color: '#64748B', icon: '⏳' },
    { id: 'open', label: 'Açık', color: '#3B82F6', icon: '📝' },
    { id: 'in_progress', label: 'Devam Ediyor', color: '#F59E0B', icon: '🔄' },
    { id: 'completed', label: 'Tamamlandı', color: '#10B981', icon: '✅' },
    { id: 'overdue', label: 'Gecikmiş', color: '#EF4444', icon: '⏰' },
    { id: 'cancelled', label: 'İptal Edildi', color: '#64748B', icon: '❌' }
];

export const OBSERVATION_STATUSES = [
    { id: 'new', label: 'Yeni', color: '#3B82F6' },
    { id: 'in_review', label: 'İnceleniyor', color: '#F59E0B' },
    { id: 'action_taken', label: 'Aksiyon Alındı', color: '#8B5CF6' },
    { id: 'closed', label: 'Kapatıldı', color: '#10B981' }
];

export const DEPARTMENTS = [
    'Uçak Bakım', 'Komponent Bakım', 'Motor Bakım',
    'Elektrik/Aviyonik', 'Yapısal Bakım', 'Boya/Kaplama',
    'Kalite Güvence', 'Mühendislik', 'Planlama',
    'Malzeme Yönetimi', 'İnsan Kaynakları', 'İSG Birimi',
    'Genel Müdürlük', 'Diğer'
];

// ── Çalışan Geri Bildirim (ISO 45001 Madde 5.4) ──
export const FEEDBACK_TYPES = [
    { id: 'suggestion', label: 'Öneri', icon: '💡', color: '#3B82F6' },
    { id: 'complaint', label: 'Şikâyet', icon: '📢', color: '#F97316' },
    { id: 'hazard_report', label: 'Tehlike Bildirimi', icon: '⚠️', color: '#EF4444' },
    { id: 'improvement', label: 'İyileştirme Önerisi', icon: '🔧', color: '#10B981' },
    { id: 'consultation', label: 'Yönetim İstişaresi / Anket', icon: '🤝', color: '#A855F7' }
];

export const FEEDBACK_STATUSES = [
    { id: 'new', label: 'Yeni', color: '#3B82F6', icon: '🆕' },
    { id: 'reviewed', label: 'İncelendi', color: '#8B5CF6', icon: '👁️' },
    { id: 'in_progress', label: 'İşlemde', color: '#F59E0B', icon: '🔄' },
    { id: 'resolved', label: 'Çözüldü', color: '#10B981', icon: '✅' },
    { id: 'rejected', label: 'Reddedildi', color: '#64748B', icon: '❌' }
];

export const FEEDBACK_PRIORITIES = [
    { id: 'low', label: 'Düşük', color: '#22C55E' },
    { id: 'medium', label: 'Orta', color: '#EAB308' },
    { id: 'high', label: 'Yüksek', color: '#F97316' },
    { id: 'urgent', label: 'Acil', color: '#EF4444' }
];

// ── ISO 45001 Madde 6.1.2 (Fırsatlar ve Kök Neden) ──
export const OPPORTUNITY_TYPES = [
    { id: 'process', label: 'Süreç İyileştirme', icon: '📈', color: '#10B981' },
    { id: 'technology', label: 'Teknolojik Yatırım', icon: '🤖', color: '#3B82F6' },
    { id: 'training', label: 'Eğitim ve Yeterlilik', icon: '🎓', color: '#8B5CF6' },
    { id: 'ergonomics', label: 'Ergonomik Tasarım', icon: '🪑', color: '#EC4899' },
    { id: 'culture', label: 'Güvenlik Kültürü', icon: '🤝', color: '#F59E0B' }
];

export const RCA_METHODS = [
    { id: '5why', label: '5 Neden Analizi', description: 'Neden sorusunu 5 kez sorarak kök nedene ulaşma' },
    { id: 'fishbone', label: 'Balık Kılçığı (Ishikawa)', description: 'İnsan, Makine, Metot, Malzeme, Ölçüm, Çevre analizi' },
    { id: 'pareto', label: 'Pareto Analizi', description: 'Sorunların %80inin, sebeplerin %20sinden kaynaklanması' }
];

export const ROOT_CAUSE_CATEGORIES = [
    { id: 'individual', label: 'Bireysel Faktörler', color: '#EF4444' },
    { id: 'workplace', label: 'İşyeri Koşulları', color: '#F59E0B' },
    { id: 'management', label: 'Yönetim Sistemi', color: '#3B82F6' },
    { id: 'technical', label: 'Teknik / Ekipman', color: '#8B5CF6' },
    { id: 'external', label: 'Dış Faktörler', color: '#64748B' }
];

// ── ISO 45001 Madde 7.2 (Eğitim ve Yeterlilik) ──
export const TRAINING_TYPES = [
    { id: 'isg_temel', label: 'Temel İSG Eğitimi', icon: '🔰', color: '#3B82F6', validityMonths: 12 },
    { id: 'yuksekte_calisma', label: 'Yüksekte Çalışma', icon: '🪜', color: '#EF4444', validityMonths: 12 },
    { id: 'yangin', label: 'Yangın ve Acil Durum', icon: '🔥', color: '#F97316', validityMonths: 12 },
    { id: 'ilk_yardim', label: 'İlk Yardım', icon: '🚑', color: '#10B981', validityMonths: 36 },
    { id: 'ergonomi', label: 'Ergonomi', icon: '🪑', color: '#8B5CF6', validityMonths: 24 },
    { id: 'kimyasal', label: 'Kimyasallarla Çalışma', icon: '🧪', color: '#EC4899', validityMonths: 12 },
    { id: 'ekipman', label: 'Özel Ekipman Kullanımı', icon: '⚙️', color: '#F59E0B', validityMonths: 24 },
    { id: 'oryantasyon', label: 'İşe Giriş Oryantasyonu', icon: '👋', color: '#64748B', validityMonths: 0 }
];

export const TRAINING_STATUSES = [
    { id: 'planned', label: 'Planlandı', color: '#3B82F6', icon: '📅' },
    { id: 'active', label: 'Devam Ediyor', color: '#F59E0B', icon: '⏳' },
    { id: 'completed', label: 'Tamamlandı', color: '#10B981', icon: '✅' },
    { id: 'cancelled', label: 'İptal', color: '#EF4444', icon: '❌' }
];

export const PARTICIPANT_STATUSES = [
    { id: 'registered', label: 'Kayıtlı', color: '#64748B' },
    { id: 'attended', label: 'Katıldı', color: '#10B981' },
    { id: 'absent', label: 'Katılmadı', color: '#EF4444' },
    { id: 'failed', label: 'Başarısız', color: '#F97316' }
];

// ── ISO 45001 Madde 7.5 (Belgelenmiş Bilgi Kontrolü) ──
export const DOCUMENT_TYPES = [
    { id: 'procedure', label: 'Prosedür', icon: '📑', color: '#3B82F6' },
    { id: 'instruction', label: 'Talimat', icon: '📝', color: '#F59E0B' },
    { id: 'form', label: 'Form / Liste', icon: '📋', color: '#10B981' },
    { id: 'plan', label: 'Plan / Program', icon: '📅', color: '#8B5CF6' },
    { id: 'risk_assessment', label: 'Risk Değerlendirmesi', icon: '⚠️', color: '#EF4444' },
    { id: 'external', label: 'Dış Kaynaklı Doküman', icon: '🌍', color: '#64748B' },
    { id: 'other', label: 'Diğer', icon: '📁', color: '#A855F7' }
];

export const DOCUMENT_STATUSES = [
    { id: 'draft', label: 'Taslak', color: '#64748B', icon: '✍️' },
    { id: 'in_review', label: 'Onay Bekliyor', color: '#F59E0B', icon: '⏳' },
    { id: 'published', label: 'Yürürlükte', color: '#10B981', icon: '✅' },
    { id: 'archived', label: 'Arşivlendi / İptal', color: '#EF4444', icon: '📦' }
];

export const ACCESS_LEVELS = [
    { id: 'all', label: 'Tüm Çalışanlar', description: 'Sisteme kayıtlı herkes görebilir' },
    { id: 'department', label: 'Sadece İlgili Departman', description: 'Seçili departmandaki çalışanlar görebilir' },
    { id: 'management', label: 'Sadece Yöneticiler / İSG Birimi', description: 'Yetkili kullanıcılar görebilir' }
];

// ── ISO 45001 Madde 8.2 (Acil Durum Hazırlığı ve Müdahale) ──
export const EMERGENCY_TYPES = [
    { id: 'fire', label: 'Yangın ve Patlama', icon: '🔥', color: '#EF4444' },
    { id: 'earthquake', label: 'Deprem / Doğal Afet', icon: '🌍', color: '#F97316' },
    { id: 'chemical_spill', label: 'Kimyasal Döküntü / Sızıntı', icon: '🧪', color: '#8B5CF6' },
    { id: 'medical', label: 'İş Kazası / Medikal Acil', icon: '🚑', color: '#10B981' },
    { id: 'sabotage', label: 'Sabotaj / Terör', icon: '🚨', color: '#64748B' },
    { id: 'environmental', label: 'Çevre Felaketi', icon: '🌿', color: '#3B82F6' },
    { id: 'rescue', label: 'Arama ve Kurtarma', icon: '🧗', color: '#EC4899' }
];

export const EMERGENCY_PLAN_STATUSES = [
    { id: 'active', label: 'Aktif / Güncel', color: '#10B981', icon: '✅' },
    { id: 'needs_review', label: 'Gözden Geçirilmeli', color: '#F59E0B', icon: '⏳' },
    { id: 'outdated', label: 'Süresi Geçmiş', color: '#EF4444', icon: '❌' },
    { id: 'draft', label: 'Taslak', color: '#64748B', icon: '✍️' }
];

export const DRILL_STATUSES = [
    { id: 'planned', label: 'Planlandı', color: '#3B82F6', icon: '📅' },
    { id: 'completed', label: 'Başarılı', color: '#10B981', icon: '✅' },
    { id: 'needs_improvement', label: 'İyileştirme Gerekli', color: '#F59E0B', icon: '⚠️' },
    { id: 'failed', label: 'Başarısız (Tekrar)', color: '#EF4444', icon: '❌' },
    { id: 'cancelled', label: 'İptal', color: '#64748B', icon: '🚫' }
];

// ── ISO 45001 Madde 9.1.2 (Uygunluk Değerlendirmesi) ──
export const COMPLIANCE_STATUSES = [
    { id: 'compliant', label: 'Uygun', color: '#10B981', icon: '✅', description: 'Yasal/Standart şartı tamamen karşılanıyor' },
    { id: 'partial', label: 'Kısmen Uygun', color: '#F59E0B', icon: '⚠️', description: 'Aksiyon planı/DÖF gerekiyor' },
    { id: 'non_compliant', label: 'Uygun Değil', color: '#EF4444', icon: '❌', description: 'Hemen aksiyon alınmalı' },
    { id: 'not_applicable', label: 'Uygulanamaz', color: '#64748B', icon: '➖', description: 'İşyerimiz için geçerli değil' },
    { id: 'not_evaluated', label: 'Değerlendirilmedi', color: '#9CA3AF', icon: '❓', description: 'Henüz değerlendirme yapılmadı' }
];

// ── ISO 45001 Madde 9.2 (İç Tetkik) ──
export const AUDIT_STATUSES = [
    { id: 'planned', label: 'Planlandı', color: '#3B82F6', icon: '📅' },
    { id: 'in_progress', label: 'Devam Ediyor', color: '#F59E0B', icon: '⏳' },
    { id: 'completed', label: 'Tamamlandı (Rapor Açık)', color: '#10B981', icon: '📝' },
    { id: 'closed', label: 'Kapatıldı', color: '#64748B', icon: '✅' },
];
export const AUDIT_FINDING_SEVERITY = [
    { id: 'major', label: 'Majör Uygunsuzluk', color: '#EF4444', icon: '🛑' },
    { id: 'minor', label: 'Minör Uygunsuzluk', color: '#F97316', icon: '⚠️' },
    { id: 'observation', label: 'Gözlem / İyileştirme Fırsatı', color: '#3B82F6', icon: '💡' },
];

// ── ISO 45001 Madde 10.2 (Olay/Kaza Soruşturması) ──
export const INCIDENT_TYPES = [
    { id: 'near_miss', label: 'Ramak Kala', color: '#F59E0B', icon: '🎯' },
    { id: 'first_aid', label: 'İlk Yardım Vakası', color: '#3B82F6', icon: '🩹' },
    { id: 'lti', label: 'Kayıp Günlü İş Kazası', color: '#EF4444', icon: '🚑' },
    { id: 'property_damage', label: 'Maddi Hasar / Ekipman', color: '#8B5CF6', icon: '🔧' },
    { id: 'environmental', label: 'Çevre Olayı', color: '#10B981', icon: '🌿' }
];

export const INCIDENT_STATUSES = [
    { id: 'new', label: 'Yeni Bildirim', color: '#3B82F6', icon: '🆕' },
    { id: 'investigating', label: 'Soruşturuluyor', color: '#F59E0B', icon: '🔍' },
    { id: 'action_taken', label: 'Aksiyon Alındı', color: '#8B5CF6', icon: '⚙️' },
    { id: 'closed', label: 'Kapatıldı', color: '#10B981', icon: '✅' }
];
