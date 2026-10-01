// raw view templates, see esbuild's --loader:.html=text in package.json
declare module "*.html" {
	const contents: string;
	export default contents;
}
