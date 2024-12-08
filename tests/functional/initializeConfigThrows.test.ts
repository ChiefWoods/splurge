import { describe, expect, test } from "bun:test";
import { getFundedKeypair, initializeConfig } from "../utils";
import { AnchorError } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("initializeConfigThrows", () => {
  test("throws if upgrade authority is not initializing config", async () => {
    const whitelistedMints = [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    const unauthorizedKeypair = await getFundedKeypair();

    try {
      await initializeConfig(unauthorizedKeypair, whitelistedMints);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("UnauthorizedAdmin");
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
