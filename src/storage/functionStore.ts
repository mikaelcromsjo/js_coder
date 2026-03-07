/**
 * functionStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Source of truth for all functions. Each function is stored individually.
 * app.js is assembled FROM this store, never the other way around.
 *
 * Row types:
 *   type=function  → a named function body
 *   type=global    → top-level const/let/var outside any function
 *   type=exports   → auto-rebuilt on assembly, never stored manually
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { db }                              from "./db";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export type TDictStoredFunction = {
  string_name:        string;
  string_body:        string;
  string_type:        "function" | "global";
  bool_obsolete:      boolean;
  int_revision:       number;
  string_app_name:    string;
  string_timestamp:   string;
};

export function initialise_function_store_sqlite_table(): void {
  init_fn_debug_log_for_string_function_name("initialise_function_store_sqlite_table");
  db.exec(`
    CREATE TABLE IF NOT EXISTS function_store (
      string_app_name   TEXT,
      string_name       TEXT,
      string_body       TEXT,
      string_type       TEXT DEFAULT 'function',
      bool_obsolete     INTEGER DEFAULT 0,
      int_revision      INTEGER,
      string_timestamp  TEXT,
      PRIMARY KEY (string_app_name, string_name)
    );
  `);
  exit_fn_debug_log_for_string_function_name("initialise_function_store_sqlite_table");
}

export function upsert_dict_function_to_store(
  string_app_name: string,
  string_name:     string,
  string_body:     string,
  string_type:     "function" | "global",
  int_revision:    number,
  bool_obsolete:   boolean = false
): void {
  init_fn_debug_log_for_string_function_name("upsert_dict_function_to_store", {
    string_app_name, string_name, string_type, bool_obsolete, int_revision,
  });
  db.prepare(`
    INSERT INTO function_store
      (string_app_name, string_name, string_body, string_type, bool_obsolete, int_revision, string_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(string_app_name, string_name) DO UPDATE SET
      string_body     = excluded.string_body,
      string_type     = excluded.string_type,
      bool_obsolete   = excluded.bool_obsolete,
      int_revision    = excluded.int_revision,
      string_timestamp= excluded.string_timestamp
  `).run(
    string_app_name, string_name, string_body, string_type,
    bool_obsolete ? 1 : 0, int_revision, get_string_current_iso_timestamp()
  );
  exit_fn_debug_log_for_string_function_name("upsert_dict_function_to_store", { string_name });
}

export function mark_string_function_obsolete_in_store(
  string_app_name: string,
  string_name:     string
): void {
  init_fn_debug_log_for_string_function_name("mark_string_function_obsolete_in_store", { string_app_name, string_name });
  db.prepare(`
    UPDATE function_store SET bool_obsolete = 1 WHERE string_app_name = ? AND string_name = ?
  `).run(string_app_name, string_name);
  exit_fn_debug_log_for_string_function_name("mark_string_function_obsolete_in_store");
}

export function load_list_dict_active_functions_from_store(
  string_app_name: string
): TDictStoredFunction[] {
  init_fn_debug_log_for_string_function_name("load_list_dict_active_functions_from_store", { string_app_name });
  const list_rows = db.prepare(`
    SELECT * FROM function_store
    WHERE string_app_name = ? AND bool_obsolete = 0
    ORDER BY string_type DESC, string_name ASC
  `).all(string_app_name) as TDictStoredFunction[];
  exit_fn_debug_log_for_string_function_name("load_list_dict_active_functions_from_store", {
    int_count: list_rows.length,
  });
  return list_rows;
}

export function load_list_dict_all_functions_from_store(
  string_app_name: string
): TDictStoredFunction[] {
  init_fn_debug_log_for_string_function_name("load_list_dict_all_functions_from_store", { string_app_name });
  const list_rows = db.prepare(`
    SELECT * FROM function_store WHERE string_app_name = ? ORDER BY string_name ASC
  `).all(string_app_name) as TDictStoredFunction[];
  exit_fn_debug_log_for_string_function_name("load_list_dict_all_functions_from_store", { int_count: list_rows.length });
  return list_rows;
}
