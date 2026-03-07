/**
 * accumulatedTests.ts
 * Extracts individual assert() lines from a generated test file and stores
 * them permanently. On each new revision, ALL historic asserts are included
 * in the test file — preventing regression.
 */
import { db }                              from "./db";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function save_list_string_test_assertions_to_sqlite_for_string_app_name(
  string_app_name:             string,
  list_string_test_assertions: string[],
  int_revision:                number
): void {
  init_fn_debug_log_for_string_function_name(
    "save_list_string_test_assertions_to_sqlite_for_string_app_name",
    { string_app_name, int_count: list_string_test_assertions.length }
  );
  const stmt = db.prepare(`
    INSERT INTO accumulated_tests (string_app_name, string_test_assertion, int_added_at_revision, string_timestamp)
    VALUES (?, ?, ?, ?)
  `);
  for (const string_assertion of list_string_test_assertions) {
    stmt.run(string_app_name, string_assertion, int_revision, get_string_current_iso_timestamp());
  }
  exit_fn_debug_log_for_string_function_name(
    "save_list_string_test_assertions_to_sqlite_for_string_app_name"
  );
}

export function load_list_string_all_test_assertions_from_sqlite_for_string_app_name(
  string_app_name: string
): string[] {
  init_fn_debug_log_for_string_function_name(
    "load_list_string_all_test_assertions_from_sqlite_for_string_app_name",
    { string_app_name }
  );
  const list_rows = db.prepare(`
    SELECT DISTINCT string_test_assertion FROM accumulated_tests
    WHERE string_app_name = ?
    ORDER BY int_id ASC
  `).all(string_app_name) as { string_test_assertion: string }[];
  const list_string_assertions = list_rows.map((r) => r.string_test_assertion);
  exit_fn_debug_log_for_string_function_name(
    "load_list_string_all_test_assertions_from_sqlite_for_string_app_name",
    { int_count: list_string_assertions.length }
  );
  return list_string_assertions;
}

export function extract_list_string_assert_lines_from_string_test_code(
  string_test_code: string
): string[] {
  init_fn_debug_log_for_string_function_name("extract_list_string_assert_lines_from_string_test_code");
  const list_string_lines = string_test_code.split("\n");
  const list_string_asserts = list_string_lines
    .map((s) => s.trim())
    .filter((s) => s.startsWith("assert.") || s.startsWith("assert("));
  exit_fn_debug_log_for_string_function_name("extract_list_string_assert_lines_from_string_test_code", {
    int_asserts_found: list_string_asserts.length,
  });
  return list_string_asserts;
}

export function build_string_full_test_file_from_string_app_path_and_list_string_assertions(
  string_app_file_path:        string,
  list_string_assertions:      string[]
): string {
  init_fn_debug_log_for_string_function_name(
    "build_string_full_test_file_from_string_app_path_and_list_string_assertions",
    { int_assertions: list_string_assertions.length }
  );
  const string_test_file = `const assert = require("assert");
const app = require("${string_app_file_path.replace(/\\/g, "/")}");

// Accumulated regression tests (auto-generated, never manually edited)
${list_string_assertions.join("\n")}

console.log("All ${list_string_assertions.length} assertions passed.");
`;
  exit_fn_debug_log_for_string_function_name(
    "build_string_full_test_file_from_string_app_path_and_list_string_assertions"
  );
  return string_test_file;
}
