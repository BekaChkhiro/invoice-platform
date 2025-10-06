import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptSecretKey, decryptSecretKey } from '@/lib/flitt/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('flitt_merchant_id, flitt_secret_key_encrypted, flitt_enabled, flitt_test_mode, flitt_setup_completed_at, flitt_last_test_at')
      .eq('user_id', user.id)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Return configuration without sensitive data
    const config = {
      merchant_id: company.flitt_merchant_id,
      has_secret_key: !!company.flitt_secret_key_encrypted,
      enabled: company.flitt_enabled || false,
      test_mode: company.flitt_test_mode || false,
      setup_completed_at: company.flitt_setup_completed_at,
      last_test_at: company.flitt_last_test_at
    }

    return NextResponse.json({ config })

  } catch (error) {
    console.error('Unexpected error in GET /api/company/flitt:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/company/flitt called')
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.id)

    // Get user's company
    console.log('Looking up company for user:', user.id)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError) {
      console.log('Company lookup error:', companyError)
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }
    console.log('Company found:', company.id)

    // Parse request body
    console.log('Parsing request body...')
    const body = await request.json()
    console.log('Request body parsed:', { merchant_id: body.merchant_id, secret_key: body.secret_key ? '[REDACTED]' : 'missing', test_mode: body.test_mode })
    const { merchant_id, secret_key, test_mode } = body

    if (!merchant_id || !secret_key) {
      return NextResponse.json(
        { error: 'Merchant ID და Secret Key სავალდებულოა' },
        { status: 400 }
      )
    }

    try {
      console.log('Attempting to encrypt secret key...')
      // Encrypt the secret key
      const encryptedSecretKey = encryptSecretKey(secret_key)
      console.log('Secret key encrypted successfully')

      // Update company with Flitt credentials
      console.log('Updating company with Flitt credentials...')
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          flitt_merchant_id: merchant_id,
          flitt_secret_key_encrypted: encryptedSecretKey,
          flitt_test_mode: test_mode || false,
          flitt_enabled: false, // Will be enabled after successful test
          flitt_setup_completed_at: new Date().toISOString()
        })
        .eq('id', company.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }
      
      console.log('Company updated successfully')

      return NextResponse.json({ 
        success: true,
        message: 'კრედენციალები შენახულია' 
      })

    } catch (encryptionError) {
      console.error('Error encrypting secret key:', encryptionError)
      return NextResponse.json(
        { error: 'კრედენციალების დამუშავება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/company/flitt:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { enabled, test_mode } = body

    // Update settings
    const updateData: any = {}
    if (typeof enabled === 'boolean') {
      updateData.flitt_enabled = enabled
    }
    if (typeof test_mode === 'boolean') {
      updateData.flitt_test_mode = test_mode
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'განსაახლებელი პარამეტრები არ არის მითითებული' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', company.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true,
      message: 'პარამეტრები განახლდა' 
    })

  } catch (error) {
    console.error('Unexpected error in PUT /api/company/flitt:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Remove Flitt configuration
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        flitt_merchant_id: null,
        flitt_secret_key_encrypted: null,
        flitt_enabled: false,
        flitt_test_mode: false,
        flitt_setup_completed_at: null,
        flitt_last_test_at: null
      })
      .eq('id', company.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true,
      message: 'Flitt კონფიგურაცია წაიშალა' 
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/company/flitt:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}