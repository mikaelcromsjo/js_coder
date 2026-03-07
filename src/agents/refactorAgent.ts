/**
 * refactorAgent.ts
 * LLM is told to output ONLY new or changed functions, never the full file.
 * Output goes to new.js. [OBSOLETE: funcName] marks removed functions.
 */
import {
  dict_string_agent_name_to_string_model_name,
  string_formal_spec,
  string_original_requirement,
} from "../state";
import { call_string_llm_for_string_agent_with_string_model }                     from "../utils/llmCall";
import { string_prompt_all_conventions }                                           from "../utils/prompts";
import { get_string_optimized_context_for_string_instruction_and_string_js_code } from "../context/resolveTargetFunctions";
import { get_string_full_context_for_llm_injection }                              from "../context";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_string_refactor_agent_on_string_js_code_and_string_critique(
  string_js_code:           string,
  string_critique_or_error: string
): Promise<string> {
  init_fn_debug_log_for_string_function_name(
    "run_string_refactor_agent_on_string_js_code_and_string_critique",
    { int_code_chars: string_js_code.length, string_critique_or_error }
  );

  const string_model   = dict_string_agent_name_to_string_model_name["refactor"];
  const string_context = string_js_code.length > 0
    ? await get_string_optimized_context_for_string_instruction_and_string_js_code(
        string_critique_or_error, string_js_code
      )
    : get_string_full_context_for_llm_injection();

  const string_system_prompt =
`You are an expert JavaScript developer.
OUTPUT RULES — critical, no exceptions:
- Output ONLY the functions that are NEW or CHANGED. Never output unchanged functions.
- If a function must be removed, write: // [OBSOLETE: functionName]
- Output raw JavaScript only. No markdown. No explanation. No imports. No module.exports.
- Each function must be complete and self-contained.
- If adding a new top-level const/let/var, include it as a single line before the function that uses it.

AUTHORITY ORDER (highest to lowest):
1. RULES — always enforced
2. FORMAL SPEC — defines what must exist and what must be output
3. PLAN — defines intended structure; flag deviations unless spec overrides

ORIGINAL REQUIREMENT: ${string_original_requirement}
FORMAL SPEC:
${string_formal_spec || "(no spec yet)"}

${string_prompt_all_conventions}

${string_context}`;

  const string_user_prompt =
`Current app code (all functions):
${string_js_code}

Instruction / issues:
${string_critique_or_error}

Return ONLY the new or changed function bodies. Nothing else.`;

  const string_result = await call_string_llm_for_string_agent_with_string_model(
    "refactor", string_model, string_system_prompt, string_user_prompt
  );

  exit_fn_debug_log_for_string_function_name(
    "run_string_refactor_agent_on_string_js_code_and_string_critique",
    { int_result_chars: string_result.length, string_preview: string_result.slice(0, 80) }
  );
  return string_result;
}
