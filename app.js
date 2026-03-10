import {$store, $update, appendChildren} from "unconscious";
import {questions, questions_zh} from "./exam_data/data/data.js";
import {showConfirm} from "./src/utils.js";
import {QuizApp} from "./src/QuizApp.js";
import {FEMALE, MALE, readFile, scoreMMPI} from "./exam_data/scorer.js";
import {renderReport} from "./exam_data/renderer.js";

const realStartTime = Date.now();
const examState = $store("examState", {
	startTime: realStartTime,
	submitTime: undefined,
	full: true
}, {persist: true});

const answers = $store("answers", {}, {persist: true});

function makeQuestions() {
	const out = [{
		title: "你的性别",
		type: "radio",
		choices: ["女", "男"]
	}];
	const questionCount = examState.full ? questions.length : 371;
	for (let i = 1; i < questionCount; i++) {
		out.push({
			title: questions[i]+"<br/>"+questions_zh[i],
			type: "radio",
			choices: ["是", "否"]
		});
	}
	return out;
}

const helloWorld = <div id="main">
		<div className="done-icon">MMPI-2中文测试</div>
		<div className={"question-card"}>
			<div className="q-header">
				<div className="q-title">明尼苏达多相人格问卷（Minnesota Multiphasic Personality Inventory）</div>
			</div>
			<div className="explain-box">
				MPPI是目前世界上使用范围很广和使用频率很高的人格与临床心理学测验之一。其初始版本由美国明尼苏达大学的心理学家于1943年编制。1990年代，香港中文大学和中国科学院心理研究所对此进行了修订。时至今日，MMPI已经发展到包括800多种量表的一个量表体系，被翻译成超过115种语言，在60多个国家使用。MMPI主要用于精神疾病的辅助临床诊断，以及心理咨询及心理治疗。
			</div>

			<div className="q-header">
				<div className="q-title">无论您是否曾学习过MMPI的相关知识，都建议您查看以下页面：</div>
			</div>

			<div className="choices">
				<div className="choice-item">
					<div className="choice-label">1</div>
					<span>
							<a href="https://zh.wikipedia.org/zh-hans/%E6%98%8E%E5%B0%BC%E8%8B%8F%E8%BE%BE%E5%A4%9A%E9%A1%B9%E4%BA%BA%E6%A0%BC%E9%97%AE%E5%8D%B7">维基百科</a>或
							<a href="https://baike.baidu.com/item/%E6%98%8E%E5%B0%BC%E8%8B%8F%E8%BE%BE%E5%A4%9A%E9%A1%B9%E4%BA%BA%E6%A0%BC%E6%B5%8B%E9%AA%8C/7059267">百度百科</a>
						</span>
				</div>
				<div className="choice-item">
					<div className="choice-label">2</div>
					<span>
							<a href="http://www.wzxljk.com/xlkp/2035280.jhtml">一篇科普文章</a>
						</span>
				</div>
				<div className="choice-item">
					<div className="choice-label">3</div>
					<span>
							<a href="https://skybrary.aero/articles/minnesota-multiphasic-personality-inventory-mmpi">英文版概述</a>
						</span>
				</div>
			</div>
			<div className="explain-box">
				全新界面由<a href="https://github.com/roj234/">Roj234 (GitHub)</a>设计&制作，感谢使用！<br/>
				如果您想深入了解MMPI的原理及专业的使用方式，可以设法阅读
				<a href="https://baike.baidu.com/item/MMPI-2%E4%B8%AD%E6%96%87%E7%AE%80%E4%BD%93%E5%AD%97%E7%89%88%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C/60347486?fr=aladdin">这本书。</a><br/>
				数据来源（没有它们就没有这个项目）：<br/>
				<a href="https://github.com/SHENGYUKing/MMPI_Test">中国常模1982 (GitHub)</a><br/>
				<a href="https://github.com/LLAA178/mmpi2-CN-normals">中国常模200X (GitHub)</a><br/>
				<a href="https://github.com/MMPI-CHN/MMPI-CHN.github.io">美国常模 (GitHub)</a>
			</div>
			<br/>
			<div style="display:flex;gap:12px;justify-content:center;">
				<button className="btn btn-secondary"
						onClick={() => showConfirm("重要提示，请认真阅读", "文件格式：每行 Q1: T<br/>请先选择男女，如果是男点确定。", () => quizFile(MALE), () => quizFile(FEMALE))}>上传结果
				</button>
				<button className="btn btn-primary"
						onClick={() => showConfirm("重要提示，请认真阅读", "<div style='text-align: left'>0、请勿空题！虽然该量表在设计时允许空题，但是这会产生蝴蝶效应，使得量表对于没有阅读障碍的被试的可信度大大降低。" +
							"<br/><br/>" +
							"1、我们不会收集任何与您有关的信息；做完量表后，会有一个提交按钮将数据交给前端脚本处理，本网站完全没有后端！" +
							"<br/><br/>" +
							"2、请认真对待该测验；MMPI是少有的具有完整理论与多年实践的专业（人格）量表，可以帮助您更好地认识自己。需要注意的是，由于该量表常用于临床，因此它主要着眼于您“<b>也许</b>存在的问题”以及“<b>也许</b>拥有的人格特质”。" +
							"<br/><br/>" +
							"3、该量表的结果仅供参考；<b style='color: red'>心理问题（如抑郁）的原始分通常是偏态分布（大多数人得低分，少数人得高分），而不是本网站代码所假设的正态分布。</b>现实中，对该量表做出解释高度依赖于被试的态度、职业，以及一些特殊情景（如近期事件）等；若您希望获得更详细的解答，可以保存我们给出的分数表格，并在日后咨询专业人士。" +
							"<br/><br/>" +
							"4、点击提交测试后，您将得到：一张人格剖析图，以及对应编码型的详尽解析，以及您作答的每个量表维度的简短解析；" +
							"<br/><br/>" +
							"5、本测验完全免费，不存在花钱买报告的情况。本项目由三个人开发，如果觉得做得还行，看完剖析图和报告后可以捐点钱给他们买游戏 :D" +
							"<br/><br/>" +
							"<b style='color: red'>6、做完第370题（我喜欢聚会等社交活动）后，所有临床量表数据均已收集完成，您可以在此时提交，或继续作答附加量表</b>" +
							"</div>", () => {

							// 写测验开始标记
							$update(examState);
							helloWorld.remove();
							renderQuiz();
						})}>开始测试
				</button>
			</div>
		</div>
</div>;


function renderQuiz() {
	appendChildren(document.body, <QuizApp startTime={examState.startTime} submitTime={examState.submitTime}
										   questions={makeQuestions()} submit={submit} reset={exitQuiz}></QuizApp>);
}

function exitQuiz() {
	examState.value = undefined;
	location.reload();
}

function submit(data) {
	examState.submitTime = Date.now();
	location.reload();
}

function quizFile(gender) {
	readFile().then((answers) => {
		helloWorld.remove();
		const scores = scoreMMPI(gender, answers);
		scores.stats.skip--;
		renderReport(scores, answers, 0);
	});
}

if (realStartTime === examState.startTime) {
	document.body.append(helloWorld);
} else if (examState.submitTime == null) {
	renderQuiz();
} else {
	document.body.append(<div className="done-icon">您的 MMPI-2 测试结果</div>);

	const data = answers.value;
	const timeUsed = examState.submitTime - examState.startTime;

	data.length = questions.length;

	const gender = data[0];
	// 请注意：未使用第零项
	data[0] = null;
	const answers1 = Array.from(data).map(v => {
		if (v === 0) return "T";
		if (v === 1) return "F";
		return null;
	});

	if (!answers1.find((v, i) => i >= 371)) answers1.length = 371;

	const scores = scoreMMPI(gender, answers1);
	scores.stats.skip--;
	renderReport(scores, answers1, timeUsed);

}

