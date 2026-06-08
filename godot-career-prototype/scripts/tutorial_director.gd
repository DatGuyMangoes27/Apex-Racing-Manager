extends Node
## Autoload that drives per-screen, first-visit tutorial walkthroughs.
##
## Each screen calls report_screen_ready(section_id, steps, host) at the end of
## its build. On the first visit to that screen the director offers a gentle
## prompt; if accepted it plays an element-by-element walkthrough. A small "?"
## help button is added to every screen with steps so the walkthrough can be
## replayed at any time.

const TutorialOverlayScript = preload("res://scripts/tutorial_overlay.gd")
const PrototypeTheme = preload("res://scripts/prototype_theme.gd")

const HELP_Y := Color("F7EB53")

var _section := ""
var _steps: Array = []
var _host: Node = null
var _overlay: Control = null
var _help_button: Control = null


## Called by each screen after it finishes building its UI.
func report_screen_ready(section_id: String, steps: Array, host: Node) -> void:
	_section = section_id
	_steps = steps
	_host = host
	_ensure_help_button()
	if steps.is_empty():
		return
	if PrototypeState == null or not PrototypeState.has_method("are_tutorials_enabled"):
		return
	if not PrototypeState.are_tutorials_enabled():
		return
	if PrototypeState.is_screen_intro_seen(section_id):
		return
	_show_prompt()


## Replays the current screen's walkthrough on demand (the "?" button).
func replay_screen() -> void:
	if _steps.is_empty():
		return
	await _play_walkthrough()


func _show_prompt() -> void:
	if _overlay != null and is_instance_valid(_overlay):
		return
	if _host == null or not is_instance_valid(_host):
		return
	_overlay = TutorialOverlayScript.new()
	_overlay.mode = "prompt"
	_overlay.persona = _persona()
	_overlay.prompt_response.connect(_on_prompt_response)
	_host.add_child(_overlay)


func _on_prompt_response(accepted: bool) -> void:
	_free_overlay()
	if PrototypeState != null and PrototypeState.has_method("mark_screen_intro_seen"):
		PrototypeState.mark_screen_intro_seen(_section)
	if accepted:
		await _play_walkthrough()


func _play_walkthrough() -> void:
	if _overlay != null and is_instance_valid(_overlay):
		return
	if _host == null or not is_instance_valid(_host):
		return
	# Let the screen's layout settle so element global transforms are valid.
	await get_tree().process_frame
	await get_tree().process_frame
	if _host == null or not is_instance_valid(_host):
		return
	_overlay = TutorialOverlayScript.new()
	_overlay.mode = "walk"
	_overlay.steps = _steps
	_overlay.persona = _persona()
	_overlay.closed.connect(_on_walk_closed)
	_host.add_child(_overlay)


func _on_walk_closed(_completed: bool) -> void:
	_free_overlay()


func _free_overlay() -> void:
	if _overlay != null and is_instance_valid(_overlay):
		_overlay.queue_free()
	_overlay = null


func _persona() -> Dictionary:
	if PrototypeState != null and PrototypeState.has_method("get_tutorial_persona"):
		var value: Variant = PrototypeState.call("get_tutorial_persona")
		if value is Dictionary:
			return value
	return {"name": "Team Manager", "role": "Team Operations", "initials": "TM", "portrait_path": ""}


func _ensure_help_button() -> void:
	if _help_button != null and is_instance_valid(_help_button):
		_help_button.queue_free()
	_help_button = null
	if _host == null or not is_instance_valid(_host) or _steps.is_empty():
		return
	var vp := Vector2(1280.0, 720.0)
	if _host is Control and is_instance_valid(_host):
		vp = (_host as Control).get_viewport_rect().size
	var btn := Button.new()
	btn.text = "?"
	btn.size = Vector2(54.0, 54.0)
	# Sit just below the scaled top bar so it never overlaps its controls.
	btn.position = Vector2(vp.x - 78.0, maxf(96.0, vp.y * 0.075))
	btn.focus_mode = Control.FOCUS_NONE
	btn.z_as_relative = false
	btn.z_index = 1050
	btn.tooltip_text = "Replay screen tour"
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.add_theme_font_override("font", PrototypeTheme.font("bold"))
	btn.add_theme_font_size_override("font_size", 26)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.07, 0.10, 0.92)
	style.border_color = HELP_Y
	style.set_border_width_all(2)
	style.set_corner_radius_all(27)
	btn.add_theme_stylebox_override("normal", style)
	btn.add_theme_stylebox_override("hover", style)
	btn.add_theme_stylebox_override("pressed", style)
	btn.add_theme_color_override("font_color", HELP_Y)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.pressed.connect(replay_screen)
	_host.add_child(btn)
	_help_button = btn
