import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const generateEmailHtml = (
  type: string,
  token: string,
  tokenHash: string,
  redirectTo: string,
  supabaseUrl: string
) => {
  const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${redirectTo}`
  
  let title = 'Conferma la tua email'
  let message = 'Clicca il pulsante qui sotto per confermare il tuo indirizzo email e completare la registrazione.'
  let buttonText = 'Conferma Email'
  
  if (type === 'recovery' || type === 'password_recovery') {
    title = 'Reimposta la password'
    message = 'Clicca il pulsante qui sotto per reimpostare la tua password.'
    buttonText = 'Reimposta Password'
  } else if (type === 'magiclink') {
    title = 'Accedi al tuo account'
    message = 'Clicca il pulsante qui sotto per accedere al tuo account.'
    buttonText = 'Accedi'
  } else if (type === 'invite') {
    title = 'Sei stato invitato'
    message = 'Clicca il pulsante qui sotto per accettare l\'invito.'
    buttonText = 'Accetta Invito'
  } else if (type === 'email_change') {
    title = 'Conferma cambio email'
    message = 'Clicca il pulsante qui sotto per confermare il nuovo indirizzo email.'
    buttonText = 'Conferma Cambio'
  }

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
                ${title}
              </h1>
              
              <!-- Message -->
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #a3a3a3; text-align: center;">
                ${message}
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background-color: #262626; margin: 32px 0;"></div>
              
              <!-- OTP Code -->
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #737373; text-align: center;">
                Oppure usa questo codice:
              </p>
              <div style="background-color: #1a1a1a; border: 1px solid #262626; border-radius: 8px; padding: 16px; text-align: center;">
                <code style="font-size: 24px; font-weight: 700; color: #22d3ee; letter-spacing: 4px; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                  ${token}
                </code>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525252;">
                Se non hai richiesto questa email, puoi ignorarla.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    console.log('Processing email hook for:', user.email, 'type:', email_action_type)

    const html = generateEmailHtml(
      email_action_type,
      token,
      token_hash,
      redirect_to,
      Deno.env.get('SUPABASE_URL') ?? ''
    )

    const { error } = await resend.emails.send({
      from: 'iCore <onboarding@resend.dev>',
      to: [user.email],
      subject: email_action_type === 'signup' ? 'Conferma la tua email - iCore' : 
               email_action_type === 'recovery' ? 'Reimposta la password - iCore' :
               email_action_type === 'magiclink' ? 'Accedi a iCore' :
               'iCore',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully to:', user.email)

  } catch (error: unknown) {
    console.error('Email hook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
