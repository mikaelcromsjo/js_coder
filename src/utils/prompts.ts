export const string_prompt_all_conventions = `
RULES:



NAMES:
var prefix = type: string_ int_ float_ bool_ list_[type]_ dict_[keyType]_to_[valType]_ fn_
functions use snake_case with type prefixes
fn name = verb + returnType + action + inputTypes
  get_string_foobar()
  get_string_foobar_for_string_input()
  run_bool_foobar_on_string_foobar()
  save_foobar_to_sqlite_using_int_foobar()
  set_bool_foobar()
never: x, res, data, temp, obj, val, i, handle(), process(), run(), update()



FUNCTIONS:
max 25 lines | one job | no nesting | no classes | no this | export all
mutable state only in state.js | every mutable global has set_<name>() setter
never wrap synchronous code in new Promise() | only use Promise for truly async operations
always add farewell or exit message before closing readline or exiting



TYPES:
flat only | max 2 levels deep | Record<string,string> for dicts
no Map | no Set | no Symbol | no Hungarian notation on object keys



ASYNC: async/await only | no .then() | always try/catch
never throw inside .then() — errors are silently swallowed | use async/await instead



IMPORTS: one per line | no wildcards | no unused



ERRORS: never empty catch | always log before throw
never throw inside a Promise .then() callback — errors will not propagate



JS OUTPUT FORMAT:
raw JS only | no markdown fences | no TypeScript | const/let never var
function declarations | module.exports = { fn1, fn2, ... } at bottom
never execute code at top level | guard self-tests: if (require.main === module) { ... }
never use fs.existsSync on fs/promises | use fs.mkdir({ recursive: true }) instead
dead code must be removed before export | every exported function must be used or be a test hook


TESTS:
only test pure functions — never test I/O, readline, or global state mutation
if no pure functions exist, write skeleton tests with TODO comments
always call get_string_test_error() as the minimum passing assertion
never access unexported module properties
`.trim();
