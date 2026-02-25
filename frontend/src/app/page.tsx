'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    MessageCircle, Phone, Upload, Hash, User, Mail,
    Calendar, MapPin, Shield, Smartphone, Send, FileText,
    CheckCircle, TrendingUp, Activity, CreditCard,
    AlertCircle, Layout, PieChart, FileCode, Route, Clock, Eye,
    Search, AlertTriangle, BarChart3, Target, DollarSign, X, Maximize2, Paperclip,
} from 'lucide-react';

/* ── Inline style objects ── */
const S = {
    page: {
        minHeight: '100vh',
        background: '#F5F7F9',
        color: '#111',
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    } as React.CSSProperties,

    header: {
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    headerInner: {
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        padding: '0 24px',
    },

    logo: {
        width: 42, height: 42,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #12C15F 0%, #0B4A2D 100%)',
        flexShrink: 0,
    },

    pillGreen: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 9999,
        fontSize: 13, fontWeight: 500,
        background: '#E8FBF0', color: '#059669',
        border: '1px solid #A7F3D0',
    },
    pillBlue: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 9999,
        fontSize: 13, fontWeight: 500,
        background: '#EBF5FF', color: '#3B82F6',
        border: '1px solid #BFDBFE',
    },

    hero: {
        borderRadius: 20,
        padding: '40px 40px 48px',
        background: 'linear-gradient(135deg, #12C15F 0%, #0A5C35 50%, #0B4A2D 100%)',
        color: '#FFFFFF',
        position: 'relative' as const,
        overflow: 'hidden',
        minHeight: 440,
    },

    stepCard: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.2)',
    },
    stepIcon: {
        width: 36, height: 36,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.25)',
        flexShrink: 0,
    },

    statsCard: {
        borderRadius: 20,
        padding: 24,
        background: '#FFFFFF',
        border: '1px solid #F3F4F6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },

    mpesaCard: {
        borderRadius: 20,
        padding: 24,
        background: 'linear-gradient(135deg, #008A4A 0%, #004D2A 100%)',
        color: '#FFFFFF',
        position: 'relative' as const,
        overflow: 'hidden',
    },

    // Missing Feature Cards Strip
    featureStrip: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginTop: 24,
    },
    featureCard: {
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px 20px',
        border: '1px solid #F3F4F6',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderLeft: '4px solid #12C15F',
    },

    // Tab Navigation
    tabBar: {
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        borderRadius: 14,
        padding: 6,
        border: '1px solid #F3F4F6',
        marginTop: 20,
        gap: 4,
        overflowX: 'auto' as const,
    },
    tab: {
        padding: '10px 18px',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap' as const,
        transition: 'all 0.2s',
    },

    formCard: {
        borderRadius: 20,
        padding: '32px 40px 40px',
        background: '#FFFFFF',
        border: '1px solid #F3F4F6',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginTop: 24,
    },

    input: {
        width: '100%',
        height: 48,
        padding: '0 16px 0 44px',
        background: '#F5F7F9',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        fontSize: 14,
        color: '#111',
        outline: 'none',
    },
    select: {
        width: '100%',
        height: 48,
        padding: '0 40px 0 44px',
        background: '#F5F7F9',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        fontSize: 14,
        color: '#111',
        outline: 'none',
        appearance: 'none' as const,
        cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
    },
    fieldIcon: {
        position: 'absolute' as const,
        left: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#9CA3AF',
        pointerEvents: 'none' as const,
    },
    label: {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: '#111',
        marginBottom: 6,
    },
    hint: {
        fontSize: 11,
        marginTop: 4,
        color: '#9CA3AF',
    },

    infoBox: {
        background: '#EBF5FF',
        border: '1px solid #BFDBFE',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
    },

    submitBtn: {
        width: '100%',
        height: 56,
        borderRadius: 14,
        border: 'none',
        background: '#111111',
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'background 0.2s',
    },

    footerStrip: {
        background: '#FFFFFF',
        border: '1px solid #F3F4F6',
        borderRadius: 14,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        marginTop: 24,
    },
    footerPill: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 9999,
        fontSize: 12, fontWeight: 500,
        background: '#F5F7F9', color: '#6B7280',
        border: '1px solid #E5E7EB',
    },
} as const;

/* ── Mock member data ── */
const MEMBERS = [
    { id: 'KE-2026-NAI-00001', name: 'John Kamau Mwangi', tier: 'standard', phone: '+254712345678', whatsapp: '+254712345678', email: 'john.kamau@example.com', coverage: 'standard', amount: 18500 },
    { id: 'KE-2026-KNA-00002', name: 'Sarah Akinyi Ochieng', tier: 'basic', phone: '+254722345678', whatsapp: '+254722345678', email: 'sarah.o@example.com', coverage: 'basic', amount: 15000 },
    { id: 'KE-2026-KNA-00003', name: 'David Kipchoge Rotich', tier: 'premium', phone: '+254733345678', whatsapp: '+254733345678', email: 'david.k@example.com', coverage: 'premium', amount: 28500 },
    { id: 'KE-2026-ELD-00004', name: 'Grace Wanjiku Njenga', tier: 'standard', phone: '+254744345678', whatsapp: '+254744345678', email: 'grace.w@example.com', coverage: 'standard', amount: 17800 },
];

const CLAIMS = [
    { id: 'CLM-202601-000001', policy: 'KE-2026-NAI-00001', member: 'John Kamau Mwangi', type: 'Medical', amount: 85000, status: 'Approved', submitted: '26/01/2026', days: '2 days' },
    { id: 'CLM-202601-000002', policy: 'KE-2026-KNA-00002', member: 'Sarah Akinyi Ochieng', type: 'Accident', amount: 120000, status: 'Under Review', submitted: '25/01/2026', days: '1 day' },
    { id: 'CLM-202601-000003', policy: 'KE-2026-KNA-00003', member: 'David Kipchoge Rotich', type: 'Medical', amount: 150000, status: 'Flagged', submitted: '28/01/2026', days: '2 days' },
    { id: 'CLM-202601-000004', policy: 'KE-2026-ELD-00004', member: 'Grace Wanjiku Njenga', type: 'Medical', amount: 45000, status: 'Paid', submitted: '22/01/2026', days: '3 days' },
    { id: 'CLM-202601-000005', policy: 'KE-2026-NAI-00001', member: 'John Kamau Mwangi', type: 'Medical', amount: 22000, status: 'Pending', submitted: '01/02/2026', days: '0 days' },
];

export default function KlaimSwiftPage() {
    const [activeTab, setActiveTab] = useState('Registration');
    const [form, setForm] = useState({
        fullName: '', idNumber: '', phone: '', whatsapp: '',
        email: '', dob: '', area: '', coverageType: 'Standard (KES 1,000,000 cover)',
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registeredPolicy, setRegisteredPolicy] = useState('');
    const [regError, setRegError] = useState('');

    /* Submit Claim state */
    const [selectedPolicy, setSelectedPolicy] = useState('');
    const [policySearch, setPolicySearch] = useState('');
    const [policyDropdownOpen, setPolicyDropdownOpen] = useState(false);
    const [claimForm, setClaimForm] = useState({
        submissionMethod: 'whatsapp', claimType: '', claimAmount: '', incidentDate: '', description: '',
    });
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [showDescModal, setShowDescModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dbMembers, setDbMembers] = useState<{ id: string; full_name: string; policy_number: string; phone: string; email: string; whatsapp_number: string; id_number: string }[]>([]);
    const [searchingMembers, setSearchingMembers] = useState(false);

    /* M-Pesa state */
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [mpesaAmount, setMpesaAmount] = useState('1000');

    /* Formulas sub-tab */
    const [formulaSubTab, setFormulaSubTab] = useState('Premium');

    const todayStr = new Date().toISOString().split('T')[0];

    /* Debounced API search for members */
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchMembers = useCallback((query: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (query.length < 2) { setDbMembers([]); return; }
        setSearchingMembers(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setDbMembers(data.members || []);
            } catch { setDbMembers([]); }
            setSearchingMembers(false);
        }, 300);
    }, []);

    useEffect(() => { searchMembers(policySearch); }, [policySearch, searchMembers]);

    const filteredMembers = dbMembers.length > 0
        ? dbMembers.map(m => ({ id: m.policy_number, name: m.full_name, tier: 'standard', phone: m.phone, whatsapp: m.whatsapp_number || m.phone, email: m.email, coverage: 'standard', amount: 18500 }))
        : MEMBERS.filter((m) =>
            m.id.toLowerCase().includes(policySearch.toLowerCase()) ||
            m.name.toLowerCase().includes(policySearch.toLowerCase())
        );

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    function removeFile(idx: number) {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
    }
    function handleClaimSubmit() {
        if (!selectedMember) return;
        const msg = [
            `*NEW CLAIM - KlaimSwift*`,
            `Policy: ${selectedMember.id}`,
            `Member: ${selectedMember.name}`,
            `Type: ${claimForm.claimType || 'N/A'}`,
            `Amount: KES ${claimForm.claimAmount || '0'}`,
            `Date: ${claimForm.incidentDate || 'N/A'}`,
            `Description: ${claimForm.description || 'N/A'}`,
            `Files: ${uploadedFiles.length} attached`,
        ].join('\n');
        const phone = '254740946103';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    const selectedMember = filteredMembers.find((m) => m.id === selectedPolicy) || MEMBERS.find((m) => m.id === selectedPolicy);

    function upd(k: string, v: string) {
        setForm((p) => ({ ...p, [k]: v }));
    }

    function updClaim(k: string, v: string) {
        setClaimForm((p) => ({ ...p, [k]: v }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setRegError('');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: form.fullName,
                    idNumber: form.idNumber,
                    phone: form.phone,
                    email: form.email,
                    whatsappNumber: form.whatsapp || form.phone,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setRegisteredPolicy(data.policyNumber);
                setSuccess(true);
            } else {
                setRegError(data.error || 'Registration failed');
                if (data.policyNumber) setRegisteredPolicy(data.policyNumber);
            }
        } catch {
            setRegError('Network error. Please try again.');
        }
        setSubmitting(false);
    }

    const tabs = [
        { name: 'Registration', icon: <User size={16} /> },
        { name: 'Submit Claim', icon: <FileText size={16} /> },
        { name: 'M-Pesa', icon: <Smartphone size={16} /> },
        { name: 'Track', icon: <Activity size={16} /> },
        { name: 'Fraud', icon: <Shield size={16} /> },
        { name: 'Analytics', icon: <PieChart size={16} /> },
        { name: 'Formulas', icon: <FileCode size={16} /> },
        { name: 'Roadmap', icon: <Route size={16} /> },
    ];

    return (
        <div style={S.page}>
            {/* ═══ HEADER ═══ */}
            <header style={S.header}>
                <div style={S.headerInner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={S.logo}>
                            <Shield size={22} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                                KlaimSwift Insurance System
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                                WhatsApp-Enabled Claims Management for Nairobi
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={S.pillGreen}><MessageCircle size={14} /> WhatsApp Enabled</span>
                        <span style={S.pillBlue}><Send size={14} /> SMS Notifications</span>
                    </div>
                </div>
            </header>

            {/* ═══ MAIN CONTENT ═══ */}
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>

                {/* ─── Hero Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

                    {/* LEFT: Green Hero */}
                    <div style={S.hero}>
                        {/* BG glow */}
                        <div style={{
                            position: 'absolute', top: -60, right: -60,
                            width: 260, height: 260, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* WhatsApp badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 14px', borderRadius: 9999,
                            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                            fontSize: 12, fontWeight: 600, marginBottom: 24,
                        }}>
                            <MessageCircle size={14} /> WhatsApp Business API
                        </div>

                        <h2 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.08, marginBottom: 16 }}>
                            Submit Claims<br />via WhatsApp
                        </h2>
                        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', maxWidth: 380, marginBottom: 32 }}>
                            No apps to download. No websites to navigate. Just
                            send &quot;CLAIM&quot; to our WhatsApp number and start your
                            claim process instantly.
                        </p>

                        {/* 3 Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
                            <div style={S.stepCard}>
                                <div style={S.stepIcon}><Send size={16} /></div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Send &quot;CLAIM&quot; to +254 700 123456</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Instant claim initiation</div>
                                </div>
                            </div>
                            <div style={S.stepCard}>
                                <div style={S.stepIcon}><Upload size={16} /></div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Upload receipts & documents</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Direct image/PDF sharing</div>
                                </div>
                            </div>
                            <div style={S.stepCard}>
                                <div style={S.stepIcon}><Hash size={16} /></div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Get Instant Claim Number</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Track status 24/7 via WhatsApp</div>
                                </div>
                            </div>
                        </div>

                        {/* Static WhatsApp icon — no animation */}
                        <div style={{ position: 'absolute', bottom: 32, right: 40 }}>
                            <div style={{
                                width: 100, height: 100, borderRadius: 28,
                                background: '#25D366',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                            }}>
                                <MessageCircle size={48} color="#fff" />
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 10, fontWeight: 500 }}>
                                2-min claim submission
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Stats + M-Pesa */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Live Statistics */}
                        <div style={S.statsCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontSize: 15, fontWeight: 700 }}>Live Statistics</span>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#12C15F' }} />
                            </div>

                            {/* Members */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F3F4F6' }}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Members Registered</div>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: '#12C15F', lineHeight: 1.2, marginTop: 2 }}>4</div>
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrendingUp size={16} color="#12C15F" />
                                </div>
                            </div>

                            {/* Active Claims */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F3F4F6' }}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Active Claims</div>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B', lineHeight: 1.2, marginTop: 2 }}>5</div>
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={16} color="#F59E0B" />
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0' }}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#6B7280' }}>Success Rate</div>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: '#12C15F', lineHeight: 1.2, marginTop: 2 }}>87%</div>
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E8FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={16} color="#12C15F" />
                                </div>
                            </div>
                        </div>

                        {/* M-Pesa Card */}
                        <div style={S.mpesaCard}>
                            <div style={{
                                position: 'absolute', top: -40, right: -40,
                                width: 120, height: 120, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 44, height: 32, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Smartphone size={22} color="#fff" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>M-Pesa Payment</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Instant STK Push</div>
                                </div>
                            </div>
                            <button style={{
                                width: '100%', height: 48, borderRadius: 12,
                                border: 'none', background: 'rgba(255,255,255,0.95)', color: '#008A4A',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                                <CreditCard size={16} /> Pay Premium Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Feature Strip (Missing Section 1) ─── */}
                <div style={S.featureStrip}>
                    <div style={{ ...S.featureCard, borderLeftColor: '#12C15F' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageCircle size={20} color="#12C15F" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>WhatsApp Claims</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>+254 700 123456</div>
                        </div>
                    </div>

                    <div style={{ ...S.featureCard, borderLeftColor: '#3B82F6' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={20} color="#3B82F6" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>2-3 Days Processing</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>87% efficiency</div>
                        </div>
                    </div>

                    <div style={{ ...S.featureCard, borderLeftColor: '#A855F7' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Shield size={20} color="#A855F7" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>AI Fraud Detection</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Real-time screening</div>
                        </div>
                    </div>

                    <div style={{ ...S.featureCard, borderLeftColor: '#F59E0B' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Smartphone size={20} color="#F59E0B" />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>SMS Notifications</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Instant updates</div>
                        </div>
                    </div>
                </div>

                {/* ─── Tab Bar (Missing Section 2) ─── */}
                <div style={S.tabBar}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            style={{
                                ...S.tab,
                                background: activeTab === tab.name ? '#3B82F6' : 'transparent',
                                color: activeTab === tab.name ? '#FFFFFF' : '#6B7280',
                            }}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* ─── Tab Content ─── */}
                <div style={S.formCard}>
                    {activeTab === 'Registration' ? (
                        /* REGISTRATION TAB */
                        success ? (
                            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CheckCircle size={32} color="#12C15F" />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Registration Successful!</h3>
                                {registeredPolicy && (
                                    <div style={{ background: '#E8FBF0', border: '2px solid #12C15F', borderRadius: 12, padding: '16px 24px', marginBottom: 16, display: 'inline-block' }}>
                                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Your Policy Number</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#12C15F', letterSpacing: 2 }}>{registeredPolicy}</div>
                                    </div>
                                )}
                                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                                    Save your policy number. You can use it to submit claims via WhatsApp or the Submit Claim tab.
                                </p>
                                <button
                                    onClick={() => { setSuccess(false); setRegisteredPolicy(''); setForm({ fullName: '', idNumber: '', phone: '', whatsapp: '', email: '', dob: '', area: '', coverageType: 'Standard (KES 1,000,000 cover)' }); }}
                                    style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#12C15F', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Register Another Member
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {regError && (
                                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#DC2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        ⚠️ {regError}
                                        {registeredPolicy && <span style={{ fontWeight: 700 }}> (Policy: {registeredPolicy})</span>}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
                                    {/* Reuse Existing Form Fields */}
                                    <div>
                                        <label style={S.label}>Full Name *</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="John Mwangi Kamau"
                                                value={form.fullName} onChange={(e) => upd('fullName', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={S.label}>ID Number *</label>
                                        <div style={{ position: 'relative' }}>
                                            <FileText size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="12345678"
                                                value={form.idNumber} onChange={(e) => upd('idNumber', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={S.label}>Phone Number (Safaricom/Airtel) *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="0712345678 or +254712345678" type="tel"
                                                value={form.phone} onChange={(e) => upd('phone', e.target.value)} required />
                                        </div>
                                        <div style={S.hint}>SMS confirmation will be sent to this number</div>
                                    </div>
                                    <div>
                                        <label style={S.label}>WhatsApp Number *</label>
                                        <div style={{ position: 'relative' }}>
                                            <MessageCircle size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="0712345678 or +254712345678" type="tel"
                                                value={form.whatsapp} onChange={(e) => upd('whatsapp', e.target.value)} required />
                                        </div>
                                        <div style={{ ...S.hint, color: '#3B82F6' }}>This number will be linked for claim submissions</div>
                                    </div>
                                    <div>
                                        <label style={S.label}>Email Address *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="john.mwangi@example.com" type="email"
                                                value={form.email} onChange={(e) => upd('email', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={S.label}>Date of Birth *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={16} style={S.fieldIcon} />
                                            <input style={S.input} type="date"
                                                value={form.dob} onChange={(e) => upd('dob', e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={S.label}>Area (Nairobi Region Only) *</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={S.fieldIcon} />
                                            <select style={S.select} value={form.area} onChange={(e) => upd('area', e.target.value)} required>
                                                <option value="">Select area in Nairobi</option>
                                                <option value="westlands">Westlands</option>
                                                <option value="kilimani">Kilimani</option>
                                                <option value="karen">Karen</option>
                                                <option value="lavington">Lavington</option>
                                                <option value="upperhill">Upperhill</option>
                                                <option value="cbd">CBD</option>
                                                <option value="eastleigh">Eastleigh</option>
                                                <option value="langata">Lang&apos;ata</option>
                                                <option value="kasarani">Kasarani</option>
                                                <option value="embakasi">Embakasi</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={S.label}>Coverage Type *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Shield size={16} style={S.fieldIcon} />
                                            <select style={S.select} value={form.coverageType} onChange={(e) => upd('coverageType', e.target.value)}>
                                                <option>Standard (KES 1,000,000 cover)</option>
                                                <option>Premium (KES 3,000,000 cover)</option>
                                                <option>Executive (KES 5,000,000 cover)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ ...S.infoBox, marginTop: 24 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MessageCircle size={16} color="#3B82F6" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>WhatsApp Integration</div>
                                        <div style={{ fontSize: 13, color: '#3B82F6', marginTop: 4, lineHeight: 1.5 }}>
                                            Your WhatsApp number will be securely linked to your policy. You&apos;ll be able to submit claims directly via
                                            WhatsApp by sending a message to our claims line at <strong>+254700123456</strong>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={submitting}
                                    style={{ ...S.submitBtn, marginTop: 28, opacity: submitting ? 0.6 : 1 }}>
                                    {submitting ? 'Processing...' : 'Register Member & Issue Policy'}
                                </button>
                            </form>
                        )
                    ) : activeTab === 'Submit Claim' ? (
                        /* SUBMIT CLAIM TAB — Figma-matching design */
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F7F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={18} color="#111" />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Submit New Claim</h3>
                            </div>
                            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                                Submit claims via WhatsApp or portal. Confirmation will be sent to linked WhatsApp number.
                            </p>

                            {/* Searchable policy selector */}
                            <div style={{ position: 'relative' }}>
                                <label style={S.label}>Select Member / Policy Number *</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={S.fieldIcon} />
                                    <input
                                        style={S.input}
                                        placeholder="Type policy number or member name to search..."
                                        value={policySearch}
                                        onChange={(e) => { setPolicySearch(e.target.value); setPolicyDropdownOpen(true); if (!e.target.value) { setSelectedPolicy(''); } }}
                                        onFocus={() => setPolicyDropdownOpen(true)}
                                    />
                                </div>
                                {/* Dropdown results */}
                                {policyDropdownOpen && policySearch && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto', marginTop: 4,
                                    }}>
                                        {filteredMembers.length > 0 ? filteredMembers.map((m) => (
                                            <div
                                                key={m.id}
                                                onClick={() => { setSelectedPolicy(m.id); setPolicySearch(`${m.id} · ${m.name}`); setPolicyDropdownOpen(false); }}
                                                style={{
                                                    padding: '12px 16px', cursor: 'pointer', fontSize: 14,
                                                    borderBottom: '1px solid #F3F4F6',
                                                    background: selectedPolicy === m.id ? '#F0F7FF' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F7F9')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = selectedPolicy === m.id ? '#F0F7FF' : 'transparent')}
                                            >
                                                <div style={{ fontWeight: 600 }}>{m.id}</div>
                                                <div style={{ fontSize: 12, color: '#6B7280' }}>{m.name} · {m.tier}</div>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No policies found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Conditional full form — only when policy is selected */}
                            {selectedMember && (
                                <div style={{ marginTop: 24 }}>
                                    {/* WhatsApp-Linked Account card */}
                                    <div style={{
                                        border: '1px solid #BFDBFE', borderRadius: 14, padding: '18px 24px',
                                        background: '#F0F7FF', marginBottom: 24,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                            <MessageCircle size={16} color="#3B82F6" />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>
                                                WhatsApp-Linked Account
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px', fontSize: 13 }}>
                                            <div>
                                                <span style={{ color: '#6B7280' }}>WhatsApp: </span>
                                                <span style={{ color: '#3B82F6', fontWeight: 600 }}>{selectedMember.whatsapp}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6B7280' }}>Phone: </span>
                                                <span style={{ fontWeight: 600 }}>{selectedMember.phone}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6B7280' }}>Email: </span>
                                                <span style={{ color: '#3B82F6', fontWeight: 600 }}>{selectedMember.email}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6B7280' }}>Coverage: </span>
                                                <span style={{ fontWeight: 600 }}>{selectedMember.coverage}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submission Method */}
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={S.label}>Submission Method *</label>
                                        <div style={{ position: 'relative' }}>
                                            <MessageCircle size={16} style={S.fieldIcon} />
                                            <select style={S.select} value={claimForm.submissionMethod} onChange={(e) => updClaim('submissionMethod', e.target.value)}>
                                                <option value="whatsapp">WhatsApp (Recommended)</option>
                                                <option value="portal">Web Portal</option>
                                                <option value="sms">SMS</option>
                                            </select>
                                        </div>
                                        <div style={{ ...S.hint, color: '#3B82F6' }}>Claim notification will be sent to {selectedMember.whatsapp}</div>
                                    </div>

                                    {/* Claim Type + Amount row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                                        <div>
                                            <label style={S.label}>Claim Type *</label>
                                            <div style={{ position: 'relative' }}>
                                                <FileText size={16} style={S.fieldIcon} />
                                                <select style={S.select} value={claimForm.claimType} onChange={(e) => updClaim('claimType', e.target.value)}>
                                                    <option value="">Select claim type</option>
                                                    <option value="medical">Medical</option>
                                                    <option value="accident">Accident</option>
                                                    <option value="property">Property Damage</option>
                                                    <option value="theft">Theft</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={S.label}>Claim Amount (KES) *</label>
                                            <div style={{ position: 'relative' }}>
                                                <CreditCard size={16} style={S.fieldIcon} />
                                                <input style={S.input} type="number" placeholder="50000"
                                                    value={claimForm.claimAmount} onChange={(e) => updClaim('claimAmount', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Upload row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                                        <div>
                                            <label style={S.label}>Date of Incident *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Calendar size={16} style={S.fieldIcon} />
                                                <input style={S.input} type="date" max={todayStr}
                                                    value={claimForm.incidentDate}
                                                    onChange={(e) => updClaim('incidentDate', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={S.label}>Upload Documents</label>
                                            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx"
                                                style={{ display: 'none' }} onChange={handleFileUpload} />
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '12px 16px', background: '#F5F7F9',
                                                    border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer',
                                                    height: 48,
                                                }}
                                            >
                                                <Upload size={16} color="#6B7280" />
                                                <span style={{ fontSize: 14, color: '#9CA3AF' }}>
                                                    {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Upload Files'}
                                                </span>
                                            </div>
                                            <div style={S.hint}>Medical reports, police abstracts, photos etc.</div>
                                            {/* File list */}
                                            {uploadedFiles.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                                    {uploadedFiles.map((f, i) => (
                                                        <div key={i} style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            padding: '6px 12px', background: '#F0F7FF', borderRadius: 8, fontSize: 12,
                                                        }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <Paperclip size={12} color="#3B82F6" />{f.name}
                                                            </span>
                                                            <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                                                <X size={14} color="#EF4444" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Incident Description with expand button */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={S.label}>Incident Description *</label>
                                            <button
                                                onClick={() => setShowDescModal(true)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
                                                    padding: '4px 10px', fontSize: 12, color: '#3B82F6', cursor: 'pointer', fontWeight: 600,
                                                }}
                                            >
                                                <Maximize2 size={12} /> Expand
                                            </button>
                                        </div>
                                        <textarea
                                            style={{
                                                width: '100%', minHeight: 90, padding: '12px 16px',
                                                background: '#F5F7F9', border: '1px solid #E5E7EB',
                                                borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical',
                                                fontFamily: 'inherit',
                                            }}
                                            placeholder="Provide detailed description of the incident..."
                                            value={claimForm.description}
                                            onChange={(e) => updClaim('description', e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    background: '#F5F7F9', border: '1px solid #E5E7EB', borderRadius: 8,
                                                    padding: '6px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer',
                                                }}
                                            >
                                                <Upload size={12} /> Upload document with description
                                            </button>
                                        </div>
                                    </div>

                                    {/* Claim Processing info box */}
                                    <div style={{
                                        background: '#E8FBF0', border: '1px solid #A7F3D0',
                                        borderRadius: 14, padding: '18px 24px', marginBottom: 28,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                            <Clock size={16} color="#059669" />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Claim Processing</span>
                                        </div>
                                        <ul style={{ fontSize: 13, color: '#047857', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
                                            <li>Claims are processed within 2-3 working days (Target 87% efficiency)</li>
                                            <li>Automatic fraud detection system screens all claims</li>
                                            <li>Track your claim status using the claim number</li>
                                            <li>Updates sent via WhatsApp to {selectedMember.whatsapp}</li>
                                        </ul>
                                    </div>

                                    {/* Submit button → WhatsApp */}
                                    <button
                                        onClick={handleClaimSubmit}
                                        style={{
                                            ...S.submitBtn,
                                            background: 'linear-gradient(135deg, #12C15F 0%, #0A5C35 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        }}
                                    >
                                        <MessageCircle size={18} /> Submit Claim via WhatsApp
                                    </button>
                                </div>
                            )}

                            {/* Description expand modal */}
                            {showDescModal && (
                                <div style={{
                                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                                }} onClick={() => setShowDescModal(false)}>
                                    <div onClick={(e) => e.stopPropagation()} style={{
                                        background: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 700,
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h4 style={{ fontSize: 18, fontWeight: 700 }}>Incident Description</h4>
                                            <button onClick={() => setShowDescModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                                        </div>
                                        <textarea
                                            autoFocus
                                            style={{
                                                width: '100%', minHeight: 300, padding: '16px',
                                                background: '#F5F7F9', border: '1px solid #E5E7EB',
                                                borderRadius: 12, fontSize: 15, outline: 'none', resize: 'vertical',
                                                fontFamily: 'inherit', lineHeight: 1.7,
                                            }}
                                            placeholder="Provide a detailed description of the incident. Take your time..."
                                            value={claimForm.description}
                                            onChange={(e) => updClaim('description', e.target.value)}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                                            <button onClick={() => fileInputRef.current?.click()} style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB',
                                                background: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
                                            }}><Upload size={14} /> Attach Document</button>
                                            <button onClick={() => setShowDescModal(false)} style={{
                                                padding: '10px 24px', borderRadius: 10, border: 'none',
                                                background: '#12C15F', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                            }}>Done</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : activeTab === 'M-Pesa' ? (
                        /* M-PESA TAB — Figma-matching design */
                        <div style={{ margin: '-32px -40px -40px' }}>
                            {/* Green header banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #008A4A 0%, #004D2A 100%)',
                                borderRadius: '20px 20px 0 0',
                                padding: '28px 40px',
                                color: '#fff',
                            }}>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>M-Pesa Premium Payments</h3>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                                    Pay your insurance premiums instantly using Safaricom M-Pesa
                                </p>
                            </div>

                            {/* Two-column layout */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '32px 40px 40px' }}>

                                {/* LEFT: M-Pesa STK Push Payment */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <Smartphone size={18} color="#111" />
                                        <span style={{ fontSize: 15, fontWeight: 700 }}>M-Pesa STK Push Payment</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Pay instantly using M-Pesa on your phone</p>

                                    {/* M-Pesa Payment green card */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #12C15F 0%, #0A5C35 100%)',
                                        borderRadius: 16, padding: '18px 22px', color: '#fff', marginBottom: 24,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <CheckCircle size={18} color="#fff" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>M-Pesa Payment</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>via M-Pesa STK Push</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                                            Premium payment for policy {selectedPolicy || 'undefined'}
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={S.label}>M-Pesa Phone Number *</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} style={S.fieldIcon} />
                                            <input style={S.input} placeholder="0712345678 or 254712345678"
                                                value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
                                        </div>
                                        <div style={S.hint}>Must be a registered M-Pesa phone number</div>
                                    </div>

                                    {/* Amount */}
                                    <div style={{ marginBottom: 24 }}>
                                        <label style={S.label}>Amount (KES) *</label>
                                        <div style={{ position: 'relative' }}>
                                            <CreditCard size={16} style={S.fieldIcon} />
                                            <input style={S.input} type="number" placeholder="1000"
                                                value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* How it works info box */}
                                    <div style={{
                                        background: '#E8FBF0', border: '1px solid #A7F3D0',
                                        borderRadius: 14, padding: '18px 22px', marginBottom: 28,
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>How it works:</div>
                                        <ol style={{ fontSize: 13, color: '#047857', lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                                            <li>Click &quot;Initiate Payment&quot; button below</li>
                                            <li>Check your phone for M-Pesa STK push prompt</li>
                                            <li>Enter your M-Pesa PIN to confirm payment</li>
                                            <li>You&apos;ll receive instant confirmation via SMS</li>
                                        </ol>
                                    </div>

                                    {/* Initiate button */}
                                    <button style={{
                                        ...S.submitBtn,
                                        background: 'linear-gradient(135deg, #12C15F 0%, #0A5C35 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    }}>
                                        <CreditCard size={18} /> Initiate M-Pesa Payment
                                    </button>

                                    {/* Footer links */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontSize: 12 }}>
                                        <span style={{ color: '#12C15F', fontWeight: 600, cursor: 'pointer' }}>Safaricom M-Pesa</span>
                                        <span style={{ color: '#9CA3AF' }}>|</span>
                                        <span style={{ color: '#6B7280' }}>Secure Payment Gateway</span>
                                    </div>
                                </div>

                                {/* RIGHT: Quick Payment Options */}
                                <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Quick Payment Options</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {MEMBERS.map((m) => (
                                            <div key={m.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '16px 20px', background: '#FFFFFF',
                                                border: '1px solid #F3F4F6', borderRadius: 14,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</span>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                                            borderRadius: 9999,
                                                            background: m.tier === 'premium' ? '#EDE9FE' : m.tier === 'basic' ? '#FEF3C7' : '#E8FBF0',
                                                            color: m.tier === 'premium' ? '#7C3AED' : m.tier === 'basic' ? '#D97706' : '#059669',
                                                        }}>{m.tier}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{m.id}</div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>KES {m.amount.toLocaleString()}</div>
                                                </div>
                                                <button style={{
                                                    padding: '8px 18px', borderRadius: 8,
                                                    border: 'none', background: '#12C15F', color: '#fff',
                                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                                }}>Pay Now</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : activeTab === 'Track' ? (
                        /* TRACK TAB */
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <Search size={20} color="#111" />
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Track Claims</h3>
                            </div>
                            <div style={{ position: 'relative', marginBottom: 24 }}>
                                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                                <input style={{ ...S.input, paddingLeft: 44, width: '100%' }} placeholder="Search by claim number, policy number, or member name..." />
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                                            {['Claim Number', 'Policy Number', 'Member', 'Type', 'Amount', 'Status', 'WhatsApp', 'Submitted', 'Processing Days'].map((h) => (
                                                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CLAIMS.map((c) => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <td style={{ padding: '14px', fontWeight: 600, color: '#3B82F6' }}>{c.id}</td>
                                                <td style={{ padding: '14px', color: '#6B7280' }}>{c.policy}</td>
                                                <td style={{ padding: '14px', fontWeight: 500 }}>{c.member}</td>
                                                <td style={{ padding: '14px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#EBF5FF', color: '#3B82F6' }}>{c.type}</span>
                                                </td>
                                                <td style={{ padding: '14px', fontWeight: 500 }}>KES {c.amount.toLocaleString()}</td>
                                                <td style={{ padding: '14px' }}>
                                                    <span style={{
                                                        padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                                                        background: c.status === 'Approved' ? '#E8FBF0' : c.status === 'Under Review' ? '#FEF3C7' : c.status === 'Flagged' ? '#FEE2E2' : c.status === 'Paid' ? '#E8FBF0' : '#EBF5FF',
                                                        color: c.status === 'Approved' ? '#059669' : c.status === 'Under Review' ? '#D97706' : c.status === 'Flagged' ? '#DC2626' : c.status === 'Paid' ? '#059669' : '#3B82F6',
                                                    }}>{c.status}</span>
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center' }}><MessageCircle size={16} color="#9CA3AF" /></td>
                                                <td style={{ padding: '14px', color: '#6B7280' }}>{c.submitted}</td>
                                                <td style={{ padding: '14px', color: '#12C15F', fontWeight: 600 }}>{c.days}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    ) : activeTab === 'Fraud' ? (
                        /* FRAUD TAB */
                        <div>
                            {/* Stats cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Critical Alerts</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 36, fontWeight: 800, color: '#12C15F' }}>0</span>
                                        <AlertCircle size={20} color="#EF4444" />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Fraud Score &gt;85</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>High Risk</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B' }}>1</span>
                                        <AlertTriangle size={20} color="#F59E0B" />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Fraud Score 70-84</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Medium Risk</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 36, fontWeight: 800, color: '#12C15F' }}>0</span>
                                        <Eye size={20} color="#F59E0B" />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Fraud Score 55-69</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Detection Rate</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 36, fontWeight: 800, color: '#3B82F6' }}>20.0%</span>
                                        <TrendingUp size={20} color="#3B82F6" />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Of total claims</div>
                                </div>
                            </div>

                            {/* Fraud Detection Algorithm */}
                            <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16, marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <Shield size={18} color="#111" />
                                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>Fraud Detection Algorithm</h4>
                                </div>
                                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Multi-factor risk assessment using actuarial formulas</p>

                                {/* Algorithm Formula */}
                                <div style={{ background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 20px', marginBottom: 20, fontFamily: 'monospace', fontSize: 13, color: '#1E40AF' }}>
                                    <strong>Algorithm Formula:</strong><br />
                                    FS = 0.18 × CF + 0.25 × TS + 0.20 × ML + 0.20 × PS
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 32px', fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
                                    <div><strong style={{ color: '#3B82F6' }}>FS:</strong> Fraud Score (0-100)</div>
                                    <div><strong style={{ color: '#3B82F6' }}>CF:</strong> Claim Frequency Score</div>
                                    <div><strong style={{ color: '#3B82F6' }}>TS:</strong> Timing Suspicion Score</div>
                                    <div><strong style={{ color: '#3B82F6' }}>ML:</strong> Historical Legitimacy Score</div>
                                    <div><strong style={{ color: '#3B82F6' }}>PS:</strong> Pattern Similarity Score</div>
                                </div>

                                {/* Detection Factors + Risk Thresholds */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Detection Factors:</div>
                                        <ul style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                                            <li>Multiple claims in short period</li>
                                            <li>Claims submitted immediately after incident</li>
                                            <li>Unusual claim amounts</li>
                                            <li>Missing documentation</li>
                                            <li>Non-WhatsApp submission (unverified)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Risk Thresholds:</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Low Risk (0-41)</span>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF0', color: '#059669' }}>Auto Process</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Medium (52-69)</span>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF0', color: '#059669' }}>Monitor</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>High (70-84)</span>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#D97706' }}>Review</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Critical (85-100)</span>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>Flag</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Fraud Alerts */}
                            <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <AlertTriangle size={18} color="#F59E0B" />
                                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>Active Fraud Alerts</h4>
                                </div>
                                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Claims flagged by the fraud detection system</p>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                                            {['Claim Number', 'Risk Level', 'Fraud Score', 'Flags', 'Status', 'Actions'].map((h) => (
                                                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, color: '#374151' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '14px', fontWeight: 600, color: '#3B82F6' }}>CLM-202601-000003</td>
                                            <td style={{ padding: '14px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>HIGH</span>
                                            </td>
                                            <td style={{ padding: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontWeight: 700, color: '#DC2626' }}>72/100</span>
                                                    <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, maxWidth: 80 }}>
                                                        <div style={{ width: '72%', height: '100%', background: '#DC2626', borderRadius: 3 }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px', fontSize: 12, color: '#6B7280' }}>
                                                • Claim submitted same day as incident<br />
                                                • High claim amount (KES 150,000)
                                            </td>
                                            <td style={{ padding: '14px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FEF3C7', color: '#D97706' }}>Investigating</span>
                                            </td>
                                            <td style={{ padding: '14px' }}>
                                                <button style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                    👁 Review
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    ) : activeTab === 'Analytics' ? (
                        /* ANALYTICS TAB */
                        <div>
                            {/* KPI Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Efficiency Rate</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: '#12C15F' }}>100.0% <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#E8FBF0', color: '#059669' }}>On Target</span></div>
                                    <div style={{ height: 4, background: '#E8FBF0', borderRadius: 2, marginTop: 10 }}>
                                        <div style={{ width: '100%', height: '100%', background: '#12C15F', borderRadius: 2 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Target: 87% claims within 2-3 days</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Avg Processing Time</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: '#3B82F6' }}>1.4 days</div>
                                    <div style={{ height: 4, background: '#EBF5FF', borderRadius: 2, marginTop: 10 }}>
                                        <div style={{ width: '47%', height: '100%', background: '#3B82F6', borderRadius: 2 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Target: 2-3 working days</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>WhatsApp Adoption</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: '#12C15F' }}>80.0%</div>
                                    <div style={{ height: 4, background: '#E8FBF0', borderRadius: 2, marginTop: 10 }}>
                                        <div style={{ width: '80%', height: '100%', background: '#12C15F', borderRadius: 2 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>4 of 5 claims via WhatsApp</div>
                                </div>
                                <div style={{ padding: 20, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', marginBottom: 8 }}><DollarSign size={14} /> Total Payouts</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>KES 0.13M</div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>1 approved claims</div>
                                </div>
                            </div>

                            {/* System Performance Overview */}
                            <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16, marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <BarChart3 size={18} color="#111" />
                                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>System Performance Overview</h4>
                                </div>
                                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Real-time analytics showing system efficiency and performance</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 40px', fontSize: 13 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>Total Members</span><span style={{ fontWeight: 700 }}>👤 4</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>Pending Claims</span><span style={{ fontWeight: 700, color: '#F59E0B' }}>1</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>WhatsApp Claims</span><span style={{ fontWeight: 700, color: '#3B82F6' }}>📱 4</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>Active Policies</span><span style={{ fontWeight: 700, color: '#12C15F' }}>4</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>Approved Claims</span><span style={{ fontWeight: 700, color: '#12C15F' }}>1</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                                        <span>Fraud Detection Rate</span><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#D97706' }}>20.0%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <span>Total Claims</span><span style={{ fontWeight: 700 }}>5</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <span>Rejected Claims</span><span style={{ fontWeight: 700, color: '#EF4444' }}>0</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <span>System Efficiency</span><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#E8FBF0', color: '#059669' }}>100.0%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
                                {/* Claims by Status (pie chart visual) */}
                                <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Claims by Status</h4>
                                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Distribution of claim statuses</p>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                        <div style={{
                                            width: 180, height: 180, borderRadius: '50%',
                                            background: `conic-gradient(
                                                #12C15F 0deg 72deg,
                                                #3B82F6 72deg 144deg,
                                                #F59E0B 144deg 216deg,
                                                #EF4444 216deg 288deg,
                                                #8B5CF6 288deg 360deg
                                            )`,
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center', fontSize: 12 }}>
                                        {[
                                            { label: 'Approved 20%', color: '#12C15F' },
                                            { label: 'Pending 20%', color: '#3B82F6' },
                                            { label: 'Under Review 20%', color: '#F59E0B' },
                                            { label: 'Flagged 20%', color: '#EF4444' },
                                            { label: 'Paid 20%', color: '#8B5CF6' },
                                        ].map((item) => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                                                <span style={{ color: item.color, fontWeight: 500 }}>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Claims by Type (bar chart visual) */}
                                <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Claims by Type</h4>
                                    <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Number of claims per category</p>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 160, justifyContent: 'center' }}>
                                        {[
                                            { label: 'Medical', value: 4, color: '#3B82F6' },
                                            { label: 'Accident', value: 1, color: '#3B82F6' },
                                            { label: 'Disability', value: 0, color: '#3B82F6' },
                                            { label: 'Death', value: 0, color: '#3B82F6' },
                                            { label: 'Property', value: 0, color: '#3B82F6' },
                                        ].map((bar) => (
                                            <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600 }}>{bar.value}</span>
                                                <div style={{
                                                    width: '100%', maxWidth: 50,
                                                    height: bar.value > 0 ? `${bar.value * 30}px` : '4px',
                                                    background: bar.value > 0 ? bar.color : '#F3F4F6',
                                                    borderRadius: '4px 4px 0 0',
                                                    minHeight: 4,
                                                }} />
                                                <span style={{ fontSize: 11, color: '#6B7280' }}>{bar.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Processing Time Trend */}
                            <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16, marginBottom: 28 }}>
                                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Processing Time Trend</h4>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Average processing time over the last 5 months (Target: 2-3 days)</p>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 20px' }}>
                                    {[
                                        { month: 'Oct', days: 4.2 },
                                        { month: 'Nov', days: 3.8 },
                                        { month: 'Dec', days: 3.5 },
                                        { month: 'Jan', days: 2.1 },
                                        { month: 'Feb', days: 1.4 },
                                    ].map((p) => (
                                        <div key={p.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>{p.days}d</span>
                                            <div style={{
                                                width: '60%', height: `${p.days * 24}px`,
                                                background: 'linear-gradient(180deg, #3B82F6 0%, #93C5FD 100%)',
                                                borderRadius: '4px 4px 0 0',
                                            }} />
                                            <span style={{ fontSize: 11, color: '#6B7280' }}>{p.month}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, fontSize: 12 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 3, background: '#3B82F6', borderRadius: 2 }} /> Avg Processing Days</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 3, background: '#10B981', borderRadius: 2, borderStyle: 'dashed' }} /> Target (3 days)</span>
                                </div>
                            </div>

                            {/* Key Performance Achievements */}
                            <div style={{ padding: 28, border: '1px solid #F3F4F6', borderRadius: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <CheckCircle size={18} color="#12C15F" />
                                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>Key Performance Achievements</h4>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    {[
                                        { title: 'Efficiency Target', desc: 'Achieved 100.0% efficiency (Target: 87%)', color: '#12C15F' },
                                        { title: 'Processing Time Target', desc: 'Average: 1.4 days (Target: 2-4 days)', color: '#3B82F6' },
                                        { title: 'WhatsApp Integration', desc: '80.0% of claims submitted via WhatsApp', color: '#12C15F' },
                                        { title: 'Fraud Detection', desc: 'Active monitoring with 20.0% flagged for review', color: '#F59E0B' },
                                    ].map((a) => (
                                        <div key={a.title} style={{ padding: '16px 20px', borderLeft: `4px solid ${a.color}`, background: '#FAFAFA', borderRadius: '0 10px 10px 0' }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                                            <div style={{ fontSize: 13, color: '#6B7280' }}>✓ {a.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    ) : activeTab === 'Formulas' ? (
                        /* FORMULAS TAB */
                        <div style={{ margin: '-32px -40px -40px' }}>
                            {/* Green gradient header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 50%, #6D28D9 100%)',
                                borderRadius: '20px 20px 0 0',
                                padding: '28px 40px',
                                color: '#fff',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <FileCode size={20} />
                                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>Actuarial Formulas & Methodologies</h3>
                                </div>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                                    Comprehensive documentation of all actuarial formulas used in the KlaimSwift Insurance System
                                </p>
                            </div>

                            {/* Sub-tabs */}
                            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F3F4F6', padding: '0 40px' }}>
                                {['Premium', 'Fraud Detection', 'Efficiency', 'Financial Ratios', 'Reserves'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setFormulaSubTab(st)}
                                        style={{
                                            padding: '14px 24px', fontSize: 13, fontWeight: 600, border: 'none',
                                            background: 'transparent', cursor: 'pointer',
                                            color: formulaSubTab === st ? '#3B82F6' : '#6B7280',
                                            borderBottom: formulaSubTab === st ? '2px solid #3B82F6' : '2px solid transparent',
                                            marginBottom: '-2px',
                                        }}
                                    >{st}</button>
                                ))}
                            </div>

                            {/* Content area */}
                            <div style={{ padding: '32px 40px 40px' }}>
                                {formulaSubTab === 'Premium' && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                            <DollarSign size={18} color="#111" />
                                            <h4 style={{ fontSize: 16, fontWeight: 700 }}>Premium Calculation</h4>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Annual premium calculation based on coverage, age, and risk factors</p>

                                        {/* Main Formula */}
                                        <div style={{ border: '1px solid #F3F4F6', borderRadius: 16, padding: 28, marginBottom: 28 }}>
                                            <h5 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Main Formula</h5>
                                            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#3B82F6', marginBottom: 20, fontFamily: 'monospace' }}>
                                                P = (B × R × A × H) + L
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px', fontSize: 13, color: '#6B7280' }}>
                                                <div><strong style={{ color: '#3B82F6' }}>P</strong> = Premium (Annual)</div>
                                                <div><strong style={{ color: '#3B82F6' }}>B</strong> = Base rate (1.5% of coverage amount)</div>
                                                <div><strong style={{ color: '#3B82F6' }}>R</strong> = Risk factor (occupation, lifestyle)</div>
                                                <div><strong style={{ color: '#3B82F6' }}>A</strong> = Age adjustment factor</div>
                                                <div><strong style={{ color: '#3B82F6' }}>H</strong> = Health loading factor</div>
                                                <div><strong style={{ color: '#3B82F6' }}>L</strong> = Loading (18% for expenses & profit)</div>
                                            </div>
                                        </div>

                                        {/* Factor tables */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 28 }}>
                                            {/* Age Adjustment Factor */}
                                            <div style={{ border: '1px solid #F3F4F6', borderRadius: 14, padding: 20 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Age Adjustment Factor</div>
                                                {[
                                                    { label: 'Under 30', value: '0.9x', bg: '#E8FBF0', color: '#059669' },
                                                    { label: '30-45', value: '1.0x', bg: '#EBF5FF', color: '#3B82F6' },
                                                    { label: '45-55', value: '1.2x', bg: '#FEF3C7', color: '#D97706' },
                                                    { label: '60+', value: '1.5x+', bg: '#FEE2E2', color: '#DC2626' },
                                                ].map((r) => (
                                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }}>
                                                        <span>{r.label}</span>
                                                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: r.bg, color: r.color }}>{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Risk Category Factor */}
                                            <div style={{ border: '1px solid #F3F4F6', borderRadius: 14, padding: 20 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Risk Category Factor</div>
                                                {[
                                                    { label: 'Low Risk', value: '1.0x', bg: '#E8FBF0', color: '#059669' },
                                                    { label: 'Medium Risk', value: '1.3x', bg: '#FEF3C7', color: '#D97706' },
                                                    { label: 'High Risk', value: '1.7x', bg: '#FEE2E2', color: '#DC2626' },
                                                ].map((r) => (
                                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }}>
                                                        <span>{r.label}</span>
                                                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: r.bg, color: r.color }}>{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Health Loading */}
                                            <div style={{ border: '1px solid #F3F4F6', borderRadius: 14, padding: 20 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Health Loading</div>
                                                {[
                                                    { label: 'Excellent', value: '1.0x', bg: '#E8FBF0', color: '#059669' },
                                                    { label: 'Good', value: '1.1x', bg: '#E8FBF0', color: '#059669' },
                                                    { label: 'Fair', value: '1.3x', bg: '#FEF3C7', color: '#D97706' },
                                                    { label: 'Poor', value: '1.6x', bg: '#FEE2E2', color: '#DC2626' },
                                                ].map((r) => (
                                                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }}>
                                                        <span>{r.label}</span>
                                                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: r.bg, color: r.color }}>{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Example Calculation */}
                                        <div style={{ border: '1px solid #F3F4F6', borderRadius: 16, padding: 28, marginBottom: 28 }}>
                                            <h5 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Example Calculation</h5>
                                            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8 }}>
                                                Coverage Amount: KES 1,000,000<br />
                                                Age: 35 (Factor: 1.0)<br />
                                                Risk: Medium (Factor: 1.3)<br />
                                                Health: Good (Factor: 1.1)
                                            </div>
                                            <div style={{ background: '#EBF5FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 20px', marginTop: 14, fontFamily: 'monospace', fontSize: 13 }}>
                                                <div style={{ color: '#1E40AF' }}>Base Premium = 1,000,000 × 0.015 × 1.0 × 1.3 × 1.1 = KES 21,450</div>
                                                <div style={{ color: '#1E40AF', marginTop: 4 }}>Loading (18%) = 21,450 × 0.18 = KES 3,861</div>
                                            </div>
                                            <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: '#12C15F' }}>
                                                Annual Premium = KES 25,311
                                            </div>
                                        </div>

                                        {/* Actuarial Compliance */}
                                        <div style={{ background: '#E8FBF0', border: '1px solid #A7F3D0', borderRadius: 16, padding: 28 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                <CheckCircle size={18} color="#059669" />
                                                <h5 style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>Actuarial Compliance & Standards</h5>
                                            </div>
                                            <p style={{ fontSize: 13, color: '#047857', marginBottom: 10 }}>All formulas implemented in the KlaimSwift Insurance System comply with:</p>
                                            <ul style={{ fontSize: 13, color: '#047857', lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                                                <li>Insurance Regulatory Authority (IRA) Kenya guidelines</li>
                                                <li>International Actuarial Standards of Practice (IASPs)</li>
                                                <li>Risk-Based Capital (RBC) framework requirements</li>
                                                <li>IFRS 17 Insurance Contracts standards</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {formulaSubTab !== 'Premium' && (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F7F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <FileCode size={32} color="#9CA3AF" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{formulaSubTab} Formulas</h3>
                                        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
                                            Documentation for {formulaSubTab.toLowerCase()} calculations coming soon.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    ) : (
                        /* ROADMAP - placeholder */
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F7F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Route size={32} color="#9CA3AF" />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{activeTab} Module</h3>
                            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
                                This section is coming soon in the demo version.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* ═══ FOOTER ═══ */}
            <footer style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 24px' }}>
                {/* Status strip */}
                <div style={S.footerStrip}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={S.footerPill}><MessageCircle size={12} color="#12C15F" /> WhatsApp Claims</span>
                        <span style={S.footerPill}><Send size={12} color="#3B82F6" /> SMS Notifications</span>
                        <span style={S.footerPill}><AlertCircle size={12} color="#EF4444" /> Fraud Detection</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>
                        Nairobi Region • 87% Efficiency • 2-3 Day Processing
                    </span>
                </div>

                {/* Bottom text */}
                <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                        KlaimSwift Insurance System
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                        This is a demonstration system. WhatsApp Business API integration, SMS gateway setup (Africa&apos;s Talking), and IRA Kenya compliance.
                    </div>
                </div>
            </footer>
        </div>
    );
}
