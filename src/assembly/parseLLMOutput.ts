/**
 * parseLLMOutput.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Parses raw LLM output (new.js) into individual function/global chunks.
 * Also detects [OBSOLETE: functionName] tags the LLM may emit.
 *
 * LLM is instructed to output ONLY changed/new functions — never the full file.
 * Each function body is extracted and returned as a discrete unit.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { get_dict_function_map_from_string_js_code, TDictFunctionInfo } from "../context/codeAnalyzer";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export type TDictParsedLLMOutput = {
  list_dict_new_or_updated_functions: TDictFunctionInfo[];
  list_string_global_lines:           string[];
  list_string_obsolete_names:         string[];
};

export function parse_dict_llm_output_from_string_new_js(
  string_new_js: string
): TDictParsedLLMOutput {
  init_fn_debug_log_for_string_function_name("parse_dict_llm_output_from_string_new_js", {
    int_chars: string_new_js.length,
  });

  // Extract [OBSOLETE: funcName] markers
  const list_string_obsolete_names: string[] = [];
  const regex_obsolete = /\[OBSOLETE:\s*(\w+)\]/g;
  let match_obsolete: RegExpExecArray | null;
  while ((match_obsolete = regex_obsolete.exec(string_new_js)) !== null) {
    list_string_obsolete_names.push(match_obsolete[1]);
  }

  // Strip obsolete markers + comments before parsing
  const string_clean = string_new_js
    .replace(/\/\/.*\[OBSOLETE.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Extract named functions
  const dict_fn_map = get_dict_function_map_from_string_js_code(string_clean);
  const list_dict_new_or_updated_functions = Object.values(dict_fn_map);

  // Extract global lines (top-level const/let/var not inside any function)
  const list_string_global_lines = extract_list_string_global_lines_from_string_code(string_clean);

  exit_fn_debug_log_for_string_function_name("parse_dict_llm_output_from_string_new_js", {
    int_functions_parsed:  list_dict_new_or_updated_functions.length,
    int_globals_parsed:    list_string_global_lines.length,
    int_obsolete_found:    list_string_obsolete_names.length,
    list_string_fn_names:  list_dict_new_or_updated_functions.map((f) => f.string_name).join(","),
    list_string_obsolete:  list_string_obsolete_names.join(","),
  });

  return {
    list_dict_new_or_updated_functions,
    list_string_global_lines,
    list_string_obsolete_names,
  };
}

function extract_list_string_global_lines_from_string_code(string_code: string): string[] {
  init_fn_debug_log_for_string_function_name("extract_list_string_global_lines_from_string_code");
  const list_string_global_lines: string[] = [];
  const list_string_lines = string_code.split("\n");
  const regex_global = /^(?:const|let|var)\s+\w/;
  let bool_in_function = false;
  let int_brace_depth  = 0;

  for (const string_line of list_string_lines) {
    const int_open  = (string_line.match(/{/g) ?? []).length;
    const int_close = (string_line.match(/}/g) ?? []).length;

    if (!bool_in_function && /^(?:async\s+)?function\s+\w|^(?:const|let)\s+\w+\s*=\s*(?:async\s+)?(?:function|\()/.test(string_line)) {
      bool_in_function = true;
    }

    if (!bool_in_function && regex_global.test(string_line.trim())) {
      list_string_global_lines.push(string_line.trim());
    }

    if (bool_in_function) {
      int_brace_depth += int_open - int_close;
      if (int_brace_depth <= 0) { bool_in_function = false; int_brace_depth = 0; }
    }
  }

  exit_fn_debug_log_for_string_function_name("extract_list_string_global_lines_from_string_code", {
    int_count: list_string_global_lines.length,
  });
  return list_string_global_lines;
}
