/* eslint-env node */

'use strict';

module.exports = {
	extends: 'ckeditor5',
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint'
	],
	root: true,
	ignorePatterns: [
		// Ignore the entire `dist/` (the NIM build).
		'dist/**',
		// Ignore compiled JavaScript files, as they are generated automatically.
		'src/**/*.js',
		// Also, do not check typing declarations, too.
		'src/**/*.d.ts'
	],
	rules: {
		//  This rule disallows importing from any path other than the package main entrypoint.
		'ckeditor5-rules/allow-imports-only-from-main-package-entry-point': 'error',
		// This rule ensures that all imports from `@ckeditor/*` packages are done through the main package entry points.
		// This is required for the editor types to work properly and to ease migration to the installation methods
		// introduced in CKEditor 5 version 42.0.0.
		'ckeditor5-rules/no-legacy-imports': 'error',
		// As required by the ECMAScript (ESM) standard, all imports must include a file extension.
		// If the import does not include it, this rule will try to automatically detect the correct file extension.
		'ckeditor5-rules/require-file-extensions-in-imports': [
			'error',
			{
				extensions: [ '.ts', '.js', '.json' ]
			}
		]
	},
	overrides: [
		{
			files: [ 'tests/**/*.[jt]s', 'sample/**/*.[jt]s' ],
			rules: {
				// To write complex tests, you may need to import files that are not exported in DLL files by default.
				// Hence, imports CKEditor 5 packages in test files are not checked.
				'ckeditor5-rules/ckeditor-imports': 'off'
			}
		}
	]
};
