import { db }                              from "./db";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function save_refactor_log_to_sqlite_from_int_revision_to_int_revision(
  int_from_revision: number,
  int_to_revision:   number,
  string_reason:     string
): void {
  init_fn_debug_log_for_string_function_name("save_refactor_log_to_sqlite_from_int_revision_to_int_revision", {
    int_from_revision, int_to_revision, string_reason,
  });
  db.prepare(`
    INSERT INTO refactor_log
      (int_from_revision, int_to_revision, string_reason, string_timestamp)
    VALUES (?, ?, ?, ?)
  `).run(int_from_revision, int_to_revision, string_reason, get_string_current_iso_timestamp());
  exit_fn_debug_log_for_string_function_name("save_refactor_log_to_sqlite_from_int_revision_to_int_revision");
}
