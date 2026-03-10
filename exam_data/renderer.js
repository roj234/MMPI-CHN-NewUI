import {therapistArray} from "./data/therapist.js";
import {treatmentArray} from "./data/treatment.js";
import {profileArray} from "./data/profile.js";
import {CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip} from "chart.js";
import "./render.css";
import {formatTimeElapsed, showConfirm} from "../src/utils.js";
import {$store} from "unconscious";
import Annotation from "chartjs-plugin-annotation";

const coreScaleDescriptions = {
	"L": [70, 40, "测验结果的有效性存疑；受测者可能在有意“装好”，对自己的描述过于完美无瑕；受测者可能对测验有抵触感；受测者可能否认自己有任何缺点，不愿意承认哪怕是极微小的缺点；不现实地夸大自己的优点，声称自己符合极高的道德准则", "测验结果有效；若L的T分大于60，则受测者可能采取了“自我防御”的反应定势；受测者可能过于保守、循规蹈矩，自我要求过高、标准僵化", "T分过低，测验结果可能存在“装坏”的成分；受测者过分强调异常和病态，或过分自信而独立"],
	"F": [71, 56, "测验效度存疑；受测者可能不配合；可能在“装坏”；可能未能理解题目意思，无意间夸大了自己的心理问题；或者是有各方面较严重的心理障碍；但若被试是青年人，则可能是存在自我认同危机", "测验结果可能有效；显示受测者不希望被认为是传统型的，或是有较强的政治、宗教、社会信仰；自我苛刻，或是回答问题时极度坦诚；也许存在一定程度的心理失常的问题", "测试结果是可接受的；受测者是顺从的、保守的；受测者可能在“装好”"],
	"K": [71, 56, "表示受测者可能有很强的自我防御倾向；受测者可能在“装好”，也可能处于强烈的自我抑制当中，或是缺乏感情投入", "受测者有一定的自我防御倾向；受测者可能没有认识到或不承认自己存在心理问题；受测者十分独立，不愿意寻求帮助", "受测者自我防御倾向较低；受测者在“装坏”，又或者是对施测者极度坦诚"],
	"Hs": [65, 60, "T分高于65，高分，这反映出被测可能有以下部分（程度）的表现：过分关注身体；不清晰的躯体症状；胃部不适、疲劳、疼痛；自私、自我中心、自恋倾向；悲观、失败主义、愤世嫉俗的生活观；不满足、不愉快；诉苦、诉怨；需要他人关注、关心；对他人持批评态度；间接表达敌意；很少有失控行为；工作、学习效率降低，但无缺陷", "中等分，被测也许：关注自身的身体变化；常有不清晰具体位置的躯体不适；以自我为中心，对生活不满意；喜欢他人关注、关心；关注生活中的负性刺激", "低于平均的疑病水平，说明被试：也许不那么过分关注身体功能的问题，可能是自强、机敏、精力充沛的；也可能意味着受测者多以自己身体健康为傲，却忽略了疼痛、痛苦和疾患，直到问题变得相当严重；也许意味着抑郁情绪，反映了受测者对自己的身体健康不予关心、放任自流"],
	"D": [65, 60, "T分高于65，高分，这反映出被测可能有以下部分（程度）的表现：抑郁，不愉快；对未来悲观失望；自卑，无自信；常有负罪感；懒散，软弱，易疲劳，精力不足；主诉许多躯体症状；易怒，紧张，内心难以松弛", "中等分，被测也许：易于担忧；自觉无用，无法适应外界，常有失败感；典型的内向性格，害羞、胆小、畏缩；孤独，与外界保持距离；避免与人交往；敬小慎微，循规蹈矩；难以做出决定；过分自控，不冲动，不具有侵犯性；为避免冲突而忍让；有参与心理治疗的动机", "低于平均的抑郁水平，说明被试：通常较为开朗；若分数低于45，则被试可能表现出警觉、开朗、积极、自信、有幽默感，被别人认为是热情和友善的"],
	"Hy": [65, 60, "T分高于65，高分，这反映出被测可能有以下部分（程度）的表现：以各种躯体症状的方式来应对刺激或逃避责任；有头痛、胸痛、乏力或贫血的症状；躯体症状常突然出现，又突然消失；对躯体症状的原因缺乏认识；表现出慢性焦虑、紧张及抑郁；极少有幻觉", "中等分，被测也许：心理上显得特别不成熟，孩子气；特别自我中心，有自恋倾向；期待他人的关注，要求得到他人的情感；采用间接方式获取他人注意", "低于平均的癔症水平，说明被试：通常较为积极、现实；若分数低于45，则被试可能表现出过分地现实、世故，让人感觉刻薄生硬；少数人愤世嫉俗，甚至憎恶世人，认为人生充满苦难；但该项低分往往反映出被试是现实主义者，表现出的敌意并非必要，只是应对方式过于生硬，缺乏礼貌或圆滑"],
	"Pd": [65, 60, "T分高于65，高分，这反映出被测可能有以下部分（程度）的表现：反社会行为；有抗拒权威人物的行为；家庭关系不和，常吵闹；将问题归咎于他人；学校成绩不良，工作表现不佳；有婚姻及其他人际关系问题；有冲动行为；做事没计划，不考虑结果，只图一时之满足；无耐性，对挫折的容忍度很低；判断力较差，乐于冒险；很难吃一堑长一智，不吸取经验教训", "中等分，被测也许：不成熟，孩子气及自我中心；常自我卖弄、自我炫耀；对他人的需求不敏感；倾向于利用他人获取自己的利益；开始时可能很讨人喜欢，但人际关系难以深入，大多是肤浅的；里不能与他人形成互相关怀的依附关系；外向、健谈，动作多，表情丰富、自然；缺乏明确的生活目标；具有敌意及侵犯性，好挖苦讽刺，玩世不恭，有怨恨及抗拒行为；行为常常有侵犯性；对于自己的不良行为很少有负罪感，只是在遇到麻烦时才自责；通常都不会有焦虑、抑郁及精神病症状；对生活不满意，感觉空虚和无聊；缺乏深刻的情绪体验；当然，也往往会表现出精力旺盛、社会化、进取、主动、努力等积极的人格特质", "T分低于平均，也许有精力旺盛、社会化、进取、主动、努力等积极的人格特质，但在遭遇挫折时也可能转换为愤怒；当T分过低时（低于45），则反映出受测者拘泥于常规、稳定的行为模式，倾向于消极与不自信，不尝试冒险，通常比较依赖他人，甚至非常僵化地坚持和遵守传统"],
	"Mf": [],
	"Pa": [80, 60, "T分高于80，特高分，这反映出被测可能有以下部分（程度）的表现：明显的精神病患者行为，思维间断；被害妄想。或兼有自大妄想；关联妄想；认为自己被愚弄、被作践；易怒、不满、妒忌；常被诊断为精神分裂症或妄想状态", "若65≤T≤79，则反映出被测可能有以下部分（程度）的表现：具有妄想心理素质；对他人的行动过于敏感，常会反应过度；认为自己受到生活的不公平对待；常文过饰非，并责怪他人；多有怀疑、戒备他人的行为；对人怀有敌意，常不满他人而好争辩\n若60≤T≤64，则反映出被测可能有以下部分（程度）的表现：对人不友善，因不满他人而易发生冲突；常进行道德说教；过分强调理性。不愿意谈论情绪问题；与治疗者难以形成长期的互相信任的关系", "若36≤T≤59，则通常反应被测有着低于平均值的偏执水平；但对于更低的T分，则难以解释，必须综合其他因素判断，此处只能略过"],
	"Pt": [80, 60, "T分高于80，特高分，这反映出被测可能有以下部分（程度）的表现：焦虑、紧张、易烦恼；坐卧不宁、担心、忧虑；神经过敏；精力难以集中；内省，常沉思，有强迫观念；有不安全感及自卑感；缺乏自信，怀疑自己；自我意识强、自我苛求、自我贬低", "若65≤T≤79，则反映出被测可能有以下部分（程度）的表现：僵化、常进行道德说教；对己对人的要求很高；过度追求完美和维护道德良心；有抑郁感和负罪感\n若60≤T≤64，则反映出被测可能有以下部分（程度）的表现：常关注事务的整洁、秩序以及细枝末节；坚持以一种固定不变的方式完成任务；常缩手缩脚，解决问题缺乏真诚及首创性；犹豫不决；小题大做；害羞，社交不良；让人难以理解，常担心自己是否能被他人接受、欢迎；有身体症状；对某些问题可能有较深入的了解；倾向于用理智化的方式思考问题", "若46≤T≤59，则通常反应被测有着低于平均值的精神衰竭水平；更低的Pt值反映受测者处于放松、舒适且没有感情忧伤的状态，他们大多自信、适应良好、活动高效且能干，能够没有压力地安排自己的生活，尽管有些受测者可能由于缺少必要的焦虑而显得生活没有动力"],
	"Sc": [70, 60, "若Sc的T分高于80且量表有效，则被试可能存在严重的妄想、幻觉；T分高于70时，被测可能有以下部分（程度）的表现：也许觉得自己并非社会整体的一部分；感觉孤独，与他人疏远，被他人误解；不被周围人所接受，退缩并自我封闭；情绪体验令人无法理解；逃避与他人的接触，避免陌生的环境；害羞、冷淡，对一切都不参与、不投入；也许伴有广泛焦虑综合征；不满、有敌意、有侵犯性；不能表达情感，以幻想及白日梦的方式来对外部应激状态进行反应；将现实与非现实混为一谈，无法加以区分；怀疑自己，自卑，没有竞争性；对性相当关注，性别角色混乱；处处与众不同，与常规相违背，以自我为中心；可能有长期的身体疾患；常常十分固执，喜怒无常，不成熟、冲动；缺少解决问题的基本常识；治疗预后不良，但能维持长时间的治疗", "Sc的T分较高，被测也许：生活方式与众不同；不合群，与他人疏远，保持距离；自卑、冷淡、兴趣索然；以幻想为主要的防御手段；经常做白日梦；不成熟，有自恋倾向；有冲动、侵犯行为及焦虑表现", "受测者很可能不存在精神方面的问题；若T分小于45，受测者很可能是比较有实际生活经验的，在行为与日常生活中比较保守，较少内省和思索；通常，该类被试是顺从的、尽责的、可靠的且谨慎的，但也可能会比较无趣和刻板严格"],
	"Ma": [75, 60, "Ma的T分大于75，这反映出被测可能有以下部分（程度）的表现：过度活跃，或伴有极快频率的言语；有幻觉及自大妄想；情绪体验倒错；精力充足，谈话滔滔不绝；极端的自我欣赏；重行动，轻思考；不能聪明地运用自身能量，不能看透事情的结局；兴趣广泛，活动频繁，但对日常凡人、琐事的兴趣不高；对挫折的容忍度很低，很难抑制冲动，易激怒，有敌意及侵犯行为；常表现出没有现实根据、无原因的乐观态度；抱有不实际、夸大了的志向；夸大自我价值及自我重要性，看不到自身的局限性；开朗，善社交，喜欢集体活动；表现出阶段性焦躁不安或抑郁；抗拒心理治疗", "若65≤T≤74，则反映出被测可能有以下部分（程度）的表现：过分活跃；夸大自我价值，自恋；精力十足，讲话滔滔不绝，不加思考就采取行动；有广泛兴趣；不善于运用自身能量，做事虎头蛇尾；被人认为是有魄力、有主意的；对日常事务的兴趣不高；容易生厌及内心烦躁；对挫折的容忍度低；会冲动行事；也许曾有过被激怒、充满敌意地做出侵犯行为的情况；有时过分乐观；在某些方面自我夸大，看不到自身的局限性\n若60≤T≤64，则反映出被测可能有以下部分（程度）的表现：开朗、善社交、喜欢体育活动、愿意操纵和支配他人；常犯相同的错误；认为心理治疗是无必要的；会过早地结束疗程；当然，若被测是青年人，则也很可能暗示着一系列积极的特性，比如精力充沛、热情、开朗和活动能力强等", "若46≤T≤59，则通常反应被测有着低于平均值的轻躁狂水平；但若T分过低（45乃至35分以下），则可能表明：受测者正处于一种低精力水平、缺乏动力、倦怠的甚至是冷漠的状态（也许是疲劳或是生病，但更可能是预示其精力有限）；缺乏自信；可能面临着抑郁心境的困扰；可能年级较大（45岁以上），处于正常的衰老过程中"],
	"Si": [70, 60, "高分，被试可能：社交内向；只有独处，或与少数好友相处时才能自然放松；害羞、保守、退缩；有异性存在时会感到不自然；很难让人了解；对他人如何评价自己很敏感", "若65≤T≤69，中等分，则被试可能：对与他人缺乏情感感到忧虑不安；过分自我控制；很少公开表露自己的情感；被动、服从、遵从权威；严肃、可靠、值得信赖、谨慎、保守、循规蹈矩；个人做事节奏慢\n若60≤T≤64，正常分，则被试可能：态度及观点僵硬、不灵活；即使做小事也难以下定决心；很容易忧心忡忡，感到自责", "T≤59，低分，被试可能：善社交，外向；开朗，喜欢集体生活，友善，健谈；很需要有人在其身边；与集体的关系融洽；富于表情，语言丰富，活跃，精力充沛；对地位、权力及名誉感兴趣；寻找竞争机会；有时难以控制冲动；会不计后果而采取行动；不成熟，自我放任；人际关系可能浮浅而不正诚；喜欢支配他人，人际关系忽冷忽热"],
};

const otherScaleDescriptions = {
	ANX: "ANX（焦虑紧张）",
	FRS: "FRS（恐惧担心）",
	OBS: "OBS（强迫固执）",
	DEP: "DEP（抑郁空虚）",
	HEA: "HEA（关注健康）",
	BIZ: "BIZ（怪异思维）",
	ANG: "ANG（愤怒失控）",
	CYN: "CYN（愤世嫉俗）",
	ASP: "ASP（反社会行为）",
	TPA: "TPA（A型行为）",
	LSE: "LSE（自我低估）",
	SOD: "SOD（社交不适）",
	FAM: "FAM（家庭问题）",
	WRK: "WRK（负面工作态度）",
	TRT: "TRT（负面治疗指标）",
}

Chart.register([
	Annotation,
	LineController,
	LinearScale, CategoryScale,
	PointElement, LineElement,
	Tooltip, Legend
]);

function getTwoPointCode(coreScales) {
	const topTwo = coreScales
		.filter(item => item.tScore > 60)
		.sort((a, b) => b.tScore - a.tScore)
		.slice(0, 2)
		.map(item => item.kind); // 纠正索引偏移

	return topTwo.length === 2 ? topTwo.sort() : [0, 0];
}

function TextBlock({ id, title, content }) {
	if (!content) return null;
	return <>
		<h3>{title}</h3>
		<p dangerouslySetInnerHTML={content}></p>
	</>;
}

function colorTScore(tScore) {
	if (tScore && (tScore <= 40 || tScore >= 60)) {
		return <span style={(tScore <= 30 || tScore >= 70) ? "color: var(--danger)" : "color: var(--warning)"}>{tScore}</span>;
	}
	return tScore;
}

function ResultTable(coreScale, coreScaleDescription, otherScales) {
	const secondScales = [];
	otherScales = otherScales.filter(item => {
		if (item.id in otherScaleDescriptions) {
			item.translatedName = otherScaleDescriptions[item.id];
			secondScales.push(item);
			return false;
		}
		return true;
	});

	const renderer = (scale) => (
		<tr key={scale.id}>
			<td>{scale.translatedName || scale.name}<sup style={"float:right"}>{!scale.completionRate ? "N/A" : (100 * scale.completionRate).toFixed(2)+"%"}</sup></td>
			<td>{scale.tScore}</td>
			<td>{scale.raw}</td>
			<td>-</td>
		</tr>
	);

	return (
		<div className="report-card">
			<h3>详细量表分析</h3>
			<table className="data-table">
				<thead>
				<tr>
					<th style={{width: '18%'}}>量表名称</th>
					<th style={{width: '70px'}}>T 分<br/>美/中</th>
					<th style={{width: '70px'}}>原始分</th>
					<th>临床意义与解释</th>
				</tr>
				</thead>
				<tbody>
				{coreScale.map((scale) => {
					const res = coreScaleDescription[scale.id];
					if (!res) return null;
					const t = scale.tScore;
					// 逻辑判定解释文本
					const interpretation = t >= res[0] ? res[2] : (t >= res[1] ? res[3] : res[4]);

					return (
						<tr key={scale.id}>
							<td>
								{scale.translatedName || scale.name}
								<sub>{scale.id}</sub>
								<sup style={"float:right"}>{(100 * scale.completionRate).toFixed(2)}%</sup>
							</td>
							<td>{colorTScore(t)}/{colorTScore(scale.cnTScore)}</td>
							<td>{scale.raw}</td>
							<td><div className="interpretation-text">{interpretation}</div></td>
						</tr>
					);
				})}
				{secondScales.map(renderer)}
				{otherScales.map(renderer)}
				</tbody>
			</table>
		</div>
	);
}

function downloadFile(str, mimetype, filename) {
	const blob = new Blob([str], {type: mimetype});
	const link = <a download={filename}></a>;
	link.href = URL.createObjectURL(blob);
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(link.href);
}

export function renderReport(myFullData, answers, timeUsed) {
	const { coreScales, scales, rins, stats, errors } = myFullData;
	console.log(myFullData);
	const allScales = [
		...rins,
		...scales
	];

	if (stats.skip > 22) errors.push("Q(疑问)原始分过高");
	if (coreScales[1].raw > 10) errors.push("L(装好)原始分过高");

	// 计算编码
	const profile = coreScales.filter(v => v.kind != null).sort((a, b) => a.kind - b.kind);
	const [a, b] = getTwoPointCode(profile);

	const canvas = <canvas></canvas>;
	const resultWrapper = (
		<div className="report-container">
			<div className="report-card" style={{borderTop: '4px solid #4db8ff'}}>
				<h2>受测者编码型: <span>{a}{b} {a || b ? `(${profile[a].translatedName} & ${profile[b].translatedName})` : ""}</span>
					<span style="float:right">本次测试结果{!errors.length?"有效":"无效"}</span>
				</h2>
				{canvas}
				<p style={{textAlign: "center", fontSize: "12px"}}>中美常模百分位数据</p>
				<p>请注意：美国常模有K分校正，中国常模没有，这和数据源有关，若您的K原始分过高，结果可能不准</p>
				<h2>解读 <small>仅供参考，本网页无法替代专业心理咨询，也不作为治疗建议</small></h2>
				<p>{profileArray[a][b]}</p>

				<TextBlock title="疗法建议" content={treatmentArray[a][b] || treatmentArray[b][a]}/>
				<TextBlock title="咨询师解读" content={therapistArray[a][b] || therapistArray[b][a]}/>
				<TextBlock title="测试无效原因 详见 https://github.com/MMPI-CHN/MMPI-CHN.github.io/issues/3" content={errors.join("<br/>")}/>
				<div style="display:flex;gap:12px;justify-content:center;align-items: center;">
					<span>耗时: {formatTimeElapsed(Math.floor(timeUsed / 1000))}</span>
					<button className="btn btn-secondary"
							onClick={() => {

								let str = "";
								for (let i = 1; i < answers.length; i++) {
									str += "Q" + i + ": " + answers[i] + "\n";
								}

								downloadFile(str, "text/plain", "MMPI-2-answers.txt");

							}}>保存答案
					</button>
					<button className="btn btn-primary"
							onClick={() => showConfirm("提示", "点击确认，您将以JSON的形式导出机器可读的文本<br/>如果您只想保存网页用于查看，请退出并按下Ctrl+S", () => {

								downloadFile(JSON.stringify(myFullData), "application/json", "MMPI-2-result.json");

							})}>保存结果
					</button>
					<button className="btn btn-danger"
							onClick={() => showConfirm("数据清除确认", "点击确认，您将删除本地保存的所有数据并回到首页<br/>请确认您已经保存了需要的信息<br/>您也可以直接清除浏览器缓存", () => {
								$store("answers", undefined, {persist: true}).value = undefined;
								$store("examState", undefined, {persist: true}).value = undefined;
								location.reload();
							})}>清除数据
					</button>
					<span>T/F/Skip: {stats.t}/{stats.f}/{stats.skip}</span>
				</div>
			</div>

			{ResultTable(coreScales, coreScaleDescriptions, allScales)}
		</div>
	);

	// 渲染
	document.body.append(resultWrapper);

	// 渲染图表
	new Chart(canvas.getContext('2d'), buildChartConfig(coreScales));
}

function erf(x) {
	const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
	const p = 0.3275911;
	const sign = x < 0 ? -1 : 1;
	x = Math.abs(x);
	const t = 1.0 / (1.0 + p * x);
	const y = 1.0 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
	return sign * y;
}

function calculatePercentile(tScore) {
	const z = (tScore - 50) / 10;
	const p = (1 + erf(z / Math.SQRT2)) / 2;
	return Math.max(0, Math.min(100, p * 100)).toFixed(2);
}

function buildChartConfig(coreScales) {
	const mmpiData = {
		labels: coreScales.map(val => val.id + "(" + val.translatedName + ")"),
		datasets: [{
			label: "百分位 (美国常模)",
			hidden: true,
			data: coreScales.map(v => calculatePercentile(v.tScore)),
			borderColor: '#4db8ff',
			backgroundColor: 'rgba(77, 184, 255, 0.2)',
			borderWidth: 3,
		},{
			label: "百分位 (中国常模)",
			data: coreScales.map(v => calculatePercentile(v.cnTScore)),
			borderColor: '#22c55e',
			backgroundColor: 'rgb(34,197,94, 0.2)',
			borderWidth: 3,
		}]
	};

	return {
		type: 'line',
		data: mmpiData,
		options: {
			responsive: true,
			scales: {
				y: {
					min: 0,
					max: 100,
					ticks: { stepSize: 10 }
				}
			},
			plugins: {
				// 背景分区插件
				annotation: {
					annotations: {
						highZone: {
							type: 'box',
							yMin: calculatePercentile(60),
							yMax: 100,
							backgroundColor: 'rgba(255, 99, 132, 0.1)',
							borderWidth: 0,
							label: {
								display: true,
								content: '1x 标准差',
								position: 'start',
								color: 'rgba(255, 99, 132, 0.5)'
							}
						},
						lowZone: {
							type: 'box',
							yMin: 0,
							yMax: calculatePercentile(40),
							backgroundColor: 'rgba(255, 99, 132, 0.1)',
							borderWidth: 0,
							label: {
								display: true,
								content: '1x 标准差',
								position: 'start',
								color: 'rgba(255, 99, 132, 0.5)'
							}
						}
					}
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					padding: 12,
					callbacks: {
						label: function(context) {
							const tScore = coreScales[context.dataIndex][context.datasetIndex?"cnTScore":"tScore"];
							let label = ` T分数 (${context.datasetIndex?"中":"美"}国常模): ${tScore}`;
							if (tScore >= 60) label += " (偏高)";
							if (tScore <= 40) label += " (偏低)";
							return label;
						},
						afterLabel: function(context) {
							return ' 超越了 ' + context.parsed.y+"% 的人";
						}
					}
				}
			}
		}
	};
}
