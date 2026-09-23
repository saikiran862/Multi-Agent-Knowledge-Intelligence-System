import { DocumentChunk, DomainType, TestCaseItem } from '../types';

export const PERMANENT_KNOWLEDGE_BASE: DocumentChunk[] = [
  // DevOps & Cloud
  {
    id: 'chunk-devops-01',
    documentId: 'doc-devops-arch',
    documentTitle: 'Enterprise Cloud Architecture & Disaster Recovery Guide v4.2',
    section: '§3.2 Disaster Recovery, RTO & RPO Specifications',
    page: 24,
    domain: 'DevOps & Cloud',
    content: 'Tier-1 Mission-Critical Services (including PostgreSQL database clusters and payment ingestion pipelines) enforce a Recovery Point Objective (RPO) of ≤ 5 seconds via synchronous cross-region replication and a Recovery Time Objective (RTO) of ≤ 15 minutes. For Tier-2 analytical workloads, RPO is relaxed to 1 hour with asynchronous snapshots and RTO is ≤ 4 hours.',
    similarityScore: 0.96,
    citationRef: '[Doc 1, §3.2]',
    keywords: ['rto', 'rpo', 'recovery point objective', 'recovery time objective', 'tier-1', 'tier-2', 'disaster recovery', 'failover', 'database', 'postgresql']
  },
  {
    id: 'chunk-devops-02',
    documentId: 'doc-devops-arch',
    documentTitle: 'Enterprise Cloud Architecture & Disaster Recovery Guide v4.2',
    section: '§4.1 Automated Multi-Region Active-Passive Failover',
    page: 29,
    domain: 'DevOps & Cloud',
    content: 'Multi-region failover triggers automatically when Route53 / Cloud DNS health check failure rates exceed 3 consecutive 10-second intervals (30 seconds total outage). BGP routing pivots to the secondary standby region (us-east-1 to us-west-2), spinning up read-replicas into primary masters within 4 minutes.',
    similarityScore: 0.94,
    citationRef: '[Doc 1, §4.1]',
    keywords: ['failover', 'multi-region', 'dns', 'active-passive', 'route53', 'standby', 'secondary', 'primary']
  },
  {
    id: 'chunk-devops-03',
    documentId: 'doc-k8s-ops',
    documentTitle: 'Kubernetes Production Operations Manual 2026',
    section: '§2.4 Pod Disruption Budgets & Horizontal Pod Autoscaling (HPA)',
    page: 12,
    domain: 'DevOps & Cloud',
    content: 'All stateful workloads and API gateways require PodDisruptionBudgets (PDB) specifying minAvailable: 80% or maxUnavailable: 1 to guarantee zero downtime during rolling node upgrades. HPA targets CPU utilization at 70% threshold and custom Prometheus request-rate metrics with a 300s scale-down stabilization window.',
    similarityScore: 0.91,
    citationRef: '[Doc 2, §2.4]',
    keywords: ['kubernetes', 'k8s', 'hpa', 'autoscaling', 'pod disruption budget', 'pdb', 'rolling upgrade', 'minavailable']
  },
  {
    id: 'chunk-devops-04',
    documentId: 'doc-devops-iam',
    documentTitle: 'Cloud Security & IAM Governance Whitepaper',
    section: '§5.3 Zero-Trust Ephemeral Role Credentials & KMS Rotation',
    page: 38,
    domain: 'DevOps & Cloud',
    content: 'Static AWS IAM access keys are strictly prohibited in production. All microservices must assume OIDC-federated IAM roles with STS temporary credentials valid for a maximum duration of 1 hour (3600 seconds). AWS KMS Customer Managed Keys (CMKs) must have automatic annual rotation enabled with AES-256 symmetric encryption.',
    similarityScore: 0.92,
    citationRef: '[Doc 3, §5.3]',
    keywords: ['iam', 'zero-trust', 'sts', 'credentials', 'kms', 'rotation', 'key management', 'oidc', 'encryption']
  },

  // Cybersecurity & Compliance
  {
    id: 'chunk-sec-01',
    documentId: 'doc-soc2-policy',
    documentTitle: 'Corporate Information Security & Data Governance Policy',
    section: '§6.1 Audit Log & Evidence Retention Schedule',
    page: 15,
    domain: 'Cybersecurity & Compliance',
    content: 'Under SOC 2 Type II and ISO 27001 Annex A.12, all authentication logs, administrative access records, and financial transaction audit trails must be retained in immutable WORM (Write Once, Read Many) S3 buckets for a mandatory period of 7 years. System telemetry and debug logs are archived for 90 days before automatic deletion.',
    similarityScore: 0.95,
    citationRef: '[Doc 4, §6.1]',
    keywords: ['data retention', 'retention policy', 'audit logs', 'soc 2', 'iso 27001', '7 years', 'worm', 'compliance']
  },
  {
    id: 'chunk-sec-02',
    documentId: 'doc-incident-playbook',
    documentTitle: 'Enterprise Incident Response & Escalation Playbook',
    section: '§2.2 Severity Matrix: P1 Critical vs P2 High Escalation',
    page: 8,
    domain: 'Cybersecurity & Compliance',
    content: 'Severity 1 (P1) incidents involve active exfiltration of sensitive customer data or complete core service outage affecting >10% of users. P1 mandates an immediate bridge assembly within 15 minutes, notification of the CISO and General Counsel within 30 minutes, and customer advisory broadcast within 2 hours.',
    similarityScore: 0.93,
    citationRef: '[Doc 5, §2.2]',
    keywords: ['incident response', 'p1', 'severity 1', 'escalation', 'ciso', 'breach', 'outage', 'playbook']
  },
  {
    id: 'chunk-sec-03',
    documentId: 'doc-crypto-standard',
    documentTitle: 'Cryptographic Standards & Transport Layer Security Spec',
    section: '§3.1 Encryption in Transit and at Rest Standards',
    page: 19,
    domain: 'Cybersecurity & Compliance',
    content: 'All ingress and internal inter-service mesh communication must enforce TLS 1.3 with forward secrecy cipher suites (ECDHE-RSA-AES256-GCM-SHA384 or ChaCha20-Poly1305). Data at rest in all storage volumes, databases, and backup snapshots must be encrypted using AES-256-GCM with hardware security module (HSM) backed root keys.',
    similarityScore: 0.93,
    citationRef: '[Doc 6, §3.1]',
    keywords: ['encryption', 'tls 1.3', 'aes-256', 'cryptographic', 'transit', 'at rest', 'cipher']
  },

  // Healthcare & HIPAA Protocols
  {
    id: 'chunk-health-01',
    documentId: 'doc-hipaa-protocol',
    documentTitle: 'Clinical Information Systems & HIPAA Compliance Standard',
    section: '§4.2 Protected Health Information (PHI) Minimum Necessary Rule',
    page: 31,
    domain: 'Healthcare & HIPAA',
    content: 'Access to Protected Health Information (PHI) under HIPAA 45 CFR §164.502(b) must adhere strictly to the "Minimum Necessary" rule. Clinicians may access full medical records only for direct patients assigned to their active encounter. All PHI exports, API queries, and EMR lookups generate cryptographic audit records logged with user ID, NPI, and patient MRN.',
    similarityScore: 0.96,
    citationRef: '[Doc 7, §4.2]',
    keywords: ['hipaa', 'phi', 'protected health information', 'minimum necessary', 'emr', 'patient records', 'audit']
  },
  {
    id: 'chunk-health-02',
    documentId: 'doc-hipaa-protocol',
    documentTitle: 'Clinical Information Systems & HIPAA Compliance Standard',
    section: '§7.3 HIPAA Breach Notification Rule & HHS Reporting',
    page: 44,
    domain: 'Healthcare & HIPAA',
    content: 'Following a confirmed breach of unsecured PHI affecting 500 or more individuals, covered entities must notify affected patients and the Department of Health and Human Services (HHS) Office for Civil Rights (OCR) without unreasonable delay and in no case later than 60 calendar days following discovery. Breaches affecting fewer than 500 individuals may be logged annually.',
    similarityScore: 0.95,
    citationRef: '[Doc 7, §7.3]',
    keywords: ['breach notification', 'hhs', 'ocr', '60 days', '500 individuals', 'hipaa breach', 'reporting']
  },
  {
    id: 'chunk-health-03',
    documentId: 'doc-triage-er',
    documentTitle: 'Emergency Department Clinical Practice Guidelines',
    section: '§1.4 Emergency Severity Index (ESI) Triage Classification',
    page: 6,
    domain: 'Healthcare & HIPAA',
    content: 'The Emergency Severity Index (ESI) categorizes patients from Level 1 (Resuscitation, immediate life-saving intervention needed) down to Level 5 (Non-urgent, zero resources needed). ESI Level 2 patients require emergency nursing assessment within 10 minutes and physician consultation within 15 minutes.',
    similarityScore: 0.90,
    citationRef: '[Doc 8, §1.4]',
    keywords: ['triage', 'esi', 'emergency severity index', 'level 1', 'level 2', 'emergency room', 'clinical']
  },

  // FinTech & Banking Regulations
  {
    id: 'chunk-fin-01',
    documentId: 'doc-pci-spec',
    documentTitle: 'Payment Card Industry Data Security Standard (PCI-DSS) 4.0 Implementation Guide',
    section: '§3.4 Primary Account Number (PAN) Tokenization and Storage Restrictions',
    page: 22,
    domain: 'FinTech & Banking',
    content: 'Under PCI-DSS 4.0 Requirement 3, storage of Sensitive Authentication Data (SAD, including CVV2/CVC2 and magnetic stripe track data) after transaction authorization is strictly forbidden, even if encrypted. Primary Account Numbers (PAN) must be rendered unreadable using irreversible salted hashing, truncation (first 6, last 4), or format-preserving tokenization.',
    similarityScore: 0.97,
    citationRef: '[Doc 9, §3.4]',
    keywords: ['pci-dss', 'pci', 'pan', 'cardholder data', 'tokenization', 'cvv', 'sad', 'credit card']
  },
  {
    id: 'chunk-fin-02',
    documentId: 'doc-aml-kyc',
    documentTitle: 'Global Anti-Money Laundering (AML) & Bank Secrecy Act Policy',
    section: '§4.1 Currency Transaction Report (CTR) & Suspicious Activity (SAR) Thresholds',
    page: 18,
    domain: 'FinTech & Banking',
    content: 'Financial institutions must file a Currency Transaction Report (CTR) with FinCEN for aggregate cash deposits or withdrawals exceeding $10,000 USD in a single business day. A Suspicious Activity Report (SAR) must be filed within 30 calendar days for any transaction involving $5,000 or more where structuring, illicit origin, or absence of lawful business purpose is suspected.',
    similarityScore: 0.94,
    citationRef: '[Doc 10, §4.1]',
    keywords: ['aml', 'anti-money laundering', 'sar', 'ctr', 'fincen', 'threshold', '$10,000', '$5,000', 'suspicious activity']
  },
  {
    id: 'chunk-fin-03',
    documentId: 'doc-fraud-spec',
    documentTitle: 'Digital Payments & EMV 3-D Secure Risk Engine Specifications',
    section: '§2.5 3DS 2.2 Dynamic Risk Assessment & Step-Up Authentication',
    page: 14,
    domain: 'FinTech & Banking',
    content: 'EMV 3-D Secure 2.2 calculates fraud risk using behavioral device fingerprinting, IP velocity, and shipping-billing mismatches. Transactions scoring above the 65 risk index trigger a Step-Up Challenge (biometric or OTP). Frictionless flow is approved only for transactions under the low-risk threshold (<25) with merchant chargeback liability shift.',
    similarityScore: 0.92,
    citationRef: '[Doc 11, §2.5]',
    keywords: ['3ds', 'emv', 'fraud detection', 'step-up', 'frictionless', 'authentication', 'risk score', 'chargeback']
  }
];

export const BENCHMARK_TEST_CASES: TestCaseItem[] = [
  {
    id: 'test-ambig-01',
    title: 'Ambiguous Scope: "What is the policy on data retention?"',
    category: 'ambiguous',
    domain: 'Cybersecurity & Compliance',
    query: 'What is the policy on data retention?',
    expectedClarification: true,
    expectedBehavior: 'Clarification Agent detects missing context: multiple domains specify different retention rules (SOC 2 audit logs vs system telemetry vs HIPAA clinical records). It asks the user to clarify which category or compliance standard they are referencing.',
    suggestedFollowUp: 'Are you asking about SOC 2 audit logs (7 years), telemetry logs (90 days), or HIPAA clinical records?',
    description: 'Validates M3.1 ambiguity detection when a query lacks domain/scope qualifiers.'
  },
  {
    id: 'test-ambig-02',
    title: 'Unclear Terminology: "How do I configure failover?"',
    category: 'ambiguous',
    domain: 'DevOps & Cloud',
    query: 'How do I configure failover?',
    expectedClarification: true,
    expectedBehavior: 'Clarification Agent flags unclear terminology: does failover refer to Multi-Region Cloud DNS BGP failover, or PostgreSQL Tier-1 synchronous replication failover?',
    suggestedFollowUp: 'Are you referring to Cloud DNS multi-region failover or database replica promotion?',
    description: 'Validates M3.1 ambiguity detection on underspecified system components.'
  },
  {
    id: 'test-incomp-01',
    title: 'Incomplete Request: "Tell me about compliance"',
    category: 'incomplete',
    domain: 'Cybersecurity & Compliance',
    query: 'Tell me about compliance',
    expectedClarification: true,
    expectedBehavior: 'Clarification Agent determines the query is too generic and incomplete to formulate a precise retrieval without overwhelming the user. Prompts for specific compliance framework (SOC 2, ISO 27001, HIPAA, PCI-DSS).',
    suggestedFollowUp: 'Which regulatory standard are you interested in: SOC 2, HIPAA, PCI-DSS, or ISO 27001?',
    description: 'Validates M3.1 incomplete query detection.'
  },
  {
    id: 'test-multipart-01',
    title: 'Multi-Part Query: RTO for tier-1 AND KMS key rotation',
    category: 'multipart',
    domain: 'DevOps & Cloud',
    query: 'What are the RTO requirements for tier-1 databases, and how often must we rotate KMS customer keys?',
    expectedClarification: false,
    expectedBehavior: 'Clarification Agent identifies 2 distinct requirements (RTO for Tier-1: ≤ 15 min, RPO ≤ 5s; KMS CMK rotation: annual auto-rotation). It determines both can be resolved simultaneously without needing clarification.',
    description: 'Validates M3.1 multi-part query decomposition and joint resolution.'
  },
  {
    id: 'test-followup-01',
    title: 'Context-Dependent Follow-Up: "What about its retention policy?"',
    category: 'context_followup',
    domain: 'Cybersecurity & Compliance',
    query: 'What about its retention policy?',
    expectedClarification: false,
    expectedBehavior: 'Conversation Memory Agent inspects conversation context to resolve "its". If the prior turn was about SOC 2 audit logs, it resolves the query to "What about SOC 2 audit logs retention policy?" and provides 7-year WORM storage answer.',
    description: 'Validates M3.2 pronoun resolution & coreference without repeating context.'
  },
  {
    id: 'test-switch-01',
    title: 'Context Switching: Pivot from Cloud to FinTech AML thresholds',
    category: 'context_switch',
    domain: 'FinTech & Banking',
    query: 'Now switch to banking: what are the cash reporting thresholds for SAR and CTR?',
    expectedClarification: false,
    expectedBehavior: 'Memory Agent detects explicit domain switch, prunes cloud infrastructure context to protect token budget, retrieves FinTech AML documents ($10k CTR, $5k SAR), and updates active entity to FinCEN regulations.',
    description: 'Validates M3.2 domain transition and irrelevant history pruning.'
  }
];
