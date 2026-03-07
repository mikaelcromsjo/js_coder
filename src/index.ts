import "dotenv/config";
import { run_cli_from_process_argv } from "./cli";

run_cli_from_process_argv().catch((error: unknown) => {
  console.error("Fatal:", error);
  process.exit(1);
});
