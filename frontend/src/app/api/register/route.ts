import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generatePolicyNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `KS-${code}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fullName, idNumber, phone, email, insuranceCompany, whatsappNumber } = body;

        if (!fullName || !idNumber || !phone) {
            return NextResponse.json({ error: 'Full name, ID number, and phone are required' }, { status: 400 });
        }

        // Check if ID number already registered
        const { data: existing } = await supabase
            .from('members')
            .select('id, policy_number')
            .eq('id_number', idNumber)
            .single();

        if (existing) {
            return NextResponse.json({
                error: 'This ID number is already registered',
                policyNumber: existing.policy_number,
            }, { status: 409 });
        }

        const policyNumber = generatePolicyNumber();

        const { data, error } = await supabase
            .from('members')
            .insert({
                full_name: fullName,
                id_number: idNumber,
                phone,
                email: email || null,
                policy_number: policyNumber,
                insurance_company: insuranceCompany || 'KlaimSwift Insurance',
                whatsapp_number: whatsappNumber || phone,
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Registration successful!',
            member: data,
            policyNumber,
        }, { status: 201 });
    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
