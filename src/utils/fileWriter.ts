import fs   from "fs";
import path from "path";
import { string_current_js_output_file_path } from "../state";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export function strip_markdown_code_fence(string_code: string): string {
  return string_code
    .replace(/^```[a-z]*\n?/i, '')  // remove opening fence
    .replace(/\n?```$/,        '')  // remove closing fence
    .trim();
}

export function write_string_js_code_to_disk_at_global_output_path(string_js_code: string): void {
  init_fn_debug_log_for_string_function_name("write_string_js_code_to_disk_at_global_output_path", {
    string_path:  string_current_js_output_file_path,
    int_chars:    string_js_code.length,
  });
  string_js_code = strip_markdown_code_fence(string_js_code);
  try {
    const string_dir = path.dirname(string_current_js_output_file_path);
    if (!fs.existsSync(string_dir)) fs.mkdirSync(string_dir, { recursive: true });
    fs.writeFileSync(string_current_js_output_file_path, string_js_code, "utf-8");
    exit_fn_debug_log_for_string_function_name("write_string_js_code_to_disk_at_global_output_path", { string_path: string_current_js_output_file_path });
  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("write_string_js_code_to_disk_at_global_output_path", string_error);
    throw error;
  }
}

export function write_string_content_to_string_file_path(
  string_file_path: string,
  string_content: string
): void {
  init_fn_debug_log_for_string_function_name("write_string_content_to_string_file_path", { string_file_path, int_chars: string_content.length });
  const string_dir = path.dirname(string_file_path);
  if (!fs.existsSync(string_dir)) fs.mkdirSync(string_dir, { recursive: true });
  fs.writeFileSync(string_file_path, string_content, "utf-8");
  exit_fn_debug_log_for_string_function_name("write_string_content_to_string_file_path", { string_file_path });
}
