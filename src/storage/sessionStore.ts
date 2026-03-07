import fs   from "fs";
import path from "path";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

const string_session_file_path = path.resolve(".agef-session");

type TDictSession = {
  string_app_name:          string;
  string_original_requirement: string;
  string_formal_spec:       string;
  int_last_passing_revision: number;
};

export function save_dict_session_to_file(dict_session: TDictSession): void {
  init_fn_debug_log_for_string_function_name("save_dict_session_to_file", { string_app_name: dict_session.string_app_name });
  fs.writeFileSync(string_session_file_path, JSON.stringify(dict_session, null, 2), "utf-8");
  exit_fn_debug_log_for_string_function_name("save_dict_session_to_file");
}

export function load_dict_session_from_file(): TDictSession | null {
  init_fn_debug_log_for_string_function_name("load_dict_session_from_file");
  try {
    if (!fs.existsSync(string_session_file_path)) return null;
    const dict_session = JSON.parse(fs.readFileSync(string_session_file_path, "utf-8")) as TDictSession;
    exit_fn_debug_log_for_string_function_name("load_dict_session_from_file", { string_app_name: dict_session.string_app_name });
    return dict_session;
  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("load_dict_session_from_file", string_error);
    return null;
  }
}

export function clear_dict_session_from_file(): void {
  init_fn_debug_log_for_string_function_name("clear_dict_session_from_file");
  if (fs.existsSync(string_session_file_path)) fs.unlinkSync(string_session_file_path);
  exit_fn_debug_log_for_string_function_name("clear_dict_session_from_file");
}
