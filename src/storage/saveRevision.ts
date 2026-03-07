import { db }                                from "./db";
import { get_string_full_context_for_llm_injection } from "../context";
import { get_string_current_iso_timestamp }   from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function save_revision_to_sqlite_for_int_revision_number(
  int_revision:      number,
  string_app_name:   string,
  string_js_code:    string,
  string_prompt_used: string
): void {
  init_fn_debug_log_for_string_function_name("save_revision_to_sqlite_for_int_revision_number", {
    int_revision, string_app_name, int_code_chars: string_js_code.length,
  });
  db.prepare(`
    INSERT OR REPLACE INTO revisions
      (int_revision, string_app_name, string_js_code, string_prompt, string_context_snapshot, string_timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    int_revision, string_app_name, string_js_code,
    string_prompt_used,
    get_string_full_context_for_llm_injection(),
    get_string_current_iso_timestamp()
  );
  exit_fn_debug_log_for_string_function_name("save_revision_to_sqlite_for_int_revision_number", { int_revision });
}

export function load_string_js_code_from_sqlite_by_int_revision(int_revision: number): string {
  init_fn_debug_log_for_string_function_name("load_string_js_code_from_sqlite_by_int_revision", { int_revision });
  const row = db
    .prepare("SELECT string_js_code FROM revisions WHERE int_revision = ?")
    .get(int_revision) as { string_js_code: string } | undefined;
  exit_fn_debug_log_for_string_function_name("load_string_js_code_from_sqlite_by_int_revision", { bool_found: !!row });
  return row?.string_js_code ?? "";
}

export function get_int_max_revision_for_string_app_name(string_app_name: string): number {
  init_fn_debug_log_for_string_function_name("get_int_max_revision_for_string_app_name", { string_app_name });
  const row = db
    .prepare("SELECT MAX(int_revision) as int_max FROM revisions WHERE string_app_name = ?")
    .get(string_app_name) as { int_max: number | null } | undefined;
  const int_max = row?.int_max ?? 0;
  exit_fn_debug_log_for_string_function_name("get_int_max_revision_for_string_app_name", { int_max });
  return int_max;
}

export function get_list_dict_revision_history_for_string_app_name(string_app_name: string): {
  int_revision: number; string_prompt: string; string_timestamp: string;
}[] {
  init_fn_debug_log_for_string_function_name("get_list_dict_revision_history_for_string_app_name", { string_app_name });
  return db
    .prepare("SELECT int_revision, string_prompt, string_timestamp FROM revisions WHERE string_app_name = ? ORDER BY int_revision ASC")
    .all(string_app_name) as { int_revision: number; string_prompt: string; string_timestamp: string }[];
}
