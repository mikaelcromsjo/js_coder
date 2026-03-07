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
import { run_string_refactor_agent_on_string_js_code_and_string_critique }         from "../agents/refactorAgent";
import { run_string_critic_agent_on_string_js_code }                               from "../agents/criticAgent";
import { run_string_test_writer_agent_on_string_js_code_and_string_file_path }     from "../agents/testWriterAgent";
import { run_bool_test_on_string_test_file_path }                                  from "../tester/runTest";
import { run_bool_syntax_check_on_string_js_file_path }                            from "../tester/syntaxCheck";
import { trigger_self_heal_loop_on_string_js_code_and_string_test_path }           from "../healer/selfHealLoop";
import { write_string_content_to_string_file_path }                                from "../utils/fileWriter";
import {
  save_revision_to_sqlite_for_int_revision_number,
  get_int_max_revision_for_string_app_name,
} from "../storage/saveRevision";
import { save_refactor_log_to_sqlite_from_int_revision_to_int_revision }           from "../storage/saveRefactorLog";
import { load_dict_function_embeddings_from_sqlite_for_string_app_name_and_int_revision } from "../embeddings/functionEmbeddingStore";
import { apply_string_llm_output_and_rebuild_app_for_string_app_name }             from "../assembly/applyLLMOutput";
import { build_string_app_js_from_store_for_string_app_name }                      from "../assembly/assembleApp";
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

export async function run_update_app_pipeline_on_string_app_name_and_string_instruction(
  string_app_name:             string,
  string_instruction:          string,
  string_original_requirement: string,
  string_spec:                 string
): Promise<{ int_last_passing_revision: number }> {
  init_fn_debug_log_for_string_function_name("run_update_app_pipeline_on_string_app_name_and_string_instruction", {
    string_app_name, string_instruction,
  });

  const string_output_dir = path.resolve(process.env.OUTPUT_DIR ?? "./output", string_app_name);
  const string_js_path    = path.join(string_output_dir, "app.js");
  const string_test_path  = path.join(string_output_dir, "app.test.js");
  fs.mkdirSync(string_output_dir, { recursive: true });

  set_string_current_app_name(string_app_name);
  set_string_current_app_description(string_instruction);
  set_string_original_requirement(string_original_requirement);
  set_string_formal_spec(string_spec);
  set_string_current_js_output_file_path(string_js_path);

  // Load embeddings into memory for context retrieval
  const int_latest = get_int_max_revision_for_string_app_name(string_app_name);
  load_dict_function_embeddings_from_sqlite_for_string_app_name_and_int_revision(string_app_name, int_latest);

  // Current app.js rebuilt from store (source of truth)
  let string_js_code = build_string_app_js_from_store_for_string_app_name(string_app_name);
  set_string_last_generated_js_code(string_js_code);

  console.log(chalk.cyan(`\n✏️  [1/6] REFACTOR → new.js (diff only)`));
  const string_refactor_output = await run_string_refactor_agent_on_string_js_code_and_string_critique(
    string_js_code, `USER INSTRUCTION: ${string_instruction}`
  );
  increment_int_current_revision_number();
  const dict_apply = await apply_string_llm_output_and_rebuild_app_for_string_app_name(
    string_refactor_output, string_current_app_name, int_current_revision_number, string_output_dir
  );
  string_js_code = dict_apply.string_app_js;
  set_string_last_generated_js_code(string_js_code);
  save_revision_to_sqlite_for_int_revision_number(int_current_revision_number, string_current_app_name, string_js_code, `[UPDATE] ${string_instruction}`);
  save_refactor_log_to_sqlite_from_int_revision_to_int_revision(int_latest, int_current_revision_number, `User: ${string_instruction}`);

  console.log(chalk.bold(`  Updated functions : ${dict_apply.list_string_updated_names.join(", ") || "none"}`));
  console.log(chalk.bold(`  Obsolete functions: ${dict_apply.list_string_obsolete_names.join(", ") || "none"}`));
  console.log(chalk.bold(`  Re-embedded       : ${dict_apply.int_functions_reembedded}`));

  console.log(chalk.cyan("\n⚡ [2/6] SYNTAX CHECK"));
  if (!run_bool_syntax_check_on_string_js_file_path(string_js_path)) {
    const string_fix_output = await run_string_refactor_agent_on_string_js_code_and_string_critique(string_js_code, "SYNTAX ERROR: fix all syntax errors");
    increment_int_current_revision_number();
    const dict_fix = await apply_string_llm_output_and_rebuild_app_for_string_app_name(string_fix_output, string_current_app_name, int_current_revision_number, string_output_dir);
    string_js_code = dict_fix.string_app_js;
    set_string_last_generated_js_code(string_js_code);
  } else { console.log(chalk.green("  ✅ OK")); }

  console.log(chalk.cyan("\n🔍 [3/6] CRITIC"));
  const string_critique = await run_string_critic_agent_on_string_js_code(string_js_code);
  if (string_critique.trim().toUpperCase() !== "PASS") {
    console.log(chalk.cyan("\n♻️  [4/6] RE-REFACTOR → new.js (diff only)"));
    const string_re_output = await run_string_refactor_agent_on_string_js_code_and_string_critique(string_js_code, string_critique);
    const int_from = int_current_revision_number;
    increment_int_current_revision_number();
    const dict_re = await apply_string_llm_output_and_rebuild_app_for_string_app_name(string_re_output, string_current_app_name, int_current_revision_number, string_output_dir);
    string_js_code = dict_re.string_app_js;
    set_string_last_generated_js_code(string_js_code);
    save_revision_to_sqlite_for_int_revision_number(int_current_revision_number, string_current_app_name, string_js_code, `Refactor: ${string_critique}`);
    save_refactor_log_to_sqlite_from_int_revision_to_int_revision(int_from, int_current_revision_number, string_critique);
  } else { console.log(chalk.green("  ✅ PASS")); }

  console.log(chalk.cyan("\n🧪 [5/6] TESTS + ACCUMULATE"));
  const string_test_code = await run_string_test_writer_agent_on_string_js_code_and_string_file_path(string_js_code, string_js_path);
  const list_string_new_asserts = extract_list_string_assert_lines_from_string_test_code(string_test_code);
  save_list_string_test_assertions_to_sqlite_for_string_app_name(string_current_app_name, list_string_new_asserts, int_current_revision_number);
  const list_string_all_asserts = load_list_string_all_test_assertions_from_sqlite_for_string_app_name(string_current_app_name);
  const string_full_test = build_string_full_test_file_from_string_app_path_and_list_string_assertions(string_js_path, list_string_all_asserts);
  write_string_content_to_string_file_path(string_test_path, string_full_test);

  console.log(chalk.cyan("\n🏃 [6/6] TESTS + HEAL"));
  run_bool_test_on_string_test_file_path(string_test_path);
  if (!bool_last_test_passed) {
    string_js_code = await trigger_self_heal_loop_on_string_js_code_and_string_test_path(string_js_code, string_test_path);
  } else { console.log(chalk.green("  ✅ Tests passed!")); }

  if (bool_last_test_passed) set_int_last_passing_revision_number(int_current_revision_number);

  console.log(chalk.bold.green(`\n🎉 UPDATED → ${string_js_path}`));
  exit_fn_debug_log_for_string_function_name("run_update_app_pipeline_on_string_app_name_and_string_instruction", {
    int_current_revision_number, bool_last_test_passed,
  });
  return { int_last_passing_revision: int_current_revision_number };
}
