import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret - this function should only be called by cron scheduler
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized access attempt to check-device-rentals function");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Cron only" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log("Starting device rental check at:", now.toISOString());
    console.log("Checking for devices expiring before:", sevenDaysFromNow.toISOString());

    // 1. Find devices expiring in exactly 7 days (within a 24-hour window to avoid duplicate notifications)
    const sevenDaysStart = new Date(sevenDaysFromNow);
    sevenDaysStart.setHours(0, 0, 0, 0);
    const sevenDaysEnd = new Date(sevenDaysFromNow);
    sevenDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiringDevices, error: expiringError } = await supabase
      .from("user_devices")
      .select(`
        id,
        user_id,
        device_id,
        rental_expires_at,
        mining_devices (
          name,
          computing_power
        )
      `)
      .eq("is_rental_active", true)
      .gte("rental_expires_at", sevenDaysStart.toISOString())
      .lte("rental_expires_at", sevenDaysEnd.toISOString());

    if (expiringError) {
      console.error("Error fetching expiring devices:", expiringError);
    } else if (expiringDevices && expiringDevices.length > 0) {
      console.log(`Found ${expiringDevices.length} devices expiring in 7 days`);
      
      for (const device of expiringDevices) {
        // Check if notification already sent for this device
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", device.user_id)
          .ilike("title", "%scadenza%")
          .ilike("message", `%${(device.mining_devices as any)?.name}%`)
          .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!existingNotif || existingNotif.length === 0) {
          // Send notification
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              user_id: device.user_id,
              title: "⚠️ Dispositivo in scadenza",
              message: `Il tuo dispositivo "${(device.mining_devices as any)?.name}" scadrà tra 7 giorni. Rinnova l'affitto per continuare a guadagnare!`,
            });

          if (notifError) {
            console.error("Error creating expiry notification:", notifError);
          } else {
            console.log(`Notification sent for device ${device.id} to user ${device.user_id}`);
          }
        } else {
          console.log(`Notification already sent for device ${device.id}`);
        }
      }
    } else {
      console.log("No devices expiring in 7 days");
    }

    // 2. Find and delete expired devices
    const { data: expiredDevices, error: expiredError } = await supabase
      .from("user_devices")
      .select(`
        id,
        user_id,
        device_id,
        rental_expires_at,
        mining_devices (
          name,
          computing_power
        )
      `)
      .eq("is_rental_active", true)
      .lt("rental_expires_at", now.toISOString());

    if (expiredError) {
      console.error("Error fetching expired devices:", expiredError);
    } else if (expiredDevices && expiredDevices.length > 0) {
      console.log(`Found ${expiredDevices.length} expired devices to remove`);

      for (const device of expiredDevices) {
        const computingPower = (device.mining_devices as any)?.computing_power || 0;
        const deviceName = (device.mining_devices as any)?.name || "Dispositivo";

        // Get current user computing power
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_computing_power")
          .eq("user_id", device.user_id)
          .single();

        const currentPower = profile?.total_computing_power || 0;
        const newPower = Math.max(0, currentPower - computingPower);

        // Update user's computing power
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ total_computing_power: newPower })
          .eq("user_id", device.user_id);

        if (updateError) {
          console.error(`Error updating computing power for user ${device.user_id}:`, updateError);
          continue;
        }

        // Delete the expired device
        const { error: deleteError } = await supabase
          .from("user_devices")
          .delete()
          .eq("id", device.id);

        if (deleteError) {
          console.error(`Error deleting device ${device.id}:`, deleteError);
          continue;
        }

        // Create notification for the user
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: device.user_id,
            title: "❌ Dispositivo scaduto",
            message: `Il tuo dispositivo "${deviceName}" è stato rimosso perché l'affitto è scaduto. La potenza di calcolo (${computingPower} TH/s) è stata sottratta dal tuo totale.`,
          });

        if (notifError) {
          console.error(`Error creating removal notification for device ${device.id}:`, notifError);
        }

        console.log(`Removed expired device ${device.id}, deducted ${computingPower} TH/s from user ${device.user_id}`);
      }
    } else {
      console.log("No expired devices found");
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiringNotified: expiringDevices?.length || 0,
        expiredRemoved: expiredDevices?.length || 0,
        timestamp: now.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-device-rentals function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
