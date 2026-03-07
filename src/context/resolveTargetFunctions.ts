/**
 * resolveTargetFunctions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full resolution pipeline with embeddings + context levels:
 *
 * Step 1: embed the instruction
 * Step 2: cosine similarity against all function embeddings → ranked list
 * Step 3: fallback to keyword/LLM match if embedding store is empty
 * Step 4: build focused context based on int_context_level:
 *   level 1 → top 1-2 matches only (minimal tokens)
 *   level 2 → top matches + their call-dependencies + neighbours
 *   level 3 → full code injected (maximum context)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { load_list_dict_active_functions_from_store } from "../storage/functionStore";
import { string_current_app_name }                    from "../state";
import {
  get_list_string_target_function_names_from_string_instruction,
  get_string_target_function_resolution_prompt_for_string_instruction,
  parse_list_string_function_names_from_string_llm_reply,
} from "./promptAnalyzer";
import { get_string_focused_context_for_list_string_target_functions }           from "./focusedContext";
import { get_list_string_all_function_names_from_string_js_code }                from "./codeAnalyzer";
import { get_string_full_context_for_llm_injection }                             from "../context";
import { call_string_llm_for_string_agent_with_string_model }                    from "../utils/llmCall";
import { dict_string_agent_name_to_string_model_name, int_context_level }        from "../state";
import {
  dict_string_fn_name_to_list_float_embedding,
} from "../embeddings/functionEmbeddingStore";
import { get_list_float_embedding_for_string_text }                              from "../embeddings/embeddingClient";
import { get_list_string_top_int_n_similar_keys_for_list_float_query_vector }    from "../embeddings/cosineSimilarity";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

function get_int_top_n_for_int_context_level(int_level: number): number {
  const dict_int_level_to_int_top_n: Record<number, number> = { 1: 2, 2: 5, 3: 999 };
  return dict_int_level_to_int_top_n[int_level] ?? 2;
}

export async function get_string_optimized_context_for_string_instruction_and_string_js_code(
  string_instruction: string,
  string_js_code:     string
): Promise<string> {
  init_fn_debug_log_for_string_function_name(
    "get_string_optimized_context_for_string_instruction_and_string_js_code",
    { string_instruction, int_code_chars: string_js_code.length, int_context_level }
  );

  // Level 3 = full code, skip analysis
  if (int_context_level === 3) {
    exit_fn_debug_log_for_string_function_name(
      "get_string_optimized_context_for_string_instruction_and_string_js_code",
      { string_strategy: "level3_full_code" }
    );
    return get_string_full_context_for_llm_injection() + `\n\nFULL CODE:\n${string_js_code}`;
  }

  const list_string_all_fns = get_list_string_all_function_names_from_string_js_code(string_js_code);
  if (list_string_all_fns.length === 0) {
    exit_fn_debug_log_for_string_function_name(
      "get_string_optimized_context_for_string_instruction_and_string_js_code",
      { string_strategy: "no_functions_yet" }
    );
    return get_string_full_context_for_llm_injection();
  }

  const int_top_n = get_int_top_n_for_int_context_level(int_context_level);
  let list_string_targets: string[] = [];

  // ── Strategy A: embedding similarity (primary) ─────────────────────────────
  const bool_embeddings_available =
    Object.keys(dict_string_fn_name_to_list_float_embedding).length > 0;

  if (bool_embeddings_available) {
    try {
      const list_float_query_vector = await get_list_float_embedding_for_string_text(string_instruction);
      list_string_targets = get_list_string_top_int_n_similar_keys_for_list_float_query_vector(
        list_float_query_vector,
        dict_string_fn_name_to_list_float_embedding,
        int_top_n,
        int_context_level === 1 ? 0.45 : 0.25   // stricter threshold for level 1
      );
    } catch (_err) {
      list_string_targets = [];
    }
  }

  // ── Strategy B: keyword/direct match fallback ──────────────────────────────
  if (list_string_targets.length === 0) {
    list_string_targets = get_list_string_target_function_names_from_string_instruction(
      string_instruction, list_string_all_fns
    );
  }

// ── Strategy C: LLM resolution last resort ─────────────────────────────────
  if (list_string_targets.length === 0) {
    const dict_string_fn_name_to_string_body: Record<string, string> = {};
    for (const dict_fn of load_list_dict_active_functions_from_store(string_current_app_name)) {
      dict_string_fn_name_to_string_body[dict_fn.string_name] = dict_fn.string_body;
    }

    const string_resolution_prompt =
      get_string_target_function_resolution_prompt_for_string_instruction(
        string_instruction,
        list_string_all_fns,
        dict_string_fn_name_to_string_body
      );

    const string_llm_reply = await call_string_llm_for_string_agent_with_string_model(
      "context_resolver",
      dict_string_agent_name_to_string_model_name["critic"],
      "Identify which functions from the list are referenced. Reply ONLY with comma-separated exact names.",
      string_resolution_prompt
    );

    list_string_targets = parse_list_string_function_names_from_string_llm_reply(
      string_llm_reply, list_string_all_fns
    );
  }

  // ── Final fallback: inject full code ──────────────────────────────────────
  if (list_string_targets.length === 0) {
    exit_fn_debug_log_for_string_function_name(
      "get_string_optimized_context_for_string_instruction_and_string_js_code",
      { string_strategy: "full_code_fallback" }
    );
    return get_string_full_context_for_llm_injection() + `\n\nFULL CODE:\n${string_js_code}`;
  }

  const string_focused = get_string_focused_context_for_list_string_target_functions(
    string_js_code, list_string_targets, string_instruction
  );

  exit_fn_debug_log_for_string_function_name(
    "get_string_optimized_context_for_string_instruction_and_string_js_code",
    { string_strategy: `embedding_level${int_context_level}`, list_string_targets: list_string_targets.join(",") }
  );
  return string_focused;
}
