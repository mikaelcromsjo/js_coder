import { db }                              from "./db";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function save_bool_test_result_to_sqlite_for_int_revision(
  int_revision:          number,
  bool_passed:           boolean,
  string_stdout:         string,
  string_error_message:  string
): void {
  init_fn_debug_log_for_string_function_name("save_bool_test_result_to_sqlite_for_int_revision", {
    int_revision, bool_passed, string_error_message,
  });
  db.prepare(`
    INSERT INTO test_results
      (int_revision, bool_passed, string_stdout, string_error_message, string_timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(int_revision, bool_passed ? 1 : 0, string_stdout, string_error_message, get_string_current_iso_timestamp());
  exit_fn_debug_log_for_string_function_name("save_bool_test_result_to_sqlite_for_int_revision", { bool_passed });
}
