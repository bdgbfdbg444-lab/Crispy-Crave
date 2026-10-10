
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  await testEnv.clearDatabase();
  const authA = testEnv.authenticatedContext("userA").database();

  let results = [];
  async function test(id, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    console.log(`${id} | ${expectPass ? "SUCCEED" : "FAIL"} | ${passed ? "PASS" : "FAIL"}`);
  }

  // A. brand-new profile -> TotalOrders=0 -> expected current behavior
  await test("A", "new profile TotalOrders=0", true, 
    authA.ref(`PublicCustomers/01000`).update({ uid: "userA", Phone: "01000", TotalOrders: 0 })
  );

  // B. existing profile with TotalOrders present -> client update -> DENIED
  await test("B", "update existing TotalOrders", false, 
    authA.ref(`PublicCustomers/01000`).update({ TotalOrders: 5 })
  );

  // C. existing profile with TotalOrders missing -> client add 0
  await authA.ref(`PublicCustomers/01001`).update({ uid: "userA", Phone: "01001" }); // create without
  await test("C", "add missing TotalOrders=0", true, 
    authA.ref(`PublicCustomers/01001`).update({ TotalOrders: 0 })
  );

  // D. same tests for TotalSpent
  await test("D1", "new profile TotalSpent=0", true, 
    authA.ref(`PublicCustomers/01002`).update({ uid: "userA", Phone: "01002", TotalSpent: 0 })
  );
  await test("D2", "update existing TotalSpent", false, 
    authA.ref(`PublicCustomers/01002`).update({ TotalSpent: 5 })
  );

  await testEnv.cleanup();
}
runTests();

