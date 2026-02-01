import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log incoming request for debugging
    const authHeader = req.headers.get("Authorization");
    console.log("Received request with auth header present:", !!authHeader);

    console.log("Starting Friday spins reset...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all user IDs - both from user_spins and profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Get existing user_spins records
    const { data: existingSpins, error: spinsError } = await supabase
      .from("user_spins")
      .select("user_id");

    if (spinsError) {
      console.error("Error fetching user spins:", spinsError);
      throw spinsError;
    }

    const existingUserIds = new Set(existingSpins?.map(s => s.user_id) || []);

    // Reset spins for existing records
    if (existingUserIds.size > 0) {
      const { error: updateError } = await supabase
        .from("user_spins")
        .update({ 
          spins_used: 0, 
          last_spin_reset: new Date().toISOString() 
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (updateError) {
        console.error("Error resetting spins:", updateError);
        throw updateError;
      }
    }

    // Create records for users without one
    const newUserRecords = allProfiles
      ?.filter(p => !existingUserIds.has(p.user_id))
      .map(p => ({
        user_id: p.user_id,
        spins_used: 0,
        last_spin_reset: new Date().toISOString(),
      })) || [];

    if (newUserRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("user_spins")
        .insert(newUserRecords);

      if (insertError) {
        console.error("Error creating new spin records:", insertError);
        throw insertError;
      }
      console.log(`Created ${newUserRecords.length} new spin records`);
    }

    console.log("Successfully reset spins for all users");

    // Send notifications to all users
    const userIds = allProfiles?.map(p => p.user_id) || [];
    let notificationsSent = 0;

    for (const userId of userIds) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title: "🎡 Giri Ruota Ricaricati!",
          message: "I tuoi giri settimanali della Ruota della Fortuna sono stati ricaricati. Prova la tua fortuna e vinci T-Coin!",
          is_read: false
        });

      if (notifError) {
        console.error(`Error sending notification to user ${userId}:`, notifError);
      } else {
        notificationsSent++;
      }
    }

    console.log(`Sent ${notificationsSent} notifications to users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Spins reset successfully for all users",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in reset-friday-spins function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
