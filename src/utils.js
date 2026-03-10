
export function formatTimeElapsed(time) {
	const h = String(Math.floor(time / 3600)).padStart(2, "0");
	const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
	const s = String(time % 60).padStart(2, "0");
	return `${h}:${m}:${s}`;
}


export function showConfirm(title, msg, onOk, onCancel) {
	function closeModal() { modal.remove(); }

	const modal = <modal style={"display: flex"}>
		<div className="modal-mask">
			<div className="modal-box">
				<h3>{title}</h3>
				<p dangerouslySetInnerHTML={msg}></p>
				<div className="modal-btns">
					<button className="btn btn-ghost"
							onClick={() => {closeModal(); onCancel && onCancel(); }}>{onCancel !== null ? "取消" : "关闭"}</button>
					{onOk ? <button className="btn btn-primary" onClick={()=> {closeModal(); onOk();}}>确定</button> : null}
				</div>
			</div>
		</div>
	</modal>;

	document.body.append(modal);
}