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
            HMAC secret required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set TABLE_QR_HMAC_SECRET in `.env.local`, then mint tokens via{" "}
            <code className="text-accent-gold">POST /api/qr/table</code>.
          </p>
        </GlassPanel>
      </Shell>
    );
  }

  const payload = verifyTableToken(params.token);
  if (!payload) {
    return (
      <Shell>
        <GlassPanel className="p-6">
          <h1 className="font-display text-2xl font-bold text-accent-ruby">
            Invalid or tampered QR
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cryptographic verification failed. Ask staff for a fresh table code.
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
