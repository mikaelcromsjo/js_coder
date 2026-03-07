/**
 * applyLLMOutput.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full update cycle after receiving LLM output:
 *   1. Parse new.js into function/global/obsolete chunks
 *   2. Upsert each new/changed function to function store
 *   3. Mark obsolete functions in store
 *   4. Re-embed ONLY the new/changed functions (not the whole app)
 *   5. Rebuild app.js from store
 *   6. Write new.js (diff) and app.js (assembled) to disk
 * ─────────────────────────────────────────────────────────────────────────────
 */
import path  from "path";
import chalk from "chalk";
import {
  parse_dict_llm_output_from_string_new_js,
} from "./parseLLMOutput";
import {
  upsert_dict_function_to_store,
  mark_string_function_obsolete_in_store,
} from "../storage/functionStore";
import {
  build_string_app_js_from_store_for_string_app_name,
} from "./assembleApp";
import {
  get_list_float_embedding_for_string_text,
} from "../embeddings/embeddingClient";
import {
  dict_string_fn_name_to_list_float_embedding,
} from "../embeddings/functionEmbeddingStore";
import { db }                                 from "../storage/db";
import { get_string_current_iso_timestamp }   from "../utils/time";
import { write_string_content_to_string_file_path } from "../utils/fileWriter";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export type TDictApplyResult = {
  string_app_js:              string;
  list_string_updated_names:  string[];
  list_string_obsolete_names: string[];
  int_functions_reembedded:   number;
};

export async function apply_string_llm_output_and_rebuild_app_for_string_app_name(
  string_new_js:     string,
  string_app_name:   string,
  int_revision:      number,
  string_output_dir: string
): Promise<TDictApplyResult> {
  init_fn_debug_log_for_string_function_name(
    "apply_string_llm_output_and_rebuild_app_for_string_app_name",
    { string_app_name, int_revision, int_new_js_chars: string_new_js.length }
  );

  // ── 1. Write new.js (LLM diff output) to disk ─────────────────────────────
  const string_new_js_path = path.join(string_output_dir, "new.js");
  write_string_content_to_string_file_path(string_new_js_path, string_new_js);
  console.log(chalk.gray(`  ✍  new.js written → ${string_new_js_path}`));

  // ── 2. Parse new.js into chunks ────────────────────────────────────────────
  const dict_parsed = parse_dict_llm_output_from_string_new_js(string_new_js);

  // ── 3. Upsert each changed/new function to store ───────────────────────────
  const list_string_updated_names: string[] = [];
  for (const dict_fn_info of dict_parsed.list_dict_new_or_updated_functions) {
    upsert_dict_function_to_store(
      string_app_name, dict_fn_info.string_name, dict_fn_info.string_body,
      "function", int_revision
    );
    list_string_updated_names.push(dict_fn_info.string_name);
  }

  // Upsert globals
  for (const string_global_line of dict_parsed.list_string_global_lines) {
    const string_global_key = `__global_${string_global_line.slice(0, 40).replace(/\s+/g, "_")}`;
    upsert_dict_function_to_store(
      string_app_name, string_global_key, string_global_line, "global", int_revision
    );
  }

  // ── 4. Mark obsolete functions ─────────────────────────────────────────────
  for (const string_obsolete_name of dict_parsed.list_string_obsolete_names) {
    mark_string_function_obsolete_in_store(string_app_name, string_obsolete_name);
    // Remove from in-memory embedding cache
    delete dict_string_fn_name_to_list_float_embedding[string_obsolete_name];
  }

  // ── 5. Re-embed ONLY new/changed functions ─────────────────────────────────
  let int_functions_reembedded = 0;
  const stmt_embed = db.prepare(`
    INSERT OR REPLACE INTO function_embeddings
      (string_app_name, int_revision, string_function_name, string_embedding_json, string_fn_body, string_timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const dict_fn_info of dict_parsed.list_dict_new_or_updated_functions) {
    try {
      const string_embed_text = [
        `function: ${dict_fn_info.string_name}`,
        `body: ${dict_fn_info.string_body}`,
        `vars: ${dict_fn_info.list_string_vars_used.join(", ")}`,
        `calls: ${dict_fn_info.list_string_functions_called.join(", ")}`,
      ].join("\n");

      const list_float_vector = await get_list_float_embedding_for_string_text(string_embed_text);
      dict_string_fn_name_to_list_float_embedding[dict_fn_info.string_name] = list_float_vector;

      stmt_embed.run(
        string_app_name, int_revision, dict_fn_info.string_name,
        JSON.stringify(list_float_vector), dict_fn_info.string_body,
        get_string_current_iso_timestamp()
      );
      int_functions_reembedded++;
      console.log(chalk.gray(`  🔢 embedded: ${dict_fn_info.string_name}`));
    } catch (error: unknown) {
      const string_error = error instanceof Error ? error.message : String(error);
      error_fn_debug_log_for_string_function_name(
        "apply_string_llm_output_and_rebuild_app_for_string_app_name",
        `embed failed for ${dict_fn_info.string_name}: ${string_error}`
      );
    }
  }

  // ── 6. Rebuild app.js from store ───────────────────────────────────────────
  const string_app_js = build_string_app_js_from_store_for_string_app_name(string_app_name);
  const string_app_js_path = path.join(string_output_dir, "app.js");
  write_string_content_to_string_file_path(string_app_js_path, string_app_js);
  console.log(chalk.gray(`  📦 app.js assembled → ${string_app_js_path}`));

  exit_fn_debug_log_for_string_function_name(
    "apply_string_llm_output_and_rebuild_app_for_string_app_name",
    {
      int_updated:          list_string_updated_names.length,
      int_obsolete:         dict_parsed.list_string_obsolete_names.length,
      int_reembedded:       int_functions_reembedded,
      list_string_updated:  list_string_updated_names.join(","),
    }
  );

  return {
    string_app_js,
    list_string_updated_names,
    list_string_obsolete_names: dict_parsed.list_string_obsolete_names,
    int_functions_reembedded,
  };
}
