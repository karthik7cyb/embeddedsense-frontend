
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import DiagnoseWorkspace from "./diagnose-workspace";

export default async function DiagnosePage() {
    // Wait for the incoming request before rendering
 

    // Initialize Supabase server client
    const supabase = await createClient();

    // Verify the authenticated user
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users
    if (error || !user) {
        redirect("/login");
    }

    // Get user details
    const displayName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";

    return (
        <DiagnoseWorkspace
            user={{
                id: user.id,
                name: displayName,
                email: user.email ?? "",
            }}
        />
    );
}
