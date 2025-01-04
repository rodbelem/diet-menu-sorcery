import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { keys } = await req.json()
    
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('Keys must be a non-empty array')
    }

    const secrets = {}
    for (const key of keys) {
      const value = Deno.env.get(key)
      if (!value) {
        console.error(`Secret ${key} not found`)
      }
      secrets[key] = value || null
    }

    return new Response(
      JSON.stringify({ data: secrets }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error getting secrets:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})