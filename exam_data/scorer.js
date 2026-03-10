import {rin, scales, tScoreCategories} from "./data/data.js";

export const MALE = 1, FEMALE = 0;

/**
 * 重构的 MMPI-2 打分函数
 * @param {FEMALE | MALE} gender
 * @param {Array<"T" | "F" | null>} answers
 */
export function scoreMMPI(gender, answers) {
	// 基础统计
	const stats = { t: 0, f: 0, skip: 0 };
	answers.forEach((val) => {
		if (val === "T") stats.t++;
		else if (val === "F") stats.f++;
		else stats.skip++;
	});

	// 计算 RIN (TRIN/VRIN) 量表
	const rinResults = rin.map(([info, pairs, maleTable, femaleTable]) => {
		let raw = info[2]; // 初始分
		pairs.forEach(([q1, a1, q2, a2, weight]) => {
			if (answers[q1] === a1 && answers[q2] === a2) {
				raw += weight;
			}
		});
		return {
			id: info[0],
			name: info[1],
			raw,
			tScore: (gender === MALE ? maleTable : femaleTable)[raw]
		};
	});

	const fromNormalDistribution = (raw, mean, stddev, isSpecialFemale = false) => {
		let t = isSpecialFemale
			? -(raw - mean) / stddev * 10 + 50
			: (raw - mean) / stddev * 10 + 50;
		return Math.round(t);
	};

	const MMPI_MAP = {
		"1": "Hs", // 疑病 Hypochondriasis
		"2": "D",  // 抑郁 Depression
		"3": "Hy", // 癔症 Hysteria
		"4": "Pd", // 精神病态 Psychopathic Deviate
		"5": "Mf", // 男/女性气质 Masculinity-Femininity
		"6": "Pa", // 偏执 Paranoia
		"7": "Pt", // 精神衰弱 Psychasthenia
		"8": "Sc", // 精神分裂 Schizophrenia
		"9": "Ma", // 轻躁狂 Hypomania
		"0": "Si"  // 社会内向 Social Introversion
	};
	const coreScales = {};

	// 计算主量表
	const scaleResults = scales.map((scale, index) => {
		const [
			header,
			trueList, falseList,
			...tables
		] = scale;

		// 计算原始分 (Raw Score)
		const rawScore =
			trueList.reduce((acc, q) => acc + (answers[q] === "T" ? 1 : 0), 0) +
			falseList.reduce((acc, q) => acc + (answers[q] === "F" ? 1 : 0), 0);

		// 计算回答完整度
		const totalPossible = trueList.length + falseList.length;
		const answeredCount = [...trueList, ...falseList].filter(q => answers[q] === "T" || answers[q] === "F").length;

		// 计算 T 分
		const scores = {};
		const isMfFemale = header[2] === "Masculinity-Femininity - Female";
		for (let i = gender === MALE ? 0 : 1; i < tables.length; i += 2) {
			const tParams = tables[i];
			if (tParams) {
				const catId = tScoreCategories[Math.floor(i / 2)][0];
				let tScore;

				if (tParams.length === 3) {
					// Uniform (WIP)
					const [A, B, C] = tParams;
					tScore = A + B * rawScore + C * rawScore * rawScore;
				} else if (tParams.length === 2) {
					// Mean/Stddev
					tScore = fromNormalDistribution(rawScore, tParams[0], tParams[1], isMfFemale);
				} else if (tParams.length === 5) {
					// Mean/Stddev with K Correction
					scores["kScore"+catId] = fromNormalDistribution(rawScore, tParams[0], tParams[1]);

					tScore = fromNormalDistribution(rawScore + Math.round(tParams[2] * coreScales["K"].raw), tParams[3], tParams[4]);
				} else {
					// Legacy

					let score = rawScore;
					if (tParams[0]) {
						// K correction
						score = Math.floor(coreScales["K"].raw * tParams[0] + rawScore + 0.5);
						scores["kScore"+catId] = score;
					}

					tScore = tParams[score + 1];
				}

				scores["tScore"+catId] = tScore;
			}
		}

		if (header[0]?.length === 1) {
			if (
				!header[2].startsWith("Masculinity-Femininity")
				|| isMfFemale === (gender === FEMALE)
			) {
				const id = MMPI_MAP[header[0]] ?? header[0];
				const result = {
					id,
					translatedName: header[1],
					name: header[2],
					raw: rawScore,
					...scores,
					completionRate: answeredCount / totalPossible,
				};
				if (MMPI_MAP[header[0]]) result.kind = parseInt(header[0]);
				coreScales[id] = result;
			}

			return;
		}

		return {
			id: header[1],
			name: header[2],
			raw: rawScore,
			...scores,
			completionRate: answeredCount / totalPossible
		};
	}).filter(x => x);

	// 剖面图提升 (Profile Elevation)
	const CLINICAL_SCALE_KEYS = new Set(["Hs", "D", "Hy", "Pd", "Pa", "Pt", "Sc", "Ma"]);

	let profileElevation = 0;
	const validationErrors = [];
	for (const key in coreScales) {
		const tScore = coreScales[key].tScore;
		if (CLINICAL_SCALE_KEYS.has(key)) profileElevation += tScore || 0;
		if (tScore == null && key !== "L") validationErrors.push(coreScales[key].name+"原始分超出范围");
	}
	profileElevation /= CLINICAL_SCALE_KEYS.size;

	return {
		stats,
		rins: rinResults,
		scales: scaleResults,
		coreScales: Object.values(coreScales),
		profileElevation,
		errors: validationErrors
	};
}

/**
 *
 * @return {Promise<{}>}
 */
export function readFile() {
	return new Promise((resolve, reject) => {
		const fileInput	= <input type="file" accept="text/plain" onChange={async (event) => {
			const file = event.target.files[0];
			if (!file) return;

			try {
				resolve(parseTextToArray(await file.text()));
			} catch (err) {
				reject(err);
			}
		}} />;

		fileInput.click();
	})
}

/**
 * 解析逻辑
 * @param {string} content
 * @returns {Array}
 */
function parseTextToArray(content) {
	const result = Array(371).fill(null);
	// 按行分割并过滤空行
	const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");

	lines.forEach(line => {
		// 使用正则匹配 索引: 内容 (例如 "99: DEF")
		const match = line.match(/^Q?(\d{1,3}):\s*(.*)$/);
		if (match) {
			const index = parseInt(match[1]);

			let a;
			switch (match[2].trim()[0]) {
				case "T":
				case "t":
				case "Y":
				case "y":
				case "X":
				case "x":
					a = "T";
					break;
				case "F":
				case "f":
				case "N":
				case "n":
				case "O":
				case "o":
					a = "F";
					break;
				default:
					a = null;
					break;
			}
			result[index] = a;
		}
	});

	return result;
}
