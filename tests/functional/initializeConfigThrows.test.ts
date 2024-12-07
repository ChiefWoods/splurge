import { describe, expect, test } from "bun:test";
import { getFundedKeypair, initializeConfig } from "../utils";
import { AnchorError } from "@coral-xyz/anchor";

// NOTE: Run against local validator

describe("initializeConfigThrows", () => {
  test("throws when upgrade authority is not initializing config", async () => {
    const unauthorizedKeypair = await getFundedKeypair();

    try {
      await initializeConfig(unauthorizedKeypair);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("UnauthorizedAdmin");
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
