import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import {
  bumpPasskeyCounter,
  createGuestProfile,
  getGuestByCredentialId,
  getGuestProfile,
  listPasskeyCredentialIds,
  putChallenge,
  savePasskey,
  takeChallenge,
  type GuestProfile,
} from "@/lib/auth/guest-identity";

function rpID(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    return new URL(url).hostname || "localhost";
  } catch {
    return "localhost";
  }
}

function origin(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function passkeyRp() {
  return {
    rpID: rpID(),
    rpName: "mAITab",
    origin: origin(),
  };
}

function decodeClientChallenge(clientDataJSON: string): string {
  const json = Buffer.from(clientDataJSON, "base64url").toString("utf8");
  const parsed = JSON.parse(json) as { challenge: string };
  return parsed.challenge;
}

export async function buildRegistrationOptions(guest?: GuestProfile) {
  const profile = guest ?? createGuestProfile({ full_name: "Guest" });
  const options = await generateRegistrationOptions({
    rpName: passkeyRp().rpName,
    rpID: passkeyRp().rpID,
    userName: profile.id,
    userDisplayName: profile.full_name,
    userID: new TextEncoder().encode(profile.id),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
    excludeCredentials: profile.passkey
      ? [
          {
            id: profile.passkey.credentialId,
            transports: profile.passkey.transports as
              | AuthenticatorTransportFuture[]
              | undefined,
          },
        ]
      : [],
  });
  putChallenge(options.challenge, { type: "reg", userId: profile.id });
  return { options, guestId: profile.id };
}

export async function verifyRegistration(
  guestId: string,
  response: RegistrationResponseJSON
) {
  const challenge = decodeClientChallenge(response.response.clientDataJSON);
  const meta = takeChallenge(challenge);
  if (!meta || meta.type !== "reg" || (meta.userId && meta.userId !== guestId)) {
    throw new Error("Registration challenge expired or missing");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: passkeyRp().origin,
    expectedRPID: passkeyRp().rpID,
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration failed verification");
  }

  const { credential } = verification.registrationInfo;
  const profile = savePasskey(guestId, {
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports as AuthenticatorTransport[] | undefined,
  });
  if (!profile) throw new Error("Guest profile not found");
  return profile;
}

export async function buildAuthenticationOptions(guestId?: string) {
  const allowCredentials = guestId
    ? (() => {
        const g = getGuestProfile(guestId);
        return g?.passkey
          ? [
              {
                id: g.passkey.credentialId,
                transports: g.passkey.transports as
                  | AuthenticatorTransportFuture[]
                  | undefined,
              },
            ]
          : [];
      })()
    : listPasskeyCredentialIds().map((id) => ({ id }));

  const options = await generateAuthenticationOptions({
    rpID: passkeyRp().rpID,
    userVerification: "preferred",
    allowCredentials:
      allowCredentials.length > 0 ? allowCredentials : undefined,
  });
  putChallenge(options.challenge, { type: "auth", userId: guestId });
  return options;
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON
) {
  const challenge = decodeClientChallenge(response.response.clientDataJSON);
  const meta = takeChallenge(challenge);
  if (!meta || meta.type !== "auth") {
    throw new Error("Authentication challenge expired or missing");
  }

  const guest =
    getGuestByCredentialId(response.id) ||
    (meta.userId ? getGuestProfile(meta.userId) : undefined);
  if (!guest?.passkey) {
    throw new Error("Unknown passkey credential");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: passkeyRp().origin,
    expectedRPID: passkeyRp().rpID,
    requireUserVerification: false,
    credential: {
      id: guest.passkey.credentialId,
      publicKey: Buffer.from(guest.passkey.publicKey, "base64url"),
      counter: guest.passkey.counter,
      transports: guest.passkey.transports as
        | AuthenticatorTransportFuture[]
        | undefined,
    },
  });

  if (!verification.verified) {
    throw new Error("Passkey authentication failed");
  }

  const newCounter =
    verification.authenticationInfo?.newCounter ?? guest.passkey.counter + 1;
  bumpPasskeyCounter(guest.id, newCounter);
  return guest;
}
