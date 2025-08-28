import { createClient } from 'npm:@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define the CORS headers to allow requests from your Vercel domain.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://auto-fitment-forge-lfdt19jl8-auto-mobiles-projects.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 204 })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userId, role } = await req.json()

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'User ID and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (!existingRole) {
      const { data, error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: role })
        .select()

      if (insertError) {
        throw insertError
      }

      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          app_metadata: { role: role }
        }
      )

      if (metadataError) {
        throw metadataError
      }
      
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ data: { message: 'Role already set' } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
