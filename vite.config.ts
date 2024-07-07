import { resolve } from 'path';
import { Plugin } from 'vite'
import { defineConfig } from 'vitest/config';
import { nodeExternals } from 'rollup-plugin-node-externals';


function externals(): Plugin {
	return {
		...nodeExternals({
			// Options here if needed
		}),
		name: 'node-externals',
		enforce: 'pre',
		apply: 'build',
	}
}

export default defineConfig( {
	plugins: [
		externals()
	],

	// https://vitejs.dev/guide/build#library-mode
	build: {
		lib: {
			entry: resolve( __dirname, 'src/index.ts' ),
			name: '@modernized/express',
			fileName: 'index'
		},
		rollupOptions: {
			external: [],
			output: {
				globals: {}
			}
		},
	},
	
	resolve: {
		// Change default resolution to node rather than browser
		mainFields: ['module', 'jsnext:main', 'jsnext'],
		conditions: ['node'],
	},

	// https://vitest.dev/config/
	test: {
		isolate: false,
		include: [
			'./test/**/*.test.ts'
		],
		coverage: {
			provider: 'v8',
			include: [ 'lib/*' ]
		}
	}
} );
