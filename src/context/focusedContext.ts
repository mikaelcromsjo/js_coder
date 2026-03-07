/**
 * focusedContext.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a FOCUSED context string for a specific set of target functions.
 * Instead of injecting the full app code, injects only:
 *   - The target function(s) full body
 *   - Functions directly called by the target(s)
 *   - Global variables referenced by the target(s)
 *   - Total function list (names only)
 * This keeps token count minimal while giving the LLM exactly what it needs.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  get_dict_function_map_from_string_js_code,
  get_list_string_all_function_names_from_string_js_code,
} from "./codeAnalyzer";
import { get_string_full_context_for_llm_injection } from "../context";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function get_string_focused_context_for_list_string_target_functions(
  string_js_code:                  string,
  list_string_target_function_names: string[],
  string_instruction:              string
): string {
  init_fn_debug_log_for_string_function_name(
    "get_string_focused_context_for_list_string_target_functions",
    { list_string_target_function_names: list_string_target_function_names.join(","), string_instruction }
  );

  const dict_fn_map      = get_dict_function_map_from_string_js_code(string_js_code);
  const list_string_all  = get_list_string_all_function_names_from_string_js_code(string_js_code);
  const string_base_ctx  = get_string_full_context_for_llm_injection();

  // Collect target functions + their direct callees
  const set_string_relevant = new Set<string>(list_string_target_function_names);
  for (const string_target of list_string_target_function_names) {
    const dict_fn_info = dict_fn_map[string_target];
    if (dict_fn_info) {
      dict_fn_info.list_string_functions_called.forEach((s) => set_string_relevant.add(s));
    }
  }

  // Build focused code block — only relevant function bodies
  const list_string_relevant_bodies = [...set_string_relevant]
    .filter((string_name) => dict_fn_map[string_name])
    .map((string_name) => {
      const dict_info = dict_fn_map[string_name];
      const string_tag = list_string_target_function_names.includes(string_name)
        ? "← TARGET"
        : "← DEPENDENCY";
      return `// ${string_tag}: ${string_name} (line ${dict_info.int_line_start})\n${dict_info.string_body}`;
    })
    .join("\n\n");

  // Collect all global vars referenced by targets
  const list_string_all_vars_referenced = [...set_string_relevant]
    .filter((string_name) => dict_fn_map[string_name])
    .flatMap((string_name) => dict_fn_map[string_name].list_string_vars_used)
    .filter((v) => !list_string_all.includes(v));
  const list_string_unique_vars = [...new Set(list_string_all_vars_referenced)];

  const string_focused_context = `
${string_base_ctx}

=== FOCUSED CONTEXT FOR: "${string_instruction}" ===
target_functions : ${list_string_target_function_names.join(", ")}
all_functions    : ${list_string_all.join(", ")}
vars_referenced  : ${list_string_unique_vars.join(", ") || "none"}

RELEVANT CODE:
${list_string_relevant_bodies || "(no matching functions found — apply instruction to full code)"}
=== END FOCUSED CONTEXT ===`.trim();

  exit_fn_debug_log_for_string_function_name(
    "get_string_focused_context_for_list_string_target_functions",
    {
      int_context_chars:   string_focused_context.length,
      int_relevant_fns:    set_string_relevant.size,
      int_vars_referenced: list_string_unique_vars.length,
    }
  );
  return string_focused_context;
}
