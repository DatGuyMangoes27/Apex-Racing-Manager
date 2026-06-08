## Headless: tutorial state gating/persistence + overlay step sequencing.
extends SceneTree

const PrototypeStateScr := preload("res://scripts/prototype_state.gd")
const TutorialOverlayScr := preload("res://scripts/tutorial_overlay.gd")


func _init() -> void:
	call_deferred("_start")


func _start() -> void:
	quit(await _run())


func _run() -> int:
	# ── Tutorial state: defaults, gating, reset, persistence ──────────────────
	var ps = PrototypeStateScr.new()
	ps.call("set_save_file_path", "user://savegame-tutorial-test.json")
	ps.reset_to_defaults()

	if ps.is_screen_intro_seen("home"):
		push_error("tutorial_director_smoke_test: fresh state must not have seen home")
		return 1
	if not ps.are_tutorials_enabled():
		push_error("tutorial_director_smoke_test: tutorials should default to enabled")
		return 1

	ps.mark_screen_intro_seen("home")
	if not ps.is_screen_intro_seen("home"):
		push_error("tutorial_director_smoke_test: home should be seen after marking")
		return 1

	# Persistence round-trip.
	ps.save_game()
	ps.reset_to_defaults()
	if ps.is_screen_intro_seen("home"):
		push_error("tutorial_director_smoke_test: reset_to_defaults should clear seen intros")
		return 1
	ps.load_game()
	if not ps.is_screen_intro_seen("home"):
		push_error("tutorial_director_smoke_test: load_game should restore seen intros")
		return 1

	ps.reset_screen_intros()
	if ps.is_screen_intro_seen("home"):
		push_error("tutorial_director_smoke_test: reset_screen_intros should re-arm all intros")
		return 1

	# Disabling tutorials persists too.
	ps.set_tutorials_enabled(false)
	if ps.are_tutorials_enabled():
		push_error("tutorial_director_smoke_test: tutorials should report disabled")
		return 1
	ps.free()

	# ── Overlay step sequencing: next / back / done / skip ────────────────────
	var host := Control.new()
	host.size = Vector2(1280.0, 720.0)
	root.add_child(host)
	var anchor := Control.new()
	anchor.size = Vector2(220.0, 120.0)
	anchor.position = Vector2(120.0, 140.0)
	host.add_child(anchor)

	var overlay = TutorialOverlayScr.new()
	overlay.mode = "walk"
	overlay.persona = {"name": "Team Manager", "initials": "TM"}
	overlay.steps = [
		{"target": anchor, "title": "One", "body": "First."},
		{"target": anchor, "title": "Two", "body": "Second."},
		{"target": anchor, "title": "Three", "body": "Third."},
	]
	var done_state := {"closed": false, "completed": false}
	overlay.closed.connect(func(c: bool) -> void:
		done_state["closed"] = true
		done_state["completed"] = c)
	host.add_child(overlay)
	await process_frame

	if overlay.step_index != 0:
		push_error("tutorial_director_smoke_test: overlay should start at step 0")
		return 1
	overlay._on_next()
	if overlay.step_index != 1:
		push_error("tutorial_director_smoke_test: Next should advance to step 1")
		return 1
	overlay._on_back()
	if overlay.step_index != 0:
		push_error("tutorial_director_smoke_test: Back should return to step 0")
		return 1
	overlay._on_next()
	overlay._on_next()
	overlay._on_next() # past the last step -> Done
	if not bool(done_state["closed"]) or not bool(done_state["completed"]):
		push_error("tutorial_director_smoke_test: finishing the last step should emit closed(true)")
		return 1

	# Skip emits closed(false).
	var overlay2 = TutorialOverlayScr.new()
	overlay2.mode = "walk"
	overlay2.persona = {"name": "Team Manager"}
	overlay2.steps = [{"target": anchor, "title": "Only", "body": "x"}]
	var skip_state := {"closed": false, "completed": true}
	overlay2.closed.connect(func(c: bool) -> void:
		skip_state["closed"] = true
		skip_state["completed"] = c)
	host.add_child(overlay2)
	await process_frame
	overlay2._on_skip()
	if not bool(skip_state["closed"]) or bool(skip_state["completed"]):
		push_error("tutorial_director_smoke_test: Skip should emit closed(false)")
		return 1

	# ── Director gating (only if the autoload is live in this run) ─────────────
	var director = root.get_node_or_null("TutorialDirector")
	var live_state = root.get_node_or_null("PrototypeState")
	if director != null and live_state != null:
		live_state.reset_to_defaults()
		var d_host := Control.new()
		d_host.size = Vector2(1280.0, 720.0)
		root.add_child(d_host)
		var d_anchor := Control.new()
		d_anchor.size = Vector2(200.0, 100.0)
		d_host.add_child(d_anchor)
		var d_steps := [{"target": d_anchor, "title": "T", "body": "B", "affects": "A"}]
		director.report_screen_ready("calendar", d_steps, d_host)
		if not _has_overlay(d_host):
			push_error("tutorial_director_smoke_test: first visit should add a prompt overlay")
			return 1
		director._on_prompt_response(false)
		await process_frame
		if not live_state.is_screen_intro_seen("calendar"):
			push_error("tutorial_director_smoke_test: skipping the prompt should mark the screen seen")
			return 1
		director.report_screen_ready("calendar", d_steps, d_host)
		if _has_overlay(d_host):
			push_error("tutorial_director_smoke_test: a seen screen should not re-prompt")
			return 1
		if not _has_help_button(d_host):
			push_error("tutorial_director_smoke_test: a screen with steps should have a help button")
			return 1
	else:
		print("tutorial_director_smoke_test: autoload director not present in this run; skipped integration checks")

	DirAccess.remove_absolute(ProjectSettings.globalize_path("user://savegame-tutorial-test.json"))
	print("tutorial_director_smoke_test: OK")
	return 0


func _has_overlay(host: Control) -> bool:
	for child in host.get_children():
		if child is Control and (child as Control).get_script() == TutorialOverlayScr:
			return true
	return false


func _has_help_button(host: Control) -> bool:
	for child in host.get_children():
		if child is Button and (child as Button).text == "?":
			return true
	return false
