import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AwardTcoinRequest {
  amount: number;
  type: string;
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting award-tcoin function...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No/invalid authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) {
      throw new Error("Missing SUPABASE_ANON_KEY");
    }

    // Verify the user's token using signing-keys compatible method
    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);

    if (authError || !claimsData?.claims?.sub) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("User authenticated:", userId);

    // Use service role to perform operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { amount, type, notes } = await req.json() as AwardTcoinRequest;

    // Validate input - amount must be a number
    if (typeof amount !== "number" || amount === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate type - only allow specific types from client
    const allowedTypes = ["spin_win", "conversion"];
    if (!type || !allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid transaction type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate amount ranges based on type
    if (type === "spin_win") {
      // Valid spin amounts: 5, 10, 15, 25, 50, 100, 200, 500
      const validSpinAmounts = [5, 10, 15, 25, 50, 100, 200, 500];
      if (!validSpinAmounts.includes(amount)) {
        console.error("Invalid spin amount:", amount);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid spin amount" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else if (type === "conversion") {
      // Conversions should be negative (subtracting T-Coins)
      if (amount > 0 || amount < -10000000) {
        console.error("Invalid conversion amount:", amount);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid conversion amount" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }

    // supabaseAdmin already created above with service role key

    // For spin_win, also update spins_used
    if (type === "spin_win") {
      // Check if user has available spins
      const { data: spinSettings } = await supabaseAdmin
        .from("spin_settings")
        .select("daily_spins")
        .limit(1)
        .maybeSingle();

      const { data: userSpins } = await supabaseAdmin
        .from("user_spins")
        .select("spins_used")
        .eq("user_id", userId)
        .maybeSingle();

      if (!userSpins) {
        console.error("User has no spins record - admin needs to grant spins first");
        return new Response(
          JSON.stringify({ success: false, error: "No spins available" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const dailySpins = spinSettings?.daily_spins || 3;
      if (userSpins.spins_used >= dailySpins) {
        console.error("User has no remaining spins");
        return new Response(
          JSON.stringify({ success: false, error: "No spins remaining" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Update spins_used server-side
      const { error: spinsError } = await supabaseAdmin
        .from("user_spins")
        .update({ spins_used: userSpins.spins_used + 1 })
        .eq("user_id", userId);

      if (spinsError) {
        console.error("Error updating spins:", spinsError);
        throw spinsError;
      }
    }

    // Update tcoin_balance server-side
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tcoin_balance")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Profile not found");
    }

    const currentBalance = profile.tcoin_balance || 0;
    const newBalance = currentBalance + amount;

    // For conversions, ensure user has enough balance
    if (type === "conversion" && newBalance < 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient T-Coin balance" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ tcoin_balance: newBalance })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      throw updateError;
    }

    console.log(`Updated tcoin_balance from ${currentBalance} to ${newBalance}`);

    // Insert tcoin transaction using service role
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from("tcoin_transactions")
      .insert({
        user_id: userId,
        amount,
        type,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting tcoin transaction:", insertError);
      throw insertError;
    }

    console.log("Tcoin transaction created:", transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        new_balance: newBalance,
        message: `${amount} T-Coin awarded successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in award-tcoin function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
