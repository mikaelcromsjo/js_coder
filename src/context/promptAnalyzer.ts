/**
 * promptAnalyzer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyses the user instruction string to extract which function name(s)
 * are being targeted. Uses two strategies:
 *   1. Direct match — scans instruction for known function names in the codebase
 *   2. LLM fallback — asks the LLM to identify the target function if no direct match
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function get_list_string_target_function_names_from_string_instruction(
  string_instruction:              string,
  list_string_all_function_names:  string[]
): string[] {
  init_fn_debug_log_for_string_function_name(
    "get_list_string_target_function_names_from_string_instruction",
    { string_instruction, int_total_functions: list_string_all_function_names.length }
  );

  const string_lower_instruction = string_instruction.toLowerCase();

  // Strategy 1: direct name match — check every known function name
  const list_string_direct_matches = list_string_all_function_names.filter(
    (string_fn_name) => string_lower_instruction.includes(string_fn_name.toLowerCase())
  );

  if (list_string_direct_matches.length > 0) {
    exit_fn_debug_log_for_string_function_name(
      "get_list_string_target_function_names_from_string_instruction",
      { strategy: "direct", list_string_direct_matches: list_string_direct_matches.join(",") }
    );
    return list_string_direct_matches;
  }

  // Strategy 2: keyword match — look for words in instruction that partially match function names
  const list_string_instruction_words = string_instruction
    .replace(/[^a-zA-Z0-9_ ]/g, " ")
    .split(" ")
    .filter((s) => s.length > 2);

  const list_string_keyword_matches = list_string_all_function_names.filter(
    (string_fn_name) =>
      list_string_instruction_words.some((string_word) =>
        string_fn_name.toLowerCase().includes(string_word.toLowerCase())
      )
  );

  exit_fn_debug_log_for_string_function_name(
    "get_list_string_target_function_names_from_string_instruction",
    { strategy: "keyword", int_matches: list_string_keyword_matches.length }
  );
  return list_string_keyword_matches;
}

export function get_string_target_function_resolution_prompt_for_string_instruction(
  string_instruction:             string,
  list_string_all_function_names: string[]
): string {
  init_fn_debug_log_for_string_function_name(
    "get_string_target_function_resolution_prompt_for_string_instruction"
  );
  const string_prompt = `Given this user instruction: "${string_instruction}"
And these available functions: ${list_string_all_function_names.join(", ")}
Which function name(s) from the list are being referenced or should be changed?
Reply ONLY with a comma-separated list of exact function names from the list. Nothing else.`;
  exit_fn_debug_log_for_string_function_name(
    "get_string_target_function_resolution_prompt_for_string_instruction",
    { int_prompt_chars: string_prompt.length }
  );
  return string_prompt;
}

export function parse_list_string_function_names_from_string_llm_reply(
  string_llm_reply: string,
  list_string_all_function_names: string[]
): string[] {
  init_fn_debug_log_for_string_function_name(
    "parse_list_string_function_names_from_string_llm_reply",
    { string_llm_reply }
  );
  const list_string_parsed = string_llm_reply
    .split(",")
    .map((s) => s.trim())
    .filter((string_name) => list_string_all_function_names.includes(string_name));

  exit_fn_debug_log_for_string_function_name(
    "parse_list_string_function_names_from_string_llm_reply",
    { int_parsed: list_string_parsed.length }
  );
  return list_string_parsed;
}
