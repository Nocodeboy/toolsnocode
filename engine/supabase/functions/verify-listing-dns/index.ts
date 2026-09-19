import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders as buildCorsHeaders } from "../_shared/cors.ts";

function getCorsHeaders(req: Request) {
  return buildCorsHeaders(req, "POST, OPTIONS");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { listing_id, action } = body;

    if (!listing_id) {
      return new Response(JSON.stringify({ error: "listing_id is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: tool, error: toolError } = await supabaseAdmin
      .from("listings")
      .select("id, name, website, user_id, verification_token, is_verified")
      .eq("id", listing_id)
      .maybeSingle();

    if (toolError || !tool) {
      return new Response(JSON.stringify({ error: "Tool not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const isOwner = tool.user_id === user.id;
    const isUnclaimed = !tool.user_id;

    if (!isOwner && !isUnclaimed) {
      return new Response(JSON.stringify({ error: "Forbidden: this tool is already owned by someone else" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (action === "generate_token") {
      if (tool.verification_token) {
        return new Response(
          JSON.stringify({ token: tool.verification_token, is_verified: tool.is_verified }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const randomBytes = new Uint8Array(24);
      crypto.getRandomValues(randomBytes);
      const token = "toolsnocode-verify=" + btoa(String.fromCharCode(...randomBytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({ verification_token: token })
        .eq("id", listing_id);

      if (updateError) {
        console.error("Failed to save verification token:", updateError);
        return new Response(JSON.stringify({ error: "Failed to save verification token" }), {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ token, is_verified: false }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (tool.is_verified && isOwner) {
        return new Response(
          JSON.stringify({ success: true, already_verified: true }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      if (!tool.verification_token) {
        return new Response(JSON.stringify({ error: "No verification token generated yet" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      if (!tool.website) {
        return new Response(JSON.stringify({ error: "Tool has no website URL" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      let domain: string;
      try {
        const url = new URL(tool.website.startsWith("http") ? tool.website : `https://${tool.website}`);
        domain = url.hostname.replace(/^www\./, "");
      } catch {
        return new Response(JSON.stringify({ error: "Invalid website URL on tool" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(domain)) {
        return new Response(JSON.stringify({ error: "Invalid domain format" }), {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      let dnsSuccess = false;
      let dnsError = "";

      try {
        const dnsResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`,
          { headers: { Accept: "application/json" } }
        );

        if (!dnsResponse.ok) {
          dnsError = `DNS API returned ${dnsResponse.status}`;
        } else {
          const dnsData = await dnsResponse.json();
          const txtRecords: string[] = (dnsData.Answer ?? [])
            .filter((r: { type: number }) => r.type === 16)
            .map((r: { data: string }) => r.data.replace(/^"|"$/g, "").replace(/" "/g, ""));

          dnsSuccess = txtRecords.some((record) => record === tool.verification_token);

          if (!dnsSuccess) {
            dnsError = `Token not found in TXT records for ${domain}`;
          }
        }
      } catch (e) {
        dnsError = `DNS lookup failed: ${e instanceof Error ? e.message : String(e)}`;
      }

      const { error: logError } = await supabaseAdmin.from("tool_verifications").insert({
        listing_id,
        user_id: user.id,
        success: dnsSuccess,
      });
      if (logError) {
        console.error("Failed to log verification attempt:", logError);
      }

      if (dnsSuccess) {
        await supabaseAdmin
          .from("listings")
          .update({
            is_verified: true,
            verified_at: new Date().toISOString(),
            user_id: user.id,
          })
          .eq("id", listing_id);
      }

      return new Response(
        JSON.stringify({ success: dnsSuccess, domain, error: dnsError || undefined }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("verify-listing-dns error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
