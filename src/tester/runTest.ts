import { execSync }  from "child_process";
import fs            from "fs";
import {
  set_bool_last_test_passed,
  set_string_last_test_error_message,
  set_string_last_test_stdout,
  int_current_revision_number,
} from "../state";
import { save_bool_test_result_to_sqlite_for_int_revision } from "../storage/saveTestResult";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function run_bool_test_on_string_test_file_path(string_test_file_path: string): boolean {
  init_fn_debug_log_for_string_function_name("run_bool_test_on_string_test_file_path", { string_test_file_path });

  if (!fs.existsSync(string_test_file_path)) {
    const string_error = `Test file not found: ${string_test_file_path}`;
    error_fn_debug_log_for_string_function_name("run_bool_test_on_string_test_file_path", string_error);
    set_bool_last_test_passed(false);
    set_string_last_test_error_message(string_error);
    set_string_last_test_stdout("");
    save_bool_test_result_to_sqlite_for_int_revision(int_current_revision_number, false, "", string_error);
    return false;
  }

  try {
    const string_stdout = execSync(`node "${string_test_file_path}"`, { encoding: "utf-8", timeout: 15000 });
    set_bool_last_test_passed(true);
    set_string_last_test_error_message("");
    set_string_last_test_stdout(string_stdout);
    save_bool_test_result_to_sqlite_for_int_revision(int_current_revision_number, true, string_stdout, "");
    exit_fn_debug_log_for_string_function_name("run_bool_test_on_string_test_file_path", { bool_passed: true });
    return true;

  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("run_bool_test_on_string_test_file_path", string_error);
    set_bool_last_test_passed(false);
    set_string_last_test_error_message(string_error);
    set_string_last_test_stdout("");
    save_bool_test_result_to_sqlite_for_int_revision(int_current_revision_number, false, "", string_error);
    return false;
  }
}
