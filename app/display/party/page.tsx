import { PageShell } from "@/components/design/page-shell";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import { PartyScreen } from "@/components/party/party-screen";
import { RemotePartyScreenClient } from "@/components/party/remote/remote-party-screen-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function DisplayPartyPage() {
  return (
    <PageShell variant="display" decorations={false}>
      {isSupabaseConfigured() ? (
        <RemotePartyScreenClient locale="en" />
      ) : (
        <PartyRuntimeShell>
          <PartyScreen locale="en" />
        </PartyRuntimeShell>
      )}
    </PageShell>
  );
}
