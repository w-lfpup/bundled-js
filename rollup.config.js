import brotli from "rollup-plugin-brotli";

export default [{
	input: 'node_modules/wctk/dist/mod.js',
	output: {
		file: 'dist/wctk.js',
	},
	plugins: [
		brotli()
	]
},
{
	input: 'node_modules/coyote/dist/mod.js',
	output: {
		file: 'dist/coyote.js',
	},
	plugins: [
		brotli()
	]
},
{
	input: 'node_modules/timestep/dist/mod.js',
	output: {
		file: 'dist/timestep.js',
	},
	plugins: [
		brotli()
	]
},
{
	input: 'node_modules/jackrabbit/core/dist/mod.js',
	output: {
		file: 'dist/jackrabbit-core.js',
	},
	plugins: [
		brotli()
	]
}];