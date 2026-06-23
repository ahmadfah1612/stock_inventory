import { expect, test } from "vitest";
import bcrypt from "bcryptjs";

test("password hash round-trips", async () => {
  const hash = await bcrypt.hash("secret", 10);
  expect(await bcrypt.compare("secret", hash)).toBe(true);
  expect(await bcrypt.compare("wrong", hash)).toBe(false);
});
