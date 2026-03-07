import Database from "better-sqlite3";
import path     from "path";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

const string_db_file_path = path.resolve(process.env.DB_PATH ?? "./agef.db");
export const db = new Database(string_db_file_path);

export function initialise_all_sqlite_database_tables(): void {
  init_fn_debug_log_for_string_function_name("initialise_all_sqlite_database_tables", { string_db_file_path });
  db.exec(`
    CREATE TABLE IF NOT EXISTS revisions (
      int_revision            INTEGER PRIMARY KEY,
      string_app_name         TEXT,
      string_js_code          TEXT,
      string_prompt           TEXT,
      string_context_snapshot TEXT,
      string_timestamp        TEXT
    );
    CREATE TABLE IF NOT EXISTS prompts (
      int_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      string_agent_name       TEXT,
      string_model_name       TEXT,
      string_prompt_sent      TEXT,
      string_llm_response     TEXT,
      string_timestamp        TEXT
    );
    CREATE TABLE IF NOT EXISTS test_results (
      int_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      int_revision            INTEGER,
      bool_passed             INTEGER,
      string_stdout           TEXT,
      string_error_message    TEXT,
      string_timestamp        TEXT
    );
    CREATE TABLE IF NOT EXISTS refactor_log (
      int_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      int_from_revision       INTEGER,
      int_to_revision         INTEGER,
      string_reason           TEXT,
      string_timestamp        TEXT
    );
    CREATE TABLE IF NOT EXISTS function_embeddings (
      string_app_name         TEXT,
      int_revision            INTEGER,
      string_function_name    TEXT,
      string_embedding_json   TEXT,
      string_fn_body          TEXT,
      string_timestamp        TEXT,
      PRIMARY KEY (string_app_name, int_revision, string_function_name)
    );
    CREATE TABLE IF NOT EXISTS accumulated_tests (
      int_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      string_app_name         TEXT,
      string_test_assertion   TEXT,
      int_added_at_revision   INTEGER,
      string_timestamp        TEXT
    );
  `);
  exit_fn_debug_log_for_string_function_name("initialise_all_sqlite_database_tables", { string_status: "ok" });
}
