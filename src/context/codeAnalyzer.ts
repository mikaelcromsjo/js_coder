/**
 * codeAnalyzer.ts
 * Scans generated JS and builds a map of:
 *   function name → { string_body, string_signature, list_string_params,
 *                     list_string_vars_used, list_string_functions_called }
 * Also builds a signature registry for LLM context injection.
 * Uses regex — no external AST dependency required.
 */
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export type TDictFunctionInfo = {
  string_name:                  string;
  string_body:                  string;
  string_signature:             string;
  list_string_params:           string[];
  list_string_vars_used:        string[];
  list_string_functions_called: string[];
  int_line_start:               number;
};

export function get_dict_function_map_from_string_js_code(
  string_js_code: string
): Record<string, TDictFunctionInfo> {
  init_fn_debug_log_for_string_function_name("get_dict_function_map_from_string_js_code", {
    int_code_chars: string_js_code.length,
  });

  const dict_function_map: Record<string, TDictFunctionInfo> = {};
  const list_string_lines = string_js_code.split("\n");
  const regex_fn_start =
    /^(?:async\s+)?function\s+(\w+)\s*\(|^(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\()/;

  let int_brace_depth  = 0;
  let bool_in_function = false;
  let string_fn_name   = "";
  let int_fn_start     = 0;
  let string_fn_body   = "";

  for (let int_i = 0; int_i < list_string_lines.length; int_i++) {
    const string_line = list_string_lines[int_i];

    if (!bool_in_function) {
      const match_fn = string_line.match(regex_fn_start);
      if (match_fn) {
        string_fn_name   = match_fn[1] ?? match_fn[2] ?? "";
        int_fn_start     = int_i + 1;
        string_fn_body   = string_line;
        bool_in_function = true;
        int_brace_depth  =
          (string_line.match(/{/g) ?? []).length -
          (string_line.match(/}/g) ?? []).length;
        if (int_brace_depth <= 0) bool_in_function = false;
        continue;
      }
    }

    if (bool_in_function) {
      string_fn_body  += "\n" + string_line;
      int_brace_depth += (string_line.match(/{/g) ?? []).length;
      int_brace_depth -= (string_line.match(/}/g) ?? []).length;

      if (int_brace_depth <= 0) {
        dict_function_map[string_fn_name] = {
          string_name:                  string_fn_name,
          string_body:                  string_fn_body,
          string_signature:             get_string_signature_from_string_body(string_fn_name, string_fn_body),
          list_string_params:           get_list_string_params_from_string_signature(string_fn_body) ?? [],
          list_string_vars_used:        get_list_string_vars_referenced_in_string_body(string_fn_body) ?? [],
          list_string_functions_called: get_list_string_functions_called_in_string_body(string_fn_body, string_fn_name) ?? [],
          int_line_start:               int_fn_start,
        };
        bool_in_function = false;
        string_fn_body   = "";
        int_brace_depth  = 0;
      }
    }
  }

  exit_fn_debug_log_for_string_function_name("get_dict_function_map_from_string_js_code", {
    int_functions_found: Object.keys(dict_function_map).length,
  });
  return dict_function_map;
}

function get_string_signature_from_string_body(
  string_fn_name: string,
  string_body: string
): string {
  const regex_sig = new RegExp(
    `(?:async\\s+)?function\\s+${string_fn_name}\\s*\\([^)]*\\)|${string_fn_name}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)`
  );
  const match_sig = string_body.match(regex_sig);
  return match_sig ? match_sig[0].trim() : string_fn_name + "(?)";
}

function get_list_string_params_from_string_signature(string_body: string): string[] {
  const match_params = string_body.match(/\(([^)]*)\)/);
  if (!match_params || !match_params[1].trim()) return [];
  return match_params[1]
    .split(",")
    .map((str_p) => str_p.trim())
    .filter((str_p) => str_p.length > 0);
}

function get_list_string_vars_referenced_in_string_body(string_body: string): string[] {
  const regex_var_refs = /\b([a-z][a-zA-Z0-9_]*(?:_[a-zA-Z0-9_]+)+)\b/g;
  const list_string_found: string[] = [];
  let match_result: RegExpExecArray | null;
  while ((match_result = regex_var_refs.exec(string_body)) !== null) {
    if (!list_string_found.includes(match_result[1])) {
      list_string_found.push(match_result[1]);
    }
  }
  return list_string_found;
}

function get_list_string_functions_called_in_string_body(
  string_body: string,
  string_self_name: string
): string[] {
  const regex_calls = /\b(\w+)\s*\(/g;
  const list_string_forbidden = [
    string_self_name, "if", "while", "for", "switch", "catch", "function"
  ];
  const list_string_calls: string[] = [];
  let match_result: RegExpExecArray | null;
  while ((match_result = regex_calls.exec(string_body)) !== null) {
    const string_called = match_result[1];
    if (
      !list_string_forbidden.includes(string_called) &&
      !list_string_calls.includes(string_called)
    ) {
      list_string_calls.push(string_called);
    }
  }
  return list_string_calls;
}

export function get_list_string_all_function_names_from_string_js_code(
  string_js_code: string
): string[] {
  init_fn_debug_log_for_string_function_name("get_list_string_all_function_names_from_string_js_code");
  const dict_map = get_dict_function_map_from_string_js_code(string_js_code);
  const list_string_names = Object.keys(dict_map);
  exit_fn_debug_log_for_string_function_name("get_list_string_all_function_names_from_string_js_code", {
    int_count: list_string_names.length,
  });
  return list_string_names;
}

export function get_list_string_signature_registry_from_string_js_code(
  string_js_code: string
): string[] {
  init_fn_debug_log_for_string_function_name("get_list_string_signature_registry_from_string_js_code");
  const dict_map = get_dict_function_map_from_string_js_code(string_js_code);
  const list_string_registry = Object.values(dict_map).map(
    (dict_info) =>
      `${dict_info.string_signature}  // params: ${dict_info.list_string_params.join(", ") || "none"}`
  );
  exit_fn_debug_log_for_string_function_name("get_list_string_signature_registry_from_string_js_code", {
    int_count: list_string_registry.length,
  });
  return list_string_registry;
}
