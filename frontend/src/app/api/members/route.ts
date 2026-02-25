import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const q = req.nextUrl.searchParams.get('q') || '';

        if (!q || q.length < 2) {
            return NextResponse.json({ members: [] });
        }

        // Search by policy number (exact prefix) or name (partial match)
        const { data, error } = await supabase
            .from('members')
            .select('id, full_name, id_number, phone, email, policy_number, insurance_company, whatsapp_number, created_at')
            .or(`policy_number.ilike.%${q}%,full_name.ilike.%${q}%,id_number.ilike.%${q}%`)
            .limit(10);

        if (error) {
            console.error('Supabase query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ members: data || [] });
    } catch (err) {
        console.error('Members search error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
