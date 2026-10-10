
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");

  const testEnv = await initializeTestEnvironment({
    projectId,
    database: {
      rules,
      host: "127.0.0.1",
      port: 9000,
    }
  });

  const unauthDb = testEnv.unauthenticatedContext().database();
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();

  let passed = 0;
  let failed = 0;
  let results = [];

  async function test(name, promise, expectPass) {
    try {
      if (expectPass) {
        await assertSucceeds(promise);
      } else {
        await assertFails(promise);
      }
      results.push(`PASS: ${name}`);
      passed++;
    } catch (err) {
      results.push(`FAIL: ${name} - ${err.message}`);
      failed++;
    }
  }

  await test("Auth create valid Order", authA.ref("Orders/order2").set({status: "New", customerPhone: "010", items: { "item1": "Burger" }, totalAmount: 100}), true);

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  console.log(results.join("\n"));
  
  await testEnv.cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

