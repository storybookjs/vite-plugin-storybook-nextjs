import type { TransformResult } from "vite";
import { addClassComponentRefreshWrapper, addRefreshWrapper } from "./utils";

const refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
const reactCompRE = /extends\s+(?:React\.)?(?:Pure)?Component/;

export function applyFastRefresh(
	transformResult: TransformResult,
	id: string,
): TransformResult {
	console.log(id);
	console.log(transformResult.code);
	if (refreshContentRE.test(transformResult.code)) {
		return {
			...transformResult,
			code: addRefreshWrapper(transformResult.code, id),
		};
	}

	if (reactCompRE.test(transformResult.code)) {
		return {
			...transformResult,
			code: addClassComponentRefreshWrapper(transformResult.code, id),
		};
	}

	return transformResult;
}
