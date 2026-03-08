/**
 * assembleApp.ts
 * Rebuilds app.js FROM the function store.
 * CRITICAL FIX: dependency sort is best-effort only — every active function
 * is always included regardless of whether it appears in the call graph.
 */
import { load_list_dict_active_functions_from_store } from "../storage/functionStore";
import { get_dict_function_map_from_string_js_code }  from "../context/codeAnalyzer";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

function get_list_dict_deduplicated_by_string_name(
  list_dict_items: { string_name: string; string_body: string }[]
): { string_name: string; string_body: string }[] {
  const dict_string_name_to_dict_item: Record<string, { string_name: string; string_body: string }> = {};
  for (const dict_item of list_dict_items) {
    dict_string_name_to_dict_item[dict_item.string_name] = dict_item;
  }
  return Object.values(dict_string_name_to_dict_item);
}

function get_list_string_safe_sorted_function_names(
  list_string_all_names: string[],
  dict_string_fn_name_to_list_string_calls: Record<string, string[]>
): string[] {
  init_fn_debug_log_for_string_function_name("get_list_string_safe_sorted_function_names", {
    int_total: list_string_all_names.length,
  });

  const list_string_visited: string[] = [];
  const list_string_sorted:  string[] = [];

  function visit_string_fn_name(string_fn_name: string): void {
    if (list_string_visited.includes(string_fn_name)) return;
    list_string_visited.push(string_fn_name);
    const list_string_deps = dict_string_fn_name_to_list_string_calls[string_fn_name] ?? [];
    for (const string_dep of list_string_deps) {
      if (list_string_all_names.includes(string_dep)) visit_string_fn_name(string_dep);
    }
    list_string_sorted.push(string_fn_name);
  }

  for (const string_fn_name of list_string_all_names) visit_string_fn_name(string_fn_name);

  for (const string_fn_name of list_string_all_names) {
    if (!list_string_visited.includes(string_fn_name)) {
      list_string_sorted.push(string_fn_name);
    }
  }

  exit_fn_debug_log_for_string_function_name("get_list_string_safe_sorted_function_names", {
    int_sorted:        list_string_sorted.length,
    int_total:         list_string_all_names.length,
    bool_all_included: list_string_sorted.length === list_string_all_names.length,
  });
  return list_string_sorted;
}

function get_list_string_sorted_global_bodies(
  list_dict_globals: { string_name: string; string_body: string }[]
): string[] {
  const list_string_all_names = list_dict_globals.map((r) => r.string_name);

  const dict_string_name_to_string_body: Record<string, string> = {};
  for (const dict_global of list_dict_globals) {
    dict_string_name_to_string_body[dict_global.string_name] = dict_global.string_body;
  }

  const dict_string_name_to_list_string_deps: Record<string, string[]> = {};
  for (const dict_global of list_dict_globals) {
    const list_string_deps: string[] = [];
    for (const string_other_name of list_string_all_names) {
      if (
        string_other_name !== dict_global.string_name &&
        dict_global.string_body.includes(string_other_name)
      ) {
        list_string_deps.push(string_other_name);
      }
    }
    dict_string_name_to_list_string_deps[dict_global.string_name] = list_string_deps;
  }

  const list_string_sorted_names = get_list_string_safe_sorted_function_names(
    list_string_all_names,
    dict_string_name_to_list_string_deps
  );

  return list_string_sorted_names
    .map((string_name) => dict_string_name_to_string_body[string_name])
    .filter((string_body) => string_body !== undefined);
}

export function build_string_app_js_from_store_for_string_app_name(
  string_app_name: string
): string {
  init_fn_debug_log_for_string_function_name("build_string_app_js_from_store_for_string_app_name", {
    string_app_name,
  });

  const list_dict_active = load_list_dict_active_functions_from_store(string_app_name);

  const list_dict_globals = get_list_dict_deduplicated_by_string_name(
    list_dict_active.filter((r) => r.string_type === "global")
  );
  const list_dict_functions = get_list_dict_deduplicated_by_string_name(
    list_dict_active.filter((r) => r.string_type === "function")
  );

  for (const dict_fn of list_dict_functions) {
    init_fn_debug_log_for_string_function_name("build_string_app_js_from_store_for_string_app_name:fn_loaded", {
      string_name:    dict_fn.string_name,
      int_body_chars: dict_fn.string_body.length,
    });
  }

  const dict_string_fn_name_to_string_body: Record<string, string> = {};
  for (const dict_fn of list_dict_functions) {
    dict_string_fn_name_to_string_body[dict_fn.string_name] = dict_fn.string_body;
  }

  const dict_string_fn_name_to_list_string_calls: Record<string, string[]> = {};
  for (const dict_fn of list_dict_functions) {
    try {
      const dict_fn_map  = get_dict_function_map_from_string_js_code(dict_fn.string_body);
      const dict_fn_info = dict_fn_map[dict_fn.string_name];
      dict_string_fn_name_to_list_string_calls[dict_fn.string_name] =
        dict_fn_info?.list_string_functions_called ?? [];
    } catch (_err) {
      dict_string_fn_name_to_list_string_calls[dict_fn.string_name] = [];
    }
  }

  const list_string_all_names     = list_dict_functions.map((r) => r.string_name);
  const list_string_sorted        = get_list_string_safe_sorted_function_names(
    list_string_all_names, dict_string_fn_name_to_list_string_calls
  );
  const list_string_global_bodies = get_list_string_sorted_global_bodies(list_dict_globals);

  const list_string_parts: string[] = [
    "// AUTO-ASSEMBLED by AGEF — do not edit directly",
    `// Generated: ${new Date().toISOString()}`,
    `// Functions: ${list_string_sorted.length} | Globals: ${list_dict_globals.length}`,
    "",
  ];

  if (list_string_global_bodies.length > 0) {
    list_string_parts.push("// ── Globals ──────────────────────────────────────");
    for (const string_body of list_string_global_bodies) {
      list_string_parts.push(string_body);
    }
    list_string_parts.push("");
  }

  list_string_parts.push("// ── Functions ────────────────────────────────────");
  for (const string_fn_name of list_string_sorted) {
    const string_body = dict_string_fn_name_to_string_body[string_fn_name];
    if (string_body) {
      list_string_parts.push(string_body, "");
    } else {
      init_fn_debug_log_for_string_function_name("build_string_app_js_from_store_for_string_app_name:MISSING_BODY", {
        string_fn_name,
      });
    }
  }

  list_string_parts.push("// ── Exports ──────────────────────────────────────");
  list_string_parts.push(`module.exports = { ${list_string_sorted.join(", ")} };`);

  const string_app_js = list_string_parts.join("\n");

  exit_fn_debug_log_for_string_function_name("build_string_app_js_from_store_for_string_app_name", {
    int_chars:              string_app_js.length,
    int_functions_in_file:  list_string_sorted.length,
    int_functions_in_store: list_string_all_names.length,
    bool_counts_match:      list_string_sorted.length === list_string_all_names.length,
  });
  return string_app_js;
}
