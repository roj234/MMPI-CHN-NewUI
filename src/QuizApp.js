import {$effect, $computed, $state, $store, $update, $watch, createSignal} from "unconscious";
import {formatTimeElapsed, showConfirm} from "./utils.js";

export function QuizApp({questions, startTime, submitTime, submit, reset}) {
	const currentQuestionRef = $store("questionNo", 0, {persist: true});
	const [currentQuestion, setCurrentQuestion] = createSignal(currentQuestionRef);
	const answers = $store("answers", {}, {persist: true});

	const [isWidgetOpened, setWidgetOpened] = createSignal($state(false));

	const quizStartTime = $store("beginTime", startTime, {persist: true});
	let quizTimer;

	if (startTime !== quizStartTime.value) {
		quizStartTime.value = startTime;
		answers.value = {};
		setCurrentQuestion(0);
	}

	const isFinished = null != submitTime;

	if (!isFinished) {
		quizTimer = setInterval(() => $update(quizStartTime), 1000);
	}

	const quizTimeStr = $computed(() => {
		const time = Math.floor(((isFinished ? submitTime : Date.now()) - quizStartTime) / 1000);
		return formatTimeElapsed(time);
	});

	function finishQuiz() {
		showConfirm(
			"确认完成答题？",
			"完成后将进行改卷，确定要提交吗？",
			() => {
				clearInterval(quizTimer);
				const data = JSON.stringify(answers);
				submit(data);
			}
		);
	}

	function resetQuiz() {
		showConfirm("重新作答", "将清除所有已作答内容并重新开始，确定吗？", () => {
			answers.value = {};
			setCurrentQuestion(-1);
			requestIdleCallback(() => {
				setCurrentQuestion(0);

				reset && reset();
			});
		});
	}

	function formatRightAnswer(q) {
		if (q.right == null) return "无标准答案";
		if (q.type === 'radio') return q.choices[q.right];
		if (q.type === 'checkbox') return q.right.map(i => q.choices[i]).join(', ');
		return "请参考解析";
	}

	const typeMap = {radio: '单选', checkbox: '多选', text: '简答'};

	function Question() {
		const idx = currentQuestion();
		const q = questions[idx];
		if (!q) return;

		let a = answers[idx];

		let qHtml;
		if (q.type === "text") {
			qHtml = <textarea className="text-answer"
							  placeholder="请在此输入你的答案…"
							  disabled={isFinished}
							  onInput={e => answers[idx] = e.target.value}>
			{a}
		</textarea>;
		} else if (q.type === "checkbox") {
			if (!a) a = answers[idx] = Array(q.choices.length).fill(false);

			qHtml = <div className="choices" onClick.delegate(".choice-item")={e => {
				if (isFinished) return;
				const selected = e.delegateTarget;
				a[selected._id] = selected.classList.toggle("selected");
			}}>
			{q.choices.map((choice, index) => {
				let cls = a[index] ? "selected" : "";
				if (isFinished) {
					const shouldSelect = q.right.includes(index);
					if (shouldSelect !== a[index]) {
						cls = shouldSelect ? "selected" : "wrong";
					} else {
						cls = shouldSelect ? "correct" : "";
					}
				}
				return <div className={"choice-item "+cls} _id={index}>
					<div className="choice-label">{String.fromCharCode(65 + index)}</div>
					<span dangerouslySetInnerHTML={choice}></span>
				</div>;
			})}
		</div>;
		} else if (q.type === "radio") {
			qHtml = <div className="choices" onClick.delegate(".choice-item")={e => {
				if (isFinished) return;
				const old = qHtml.querySelector(".selected");
				const selected = e.delegateTarget;
				if (old === selected) return;

				old?.classList.remove("selected");
				selected.classList.add("selected");
				if (answers[idx] == null) requestIdleCallback(nextQuestion);
				answers[idx] = selected._id;
			}}>
			{q.choices.map((choice, index) => {
				let cls = index === a ? "selected" : "";
				if (isFinished && q.right != null) {
					if (index === q.right) cls = "correct";
					else if (index === a) cls = "wrong";
					else cls = "";
				}
				return <div className={"choice-item "+cls} _id={index}>
					<div className="choice-label">{String.fromCharCode(65 + index)}</div>
					<span dangerouslySetInnerHTML={choice}></span>
				</div>;
			})}
		</div>;
		}

		return <div className={["question-card", isFinished ? "finished" : null]}>
			<div className="q-header">
				<span className={"q-badge " + q.type}>{typeMap[q.type]}</span>
				<div className="q-title" dangerouslySetInnerHTML={q.title}></div>
			</div>
			{qHtml}
			{isFinished && q.right != null ?
				<div className="explain-box">
					你的答案: {a}<br/>
					正确答案: {formatRightAnswer(q)}<br/>
					<div className="explain-title">💡 题目解析</div>
					{q.explain}
				</div> : null}
		</div>;
	}

	function hasAnswer(i) {
		const q = questions[i];
		const a = answers[i];
		if (!q) return;

		if (q.type === "radio") return a != null;
		if (q.type === "checkbox")  return a?.find(v => !!v);
		if (q.type === "text")   return typeof a === "string" && a.trim();
	}

	function nextQuestion() {
		const i = currentQuestion();

		if (i + 1 === questions.length) {
			finishQuiz();
		} else

		if (!hasAnswer(i) && !isFinished) {
			showConfirm(
				"尚未作答",
				"你还没有回答这道题，是否跳过？",
				() => setCurrentQuestion(i+1)
			);
		} else {
			setCurrentQuestion(i+1);
		}
	}

	let widgetGrid;

	function getWidgetGridState(i) {
		let classes = hasAnswer(i) ? "answered" : "";

		if (classes && isFinished) {
			const q = questions[i];
			if (q.right != null) {
				const a = answers[i];

				if (q.type === "radio") {
					classes = a === q.right ? "correct" : "wrong";
				} else if (q.type === "checkbox") {
					const array = Array(q.choices.length).fill(false);
					q.right.forEach((choice) => array[choice] = true);

					classes = array.toString() === a.toString() ? "correct" : "wrong";
				}
			}
		}

		if (currentQuestion() === i) classes = (classes||"answered") + " current";
		return classes;
	}

	function updateWidgetGridState() {
		const i = currentQuestion();
		if (i < 0) return;

		const prev = widgetGrid.querySelector(".current");
		if (prev) prev.className = getWidgetGridState(prev._id);
		const currentGridNode = widgetGrid.children[i];
		currentGridNode.className = getWidgetGridState(i);
	}

	$effect(() => {
		if (isWidgetOpened()) {
			setTimeout(() => {
				widgetGrid.children[currentQuestion()].scrollIntoViewIfNeeded();
			}, 100); // < 250ms
		}
	})

	$watch(answers, updateWidgetGridState, false);
	$watch(currentQuestionRef, updateWidgetGridState, false);

	function WidgetGrid() {
		return <div className="widget-grid" ref={widgetGrid}>{
			questions.map((q, i) => {
				let cls = getWidgetGridState(i);

				return <div className={cls} _id={i} onClick={() => setCurrentQuestion(i)}
							title={"第" + (i + 1) + "题"}>{i + 1}</div>;
			})
		}</div>;
	}

	return <>
		<div id="top">
			<div className="wrap">
				<span>第 <strong>{() => currentQuestion() + 1}</strong> 题 / 共 <strong>{() => questions.length}</strong> 题</span>
				<div id="progress-bar-wrap">
					<div id="progress-bar"
						 style:reactive={{width: () => ((currentQuestion() + (isFinished || hasAnswer(currentQuestion()) ? 1 : 0)) / questions.length) * 100 + "%"}}></div>
				</div>
			</div>
		</div>

		<div id="main">
			{$computed(Question, [currentQuestionRef])}
		</div>

		<div id="bottom-bar">
			<button className="btn btn-ghost" id="btn-prev" disabled={() => currentQuestion() === 0} onClick={() => {
				if (currentQuestion() > 0) setCurrentQuestion(currentQuestion() - 1);
			}}>◀ 上一题
			</button>
			<button className="btn btn-primary" id="btn-next" onClick={nextQuestion}>
				{() => currentQuestion() + 1 === questions.length ? "交卷" : "下一题 ▶"}
			</button>
		</div>

		<button id="widget-toggle" onClick={() => setWidgetOpened(!isWidgetOpened())} title="题目总览">≡</button>

		<div id="widget-panel" className:reactive={{open: isWidgetOpened}}>
			<div className="widget-header">
				<span>📋 答题总览</span>
				<button onClick={() => setWidgetOpened(false)}
						style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer">✕
				</button>
			</div>
			<div className="widget-timer">
				<span id="timer-display">{quizTimeStr}</span>
				<small>答题用时</small>
			</div>
			<WidgetGrid></WidgetGrid>
			<div className="widget-legend">
				<div className="legend-item">
					<div className="legend-dot" style="background:#dbeafe;border:1.5px solid var(--primary)"></div>
					已作答
				</div>
				<div className="legend-item">
					<div className="legend-dot" style="background:var(--light);border:1.5px solid var(--border)"></div>
					未作答
				</div>
				<div className="legend-item">
					<div className="legend-dot" style="background:#dcfce7;border:1.5px solid var(--success)"></div>
					正确
				</div>
				<div className="legend-item">
					<div className="legend-dot" style="background:#fee2e2;border:1.5px solid var(--danger)"></div>
					错误
				</div>
			</div>
			<div className="widget-actions">
				<button className="btn btn-ghost" onClick={resetQuiz} disabled={isFinished}>🔄 重新作答</button>
				<button className="btn btn-primary" onClick={finishQuiz} disabled={isFinished}>✅ 完成答题</button>
			</div>
		</div>
	</>;
}
