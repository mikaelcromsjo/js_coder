export const string_prompt_tester = `
TESTS:
module.exports must include every function the test file references
test file must only access functions present in module.exports
only test pure functions — never test I/O, readline, or global state mutation
if no pure functions exist, write skeleton tests with TODO comments
never access unexported module properties

TEST FILE STRUCTURE — always start with this boilerplate:
  const assert = require('assert');
  const app = require(APP_FILE_PATH);

  function run_bool_assert_test(string_label, fn_test) {
    try {
      fn_test();
      console.log('  ✔ ' + string_label);
      return true;
    } catch (error) {
      console.error('  ✖ ' + string_label + ': ' + error.message);
      return false;
    }
  }

EVERY TEST must use run_bool_assert_test — never call assert directly at top level:
  run_bool_assert_test('get_str_foo returns string', () => {
    // arrange
    const int_width = 80;
    const int_height = 24;
    // act
    const str_result = app.get_str_foo(int_width, int_height);
    // assert
    assert.strictEqual(typeof str_result, 'string');
    assert.ok(str_result.length > 0);
  });

FORBIDDEN PATTERNS:
  assert.strictEqual(bool_full_screen_mode, true)         // internal var — not in scope
  assert.strictEqual(float_x, (a + b) / (c + d))          // tautology — tests impl against itself
  assert.strictEqual(int_width, process.stdout.columns)    // environment-dependent — always true
  assert.deepStrictEqual(some_dict, {                      // never leave object literals incomplete
  any assert call outside run_bool_assert_test             // causes exit on first failure

INPUT RULES:
  declare all inputs locally inside each run_bool_assert_test callback
  use fixed representative values: int_width = 80, int_height = 24, str_input = 'hello'
  for range checks use assert.ok(result > 0) — never assert exact environment values
  test edge cases: zero, empty string, negative numbers where relevant

WHAT TO TEST:
  return type is correct          → assert.strictEqual(typeof result, 'string')
  output shape is reasonable      → assert.ok(result.length > 0)
  edge cases throw or return safe → assert.throws(() => app.get_str_foo(-1))
  known fixed outputs             → assert.strictEqual(app.get_str_error('x'), 'Error: x')

END WITH summary count:
  console.log('Tests complete.');
`.trim();
