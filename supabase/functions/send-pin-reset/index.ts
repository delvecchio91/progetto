import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generatePinResetEmailHtml = (resetUrl: string) => {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reimposta PIN</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 420px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #22d3ee 0%, #0891b2 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">i</span>
              </div>
            </td>
          </tr>
          
          <!-- Card -->
          <tr>
            <td style="background-color: #141414; border-radius: 16px; padding: 40px 32px; border: 1px solid #262626;">
              
              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; text-align: center;">
                Reimposta PIN di Sicurezza
              </h1>
              
              <!-- Message -->
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #a3a3a3; text-align: center;">
                Hai richiesto di reimpostare il tuo PIN di sicurezza. Clicca il pulsante qui sotto per procedere.
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px;">
                      Reimposta PIN
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <div style="margin-top: 24px; padding: 12px; background-color: #1a1a1a; border: 1px solid #262626; border-radius: 8px;">
                <p style="margin: 0; font-size: 13px; color: #f59e0b; text-align: center;">
                  ⚠️ Questo link scade tra 1 ora
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525252;">
                Se non hai richiesto questo reset, ignora questa email e il tuo PIN rimarrà invariato.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticazione richiesta" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Token non valido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing PIN reset request for user:", user.id);

    // Generate reset token
    const resetToken = crypto.randomUUID();
    
    // Invalidate existing tokens and create new one
    await supabase
      .from("pin_reset_tokens")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    const { error: insertError } = await supabase
      .from("pin_reset_tokens")
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      });

    if (insertError) {
      console.error("Token insert error:", insertError);
      throw new Error("Errore nella creazione del token");
    }

    // Get app URL from origin or use fallback
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const resetUrl = `${origin}/reset-pin?token=${resetToken}`;

    // Send email
    const emailHtml = generatePinResetEmailHtml(resetUrl);
    
    const emailResponse = await resend.emails.send({
      from: "iCore <onboarding@resend.dev>",
      to: [user.email!],
      subject: "Reimposta il tuo PIN - iCore",
      html: emailHtml,
    });

    console.log("PIN reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email inviata" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in send-pin-reset:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
