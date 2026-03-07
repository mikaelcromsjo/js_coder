import "dotenv/config";
import minimist from "minimist";
import chalk    from "chalk";
import { initialise_all_sqlite_database_tables }                                       from "./storage/db";
import { initialise_function_embeddings_sqlite_table }                                 from "./embeddings/functionEmbeddingStore";
import { run_full_app_generation_pipeline_on_string_user_request }                     from "./runner/generateAppPipeline";
import { run_update_app_pipeline_on_string_app_name_and_string_instruction }           from "./runner/updateAppPipeline";
import {
  save_dict_session_to_file,
  load_dict_session_from_file,
  clear_dict_session_from_file,
} from "./storage/sessionStore";
import { load_string_js_code_from_sqlite_by_int_revision, get_list_dict_revision_history_for_string_app_name } from "./storage/saveRevision";
import { write_string_js_code_to_disk_at_global_output_path }                          from "./utils/fileWriter";
import {
  set_string_current_app_name,
  set_string_current_js_output_file_path,
  set_int_context_level,
} from "./state";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
  error_fn_debug_log_for_string_function_name,
} from "./debug/debugLogger";
import path from "path";

function get_string_app_name_from_string_description(string_description: string): string {
  return string_description.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(" ").slice(0, 3).join("-");
}

function print_string_cli_help(): void {
  console.log(chalk.bold("\nAGEF — Agentic Generation Environment & Framework\n"));
  console.log("  agef --init \"<description>\"              Create a new app");
  console.log("  agef --init \"...\" --name <n>             Create with custom name");
  console.log("  agef \"<instruction>\"                     Update active app");
  console.log("  agef \"...\" --context 1|2|3               Set context level (1=focused 2=wide 3=full)");
  console.log("  agef --rollback <n>                      Restore revision N");
  console.log("  agef --history                           Show revision history");
  console.log("  agef --status                            Show active app");
  console.log("  agef --reset                             Clear session");
  console.log("  agef --help\n");
}

export async function run_cli_from_process_argv(): Promise<void> {
  init_fn_debug_log_for_string_function_name("run_cli_from_process_argv", {
    string_argv: process.argv.slice(2).join(" "),
  });

  const dict_args = minimist(process.argv.slice(2), {
    string:  ["init", "name", "rollback"],
    boolean: ["reset", "status", "help", "history"],
    alias:   { h: "help", n: "name", i: "init", c: "context" },
  });

  initialise_all_sqlite_database_tables();
  initialise_function_embeddings_sqlite_table();

  // Apply context level flag if provided
  const int_context_flag = Number(dict_args["context"] ?? process.env.CONTEXT_LEVEL ?? 1);
  if ([1, 2, 3].includes(int_context_flag)) set_int_context_level(int_context_flag);

  try {
    if (dict_args["help"])   { print_string_cli_help(); return; }
    if (dict_args["reset"])  { clear_dict_session_from_file(); console.log(chalk.yellow("Session cleared.")); return; }

    if (dict_args["status"]) {
      const dict_session = load_dict_session_from_file();
      if (!dict_session) { console.log(chalk.yellow("No active app.")); return; }
      console.log(chalk.green(`Active: ${dict_session.string_app_name}`));
      console.log(chalk.gray(`Requirement: ${dict_session.string_original_requirement}`));
      console.log(chalk.gray(`Last passing revision: ${dict_session.int_last_passing_revision}`));
      return;
    }

    if (dict_args["history"]) {
      const dict_session = load_dict_session_from_file();
      if (!dict_session) { console.log(chalk.yellow("No active app.")); return; }
      const list_revisions = get_list_dict_revision_history_for_string_app_name(dict_session.string_app_name);
      console.log(chalk.bold(`\nRevision history for: ${dict_session.string_app_name}`));
      for (const row of list_revisions) {
        console.log(chalk.gray(`  [${row.int_revision}] ${row.string_timestamp}  ${row.string_prompt.slice(0, 80)}`));
      }
      return;
    }

    if (dict_args["rollback"]) {
      const dict_session = load_dict_session_from_file();
      if (!dict_session) { console.log(chalk.red("No active app.")); return; }
      const int_rollback_to = Number(dict_args["rollback"]);
      const string_code     = load_string_js_code_from_sqlite_by_int_revision(int_rollback_to);
      if (!string_code) { console.log(chalk.red(`Revision ${int_rollback_to} not found.`)); return; }
      const string_output_path = path.resolve(process.env.OUTPUT_DIR ?? "./output", dict_session.string_app_name, "app.js");
      set_string_current_app_name(dict_session.string_app_name);
      set_string_current_js_output_file_path(string_output_path);
      write_string_js_code_to_disk_at_global_output_path(string_code);
      console.log(chalk.green(`\n✅ Rolled back to revision ${int_rollback_to}`));
      return;
    }

    if (dict_args["init"]) {
      const string_description = dict_args["init"] as string;
      const string_app_name    = (dict_args["name"] as string | undefined)
        ?? get_string_app_name_from_string_description(string_description);

      console.log(chalk.bold.cyan(`\n🚀 Init: "${string_app_name}"  context-level=${int_context_flag}`));

      const dict_result = await run_full_app_generation_pipeline_on_string_user_request(
        string_description, string_app_name
      );

      save_dict_session_to_file({
        string_app_name,
        string_original_requirement: string_description,
        string_formal_spec:          dict_result.string_formal_spec,
        int_last_passing_revision:   dict_result.int_last_passing_revision,
      });
      return;
    }

    // ── Update active app ─────────────────────────────────────────────────────
    const string_instruction = (dict_args["_"] as string[]).join(" ");
    if (!string_instruction) { print_string_cli_help(); return; }

    const dict_session = load_dict_session_from_file();
    if (!dict_session) {
      console.log(chalk.red("\nNo active app. Run: agef --init \"description\" first."));
      process.exit(1);
    }

    console.log(chalk.bold.cyan(`\n✏️  Update "${dict_session.string_app_name}"  context-level=${int_context_flag}`));
    console.log(chalk.gray(`   "${string_instruction}"\n`));

    const dict_update_result = await run_update_app_pipeline_on_string_app_name_and_string_instruction(
      dict_session.string_app_name,
      string_instruction,
      dict_session.string_original_requirement,
      dict_session.string_formal_spec
    );

    save_dict_session_to_file({
      ...dict_session,
      int_last_passing_revision: dict_update_result.int_last_passing_revision,
    });

  } catch (error: unknown) {
    const string_error = error instanceof Error ? error.message : String(error);
    error_fn_debug_log_for_string_function_name("run_cli_from_process_argv", string_error);
    console.error(chalk.red(`\nError: ${string_error}`));
    process.exit(1);
  }

  exit_fn_debug_log_for_string_function_name("run_cli_from_process_argv", { string_status: "done" });
}
