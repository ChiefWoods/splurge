import { describe, expect, test } from "bun:test";
import { masterWallet, updateAdmin } from "../utils";
import { AnchorError } from "@coral-xyz/anchor";

// NOTE: Run against local validator

describe("updateAdminThrows", () => {
  test("throws when updating config to same admin", async () => {
    try {
      await updateAdmin(masterWallet, masterWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("AdminAlreadyAssigned");
      expect(err.error.errorCode.number).toEqual(6002);
    }
  });
});
