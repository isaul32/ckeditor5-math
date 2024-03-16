module.exports = {
	extends: [
		"ckeditor5",
		"plugin:@typescript-eslint/strict",
		"plugin:@typescript-eslint/stylistic-type-checked",
	],
	root: true,
	plugins: ["@typescript-eslint"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: true,
		__tsconfigRootDir: __dirname,
		ecmaVersion: "latest",
		sourceType: "module",
	},
	globals: {
		MathJax: true,
		katex: true,
		console: true,
	},
	ignorePatterns: [
		// Ignore the entire `build/` (the DLL build).
		"build/**",
		// Ignore compiled JavaScript files, as they are generated automatically.
		'src/**/*.js',
		// Also, do not check typing declarations, too.
		'src/**/*.d.ts'
	],
	rules: {
		// This rule disallows importing core DLL packages directly. Imports should be done using the `ckeditor5` package.
		// Also, importing non-DLL packages is not allowed. If the package requires other features to work, they should be
		// specified as soft-requirements.
		// Read more: https://ckeditor.com/docs/ckeditor5/latest/builds/guides/migration/migration-to-26.html#soft-requirements.
		"ckeditor5-rules/ckeditor-imports": "error",

		// This rule could not be found ???
		"ckeditor5-rules/use-require-for-debug-mode-imports": "off",

		"no-void": ["error", { allowAsStatement: true }],
	},
	overrides: [
		{
			files: [ 'tests/**/*.[jt]s', 'sample/**/*.[jt]s' ],
			rules: {
				// To write complex tests, you may need to import files that are not exported in DLL files by default.
				// Hence, imports CKEditor 5 packages in test files are not checked.
				"ckeditor5-rules/ckeditor-imports": "off",
			},
		},
		{
			env: {
				node: true,
			},
			files: [".eslintrc.{js,cjs}"],
			parserOptions: {
				sourceType: "script",
			},
		},
	],
};
