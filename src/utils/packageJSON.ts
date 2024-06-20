import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { findUp } from "find-up";

type PackageJSON = {
	name: string;
	version: string;
	type: "module" | "commonjs";
};

export async function getPackageJSON(cwd: string): Promise<PackageJSON> {
	const packageJSONPath = await findUp("package.json", { cwd });
	assert(
		packageJSONPath,
		"Could not find a package.json file in the current directory or any of its parents.",
	);
	return JSON.parse(await readFile(packageJSONPath, "utf-8"));
}