extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")

const RACE_DAY_SCENE := "res://scenes/race_day_screen.tscn"
const SERIES_SCENE := "res://scenes/series_entry_screen.tscn"

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("8C8E91")
const RED := Color("E43E3F")
const GREEN := Color("7ED56F")
const BLUE := Color("7AA2FF")

var calendar_events: Array = []
var selected_day_key := ""
var selected_event_id := ""
var selected_week := 1
var selected_month_start_week := 0
var _rebuild_queued := false
var _tut_month_label: Control = null
var _tut_grid_panel: Control = null
var _tut_detail_panel: Control = null


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_refresh_data()
	get_viewport().size_changed.connect(_on_viewport_resized)
	_build_ui()


func _on_viewport_resized() -> void:
	_request_rebuild()


func _request_rebuild() -> void:
	if _rebuild_queued:
		return
	_rebuild_queued = true
	call_deferred("_run_queued_rebuild")


func _run_queued_rebuild() -> void:
	_rebuild_queued = false
	_refresh_data()
	_build_ui()


func _refresh_data() -> void:
	if PrototypeState != null and PrototypeState.has_method("get_career_calendar_events"):
		var value: Variant = PrototypeState.call("get_career_calendar_events")
		calendar_events = value if value is Array else []
	var date_state := _current_date_state()
	selected_week = int(date_state.get("week", selected_week))
	if selected_month_start_week <= 0:
		selected_month_start_week = _month_start_week_for_week(selected_week)
	if selected_day_key.is_empty():
		selected_day_key = _day_key_for_week_day(selected_week, int(date_state.get("day", 1)))
	if selected_event_id.is_empty():
		var day_events := _events_for_day(selected_day_key)
		if not day_events.is_empty():
			selected_event_id = str((day_events[0] as Dictionary).get("id", ""))


func _build_ui() -> void:
	for child in get_children():
		child.queue_free()
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)

	var vp: Vector2 = get_viewport_rect().size
	var sc: float = min(vp.x / DW, vp.y / DH)
	var fs: Vector2 = Vector2(DW, DH) * sc
	var off: Vector2 = (vp - fs) / 2.0

	var bg := TextureRect.new()
	bg.texture = BG_TEXTURE
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(bg)

	var dim := ColorRect.new()
	dim.color = Color(0.0, 0.02, 0.06, 0.78)
	dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(dim)

	var frame := Control.new()
	frame.position = off
	frame.size = Vector2(DW, DH)
	frame.scale = Vector2(sc, sc)
	add_child(frame)

	var shell := Control.new()
	shell.scale = Vector2(LAYOUT_SCALE, LAYOUT_SCALE)
	frame.add_child(shell)

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "calendar"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	var title := _txt("OPERATIONS CALENDAR", "title", 32, Color.WHITE, Rect2(Vector2(92, 96), Vector2(680, 40)))
	shell.add_child(title)
	var subtitle := _txt("Race weekends, conflicts, setup locks, finance, staff, and team reminders at a glance.", "body", 15, COPY, Rect2(Vector2(96, 132), Vector2(1040, 24)))
	shell.add_child(subtitle)

	_build_week_nav(shell)
	_build_calendar_grid(shell)
	_build_detail_panel(shell)

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "calendar"
	nav.show_continue_button = true
	nav.position = Vector2(0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)
	_register_tutorial()


func _register_tutorial() -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = []
	if _tut_month_label != null:
		steps.append({
			"target": _tut_month_label,
			"title": "Month Navigation",
			"body": "Step through the season month by month with PREV and NEXT. The counter next to it flags any unresolved race-weekend conflicts in the current month.",
			"affects": "Lets you plan ahead across the calendar.",
		})
	if _tut_grid_panel != null:
		steps.append({
			"target": _tut_grid_panel,
			"title": "Season Calendar",
			"body": "Your full operations schedule - race weekends, setup locks, finance and team reminders. Click any day to inspect what is happening on it.",
			"affects": "Your single source of truth for what is coming up.",
		})
	if _tut_detail_panel != null:
		steps.append({
			"target": _tut_detail_panel,
			"title": "Day Detail",
			"body": "Everything scheduled on the selected day. When race weekends overlap, this is where you resolve the clash - choosing which event to attend.",
			"affects": "Resolving conflicts decides which races you run.",
		})
	if steps.is_empty():
		return
	director.report_screen_ready("calendar", steps, self)


func _build_week_nav(shell: Control) -> void:
	var month_label := _month_label_for_week(selected_month_start_week)
	var label := _txt(month_label.to_upper(), "title", 25, Y, Rect2(Vector2(95, 174), Vector2(330, 34)))
	shell.add_child(label)
	_tut_month_label = label
	shell.add_child(_small_button(Rect2(Vector2(442, 174), Vector2(112, 34)), "PREV", Callable(self, "_on_prev_month")))
	shell.add_child(_small_button(Rect2(Vector2(568, 174), Vector2(112, 34)), "NEXT", Callable(self, "_on_next_month")))
	var conflict_count := _unresolved_conflict_count_for_month()
	var copy := "%d unresolved conflict%s" % [conflict_count, "" if conflict_count == 1 else "s"]
	shell.add_child(_txt(copy.to_upper(), "body", 13, RED if conflict_count > 0 else MUTED, Rect2(Vector2(704, 179), Vector2(410, 24))))


func _build_calendar_grid(shell: Control) -> void:
	var rect := Rect2(Vector2(89, 224), Vector2(1180, 1118))
	var grid_panel := _panel(rect)
	shell.add_child(grid_panel)
	_tut_grid_panel = grid_panel
	var day_names := ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
	var cell_w := 152.0
	var cell_h := 112.0
	var gap := 7.0
	for index in range(day_names.size()):
		var header := _txt(day_names[index], "body", 14, MUTED, Rect2(rect.position + Vector2(32 + index * (cell_w + gap), 22), Vector2(cell_w, 22)))
		header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		shell.add_child(header)
	for row in range(5):
		for col in range(7):
			var day_number := col + 1
			var week_number := selected_month_start_week + row
			var day_key := _day_key_for_week_day(week_number, day_number)
			var cell_pos := rect.position + Vector2(28 + col * (cell_w + gap), 52 + row * (cell_h + gap))
			shell.add_child(_day_cell(day_key, week_number, day_number, Rect2(cell_pos, Vector2(cell_w, cell_h))))

	var event_y := rect.position.y + 650
	shell.add_child(_txt("SELECTED DAY", "body", 16, Y, Rect2(Vector2(rect.position.x + 34, event_y), Vector2(250, 26))))
	var list_y := event_y + 34
	var rows := _events_for_day(selected_day_key)
	if rows.is_empty():
		shell.add_child(_txt("No scheduled activity on the selected day.", "body", 18, COPY, Rect2(Vector2(rect.position.x + 34, list_y), Vector2(1050, 42))))
		return
	for i in range(min(rows.size(), 5)):
		var event: Dictionary = rows[i]
		shell.add_child(_event_row(event, Rect2(Vector2(rect.position.x + 34, list_y + i * 58), Vector2(1100, 48))))


func _day_cell(day_key: String, week_number: int, day_number: int, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var is_selected := day_key == selected_day_key
	var events := _events_for_day(day_key)
	var has_conflict := false
	for event_variant: Variant in events:
		var event: Dictionary = event_variant
		if not str(event.get("conflict_group_id", "")).is_empty() and not bool(event.get("resolved", false)):
			has_conflict = true
			break
	var bg := PanelContainer.new()
	bg.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.02, 0.02, 0.02, 0.64 if is_selected else 0.34)
	style.border_color = RED if has_conflict else (Y if is_selected else Color(1, 1, 1, 0.16))
	style.set_border_width_all(2 if is_selected or has_conflict else 1)
	style.set_corner_radius_all(14)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(str(_day_of_month_for_week_day(week_number, day_number)), "title", 24, Color.WHITE, Rect2(Vector2(14, 8), Vector2(54, 30))))
	wrap.add_child(_txt("%d event%s" % [events.size(), "" if events.size() == 1 else "s"], "body", 12, RED if has_conflict else MUTED, Rect2(Vector2(14, 40), Vector2(118, 20))))
	var chip_y := 68.0
	for index in range(min(events.size(), 3)):
		var event: Dictionary = events[index]
		var chip := ColorRect.new()
		chip.position = Vector2(14, chip_y + index * 13)
		chip.size = Vector2(112, 6)
		chip.color = _category_color(str(event.get("category", "")))
		wrap.add_child(chip)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.pressed.connect(_on_day_pressed.bind(day_key))
	wrap.add_child(button)
	return wrap


func _event_row(event: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var selected := str(event.get("id", "")) == selected_event_id
	var marker := ColorRect.new()
	marker.position = Vector2.ZERO
	marker.size = Vector2(8, rect.size.y)
	marker.color = _category_color(str(event.get("category", "")))
	wrap.add_child(marker)
	var title := _txt(str(event.get("title", "")), "body", 18, Color.WHITE, Rect2(Vector2(20, 0), Vector2(rect.size.x - 200, 25)))
	title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(title)
	var meta := _txt(_event_meta(event), "body", 12, RED if _is_unresolved_conflict(event) else MUTED, Rect2(Vector2(20, 25), Vector2(rect.size.x - 120, 20)))
	meta.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(meta)
	if selected:
		var border := PanelContainer.new()
		border.size = rect.size
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0, 0, 0, 0)
		style.border_color = Y
		style.set_border_width_all(2)
		style.set_corner_radius_all(8)
		border.add_theme_stylebox_override("panel", style)
		wrap.add_child(border)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.pressed.connect(_on_event_pressed.bind(str(event.get("id", "")), str(event.get("start_day_key", ""))))
	wrap.add_child(button)
	return wrap


func _build_detail_panel(shell: Control) -> void:
	var rect := Rect2(Vector2(1308, 224), Vector2(1160, 1118))
	var detail_panel := _panel(rect)
	shell.add_child(detail_panel)
	_tut_detail_panel = detail_panel
	var event := _selected_event()
	if event.is_empty():
		shell.add_child(_txt("SELECT A DAY", "title", 40, Y, Rect2(rect.position + Vector2(48, 46), Vector2(520, 52))))
		shell.add_child(_txt("Pick a calendar day to review its racing and operational activity.", "body", 24, COPY, Rect2(rect.position + Vector2(48, 120), Vector2(940, 54))))
		return
	var title := _txt(str(event.get("title", "Calendar event")).to_upper(), "title", 32, Color.WHITE, Rect2(rect.position + Vector2(48, 42), Vector2(940, 48)))
	title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	shell.add_child(title)
	var status_color := RED if _is_unresolved_conflict(event) else _category_color(str(event.get("category", "")))
	shell.add_child(_txt(_event_meta(event).to_upper(), "body", 15, status_color, Rect2(rect.position + Vector2(50, 98), Vector2(900, 24))))
	shell.add_child(_txt(str(event.get("subtitle", "")), "body", 22, COPY, Rect2(rect.position + Vector2(50, 134), Vector2(900, 38))))

	var y := rect.position.y + 226
	if str(event.get("kind", "")) == "race_weekend":
		var class_labels: Array = event.get("required_class_labels", []) if event.get("required_class_labels", []) is Array else []
		var setup: Dictionary = event.get("setup", {}) if event.get("setup", {}) is Dictionary else {}
		shell.add_child(_info_block(Rect2(Vector2(rect.position.x + 48, y), Vector2(500, 130)), "REQUIRED GRID", ", ".join(class_labels) if not class_labels.is_empty() else "Series class roster"))
		shell.add_child(_info_block(Rect2(Vector2(rect.position.x + 580, y), Vector2(500, 130)), "PLAYER CLASS", str(event.get("player_class_label", "Class TBC"))))
		y += 166
		for session_name in ["practice", "qualifying", "race"]:
			var session_setup: Dictionary = setup.get(session_name, {}) if setup.get(session_name, {}) is Dictionary else {}
			var copy := str(session_setup.get("summary", session_setup.get("weather", "Use the recommended AMS2 settings before the weekend starts.")))
			shell.add_child(_info_block(Rect2(Vector2(rect.position.x + 48, y), Vector2(1032, 92)), session_name.to_upper(), copy))
			y += 110
		if _is_unresolved_conflict(event):
			shell.add_child(_txt("CONFLICT DECISION", "body", 18, RED, Rect2(Vector2(rect.position.x + 50, y + 12), Vector2(350, 28))))
			y += 54
			shell.add_child(_small_button(Rect2(Vector2(rect.position.x + 48, y), Vector2(220, 58)), "ATTEND", _on_attend_pressed.bind(str(event.get("id", "")))))
			shell.add_child(_small_button(Rect2(Vector2(rect.position.x + 286, y), Vector2(220, 58)), "DELEGATE", _on_delegate_pressed.bind(str(event.get("id", "")))))
			shell.add_child(_small_button(Rect2(Vector2(rect.position.x + 524, y), Vector2(220, 58)), "WITHDRAW", _on_withdraw_pressed.bind(str(event.get("id", "")))))
		else:
			shell.add_child(_small_button(Rect2(Vector2(rect.position.x + 48, y + 22), Vector2(300, 62)), "OPEN RACE DAY", _on_attend_pressed.bind(str(event.get("id", "")))))
	else:
		var copy := "This operational item is part of the team calendar. Open the linked section to act on it."
		shell.add_child(_info_block(Rect2(Vector2(rect.position.x + 48, y), Vector2(1032, 150)), str(event.get("category", "operation")).to_upper(), copy))
		shell.add_child(_small_button(Rect2(Vector2(rect.position.x + 48, y + 190), Vector2(260, 58)), "OPEN", _on_open_operational_pressed.bind(str(event.get("id", "")))))


func _info_block(rect: Rect2, heading: String, body: String) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var bg := PanelContainer.new()
	bg.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.30)
	style.border_color = Color(1, 1, 1, 0.13)
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(heading, "body", 15, Y, Rect2(Vector2(20, 14), Vector2(rect.size.x - 40, 22))))
	var text := _txt(body, "body", 19, COPY, Rect2(Vector2(20, 42), Vector2(rect.size.x - 40, rect.size.y - 50)))
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(text)
	return wrap


func _panel(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var bg := PanelContainer.new()
	bg.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_BG
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(20)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	return wrap


func _small_button(rect: Rect2, label: String, callback: Callable) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var border := PanelContainer.new()
	border.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0.44)
	style.border_color = Y
	style.set_border_width_all(2)
	style.set_corner_radius_all(10)
	border.add_theme_stylebox_override("panel", style)
	wrap.add_child(border)
	var text := _txt(label, "body", 17, Y, Rect2(Vector2.ZERO, rect.size))
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(text)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.pressed.connect(callback)
	wrap.add_child(button)
	return wrap


func _txt(value: String, role: String, size_px: int, color: Color, rect: Rect2) -> Label:
	var label := Label.new()
	label.text = value
	label.position = rect.position
	label.size = rect.size
	label.add_theme_font_override("font", PrototypeTheme.font(role))
	label.add_theme_font_size_override("font_size", size_px)
	label.add_theme_color_override("font_color", color)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label


func _on_prev_month() -> void:
	selected_month_start_week = maxi(1, selected_month_start_week - 4)
	selected_week = selected_month_start_week
	selected_day_key = _day_key_for_week_day(selected_month_start_week, 1)
	selected_event_id = ""
	_request_rebuild()


func _on_next_month() -> void:
	selected_month_start_week = mini(49, selected_month_start_week + 4)
	selected_week = selected_month_start_week
	selected_day_key = _day_key_for_week_day(selected_month_start_week, 1)
	selected_event_id = ""
	_request_rebuild()


func _on_day_pressed(day_key: String) -> void:
	selected_day_key = day_key
	var day_events := _events_for_day(day_key)
	selected_event_id = str((day_events[0] as Dictionary).get("id", "")) if not day_events.is_empty() else ""
	_request_rebuild()


func _on_event_pressed(event_id: String, day_key: String) -> void:
	selected_event_id = event_id
	selected_day_key = day_key
	_request_rebuild()


func _on_attend_pressed(event_id: String) -> void:
	if PrototypeState != null and PrototypeState.has_method("set_pending_race_context_from_calendar_event"):
		PrototypeState.call("set_pending_race_context_from_calendar_event", event_id)
	ScreenTransition.fade_to_scene(RACE_DAY_SCENE)


func _on_delegate_pressed(event_id: String) -> void:
	if PrototypeState != null and PrototypeState.has_method("resolve_calendar_conflict"):
		PrototypeState.call("resolve_calendar_conflict", event_id, "delegate")
	_request_rebuild()


func _on_withdraw_pressed(event_id: String) -> void:
	if PrototypeState != null and PrototypeState.has_method("resolve_calendar_conflict"):
		PrototypeState.call("resolve_calendar_conflict", event_id, "withdraw")
	_request_rebuild()


func _on_open_operational_pressed(event_id: String) -> void:
	var event := _event_by_id(event_id)
	var action: Dictionary = event.get("action", {}) if event.get("action", {}) is Dictionary else {}
	var scene_path := str(action.get("scene_path", ""))
	if scene_path.is_empty():
		return
	ScreenTransition.fade_to_scene(scene_path)


func _current_date_state() -> Dictionary:
	if PrototypeState != null and PrototypeState.has_method("get_current_calendar_date"):
		var value: Variant = PrototypeState.call("get_current_calendar_date")
		if value is Dictionary:
			return value
	return {"week": 1, "day": 1}


func _selected_event() -> Dictionary:
	var event := _event_by_id(selected_event_id)
	if not event.is_empty():
		return event
	var day_events := _events_for_day(selected_day_key)
	return (day_events[0] as Dictionary).duplicate(true) if not day_events.is_empty() else {}


func _event_by_id(event_id: String) -> Dictionary:
	for event_variant: Variant in calendar_events:
		if event_variant is Dictionary and str((event_variant as Dictionary).get("id", "")) == event_id:
			return (event_variant as Dictionary).duplicate(true)
	return {}


func _events_for_day(day_key: String) -> Array:
	var out: Array = []
	for event_variant: Variant in calendar_events:
		if not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant
		if str(event.get("start_day_key", "")) <= day_key and str(event.get("end_day_key", event.get("start_day_key", ""))) >= day_key:
			out.append(event)
	return out


func _events_for_week(week_number: int) -> Array:
	var out: Array = []
	for event_variant: Variant in calendar_events:
		if not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant
		if int(event.get("week_number", -1)) == week_number:
			out.append(event)
	return out


func _unresolved_conflict_count_for_month() -> int:
	var count := 0
	for week_number in range(selected_month_start_week, selected_month_start_week + 5):
		for event_variant: Variant in _events_for_week(week_number):
			var event: Dictionary = event_variant
			if _is_unresolved_conflict(event):
				count += 1
	return count


func _is_unresolved_conflict(event: Dictionary) -> bool:
	return not str(event.get("conflict_group_id", "")).is_empty() and not bool(event.get("resolved", false))


func _event_meta(event: Dictionary) -> String:
	var pieces: Array[String] = []
	pieces.append(str(event.get("category", "operation")).capitalize())
	if not str(event.get("round_label", "")).is_empty():
		pieces.append(str(event.get("round_label", "")))
	if _is_unresolved_conflict(event):
		pieces.append("Conflict unresolved")
	elif bool(event.get("resolved", false)) and not str(event.get("decision_outcome", "")).is_empty():
		pieces.append("Decision: %s" % str(event.get("decision_outcome", "")).capitalize())
	var start_label := str(event.get("start_label", ""))
	if not start_label.is_empty():
		pieces.append(start_label)
	return "  •  ".join(pieces)


func _category_color(category: String) -> Color:
	match category:
		"racing":
			return Y
		"inbox":
			return BLUE
		"prep":
			return GREEN
		"finance":
			return Color("B68CFF")
		"staff":
			return Color("FFB86C")
		"sponsor":
			return Color("74E0C3")
		_:
			return Color(1, 1, 1, 0.50)


func _day_key_for_week_day(week_number: int, day_number: int) -> String:
	var start_dt := {"year": 2026, "month": 1, "day": 5, "hour": 12, "minute": 0, "second": 0}
	var offset_days := (maxi(week_number, 1) - 1) * 7 + (clampi(day_number, 1, 7) - 1)
	var unix := Time.get_unix_time_from_datetime_dict(start_dt) + offset_days * 86400
	var dt: Dictionary = Time.get_datetime_dict_from_unix_time(unix)
	return "%04d-%02d-%02d" % [int(dt.get("year", 2026)), int(dt.get("month", 1)), int(dt.get("day", 1))]


func _day_of_month_for_week_day(week_number: int, day_number: int) -> int:
	var start_dt := {"year": 2026, "month": 1, "day": 5, "hour": 12, "minute": 0, "second": 0}
	var offset_days := (maxi(week_number, 1) - 1) * 7 + (clampi(day_number, 1, 7) - 1)
	var unix := Time.get_unix_time_from_datetime_dict(start_dt) + offset_days * 86400
	var dt: Dictionary = Time.get_datetime_dict_from_unix_time(unix)
	return int(dt.get("day", 1))


func _month_start_week_for_week(week_number: int) -> int:
	return int(floor(float(maxi(week_number, 1) - 1) / 4.0)) * 4 + 1


func _month_label_for_week(week_number: int) -> String:
	var start_dt := {"year": 2026, "month": 1, "day": 5, "hour": 12, "minute": 0, "second": 0}
	var offset_days := (maxi(week_number, 1) - 1) * 7
	var unix := Time.get_unix_time_from_datetime_dict(start_dt) + offset_days * 86400
	var dt: Dictionary = Time.get_datetime_dict_from_unix_time(unix)
	var names := ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	var month_index := clampi(int(dt.get("month", 1)), 1, 12)
	return "%s %d" % [names[month_index], int(dt.get("year", 2026))]
