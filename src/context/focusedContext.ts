/**
 * focusedContext.ts
 * Builds a focused context string for a specific set of target functions.
 * Injects: target bodies, callees up to int_depth levels, global vars,
 * full signature registry, and the instruction last for recency.
 */
import {
  get_dict_function_map_from_string_js_code,
  get_list_string_signature_registry_from_string_js_code,
} from "./codeAnalyzer";
import { get_string_full_context_for_llm_injection } from "../context";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function get_list_string_callees_up_to_depth(
  dict_fn_map: Record<string, any>,
  list_string_seeds: string[],
  int_depth: number
): string[] {
  let list_string_frontier = [...list_string_seeds];
  let list_string_visited  = [...list_string_seeds];
  let int_current_depth    = 0;

  while (int_current_depth < int_depth && list_string_frontier.length > 0) {
    const list_string_next: string[] = [];
    for (const string_name of list_string_frontier) {
      const dict_fn_info = dict_fn_map[string_name];
      if (!dict_fn_info) continue;
      const list_string_called = dict_fn_info.list_string_functions_called ?? [];
      for (const string_callee of list_string_called) {
        if (!list_string_visited.includes(string_callee)) {
          list_string_visited.push(string_callee);
          list_string_next.push(string_callee);
        }
      }
    }
    list_string_frontier  = list_string_next;
    int_current_depth    += 1;
  }

  return list_string_visited;
}

function get_int_context_depth_from_env(): number {
  const str_raw = process.env.CONTEXT_DEPTH;
  if (!str_raw) return 2;
  const int_parsed = parseInt(str_raw, 10);
  if (!Number.isInteger(int_parsed) || int_parsed < 1) {
    throw new Error(`CONTEXT_DEPTH must be a positive integer, got: "${str_raw}"`);
  }
  return int_parsed;
}

export function get_string_focused_context_for_list_string_target_functions(
  string_js_code: string,
  list_string_target_function_names: string[],
  string_instruction: string,
  int_depth: number = get_int_context_depth_from_env()
  
): string {
  init_fn_debug_log_for_string_function_name(
    "get_string_focused_context_for_list_string_target_functions",
    { list_string_target_function_names: list_string_target_function_names.join(","), string_instruction }
  );

  const dict_fn_map = get_dict_function_map_from_string_js_code(string_js_code);
  const list_string_signatures = get_list_string_signature_registry_from_string_js_code(string_js_code);
  const string_base_ctx = get_string_full_context_for_llm_injection();

  const list_string_relevant = get_list_string_callees_up_to_depth(
    dict_fn_map,
    list_string_target_function_names,
    int_depth
  );

  const list_string_relevant_bodies = list_string_relevant
    .filter((string_name) => dict_fn_map[string_name])
    .map((string_name) => {
      const dict_info = dict_fn_map[string_name];
      const string_tag = list_string_target_function_names.includes(string_name)
        ? "TARGET"
        : "DEPENDENCY";
      return `// [${string_tag}] ${string_name} \n${dict_info.string_body}`;
    })
    .join("\n\n");

  const list_string_all_function_names = Object.keys(dict_fn_map);

  const list_string_vars_raw = list_string_relevant
    .filter((string_name) => dict_fn_map[string_name])
    .flatMap((string_name) => dict_fn_map[string_name].list_string_vars_used)
    .filter((string_var) => !list_string_all_function_names.includes(string_var));

  const list_string_unique_vars = list_string_vars_raw.filter(
    (string_var, int_index) => list_string_vars_raw.indexOf(string_var) === int_index
  );

  const string_focused_context = `
${string_base_ctx}

=== SIGNATURE REGISTRY (all functions — do not duplicate these) ===
${list_string_signatures.join("\n")}
=== END REGISTRY ===

=== FOCUSED CONTEXT ===
targets          : ${list_string_target_function_names.join(", ")}
dependency_depth : ${int_depth}
vars_referenced  : ${list_string_unique_vars.join(", ") || "none"}

RELEVANT CODE:
${list_string_relevant_bodies || "(no matching functions found — apply instruction to full code)"}
=== END FOCUSED CONTEXT ===

INSTRUCTION: ${string_instruction}`.trim();

  exit_fn_debug_log_for_string_function_name(
    "get_string_focused_context_for_list_string_target_functions",
    {
      int_context_chars: string_focused_context.length,
      int_relevant_fns: list_string_relevant.length,
      int_vars_referenced: list_string_unique_vars.length,
      int_depth,
    }
  );

  return string_focused_context;
}
