import path  from "path";
import fs    from "fs";
import chalk from "chalk";
import {
  set_string_current_app_name, set_string_current_app_description,
  set_string_current_js_output_file_path, set_string_last_generated_js_code,
  set_string_original_requirement, set_string_formal_spec,
  set_int_last_passing_revision_number,
  increment_int_current_revision_number,
  int_current_revision_number, string_current_app_name, bool_last_test_passed,
} from "../state";
import { run_string_spec_writer_agent_on_string_user_request }             from "../agents/specWriterAgent";
import { run_string_planner_agent_on_string_user_request }                 from "../agents/plannerAgent";
import { run_string_coder_agent_on_string_plan }                           from "../agents/coderAgent";
import { run_string_critic_agent_on_string_js_code }                       from "../agents/criticAgent";
import { run_string_refactor_agent_on_string_js_code_and_string_critique } from "../agents/refactorAgent";
import { run_string_test_writer_agent_on_string_js_code_and_string_file_path } from "../agents/testWriterAgent";
import { run_bool_test_on_string_test_file_path }                          from "../tester/runTest";
import { run_bool_syntax_check_on_string_js_file_path }                    from "../tester/syntaxCheck";
import { trigger_self_heal_loop_on_string_js_code_and_string_test_path }   from "../healer/selfHealLoop";
import { write_string_content_to_string_file_path }                        from "../utils/fileWriter";
import { save_revision_to_sqlite_for_int_revision_number }                 from "../storage/saveRevision";
import { save_refactor_log_to_sqlite_from_int_revision_to_int_revision }   from "../storage/saveRefactorLog";
import { initialise_function_store_sqlite_table }                          from "../storage/functionStore";
import { apply_string_llm_output_and_rebuild_app_for_string_app_name }     from "../assembly/applyLLMOutput";
import {
  extract_list_string_assert_lines_from_string_test_code,
  save_list_string_test_assertions_to_sqlite_for_string_app_name,
  load_list_string_all_test_assertions_from_sqlite_for_string_app_name,
  build_string_full_test_file_from_string_app_path_and_list_string_assertions,
} from "../storage/accumulatedTests";
import {
  init_fn_debug_log_for_string_function_name,
  exit_fn_debug_log_for_string_function_name,
} from "../debug/debugLogger";

export async function run_full_app_generation_pipeline_on_string_user_request(
  string_user_request: string,
  string_app_name:     string
): Promise<{ string_formal_spec: string; int_last_passing_revision: number }> {
  init_fn_debug_log_for_string_function_name("run_full_app_generation_pipeline_on_string_user_request", {
    string_app_name, string_user_request,
  });

  const string_output_dir = path.resolve(process.env.OUTPUT_DIR ?? "./output", string_app_name);
  const string_js_path    = path.join(string_output_dir, "app.js");
  const string_test_path  = path.join(string_output_dir, "app.test.js");
  fs.mkdirSync(string_output_dir, { recursive: true });

  set_string_current_app_name(string_app_name);
  set_string_current_app_description(string_user_request);
  set_string_original_requirement(string_user_request);
  set_string_current_js_output_file_path(string_js_path);
  initialise_function_store_sqlite_table();

  console.log(chalk.cyan("\n📋 [1/8] SPEC WRITER"));
  const string_spec = await run_string_spec_writer_agent_on_string_user_request(string_user_request);
  set_string_formal_spec(string_spec);

  console.log(chalk.cyan("\n🧠 [2/8] PLANNER"));
  const string_plan = await run_string_planner_agent_on_string_user_request(string_user_request);

  console.log(chalk.cyan("\n💻 [3/8] CODER → new.js + store + embed"));
  const string_coder_output = await run_string_coder_agent_on_string_plan(string_plan);
  increment_int_current_revision_number();
  const dict_apply_init = await apply_string_llm_output_and_rebuild_app_for_string_app_name(
    string_coder_output, string_current_app_name, int_current_revision_number, string_output_dir
  );
  let string_js_code = dict_apply_init.string_app_js;
  set_string_last_generated_js_code(string_js_code);
  save_revision_to_sqlite_for_int_revision_number(int_current_revision_number, string_current_app_name, string_js_code, string_plan);

  console.log(chalk.cyan("\n⚡ [4/8] SYNTAX CHECK"));
  if (!run_bool_syntax_check_on_string_js_file_path(string_js_path)) {
    console.log(chalk.red("  ❌ Syntax error — healing..."));
    const string_fix_output = await run_string_refactor_agent_on_string_js_code_and_string_critique(string_js_code, "SYNTAX ERROR: fix all syntax errors");
    increment_int_current_revision_number();
    const dict_fix = await apply_string_llm_output_and_rebuild_app_for_string_app_name(string_fix_output, string_current_app_name, int_current_revision_number, string_output_dir);
    string_js_code = dict_fix.string_app_js;
    set_string_last_generated_js_code(string_js_code);
  }

  console.log(chalk.cyan("\n🔍 [5/8] CRITIC"));
  const string_critique = await run_string_critic_agent_on_string_js_code(string_js_code);
  if (string_critique.trim().toUpperCase() !== "PASS") {
    console.log(chalk.cyan("\n♻️  [6/8] REFACTOR → new.js + store + embed"));
    const string_refactor_output = await run_string_refactor_agent_on_string_js_code_and_string_critique(string_js_code, string_critique);
    const int_from = int_current_revision_number;
    increment_int_current_revision_number();
    const dict_refactor = await apply_string_llm_output_and_rebuild_app_for_string_app_name(string_refactor_output, string_current_app_name, int_current_revision_number, string_output_dir);
    string_js_code = dict_refactor.string_app_js;
    set_string_last_generated_js_code(string_js_code);
    save_revision_to_sqlite_for_int_revision_number(int_current_revision_number, string_current_app_name, string_js_code, `Refactor: ${string_critique}`);
    save_refactor_log_to_sqlite_from_int_revision_to_int_revision(int_from, int_current_revision_number, string_critique);
    console.log(chalk.gray(`  Updated: ${dict_refactor.list_string_updated_names.join(", ")}`));
  } else { console.log(chalk.green("  ✅ Critic: PASS")); }

  console.log(chalk.cyan("\n🧪 [7/8] TEST WRITER + ACCUMULATE"));
  const string_test_code = await run_string_test_writer_agent_on_string_js_code_and_string_file_path(string_js_code, string_js_path);
  const list_string_new_asserts = extract_list_string_assert_lines_from_string_test_code(string_test_code);
  save_list_string_test_assertions_to_sqlite_for_string_app_name(string_current_app_name, list_string_new_asserts, int_current_revision_number);
  const list_string_all_asserts = load_list_string_all_test_assertions_from_sqlite_for_string_app_name(string_current_app_name);
  const string_full_test = build_string_full_test_file_from_string_app_path_and_list_string_assertions(string_js_path, list_string_all_asserts);
  write_string_content_to_string_file_path(string_test_path, string_full_test);

  console.log(chalk.cyan("\n🏃 [8/8] TEST RUNNER"));
  run_bool_test_on_string_test_file_path(string_test_path);
  if (!bool_last_test_passed) {
    string_js_code = await trigger_self_heal_loop_on_string_js_code_and_string_test_path(string_js_code, string_test_path);
  } else { console.log(chalk.green("  ✅ Tests passed!")); }

  if (bool_last_test_passed) set_int_last_passing_revision_number(int_current_revision_number);
  console.log(chalk.bold.green(`\n🎉 DONE → ${string_js_path}`));

  exit_fn_debug_log_for_string_function_name("run_full_app_generation_pipeline_on_string_user_request", {
    int_current_revision_number, bool_last_test_passed,
  });
  return { string_formal_spec: string_spec, int_last_passing_revision: int_current_revision_number };
}
