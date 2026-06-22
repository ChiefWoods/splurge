import {
  getDiscriminatedUnionCodec,
  getStructCodec,
  getU8Codec,
  getUnitCodec,
} from "@solana/codecs";

export type VerificationLevel = { __kind: "Partial"; numSignatures: number } | { __kind: "Full" };

export const verificationLevelCodec = getDiscriminatedUnionCodec([
  ["Partial", getStructCodec([["numSignatures", getU8Codec()]])],
  ["Full", getUnitCodec()],
]);

// Data Enum Helpers.
type GetDiscriminatedUnionVariant<
  TUnion,
  TDiscriminator extends keyof TUnion,
  TKind extends TUnion[TDiscriminator],
> = Extract<TUnion, Record<TDiscriminator, TKind>>;

type GetDiscriminatedUnionVariantContent<
  TUnion,
  TDiscriminator extends keyof TUnion,
  TKind extends TUnion[TDiscriminator],
> = Omit<GetDiscriminatedUnionVariant<TUnion, TDiscriminator, TKind>, TDiscriminator>;

export function verificationLevel(
  kind: "Partial",
  data: GetDiscriminatedUnionVariantContent<VerificationLevel, "__kind", "Partial">,
): GetDiscriminatedUnionVariant<VerificationLevel, "__kind", "Partial">;
export function verificationLevel(
  kind: "Full",
): GetDiscriminatedUnionVariant<VerificationLevel, "__kind", "Full">;
export function verificationLevel<K extends VerificationLevel["__kind"], Data>(
  kind: K,
  data?: Data,
) {
  if (Array.isArray(data)) {
    return { __kind: kind, fields: data };
  }
  return { __kind: kind, ...data };
}

export function isVerificationLevel<K extends VerificationLevel["__kind"]>(
  kind: K,
  value: VerificationLevel,
): value is VerificationLevel & { __kind: K } {
  return value.__kind === kind;
}
