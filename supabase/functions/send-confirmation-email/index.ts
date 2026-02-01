import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  confirmationUrl: string;
  username?: string;
  isTest?: boolean;
  debug?: boolean;
  daysBack?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-confirmation-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, username, isTest, debug, daysBack }: ConfirmationEmailRequest = await req.json();
    
    console.log(`Sending confirmation email to: ${email}`);
    console.log(`Confirmation URL: ${confirmationUrl}`);

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }


    // Optional diagnostics mode: verify Brevo account/senders/blocked list without sending an email
    if (debug) {
      const now = new Date();
      const days = Math.max(1, Math.min(365, daysBack ?? 30));
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const startDate = start.toISOString().slice(0, 10);
      const endDate = now.toISOString().slice(0, 10);

      const baseHeaders = {
        "api-key": BREVO_API_KEY,
        "Accept": "application/json",
      };

      const safeParse = async (res: Response) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      };

      const [accountRes, sendersRes, blockedRes] = await Promise.all([
        fetch("https://api.brevo.com/v3/account", { headers: baseHeaders }),
        fetch("https://api.brevo.com/v3/senders", { headers: baseHeaders }),
        fetch(
          `https://api.brevo.com/v3/smtp/blockedContacts?startDate=${startDate}&endDate=${endDate}&limit=100&offset=0&sort=desc`,
          { headers: baseHeaders }
        ),
      ]);

      const [accountData, sendersData, blockedData] = await Promise.all([
        safeParse(accountRes),
        safeParse(sendersRes),
        safeParse(blockedRes),
      ]);

      const blockedContacts =
        (blockedData && typeof blockedData === "object" && "contacts" in blockedData)
          ? (blockedData as any).contacts
          : [];

      const isRecipientBlocked = Array.isArray(blockedContacts)
        ? blockedContacts.some(
            (c: any) =>
              (c?.email ?? "").toLowerCase() === (email ?? "").toLowerCase()
          )
        : false;

      console.log("Brevo diagnostics:", {
        accountStatus: accountRes.status,
        sendersStatus: sendersRes.status,
        blockedStatus: blockedRes.status,
        isRecipientBlocked,
        startDate,
        endDate,
      });

      return new Response(
        JSON.stringify({
          success: true,
          diagnostics: {
            accountStatus: accountRes.status,
            account: accountData,
            sendersStatus: sendersRes.status,
            senders: sendersData,
            blockedStatus: blockedRes.status,
            blocked: blockedData,
            isRecipientBlocked,
            window: { startDate, endDate },
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0f14;">
          <tr>
            <td style="padding: 60px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
                
                <!-- Logo -->
                <tr>
                  <td style="text-align: center; padding-bottom: 40px;">
                    <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #22d3ee, #0891b2); border-radius: 14px; line-height: 56px; font-size: 28px;">
                      ⚡
                    </div>
                  </td>
                </tr>
                
                <!-- Main Card -->
                <tr>
                  <td style="background: #111827; border-radius: 20px; padding: 48px 40px; border: 1px solid rgba(34, 211, 238, 0.2);">
                    
                    <!-- Greeting -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 8px 0; text-align: center;">
                      ${isTest ? 'Email di Test' : `Ciao${username ? ` ${username}` : ''}`}
                    </h1>
                    <p style="color: #9ca3af; font-size: 15px; margin: 0 0 32px 0; text-align: center; line-height: 1.5;">
                      ${isTest ? 'Questo è un test del nuovo design email.' : 'Conferma la tua email per attivare il tuo account iCore.'}
                    </p>
                    
                    <!-- Divider -->
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #22d3ee33, transparent); margin: 0 0 32px 0;"></div>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #22d3ee, #a855f7); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 15px; font-weight: 600;">
                        ${isTest ? 'Pulsante di Esempio' : 'Conferma Email'}
                      </a>
                    </div>
                    
                    <!-- Alternative Link -->
                    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0; line-height: 1.6;">
                      Oppure copia questo link:<br>
                      <a href="${confirmationUrl}" style="color: #22d3ee; text-decoration: none; word-break: break-all; font-size: 12px;">
                        ${confirmationUrl}
                      </a>
                    </p>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 32px; text-align: center;">
                    <p style="color: #4b5563; font-size: 12px; margin: 0 0 8px 0;">
                      iCore
                    </p>
                    <p style="color: #374151; font-size: 11px; margin: 0;">
                      Non hai richiesto questa email? Ignorala.
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

    // Send email using Brevo API
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "iCore",
          email: "no-reply@brevo.com", // Use Brevo's verified domain for testing
        },
        to: [{ email: email }],
        subject: isTest ? "🧪 Test Email - iCore" : "Conferma la tua email - iCore",
        htmlContent: htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Brevo API error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("Email sent successfully via Brevo:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
