import chalk from "chalk";

const bool_debug_enabled = (process.env.DEBUG ?? "true") === "true";

export function init_fn_debug_log_for_string_function_name(
  string_function_name: string,
  dict_string_param_to_any_value: Record<string, unknown> = {}
): void {
  if (!bool_debug_enabled) return;
  const string_params = Object.entries(dict_string_param_to_any_value)
    .map(([k, v]) => {
      const string_val = typeof v === "string"
        ? `"${(v as string).slice(0, 80).replace(/\n/g, " ")}${(v as string).length > 80 ? "…" : ""}"`
        : String(v);
      return `${k}=${string_val}`;
    })
    .join(" | ");
  console.log(
    chalk.blue(`→ INIT  [${string_function_name}]`) +
    (string_params ? chalk.gray(` (${string_params})`) : "")
  );
}

export function exit_fn_debug_log_for_string_function_name(
  string_function_name: string,
  dict_string_result_key_to_any_value: Record<string, unknown> = {}
): void {
  if (!bool_debug_enabled) return;
  const string_results = Object.entries(dict_string_result_key_to_any_value)
    .map(([k, v]) => {
      const string_val = typeof v === "string"
        ? `"${(v as string).slice(0, 80).replace(/\n/g, " ")}${(v as string).length > 80 ? "…" : ""}"`
        : String(v);
      return `${k}=${string_val}`;
    })
    .join(" | ");
  console.log(
    chalk.green(`← EXIT  [${string_function_name}]`) +
    (string_results ? chalk.gray(` (${string_results})`) : "")
  );
}

export function error_fn_debug_log_for_string_function_name(
  string_function_name: string,
  string_error_message: string
): void {
  console.log(
    chalk.red(`✖ ERROR [${string_function_name}]`) +
    chalk.gray(` "${string_error_message.slice(0, 120)}"`)
  );
}
