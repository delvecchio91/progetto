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
    // Validate cron secret - this function should only be called by cron scheduler
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized access attempt to monthly-salary function");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Cron only" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting monthly salary distribution...");

    // 1. Get all referral levels with their salaries
    const { data: levels, error: levelsError } = await supabase
      .from("referral_levels")
      .select("name, monthly_salary");

    if (levelsError) {
      console.error("Error fetching referral levels:", levelsError);
      throw levelsError;
    }

    // Create a map for quick lookup
    const salaryMap: Record<string, number> = {};
    for (const level of levels || []) {
      salaryMap[level.name] = level.monthly_salary;
    }

    console.log("Salary map:", salaryMap);

    // 2. Get all users with their referral_level
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("user_id, username, email, referral_level, wallet_balance, referral_earnings");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users to process`);

    let processedCount = 0;
    let skippedCount = 0;

    // 3. Process each user
    for (const user of users || []) {
      const level = user.referral_level || "bronze";
      const salary = salaryMap[level] || 0;

      // Skip if salary is 0
      if (salary <= 0) {
        skippedCount++;
        continue;
      }

      console.log(`Processing user ${user.email}: level=${level}, salary=${salary}`);

      // Update wallet balance and referral earnings
      const newBalance = (user.wallet_balance || 0) + salary;
      const newReferralEarnings = (user.referral_earnings || 0) + salary;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          wallet_balance: newBalance,
          referral_earnings: newReferralEarnings,
        })
        .eq("user_id", user.user_id);

      if (updateError) {
        console.error(`Error updating user ${user.email}:`, updateError);
        continue;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.user_id,
          type: "referral_salary",
          amount: salary,
          exact_amount: salary,
          status: "completed",
          notes: `Stipendio mensile livello ${level.toUpperCase()}`,
          processed_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error(`Error creating transaction for ${user.email}:`, transactionError);
      }

      // Create notification
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: user.user_id,
          title: "Stipendio mensile accreditato! 💰",
          message: `Hai ricevuto ${salary.toFixed(2)} USDC come stipendio mensile per il livello ${level.toUpperCase()}.`,
        });

      if (notificationError) {
        console.error(`Error creating notification for ${user.email}:`, notificationError);
      }

      processedCount++;
    }

    const result = {
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      timestamp: new Date().toISOString(),
    };

    console.log("Monthly salary distribution completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in monthly-salary function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
