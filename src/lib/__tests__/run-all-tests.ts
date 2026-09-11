import { runApiBoundaryTestSuite } from './api.test';
import { runFullStackIntegrationTestSuite } from './e2e.test';
import { runRubricsTestSuite } from './unit-rubrics.test';
import { runGovernorTestSuite } from './unit-governor.test';
import { runIframeBridgeTestSuite } from './unit-iframe-bridge.test';

async function main() {
  console.log("=== EXECUTING AUTOMATED REGRESSION TEST SUITE ===");
  try {
    runRubricsTestSuite();
    runGovernorTestSuite();
    runIframeBridgeTestSuite();
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
