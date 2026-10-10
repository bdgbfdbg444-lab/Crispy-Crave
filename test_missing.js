
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  await testEnv.clearDatabase();
  const authA = testEnv.authenticatedContext("USER_A").database();
  const authB = testEnv.authenticatedContext("USER_B").database();

  let results = [];
  async function test(id, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    console.log(`${id} | ${expectPass ? "SUCCEED" : "FAIL"} | ${passed ? "PASS" : "FAIL"}`);
  }

  // Set up existing profile missing fields
  await authB.ref(`PublicCustomers/01001`).update({ uid: "USER_B", Phone: "01001" });

  console.log("=== 1. REQUIRED ATTACK TEST ===");
  await test("1_1", "USER_A tries to add Name", false, authA.ref(`PublicCustomers/01001/Name`).set("A Name"));
  await test("1_2", "USER_A tries to add Address", false, authA.ref(`PublicCustomers/01001/Address`).set("A Address"));
  await test("1_3", "USER_A tries to add Email", false, authA.ref(`PublicCustomers/01001/Email`).set("a@a.com"));
  await test("1_4", "USER_A tries to add addresses", false, authA.ref(`PublicCustomers/01001/addresses`).set([]));
  await test("1_5", "USER_A tries to add Zone", false, authA.ref(`PublicCustomers/01001/Zone`).set("Z1"));
  await test("1_6", "USER_A tries to add zone", false, authA.ref(`PublicCustomers/01001/zone`).set("z1"));

  console.log("=== 2. OWNER FILLING MISSING FIELDS ===");
  await test("2_1", "USER_B fills Name", true, authB.ref(`PublicCustomers/01001/Name`).set("B Name"));
  await test("2_2", "USER_B fills Address", true, authB.ref(`PublicCustomers/01001/Address`).set("B Address"));
  await test("2_3", "USER_B fills Email", true, authB.ref(`PublicCustomers/01001/Email`).set("b@b.com"));
  await test("2_4", "USER_B fills addresses", true, authB.ref(`PublicCustomers/01001/addresses`).set([{id:"1",fullAddress:"F",zone:"Z"}]));
  await test("2_5", "USER_B fills Zone", true, authB.ref(`PublicCustomers/01001/Zone`).set("Z2"));

  console.log("=== 3. TOTALORDERS TEST ===");
  await test("3_1", "USER_A sets TotalOrders", false, authA.ref(`PublicCustomers/01001/TotalOrders`).set(0));
  await test("3_2", "USER_B sets TotalOrders", true, authB.ref(`PublicCustomers/01001/TotalOrders`).set(0));

  console.log("=== 4. EXISTING OWNER UPDATE TESTS ===");
  await test("4_1", "USER_B updates Name", true, authB.ref(`PublicCustomers/01001/Name`).set("B Name updated"));
  await test("4_2", "USER_B updates addresses nested", true, authB.ref(`PublicCustomers/01001/addresses/0/label`).set("Home"));

  console.log("=== 5. COMPLETE CROSS-USER BLOCK ===");
  await authA.ref(`PublicCustomers/01002`).update({ uid: "USER_A", Phone: "01002", Name: "A", TotalOrders: 0 });
  await test("5_1", "USER_B reads A", false, authB.ref(`PublicCustomers/01002`).once("value"));
  await test("5_2", "USER_B modifies A Name", false, authB.ref(`PublicCustomers/01002/Name`).set("Hack"));
  await test("5_3", "USER_B changes UID", false, authB.ref(`PublicCustomers/01002/uid`).set("USER_B"));
  await test("5_4", "USER_B adds arbitrary field", false, authB.ref(`PublicCustomers/01002/HACK`).set(true));

  await testEnv.cleanup();
}
runTests();

