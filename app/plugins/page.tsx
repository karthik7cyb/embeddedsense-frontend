
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import PluginsClient from "./plugins-client";

export default async function PluginsPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/login");
    }

    return (
        <PluginsClient
            user={{
                id: user.id,
                email: user.email ?? "",
            }}
        />
    );
}
