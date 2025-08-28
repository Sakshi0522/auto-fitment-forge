import { createClient } from 'npm:@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userId, role } = await req.json()

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: 'User ID and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // This client is created with the service_role key, which has elevated permissions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, check if a role already exists for the user to prevent duplicates.
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (!existingRole) {
      // Insert the new role if one doesn't exist
      const { data, error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: role })
        .select()

      if (insertError) {
        throw insertError
      }

      // To make the new role active, we must update the user's app_metadata.
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
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ data: { message: 'Role already set' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
