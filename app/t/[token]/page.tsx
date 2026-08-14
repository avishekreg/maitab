import { MaiTabLogo } from "@/components/branding/MaiTabLogo";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TableJoinClient } from "@/components/table/TableJoinClient";
import { verifyTableToken } from "@/lib/qr/hmac";

interface PageProps {
  params: { token: string };
}

export default function TableScanPage({ params }: PageProps) {
  const secret = process.env.TABLE_QR_HMAC_SECRET;

  if (!secret || secret.includes("replace-with")) {
    return (
      <Shell>
        <GlassPanel className="p-6">
          <h1 className="font-display text-2xl font-bold text-accent-ruby">
            Table seal key required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure the table seal secret in the environment, then mint
            tokens via the venue QR console.
          </p>
        </GlassPanel>
      </Shell>
    );
  }

  const payload = verifyTableToken(params.token);
  if (!payload) {
    return (
      <Shell>
        <GlassPanel className="border-accent-ruby/40 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-ruby">
            403 Forbidden · cryptographic error
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-accent-ruby">
            URL tampering blocked
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cryptographic verification failed. Manual edits to table slugs are
            rejected and flagged. Ask staff for a fresh signed QR.
          </p>
        </GlassPanel>
      </Shell>
    );
  }

  return (
    <Shell>
      <TableJoinClient
        token={params.token}
        tableCodeHint={payload.tableCode}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-nightlife-radial px-4 text-foreground">
      <div className="w-full max-w-md">
        <MaiTabLogo variant="FullLogoWithText" className="mb-4 h-12 w-auto" />
        {children}
      </div>
    </div>
  );
}
