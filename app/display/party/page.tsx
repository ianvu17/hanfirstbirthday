import { PageShell } from "@/components/design/page-shell";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import { PartyScreen } from "@/components/party/party-screen";

export default function DisplayPartyPage() {
  return (
    <PageShell variant="display" decorations={false}>
      <PartyRuntimeShell>
        <PartyScreen locale="en" />
      </PartyRuntimeShell>
    </PageShell>
  );
}
