import chalk from "chalk";
import {
  int_max_heal_attempts,
  int_current_revision_number,
  string_last_test_error_message,
  bool_last_test_passed,
  string_current_app_name,
  set_int_current_heal_attempt_number,
  increment_int_current_revision_number,
  set_string_last_generated_js_code,
} from "../state";
import { run_string_refactor_agent_on_string_js_code_and_string_critique } from "../agents/refactorAgent";
import { run_bool_test_on_string_test_file_path }                          from "../tester/runTest";
import { write_string_js_code_to_disk_at_global_output_path }              from "../utils/fileWriter";
import { save_revision_to_sqlite_for_int_revision_number }                 from "../storage/saveRevision";
import { save_refactor_log_to_sqlite_from_int_revision_to_int_revision }   from "../storage/saveRefactorLog";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function trigger_self_heal_loop_on_string_js_code_and_string_test_path(
  string_js_code:      string,
  string_test_path:    string
): Promise<string> {
  init_fn_debug_log_for_string_function_name("trigger_self_heal_loop_on_string_js_code_and_string_test_path", {
    int_code_chars: string_js_code.length, string_test_path,
  });

  let string_current_code = string_js_code;
  let int_attempt         = 0;

  while (!bool_last_test_passed && int_attempt < int_max_heal_attempts) {
    int_attempt++;
    set_int_current_heal_attempt_number(int_attempt);
    console.log(chalk.yellow(`  🔧 Heal ${int_attempt}/${int_max_heal_attempts}`));

    const int_from = int_current_revision_number;

    string_current_code = await run_string_refactor_agent_on_string_js_code_and_string_critique(
      string_current_code,
      `TEST FAILED: ${string_last_test_error_message}`
    );

    set_string_last_generated_js_code(string_current_code);
    write_string_js_code_to_disk_at_global_output_path(string_current_code);
    increment_int_current_revision_number();

    save_revision_to_sqlite_for_int_revision_number(
      int_current_revision_number, string_current_app_name,
      string_current_code, `[HEAL-${int_attempt}] ${string_last_test_error_message}`
    );
    save_refactor_log_to_sqlite_from_int_revision_to_int_revision(
      int_from, int_current_revision_number, `Heal-${int_attempt}: ${string_last_test_error_message}`
    );

    run_bool_test_on_string_test_file_path(string_test_path);
    if (bool_last_test_passed) console.log(chalk.green(`  ✅ Healed at attempt ${int_attempt}`));
  }

  exit_fn_debug_log_for_string_function_name("trigger_self_heal_loop_on_string_js_code_and_string_test_path", {
    bool_last_test_passed, int_attempt,
  });
  return string_current_code;
}
