import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()

  try {
    const body = await req.json().catch(() => ({}))
    const { rotate = false, expiresAt }: { rotate?: boolean; expiresAt?: string } = body

    const token = rotate || !body.token
      ? crypto.randomUUID().replace(/-/g, '')
      : String(body.token)

    const updates: any = {
      public_enabled: true,
      public_token: token,
    }
    if (expiresAt) updates.public_expires_at = new Date(expiresAt).toISOString()

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', params.id)
      .select('public_token')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { origin } = new URL(req.url)
    const publicUrl = `${origin}/i/${data.public_token}`

    return NextResponse.json({ token: data.public_token, url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to enable public link' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ public_enabled: false })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to disable public link' }, { status: 500 })
  }
}
