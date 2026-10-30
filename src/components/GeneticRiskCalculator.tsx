import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Dna,
  Droplet,
  FileText,
  Info,
  Layers,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Users
} from 'lucide-react';

export type ConditionKey =
  | 'BETA_THALASSEMIA'
  | 'SICKLE_CELL'
  | 'HEMOPHILIA_A'
  | 'BOMBAY_BLOOD'
  | 'RH_INCOMPATIBILITY';

export type PhenotypeStatus = 'NORMAL' | 'CARRIER' | 'AFFECTED';

interface ConditionMeta {
  name: string;
  inheritance: string;
  description: string;
  bloodRelevance: string;
  carrierFreq: string;
  defaultAlleleMom: string;
  defaultAlleleDad: string;
  riskHighThreshold: number;
}

const CONDITIONS: Record<ConditionKey, ConditionMeta> = {
  BETA_THALASSEMIA: {
    name: 'Beta-Thalassemia Major / Cooley\'s Anemia',
    inheritance: 'Autosomal Recessive (HBB gene, Chr 11p15.4)',
    description:
      'Impaired beta-globin chain synthesis leads to severe microcytic anemia, requiring lifelong 2-4 weekly packed RBC transfusions and iron chelation.',
    bloodRelevance: 'Lifelong PRBC transfusions. Demands phenotypically matched, leuco-depleted blood to prevent alloimmunization.',
    carrierFreq: '3-4% general population in India, up to 10-15% in specific ethnic communities.',
    defaultAlleleDad: 'A / β',
    defaultAlleleMom: 'A / β',
    riskHighThreshold: 25,
  },
  SICKLE_CELL: {
    name: 'Sickle Cell Anemia (HbSS)',
    inheritance: 'Autosomal Recessive (HBB Glu6Val mutation)',
    description:
      'Abnormal Hemoglobin S polymerizes under hypoxia, causing painful vaso-occlusive crises, splenic sequestration, and stroke risk.',
    bloodRelevance: 'Emergency exchange transfusions during acute chest syndrome; requires HbS-negative, extended-phenotype RBC units.',
    carrierFreq: 'Up to 20-30% in central, tribal, and eastern Indian belts.',
    defaultAlleleDad: 'A / S',
    defaultAlleleMom: 'A / S',
    riskHighThreshold: 25,
  },
  HEMOPHILIA_A: {
    name: 'Hemophilia A (Factor VIII Deficiency)',
    inheritance: 'X-Linked Recessive (F8 gene, Chr Xq28)',
    description:
      'Severe bleeding disorder causing recurrent hemarthroses, soft tissue hematomas, and life-threatening intracranial hemorrhage.',
    bloodRelevance: 'Requires Factor VIII concentrates or Cryoprecipitate units during surgical or trauma emergencies.',
    carrierFreq: '1 in 5,000 male live births globally.',
    defaultAlleleDad: 'X(h) / Y',
    defaultAlleleMom: 'X / X(h)',
    riskHighThreshold: 25,
  },
  BOMBAY_BLOOD: {
    name: 'Bombay Phenotype (hh / Oh)',
    inheritance: 'Autosomal Recessive (FUT1 deficiency, Chr 19p13.3)',
    description:
      'Failure to synthesize the H-antigen precursor; produces potent anti-H IgM antibodies that hemolyze O, A, B, and AB red cells violently.',
    bloodRelevance: 'Extreme transfusion emergency. Can ONLY receive blood from another verified Bombay hh donor or frozen autologous units.',
    carrierFreq: '1 in 10,000 in Mumbai / Western India; 1 in a million in Western nations.',
    defaultAlleleDad: 'H / h',
    defaultAlleleMom: 'H / h',
    riskHighThreshold: 25,
  },
  RH_INCOMPATIBILITY: {
    name: 'Rh Isoimmunization / Hemolytic Disease of Fetus & Newborn (HDFN)',
    inheritance: 'Maternal-Fetal Alloimmunization (RHD positive fetus vs RhD negative mother)',
    description:
      'RhD-negative sensitized mother produces maternal anti-D IgG antibodies crossing placenta, destroying RhD-positive fetal red blood cells.',
    bloodRelevance: 'Requires intrauterine transfusions and O-negative CMV-negative exchange transfusions post-delivery.',
    carrierFreq: 'Approximately 5-6% of Indian population is Rh-negative (d/d).',
    defaultAlleleDad: 'D / d',
    defaultAlleleMom: 'd / d',
    riskHighThreshold: 50,
  },
};

interface PedigreePerson {
  id: string;
  name: string;
  role: string;
  generation: 1 | 2 | 3;
  status: PhenotypeStatus;
  gender: 'MALE' | 'FEMALE';
}

export const GeneticRiskCalculator: React.FC = () => {
  const [selectedCondition, setSelectedCondition] = useState<ConditionKey>('BETA_THALASSEMIA');

  const [pedigree, setPedigree] = useState<Record<string, PedigreePerson>>({
    paternalGrandpa: { id: 'paternalGrandpa', name: 'Paternal Grandfather', role: 'Grandfather', generation: 1, status: 'NORMAL', gender: 'MALE' },
    paternalGrandma: { id: 'paternalGrandma', name: 'Paternal Grandmother', role: 'Grandmother', generation: 1, status: 'CARRIER', gender: 'FEMALE' },
    maternalGrandpa: { id: 'maternalGrandpa', name: 'Maternal Grandfather', role: 'Grandfather', generation: 1, status: 'CARRIER', gender: 'MALE' },
    maternalGrandma: { id: 'maternalGrandma', name: 'Maternal Grandmother', role: 'Grandmother', generation: 1, status: 'NORMAL', gender: 'FEMALE' },
    father: { id: 'father', name: 'Father (Consultand)', role: 'Father', generation: 2, status: 'CARRIER', gender: 'MALE' },
    mother: { id: 'mother', name: 'Mother (Partner)', role: 'Mother', generation: 2, status: 'CARRIER', gender: 'FEMALE' },
    child1: { id: 'child1', name: 'First Offspring', role: 'Child 1', generation: 3, status: 'NORMAL', gender: 'MALE' },
    child2: { id: 'child2', name: 'Current Fetus / Neonate', role: 'Target Fetus', generation: 3, status: 'AFFECTED', gender: 'FEMALE' },
  });

  const toggleStatus = (id: string) => {
    const sequence: PhenotypeStatus[] = ['NORMAL', 'CARRIER', 'AFFECTED'];
    setPedigree((prev) => {
      const current = prev[id].status;
      const next = sequence[(sequence.indexOf(current) + 1) % sequence.length];
      return {
        ...prev,
        [id]: { ...prev[id], status: next },
      };
    });
  };

  const fatherStatus = pedigree.father.status;
  const motherStatus = pedigree.mother.status;

  const calculateProbabilities = (): { affected: number; carrier: number; normal: number } => {
    if (selectedCondition === 'RH_INCOMPATIBILITY') {
      if (fatherStatus === 'AFFECTED' && motherStatus === 'NORMAL') {
        return { affected: 100, carrier: 0, normal: 0 };
      }
      if (fatherStatus === 'CARRIER' && motherStatus === 'NORMAL') {
        return { affected: 50, carrier: 50, normal: 0 };
      }
      return { affected: 25, carrier: 50, normal: 25 };
    }

    if (selectedCondition === 'HEMOPHILIA_A') {
      if (motherStatus === 'CARRIER' && fatherStatus === 'NORMAL') {
        return { affected: 25, carrier: 25, normal: 50 };
      }
      if (motherStatus === 'CARRIER' && fatherStatus === 'AFFECTED') {
        return { affected: 50, carrier: 25, normal: 25 };
      }
      if (motherStatus === 'AFFECTED' && fatherStatus === 'NORMAL') {
        return { affected: 50, carrier: 50, normal: 0 };
      }
    }

    // Standard Mendelian Autosomal Recessive:
    if (fatherStatus === 'CARRIER' && motherStatus === 'CARRIER') {
      return { affected: 25, carrier: 50, normal: 25 };
    }
    if ((fatherStatus === 'CARRIER' && motherStatus === 'AFFECTED') || (fatherStatus === 'AFFECTED' && motherStatus === 'CARRIER')) {
      return { affected: 50, carrier: 50, normal: 0 };
    }
    if (fatherStatus === 'AFFECTED' && motherStatus === 'AFFECTED') {
      return { affected: 100, carrier: 0, normal: 0 };
    }
    if ((fatherStatus === 'CARRIER' && motherStatus === 'NORMAL') || (fatherStatus === 'NORMAL' && motherStatus === 'CARRIER')) {
      return { affected: 0, carrier: 50, normal: 50 };
    }
    if ((fatherStatus === 'AFFECTED' && motherStatus === 'NORMAL') || (fatherStatus === 'NORMAL' && motherStatus === 'AFFECTED')) {
      return { affected: 0, carrier: 100, normal: 0 };
    }
    return { affected: 0, carrier: 0, normal: 100 };
  };

  const probabilities = calculateProbabilities();
  const currentConditionMeta = CONDITIONS[selectedCondition];

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0.5rem 0.5rem 3rem' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card, #ffffff)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--border-subtle, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', background: 'var(--critical-bg, #fff1f2)', border: '1px solid var(--critical-border, #fecdd3)', color: 'var(--blood-red, #e11d48)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            <Dna size={12} />
            Clinical Genetics &amp; Transfusion Forecast
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
            Genetic Risk &amp; Transfusion Pedigree Calculator
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.78rem', marginTop: '0.2rem', margin: 0 }}>
            Interactive 3-generation family tree model with Mendelian inheritance probabilities and projected blood requirements
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem' }}>
          <div>
            <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Fetal Risk</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: probabilities.affected >= 25 ? '#e11d48' : '#15803d', fontFamily: 'var(--font-mono)' }}>
              {probabilities.affected}%
            </span>
          </div>
          <div style={{ width: '1px', background: '#e2e8f0' }} />
          <div>
            <span style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Carrier Likelihood</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)' }}>
              {probabilities.carrier}%
            </span>
          </div>
        </div>
      </div>

      {/* Condition Selector Chips */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {(Object.keys(CONDITIONS) as ConditionKey[]).map((key) => {
          const isSelected = selectedCondition === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCondition(key)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: isSelected ? '1px solid #e11d48' : '1px solid #e2e8f0',
                background: isSelected ? '#e11d48' : 'var(--bg-card, #ffffff)',
                color: isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: isSelected ? '0 2px 6px rgba(225, 29, 72, 0.25)' : 'none',
              }}
            >
              {CONDITIONS[key].name.split('/')[0]}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Pedigree Tree (Left) + Calculation Matrix (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem', alignItems: 'start' }}>
        {/* Left: Interactive 3-Generation Pedigree */}
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: 'var(--radius-md, 12px)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={15} color="#e11d48" />
              Interactive Family Pedigree (Click to Cycle State)
            </h3>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Normal → Carrier → Affected
            </span>
          </div>

          {/* Pedigree Tree Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Gen 1: Grandparents */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Generation I: Grandparents
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {['paternalGrandpa', 'paternalGrandma', 'maternalGrandpa', 'maternalGrandma'].map((id) => {
                  const person = pedigree[id];
                  return (
                    <div
                      key={id}
                      onClick={() => toggleStatus(id)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: person.status === 'AFFECTED' ? '#fff1f2' : person.status === 'CARRIER' ? '#fffbeb' : '#f8fafc',
                        border: person.status === 'AFFECTED' ? '1px solid #fecdd3' : person.status === 'CARRIER' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{person.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{person.gender}</span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: person.status === 'AFFECTED' ? '#e11d48' : person.status === 'CARRIER' ? '#d97706' : '#e2e8f0',
                          color: person.status === 'NORMAL' ? '#475569' : '#ffffff',
                        }}>
                          {person.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gen 2: Parents */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Generation II: Parents (Direct Genetic Contributors)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {['father', 'mother'].map((id) => {
                  const person = pedigree[id];
                  return (
                    <div
                      key={id}
                      onClick={() => toggleStatus(id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: person.status === 'AFFECTED' ? '#fff1f2' : person.status === 'CARRIER' ? '#fffbeb' : '#f8fafc',
                        border: person.status === 'AFFECTED' ? '2px solid #e11d48' : person.status === 'CARRIER' ? '2px solid #d97706' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>{person.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{person.gender}</span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: person.status === 'AFFECTED' ? '#e11d48' : person.status === 'CARRIER' ? '#d97706' : '#e2e8f0',
                          color: person.status === 'NORMAL' ? '#475569' : '#ffffff',
                        }}>
                          {person.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gen 3: Target Offspring */}
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Generation III: Evaluated Offspring
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {['child1', 'child2'].map((id) => {
                  const person = pedigree[id];
                  return (
                    <div
                      key={id}
                      onClick={() => toggleStatus(id)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: person.status === 'AFFECTED' ? '#fff1f2' : person.status === 'CARRIER' ? '#fffbeb' : '#f8fafc',
                        border: person.status === 'AFFECTED' ? '1px solid #fecdd3' : person.status === 'CARRIER' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{person.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{person.role}</span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background: person.status === 'AFFECTED' ? '#e11d48' : person.status === 'CARRIER' ? '#d97706' : '#e2e8f0',
                          color: person.status === 'NORMAL' ? '#475569' : '#ffffff',
                        }}>
                          {person.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Risk Analysis & Transfusion Blueprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Punnett Square Probabilities Card */}
          <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: 'var(--radius-md, 12px)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={15} color="#e11d48" />
              Mendelian Offspring Distribution
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '1rem' }}>
              Calculated for Mother: <strong>{motherStatus}</strong> and Father: <strong>{fatherStatus}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', textAlign: 'center' }}>
              <div style={{ padding: '0.85rem 0.5rem', borderRadius: '8px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
                <span style={{ fontSize: '0.65rem', color: '#9f1239', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Affected / Severe</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e11d48', fontFamily: 'var(--font-mono)' }}>{probabilities.affected}%</span>
                <span style={{ fontSize: '0.62rem', color: '#9f1239', display: 'block', marginTop: '0.15rem' }}>Transfusion Dependent</span>
              </div>
              <div style={{ padding: '0.85rem 0.5rem', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '0.65rem', color: '#92400e', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Carrier / Trait</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-mono)' }}>{probabilities.carrier}%</span>
                <span style={{ fontSize: '0.62rem', color: '#92400e', display: 'block', marginTop: '0.15rem' }}>Asymptomatic Carrier</span>
              </div>
              <div style={{ padding: '0.85rem 0.5rem', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>Normal / Wildtype</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d', fontFamily: 'var(--font-mono)' }}>{probabilities.normal}%</span>
                <span style={{ fontSize: '0.62rem', color: '#166534', display: 'block', marginTop: '0.15rem' }}>Non-Transfusion</span>
              </div>
            </div>
          </div>

          {/* Transfusion Protocol Card */}
          <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: 'var(--radius-md, 12px)', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Droplet size={15} color="#e11d48" />
              Blood Transfusion Protocol &amp; Fulfilment Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Target Phenotype &amp; Inheritance:</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{currentConditionMeta.inheritance}</span>
              </div>

              <div style={{ padding: '0.6rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Transfusion Implication:</span>
                <span style={{ color: '#0f172a', lineHeight: 1.4 }}>{currentConditionMeta.bloodRelevance}</span>
              </div>

              <div style={{ padding: '0.6rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Population Prevalance:</span>
                <span style={{ color: '#475569' }}>{currentConditionMeta.carrierFreq}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
