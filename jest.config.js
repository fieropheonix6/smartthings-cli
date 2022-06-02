module.exports = {
	preset: 'ts-jest',
	testMatch: [
		'**/__tests__/**/*.test.ts',
	],
	setupFilesAfterEnv: ['jest-extended'],
	collectCoverageFrom: ['src/**/*.ts'],
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'/__tests__/',
		'/src/typings/',
		'/src/index.ts',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/dist',
	],
	clearMocks: true,
	reporters: [
		'default',
		'github-actions',
	],
}