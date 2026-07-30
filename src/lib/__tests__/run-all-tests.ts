import { runApiBoundaryTestSuite } from './api.test';
import { runFullStackIntegrationTestSuite } from './e2e.test';

async function main() {
  console.log("=== EXECUTING AUTOMATED REGRESSION TEST SUITE ===");
  try {
    runApiBoundaryTestSuite();
    runFullStackIntegrationTestSuite();
    console.log("=== ALL TEST SUITES PASSED SUCCESSFULLY (0 FAILURES) ===");
    process.exit(0);
  } catch (err: unknown) {
    console.error("!!! TEST FAILURE !!!", err);
    process.exit(1);
  }
}

main();
