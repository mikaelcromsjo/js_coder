/**
 * syntaxCheck.ts
 * Fast syntax validation using "node --check file.js" before running tests.
 * Catches parse errors in <10ms — far faster than a full test run.
 */
import { execSync }  from "child_process";
import {
  set_bool_last_syntax_check_passed,
  set_string_last_test_error_message,
} from "../state";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function run_bool_syntax_check_on_string_js_file_path(string_js_file_path: string): boolean {
  init_fn_debug_log_for_string_function_name("run_bool_syntax_check_on_string_js_file_path", { string_js_file_path });
  try {
    execSync(`node --check "${string_js_file_path}"`, { encoding: "utf-8", timeout: 5000 });
    set_bool_last_syntax_check_passed(true);
    exit_fn_debug_log_for_string_function_name("run_bool_syntax_check_on_string_js_file_path", { bool_passed: true });
    return true;
  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("run_bool_syntax_check_on_string_js_file_path", string_error);
    set_bool_last_syntax_check_passed(false);
    set_string_last_test_error_message(`SYNTAX ERROR: ${string_error}`);
    return false;
  }
}
