extends Control
## In-game tutorial overlay. Two modes:
##   "prompt" - a small assistant card offering the first-visit walkthrough.
##   "walk"   - dims the screen and spotlights each element step in turn.
## Lives in native viewport coordinates (added to the current scene), and reads
## element target rects from registered Control nodes via their global transform.

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")

signal prompt_response(accepted: bool)
signal closed(completed: bool)

const DIM := Color(0.02, 0.03, 0.05, 0.84)
const PANEL_BG := Color(0.05, 0.07, 0.10, 0.99)
const PANEL_BORDER := Color(1.0, 1.0, 1.0, 0.14)
const SPOT_BORDER := Color("F7EB53")
const Y := Color("F7EB53")
const COPY := Color(0.85, 0.87, 0.91, 0.94)
const MUTED := Color(0.64, 0.68, 0.74, 0.88)
const AFFECTS := Color(0.62, 0.86, 0.78, 0.95)
const SPOT_PAD := 14.0
const PAD := 40.0
const HEADER_H := 116.0
const TITLE_H := 38.0
const BTN_H := 52.0

var mode := "prompt"
var persona: Dictionary = {}
var steps: Array = []
var step_index := 0

var _border_panel: Panel
var _border_tween: Tween
var _portrait_cache: Texture2D


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	top_level = true
	z_as_relative = false
	z_index = 1100
	if mode == "prompt":
		_build_prompt()
	else:
		_build_walkthrough()


# ── Prompt mode ──────────────────────────────────────────────────────────────

func _build_prompt() -> void:
	_clear()
	var vp := get_viewport_rect().size
	var dim := ColorRect.new()
	dim.color = Color(0.02, 0.03, 0.05, 0.55)
	dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(dim)

	var card_w := clampf(vp.x * 0.42, 600.0, 820.0)
	var pad := PAD
	var text_w := card_w - pad * 2.0
	var title_text := "New screen"
	var body_text := "First time here. Want a quick walkthrough of what everything on this screen does?"
	var title_y := HEADER_H + 12.0
	var body_y := title_y + TITLE_H + 10.0
	var body_h := _text_height(body_text, "body", 19, text_w)
	var card_h := body_y + body_h + 32.0 + BTN_H + 28.0

	var pos := Vector2((vp.x - card_w) * 0.5, (vp.y - card_h) * 0.5)
	var card := _make_panel(pos, Vector2(card_w, card_h))
	add_child(card)

	_card_header(card, card_w, "QUICK INTRO")

	var title := _label(title_text, "title", 28, Y, Vector2(pad, title_y), Vector2(text_w, TITLE_H))
	card.add_child(title)
	var body := _label(body_text, "body", 19, COPY, Vector2(pad, body_y), Vector2(text_w, body_h + 6.0), true)
	card.add_child(body)

	var btn_y := card_h - BTN_H - 28.0
	var skip := _make_button("Skip", Vector2(pad, btn_y), Vector2(150.0, BTN_H), false)
	skip.pressed.connect(_on_prompt_skip)
	card.add_child(skip)

	var show_btn := _make_button("Show me", Vector2(card_w - pad - 210.0, btn_y), Vector2(210.0, BTN_H), true)
	show_btn.pressed.connect(_on_prompt_accept)
	card.add_child(show_btn)


func _on_prompt_accept() -> void:
	prompt_response.emit(true)


func _on_prompt_skip() -> void:
	prompt_response.emit(false)


# ── Walkthrough mode ─────────────────────────────────────────────────────────

func _build_walkthrough() -> void:
	if steps.is_empty():
		closed.emit(true)
		return
	step_index = clampi(step_index, 0, steps.size() - 1)
	_render_step()


func _render_step() -> void:
	_clear()
	_border_tween = null
	var vp := get_viewport_rect().size
	var step: Dictionary = steps[step_index] if steps[step_index] is Dictionary else {}
	var rect := _target_rect(step)
	var has_target := rect.size.x > 1.0 and rect.size.y > 1.0

	if has_target:
		rect = rect.grow(SPOT_PAD)
		rect = rect.intersection(Rect2(Vector2.ZERO, vp))
		_build_dim_frame(rect, vp)
		_build_spotlight_border(rect)
	else:
		var dim := ColorRect.new()
		dim.color = DIM
		dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		dim.mouse_filter = Control.MOUSE_FILTER_STOP
		add_child(dim)

	_build_step_card(step, rect, has_target, vp)


func _build_dim_frame(rect: Rect2, vp: Vector2) -> void:
	# Four opaque rects framing the highlighted hole.
	_add_dim(Rect2(0, 0, vp.x, rect.position.y))
	_add_dim(Rect2(0, rect.end.y, vp.x, vp.y - rect.end.y))
	_add_dim(Rect2(0, rect.position.y, rect.position.x, rect.size.y))
	_add_dim(Rect2(rect.end.x, rect.position.y, vp.x - rect.end.x, rect.size.y))


func _add_dim(area: Rect2) -> void:
	if area.size.x <= 0.0 or area.size.y <= 0.0:
		return
	var r := ColorRect.new()
	r.color = DIM
	r.position = area.position
	r.size = area.size
	r.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(r)


func _build_spotlight_border(rect: Rect2) -> void:
	_border_panel = Panel.new()
	_border_panel.position = rect.position
	_border_panel.size = rect.size
	_border_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = SPOT_BORDER
	style.set_border_width_all(3)
	style.set_corner_radius_all(6)
	_border_panel.add_theme_stylebox_override("panel", style)
	add_child(_border_panel)
	_border_tween = create_tween().set_loops()
	_border_tween.tween_property(_border_panel, "modulate:a", 0.35, 0.7).set_trans(Tween.TRANS_SINE)
	_border_tween.tween_property(_border_panel, "modulate:a", 1.0, 0.7).set_trans(Tween.TRANS_SINE)


func _build_step_card(step: Dictionary, rect: Rect2, has_target: bool, vp: Vector2) -> void:
	var card_w := clampf(vp.x * 0.46, 620.0, 880.0)
	var pad := PAD
	var text_w := card_w - pad * 2.0

	var body_text := str(step.get("body", ""))
	var affects := str(step.get("affects", "")).strip_edges()
	var affects_text := "Affects: " + affects

	var title_y := HEADER_H + 14.0
	var body_y := title_y + TITLE_H + 10.0
	var body_h := _text_height(body_text, "body", 19, text_w)
	var affects_y := body_y + body_h + 18.0
	var affects_h := _text_height(affects_text, "bold", 17, text_w) if not affects.is_empty() else 0.0
	var content_bottom := (affects_y + affects_h) if not affects.is_empty() else (body_y + body_h)
	var card_h := content_bottom + 30.0 + BTN_H + 28.0

	var pos := Vector2((vp.x - card_w) * 0.5, (vp.y - card_h) * 0.5)
	if has_target:
		# Place the card on whichever side of the hole has more room.
		var space_below := vp.y - rect.end.y
		var space_above := rect.position.y
		if space_below >= card_h + 40.0:
			pos.y = rect.end.y + 24.0
		elif space_above >= card_h + 40.0:
			pos.y = rect.position.y - card_h - 24.0
		else:
			pos.y = clampf((vp.y - card_h) * 0.5, 20.0, max(20.0, vp.y - card_h - 20.0))
		pos.x = clampf(rect.position.x + rect.size.x * 0.5 - card_w * 0.5, 24.0, max(24.0, vp.x - card_w - 24.0))

	var card := _make_panel(pos, Vector2(card_w, card_h))
	add_child(card)

	_card_header(card, card_w, "%d / %d" % [step_index + 1, steps.size()])

	var title := _label(str(step.get("title", "")), "title", 26, Y, Vector2(pad, title_y), Vector2(text_w, TITLE_H))
	card.add_child(title)

	var body := _label(body_text, "body", 19, COPY, Vector2(pad, body_y), Vector2(text_w, body_h + 6.0), true)
	card.add_child(body)

	if not affects.is_empty():
		var affects_label := _label(affects_text, "bold", 17, AFFECTS, Vector2(pad, affects_y), Vector2(text_w, affects_h + 6.0), true)
		card.add_child(affects_label)

	# Controls row.
	var btn_y := card_h - BTN_H - 28.0
	var skip := _make_button("Skip", Vector2(pad, btn_y), Vector2(130.0, BTN_H), false)
	skip.pressed.connect(_on_skip)
	card.add_child(skip)

	var is_last := step_index >= steps.size() - 1
	var next := _make_button("Done" if is_last else "Next", Vector2(card_w - pad - 160.0, btn_y), Vector2(160.0, BTN_H), true)
	next.pressed.connect(_on_next)
	card.add_child(next)

	if step_index > 0:
		var back := _make_button("Back", Vector2(card_w - pad - 160.0 - 20.0 - 150.0, btn_y), Vector2(150.0, BTN_H), false)
		back.pressed.connect(_on_back)
		card.add_child(back)


func _on_next() -> void:
	if step_index >= steps.size() - 1:
		closed.emit(true)
		return
	step_index += 1
	_render_step()


func _on_back() -> void:
	if step_index <= 0:
		return
	step_index -= 1
	_render_step()


func _on_skip() -> void:
	closed.emit(false)


# ── Shared builders ──────────────────────────────────────────────────────────

func _card_header(card: Control, card_w: float, eyebrow: String) -> void:
	var accent := ColorRect.new()
	accent.color = Y
	accent.position = Vector2(0.0, 0.0)
	accent.size = Vector2(card_w, 5.0)
	card.add_child(accent)

	var portrait := _portrait_node()
	portrait.position = Vector2(PAD, 28.0)
	portrait.size = Vector2(72.0, 72.0)
	card.add_child(portrait)

	var text_x := PAD + 90.0
	var counter_w := 110.0
	var name_w := card_w - text_x - counter_w - 16.0

	var name_label := _label(str(persona.get("name", "Team Manager")), "bold", 19, Color.WHITE, Vector2(text_x, 34.0), Vector2(name_w, 26.0))
	name_label.clip_text = true
	name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	card.add_child(name_label)

	var role_label := _label(str(persona.get("role", "Team Operations")), "body", 15, MUTED, Vector2(text_x, 64.0), Vector2(name_w, 22.0))
	role_label.clip_text = true
	role_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	card.add_child(role_label)

	var eyebrow_label := _label(eyebrow, "caps", 15, MUTED, Vector2(card_w - PAD - counter_w, 36.0), Vector2(counter_w, 22.0))
	eyebrow_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	card.add_child(eyebrow_label)

	var divider := ColorRect.new()
	divider.color = Color(1.0, 1.0, 1.0, 0.10)
	divider.position = Vector2(PAD, HEADER_H - 12.0)
	divider.size = Vector2(card_w - PAD * 2.0, 1.0)
	card.add_child(divider)


func _portrait_node() -> Control:
	var tex := _portrait_texture()
	if tex != null:
		var rect := TextureRect.new()
		rect.texture = tex
		rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		rect.clip_contents = true
		return rect
	var fallback := Panel.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.16, 0.18, 0.22, 1.0)
	style.set_corner_radius_all(8)
	fallback.add_theme_stylebox_override("panel", style)
	var initials := _label(str(persona.get("initials", "TM")), "bold", 30, Y, Vector2(0.0, 24.0), Vector2(86.0, 40.0))
	initials.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	fallback.add_child(initials)
	return fallback


func _portrait_texture() -> Texture2D:
	if _portrait_cache != null:
		return _portrait_cache
	var path := str(persona.get("portrait_path", "")).strip_edges()
	if path.is_empty():
		return null
	if ResourceLoader.exists(path):
		var res: Variant = load(path)
		if res is Texture2D:
			_portrait_cache = res
			return _portrait_cache
	var globalized := ProjectSettings.globalize_path(path)
	if FileAccess.file_exists(globalized):
		var img := Image.new()
		if img.load(globalized) == OK:
			_portrait_cache = ImageTexture.create_from_image(img)
			return _portrait_cache
	return null


func _make_panel(pos: Vector2, panel_size: Vector2) -> Control:
	var panel := Panel.new()
	panel.position = pos
	panel.size = panel_size
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_BG
	style.border_color = PANEL_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	style.shadow_color = Color(0, 0, 0, 0.5)
	style.shadow_size = 18
	panel.add_theme_stylebox_override("panel", style)
	return panel


func _make_button(text: String, pos: Vector2, btn_size: Vector2, primary: bool) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.position = pos
	btn.size = btn_size
	btn.focus_mode = Control.FOCUS_NONE
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.add_theme_font_override("font", PrototypeTheme.font("bold"))
	btn.add_theme_font_size_override("font_size", 18)
	var style := StyleBoxFlat.new()
	style.set_corner_radius_all(6)
	if primary:
		style.bg_color = Y
		btn.add_theme_color_override("font_color", Color(0.05, 0.06, 0.08, 1.0))
		btn.add_theme_color_override("font_hover_color", Color(0.05, 0.06, 0.08, 1.0))
	else:
		style.bg_color = Color(1, 1, 1, 0.08)
		style.border_color = Color(1, 1, 1, 0.22)
		style.set_border_width_all(1)
		btn.add_theme_color_override("font_color", COPY)
		btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_stylebox_override("normal", style)
	btn.add_theme_stylebox_override("hover", style)
	btn.add_theme_stylebox_override("pressed", style)
	return btn


func _label(text: String, font_key: String, font_size: int, color: Color, pos: Vector2, label_size: Vector2, wrap := false) -> Label:
	var label := Label.new()
	# Autowrap and the fixed width must be set BEFORE size, otherwise the label's
	# minimum size is computed for the unwrapped text and it expands past the card.
	if wrap:
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.custom_minimum_size = Vector2(label_size.x, 0.0)
	label.position = pos
	label.size = label_size
	label.text = text
	label.add_theme_font_override("font", PrototypeTheme.font(font_key))
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	return label


func _text_height(text: String, font_key: String, font_size: int, width: float) -> float:
	var font := PrototypeTheme.font(font_key)
	if font == null:
		return 60.0
	return font.get_multiline_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, width, font_size).y


func _target_rect(step: Dictionary) -> Rect2:
	var target_variant: Variant = step.get("target")
	if target_variant is Control and is_instance_valid(target_variant):
		var ctrl := target_variant as Control
		var xform := ctrl.get_global_transform()
		var scaled_size := ctrl.size * xform.get_scale()
		return Rect2(xform.origin, scaled_size)
	return Rect2()


func _clear() -> void:
	if _border_tween != null and _border_tween.is_valid():
		_border_tween.kill()
	_border_tween = null
	_border_panel = null
	for child in get_children():
		child.queue_free()
