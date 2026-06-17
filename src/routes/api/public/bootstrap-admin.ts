import { createFileRoute } from "@tanstack/react-router";

// ONE-SHOT bootstrap to (re)set the god-admin credentials.
// Protected by a one-time secret in the request body. Safe to call only by the
// Lovable agent during setup; remove this file after the credentials are set.
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as {
          secret?: string; email?: string; password?: string; full_name?: string;
        };
        if (body.secret !== "beu-bootstrap-2026-once") {
          return new Response("forbidden", { status: 403 });
        }
        if (!body.email || !body.password) {
          return new Response("missing email/password", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Find existing user by email
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users.find((u) => u.email?.toLowerCase() === body.email!.toLowerCase());

        let userId: string;
        if (existing) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password: body.password,
            email_confirm: true,
            user_metadata: { full_name: body.full_name ?? "Beu Admin" },
          });
          if (error) return new Response(error.message, { status: 500 });
          userId = existing.id;
        } else {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: { full_name: body.full_name ?? "Beu Admin" },
          });
          if (error || !created.user) return new Response(error?.message ?? "create failed", { status: 500 });
          userId = created.user.id;
        }

        // Ensure admin role
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: userId, role: "admin" },
          { onConflict: "user_id,role" }
        );
        // Ensure profile
        await supabaseAdmin.from("profiles").upsert({
          id: userId, email: body.email, full_name: body.full_name ?? "Beu Admin",
        });

        return new Response(JSON.stringify({ ok: true, userId }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
