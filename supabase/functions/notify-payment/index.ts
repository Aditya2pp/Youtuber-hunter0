// Supabase Edge Function: notify-payment
// Triggered via Database Webhook on INSERT in public.payments
// Uses Resend API (Free Tier: 3,000 emails/month)
// Required Secrets in Supabase:
// - RESEND_API_KEY (from https://resend.com)
// - ADMIN_EMAIL (e.g. adityakumarq0lvv@gmail.com)
// - SUPABASE_URL (pre-set by Supabase)
// - SUPABASE_SERVICE_ROLE_KEY (pre-set by Supabase)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: "No payment record found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!resendApiKey || !adminEmail) {
      console.warn("RESEND_API_KEY or ADMIN_EMAIL is not set. Skipping email dispatch.");
      return new Response(JSON.stringify({ message: "Notification skipped: Missing secrets" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch user's profile details
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, email")
      .eq("id", record.user_id)
      .single();

    const username = profile?.username || "Unknown User";
    const userEmail = profile?.email || "Unknown Email";

    // 2. Generate signed URL for the screenshot valid for 7 days (604800 seconds)
    let signedScreenshotUrl = "No screenshot attached";
    if (record.screenshot_path) {
      const { data: signedData, error: signError } = await supabase.storage
        .from("screenshots")
        .createSignedUrl(record.screenshot_path, 604800);

      if (!signError && signedData?.signedUrl) {
        signedScreenshotUrl = signedData.signedUrl;
      }
    }

    const planLabel = record.plan === "1y" ? "1 Year Pro (₹299)" : "30 Days Pass (₹30)";

    // 3. Send email via Resend API
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #EAE3DB; border-radius: 16px; background-color: #FAF6F2;">
        <h2 style="color: #0D0A10; margin-bottom: 8px;">🚀 Naya Subscription Payment Aaya Hai!</h2>
        <p style="color: #555; font-size: 14px; margin-top: 0;">YouTuber Hunter par user ne UPI payment complete kiya hai.</p>
        
        <div style="background-color: #FFFFFF; padding: 16px; border-radius: 12px; border: 1px solid #EAE3DB; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #777;">Username:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0D0A10;">@${username}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777;">Registered Email:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0D0A10;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777;">Plan:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #FF3358;">${planLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777;">Amount:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0D0A10;">₹${record.amount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #777;">Payment Status:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #059669;">Auto Activated (Please Verify)</td>
            </tr>
          </table>
        </div>

        <div style="margin: 20px 0;">
          <p style="font-size: 14px; color: #333; margin-bottom: 8px;"><strong>Payment Screenshot (Valid for 7 days):</strong></p>
          <a href="${signedScreenshotUrl}" target="_blank" style="display: inline-block; padding: 10px 18px; background-color: #0D0A10; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold;">
            🖼️ View Payment Screenshot
          </a>
        </div>

        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 12px; border-radius: 8px; font-size: 13px; color: #92400E; margin-top: 20px;">
          ⚡ <strong>Plan active hai</strong>. Apne UPI app me payment check karein aur <strong>/admin</strong> me jaakar <strong>Confirm ya Reject</strong> karein.
        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "YouTuber Hunter Alerts <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `💰 New ₹${record.amount} Payment from @${username} (${planLabel})`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    return new Response(JSON.stringify({ success: true, resend: resendData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
