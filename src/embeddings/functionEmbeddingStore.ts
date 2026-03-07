/**
 * functionEmbeddingStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Maintains an in-memory + SQLite embedding store for every function
 * in the generated app.js. On every code revision, all function embeddings
 * are recomputed and stored.
 *
 * Embedding text per function = name + body + vars_used + functions_called
 * This gives the embedding strong semantic signal for retrieval.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { db } from "../storage/db";
import {
  get_dict_function_map_from_string_js_code,
  TDictFunctionInfo,
} from "../context/codeAnalyzer";
import { get_list_float_embedding_for_string_text } from "./embeddingClient";
import { get_string_current_iso_timestamp } from "../utils/time";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

// In-memory cache: function_name → float[] embedding vector
export let dict_string_fn_name_to_list_float_embedding: Record<string, number[]> = {};

export function initialise_function_embeddings_sqlite_table(): void {
  init_fn_debug_log_for_string_function_name("initialise_function_embeddings_sqlite_table");
  db.exec(`
    CREATE TABLE IF NOT EXISTS function_embeddings (
      string_app_name       TEXT,
      int_revision          INTEGER,
      string_function_name  TEXT,
      string_embedding_json TEXT,
      string_fn_body        TEXT,
      string_timestamp      TEXT,
      PRIMARY KEY (string_app_name, int_revision, string_function_name)
    );
  `);
  exit_fn_debug_log_for_string_function_name("initialise_function_embeddings_sqlite_table");
}

function get_string_embedding_text_for_dict_function_info(
  dict_fn_info: TDictFunctionInfo
): string {
  return [
    `function: ${dict_fn_info.string_name}`,
    `body: ${dict_fn_info.string_body}`,
    `vars: ${dict_fn_info.list_string_vars_used.join(", ")}`,
    `calls: ${dict_fn_info.list_string_functions_called.join(", ")}`,
  ].join("\n");
}

export async function update_all_function_embeddings_for_string_js_code_and_int_revision(
  string_js_code:   string,
  string_app_name:  string,
  int_revision:     number
): Promise<void> {
  init_fn_debug_log_for_string_function_name(
    "update_all_function_embeddings_for_string_js_code_and_int_revision",
    { string_app_name, int_revision, int_code_chars: string_js_code.length }
  );

  const dict_fn_map = get_dict_function_map_from_string_js_code(string_js_code);
  const list_string_fn_names = Object.keys(dict_fn_map);

  dict_string_fn_name_to_list_float_embedding = {};

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO function_embeddings
      (string_app_name, int_revision, string_function_name, string_embedding_json, string_fn_body, string_timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const string_fn_name of list_string_fn_names) {
    try {
      const dict_fn_info = dict_fn_map[string_fn_name];
      const string_embed_text = get_string_embedding_text_for_dict_function_info(dict_fn_info);
      const list_float_vector = await get_list_float_embedding_for_string_text(string_embed_text);

      dict_string_fn_name_to_list_float_embedding[string_fn_name] = list_float_vector;

      stmt.run(
        string_app_name,
        int_revision,
        string_fn_name,
        JSON.stringify(list_float_vector),
        dict_fn_info.string_body,
        get_string_current_iso_timestamp()
      );
    } catch (error: unknown) {
      const string_error = error instanceof Error ? error.message : String(error);
      error_fn_debug_log_for_string_function_name(
        "update_all_function_embeddings_for_string_js_code_and_int_revision",
        `fn=${string_fn_name} err=${string_error}`
      );
    }
  }

  exit_fn_debug_log_for_string_function_name(
    "update_all_function_embeddings_for_string_js_code_and_int_revision",
    { int_embedded: Object.keys(dict_string_fn_name_to_list_float_embedding).length }
  );
}

export function load_dict_function_embeddings_from_sqlite_for_string_app_name_and_int_revision(
  string_app_name: string,
  int_revision:    number
): void {
  init_fn_debug_log_for_string_function_name(
    "load_dict_function_embeddings_from_sqlite_for_string_app_name_and_int_revision",
    { string_app_name, int_revision }
  );

  const list_rows = db.prepare(`
    SELECT string_function_name, string_embedding_json
    FROM function_embeddings
    WHERE string_app_name = ? AND int_revision = ?
  `).all(string_app_name, int_revision) as { string_function_name: string; string_embedding_json: string }[];

  dict_string_fn_name_to_list_float_embedding = {};
  for (const row of list_rows) {
    dict_string_fn_name_to_list_float_embedding[row.string_function_name] =
      JSON.parse(row.string_embedding_json) as number[];
  }

  exit_fn_debug_log_for_string_function_name(
    "load_dict_function_embeddings_from_sqlite_for_string_app_name_and_int_revision",
    { int_loaded: list_rows.length }
  );
}
