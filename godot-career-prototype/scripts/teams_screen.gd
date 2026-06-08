extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const DRIVERS_SCENE := "res://scenes/drivers_screen.tscn"

const TEAM_PROFILES_PATH := "res://data/generated/team_profiles.json"
const TEAM_NARRATIVES_PATH := "res://data/generated/team_narratives.json"
const ROSTER_PATH := "res://data/generated/championship_entrants.json"

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("8C8E91")
const GREEN := Color("7ED56F")

const SUMMARY_RECT := Rect2(Vector2(89.0, 151.0), Vector2(2380.0, 122.0))
const LIST_RECT := Rect2(Vector2(89.0, 292.0), Vector2(955.0, 1032.0))
const DETAIL_RECT := Rect2(Vector2(1084.0, 292.0), Vector2(1385.0, 1032.0))
const ROWS_PER_PAGE := 12

var all_teams: Array = []
var selected_team_id := ""
var page_index := 0
var _rebuild_queued := false


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_load_team_browser_data()
	_select_first_team_if_needed()
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
	_build_ui()


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

	var bg_dim := ColorRect.new()
	bg_dim.color = Color(0.0, 0.02, 0.06, 0.74)
	bg_dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(bg_dim)

	var frame := Control.new()
	frame.position = off
	frame.size = Vector2(DW, DH)
	frame.scale = Vector2(sc, sc)
	add_child(frame)

	var shell := Control.new()
	shell.scale = Vector2(LAYOUT_SCALE, LAYOUT_SCALE)
	frame.add_child(shell)

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "team"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	var summary_strip := _build_summary_strip()
	shell.add_child(summary_strip)
	var team_list := _build_team_list_panel()
	shell.add_child(team_list)
	var team_detail := _build_team_detail_panel()
	shell.add_child(team_detail)

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "team"
	nav.show_continue_button = true
	nav.position = Vector2(0.0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)
	_register_tutorial(summary_strip, team_list, team_detail)


func _register_tutorial(summary_strip: Control, team_list: Control, team_detail: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": summary_strip,
			"title": "Team Snapshot",
			"body": "A quick overview of the teams in the world - how many there are and how yours sits among them.",
			"affects": "Context for the competition you face.",
		},
		{
			"target": team_list,
			"title": "Teams In The World",
			"body": "Every rival team on the grid. Select one to inspect it. Yours is in here too, so you can compare your operation against the field.",
			"affects": "These are your championship rivals.",
		},
		{
			"target": team_detail,
			"title": "Team Detail",
			"body": "The selected team's roster, car and livery. Drivers shown here link through to their full profiles on the Drivers screen.",
			"affects": "Scout who you are racing against.",
		},
	]
	director.report_screen_ready("team", steps, self)


func _build_summary_strip() -> Control:
	var card := _panel(SUMMARY_RECT)
	var roster_seats := 0
	var championships: Array = []
	for team_variant in all_teams:
		if not team_variant is Dictionary:
			continue
		var team: Dictionary = team_variant as Dictionary
		roster_seats += int(team.get("seat_count", 0))
		for champ_variant in team.get("championships", []):
			var champ := str(champ_variant)
			if not champ.is_empty() and not championships.has(champ):
				championships.append(champ)
	card.add_child(_summary_metric("Teams", str(all_teams.size()), Rect2(Vector2(24.0, 18.0), Vector2(300.0, 86.0))))
	card.add_child(_summary_metric("Entries", str(roster_seats), Rect2(Vector2(344.0, 18.0), Vector2(330.0, 86.0))))
	card.add_child(_summary_metric("Championships", str(championships.size()), Rect2(Vector2(694.0, 18.0), Vector2(340.0, 86.0))))
	card.add_child(_summary_metric("Selected", _selected_team_name(), Rect2(Vector2(1054.0, 18.0), Vector2(620.0, 86.0))))
	return card


func _build_team_list_panel() -> Control:
	var card := _panel(LIST_RECT)
	card.add_child(_txt("WORLD ENTRANTS", "title", 30, Y, Rect2(Vector2(28.0, 26.0), Vector2(440.0, 42.0))))
	card.add_child(_txt("AMS2-backed entrant teams, with manufacturer profiles used as metadata.", "body", 17, COPY, Rect2(Vector2(28.0, 66.0), Vector2(720.0, 28.0))))
	var start := page_index * ROWS_PER_PAGE
	var end_index := mini(start + ROWS_PER_PAGE, all_teams.size())
	var y := 120.0
	for index in range(start, end_index):
		if not all_teams[index] is Dictionary:
			continue
		card.add_child(_build_team_row(all_teams[index] as Dictionary, y))
		y += 68.0
	var max_page := maxi(int(ceil(float(all_teams.size()) / float(ROWS_PER_PAGE))) - 1, 0)
	card.add_child(_pager_button("Previous", Rect2(Vector2(28.0, 948.0), Vector2(180.0, 48.0)), _prev_page, page_index <= 0))
	card.add_child(_pager_button("Next", Rect2(Vector2(736.0, 948.0), Vector2(180.0, 48.0)), _next_page, page_index >= max_page))
	var page_label := _txt("Page %d / %d" % [page_index + 1, max_page + 1], "body", 17, COPY, Rect2(Vector2(236.0, 958.0), Vector2(470.0, 28.0)))
	page_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card.add_child(page_label)
	return card


func _build_team_row(team: Dictionary, y: float) -> Control:
	var row := Control.new()
	row.position = Vector2(24.0, y)
	row.size = Vector2(907.0, 58.0)
	row.clip_contents = true
	var selected := str(team.get("id", "")) == selected_team_id
	var bg := PanelContainer.new()
	bg.size = row.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.16) if selected else Color(1, 1, 1, 0.045)
	style.border_color = Y if selected else Color(1, 1, 1, 0.10)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	row.add_child(bg)
	var name := _txt(str(team.get("name", "Unknown Team")), "bold", 18, Color.WHITE, Rect2(Vector2(18.0, 8.0), Vector2(430.0, 24.0)))
	name.clip_text = true
	name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(name)
	row.add_child(_txt("%s  •  %s%s  •  %s" % [
		str(team.get("tier", "unknown")).capitalize(),
		str(team.get("seat_count", 0)),
		" entry" if int(team.get("seat_count", 0)) == 1 else " entries",
		str(team.get("car", team.get("source_name", "entrant")))
	], "body", 14, COPY, Rect2(Vector2(18.0, 32.0), Vector2(520.0, 20.0))))
	var champ := _txt(str(team.get("primary_championship", "No championship")), "body", 14, Y if selected else MUTED, Rect2(Vector2(560.0, 18.0), Vector2(300.0, 22.0)))
	champ.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	champ.clip_text = true
	champ.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(champ)
	var button := Button.new()
	button.flat = true
	button.size = row.size
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_team_selected.bind(str(team.get("id", ""))))
	row.add_child(button)
	return row


func _build_team_detail_panel() -> Control:
	var card := _panel(DETAIL_RECT)
	var team := _selected_team()
	if team.is_empty():
		card.add_child(_empty_state(Vector2(56.0, 300.0), "No team selected.", "Choose a team from the world list to inspect its roster."))
		return card
	var name := _txt(str(team.get("name", "Unknown Team")), "title", 44, Y, Rect2(Vector2(44.0, 40.0), Vector2(860.0, 58.0)))
	name.clip_text = true
	name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	card.add_child(name)
	card.add_child(_txt("%s  •  %s budget  •  %s" % [str(team.get("tier", "unknown")).capitalize(), str(team.get("budget_band", "unknown")).capitalize(), str(team.get("source_name", "AMS2 entrant"))], "body", 21, Color.WHITE, Rect2(Vector2(48.0, 106.0), Vector2(900.0, 32.0))))
	card.add_child(_badge("%d entr%s" % [int(team.get("seat_count", 0)), "y" if int(team.get("seat_count", 0)) == 1 else "ies"], Vector2(1080.0, 58.0), Vector2(230.0, 38.0), Y if int(team.get("seat_count", 0)) > 0 else Color(1, 1, 1, 0.10), Color.BLACK if int(team.get("seat_count", 0)) > 0 else Color.WHITE))
	card.add_child(_info_text_block("TEAM PROFILE", _team_profile_copy(team), Rect2(Vector2(48.0, 170.0), Vector2(1260.0, 156.0))))
	card.add_child(_txt("DRIVERS, CARS & LIVERIES", "title", 22, Y, Rect2(Vector2(48.0, 364.0), Vector2(620.0, 32.0))))
	var roster: Array = team.get("roster", []) if team.get("roster", []) is Array else []
	if roster.is_empty():
		card.add_child(_empty_state(Vector2(48.0, 450.0), "No roster rows yet.", "This team exists in the profile pack, but no championship entrant rows are linked yet."))
	else:
		var y := 414.0
		var max_rows := mini(roster.size(), 8)
		for index in range(max_rows):
			if roster[index] is Dictionary:
				card.add_child(_build_roster_row(roster[index] as Dictionary, y))
				y += 68.0
		if roster.size() > max_rows:
			card.add_child(_txt("+%d more linked drivers for this entrant" % (roster.size() - max_rows), "body", 17, COPY, Rect2(Vector2(52.0, y + 6.0), Vector2(720.0, 26.0))))
	return card


func _build_roster_row(entry: Dictionary, y: float) -> Control:
	var row := Control.new()
	row.position = Vector2(48.0, y)
	row.size = Vector2(1260.0, 56.0)
	row.clip_contents = true
	var bg := PanelContainer.new()
	bg.size = row.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1, 1, 1, 0.045)
	style.border_color = Color(1, 1, 1, 0.10)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	row.add_child(bg)
	var driver := _txt(str(entry.get("driver_name", "Unknown Driver")), "bold", 18, Color.WHITE, Rect2(Vector2(18.0, 6.0), Vector2(320.0, 24.0)))
	driver.clip_text = true
	driver.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(driver)
	row.add_child(_txt("#%s  •  %s  •  %s" % [str(entry.get("racing_number", "--")), str(entry.get("country", "UNK")), str(entry.get("championship", "Series"))], "body", 13, COPY, Rect2(Vector2(18.0, 31.0), Vector2(410.0, 18.0))))
	var car := _txt(str(entry.get("car", "Car TBA")), "bold", 16, Y, Rect2(Vector2(450.0, 8.0), Vector2(330.0, 22.0)))
	car.clip_text = true
	car.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(car)
	var livery := _txt(str(entry.get("livery", "Livery TBA")), "body", 13, COPY, Rect2(Vector2(450.0, 31.0), Vector2(500.0, 18.0)))
	livery.clip_text = true
	livery.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(livery)
	var open_label := _txt("Open Driver", "bold", 14, GREEN, Rect2(Vector2(1060.0, 17.0), Vector2(150.0, 22.0)))
	open_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(open_label)
	var button := Button.new()
	button.flat = true
	button.size = row.size
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_driver_pressed.bind(str(entry.get("driver_profile_id", ""))))
	row.add_child(button)
	return row


func _summary_metric(label_text: String, value_text: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var bg := PanelContainer.new()
	bg.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1, 1, 1, 0.055)
	style.border_color = Color(1, 1, 1, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(label_text.to_upper(), "body", 13, COPY, Rect2(Vector2(18.0, 12.0), Vector2(rect.size.x - 36.0, 20.0))))
	var value := _txt(value_text, "title", 30 if value_text.length() <= 18 else 22, Y, Rect2(Vector2(18.0, 34.0), Vector2(rect.size.x - 36.0, 42.0)))
	value.clip_text = true
	value.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(value)
	return wrap


func _info_text_block(title_text: String, body_text: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true
	wrap.add_child(_txt(title_text, "title", 17, Y, Rect2(Vector2.ZERO, Vector2(rect.size.x, 24.0))))
	var note := RichTextLabel.new()
	note.position = Vector2(0.0, 34.0)
	note.size = Vector2(rect.size.x, rect.size.y - 34.0)
	note.bbcode_enabled = false
	note.fit_content = false
	note.scroll_active = false
	note.clip_contents = true
	note.text = _truncate_copy(body_text, 460)
	note.add_theme_font_override("normal_font", PrototypeTheme.font("body"))
	note.add_theme_font_size_override("normal_font_size", 17)
	note.add_theme_color_override("default_color", Color.WHITE)
	wrap.add_child(note)
	return wrap


func _badge(text_value: String, pos: Vector2, size_value: Vector2, bg_color: Color, text_color: Color) -> Control:
	var wrap := PanelContainer.new()
	wrap.position = pos
	wrap.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = Color(1, 1, 1, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	wrap.add_theme_stylebox_override("panel", style)
	var label := _txt(text_value, "bold", 16, text_color, Rect2(Vector2.ZERO, size_value))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	return wrap


func _pager_button(text_value: String, rect: Rect2, callback: Callable, disabled: bool) -> Button:
	var button := Button.new()
	button.position = rect.position
	button.size = rect.size
	button.text = text_value
	button.disabled = disabled
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if not disabled else Control.CURSOR_ARROW
	button.add_theme_font_override("font", PrototypeTheme.font("bold"))
	button.add_theme_font_size_override("font_size", 16)
	button.add_theme_stylebox_override("normal", _button_style(Color(1, 1, 1, 0.055), Y if not disabled else Color(1, 1, 1, 0.10)))
	button.add_theme_stylebox_override("hover", _button_style(Color(0.968627, 0.921569, 0.32549, 0.12), Y))
	button.add_theme_color_override("font_color", Y if not disabled else MUTED)
	button.pressed.connect(callback)
	return button


func _empty_state(pos: Vector2, title_text: String, body_text: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(720.0, 190.0)
	wrap.add_child(_txt(title_text, "title", 32, Y, Rect2(Vector2.ZERO, Vector2(680.0, 42.0))))
	var body := _txt(body_text, "body", 20, COPY, Rect2(Vector2(0.0, 58.0), Vector2(680.0, 90.0)))
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(body)
	return wrap


func _load_team_browser_data() -> void:
	var narratives := _team_narratives()
	var profiles_by_id := _team_profiles_by_id()
	var teams_by_id := {}
	var used_profile_ids := {}
	all_teams = []
	for row_variant in _load_records(ROSTER_PATH):
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		var team_id := _entrant_team_id(row)
		if team_id.is_empty():
			continue
		var entrant_profile_id := str(row.get("team_profile_id", "")).strip_edges()
		var profile_value: Variant = profiles_by_id.get(entrant_profile_id, {})
		var entrant_profile: Dictionary = profile_value as Dictionary if profile_value is Dictionary else {}
		if not entrant_profile_id.is_empty():
			used_profile_ids[entrant_profile_id] = true
		var team: Dictionary = {}
		if teams_by_id.has(team_id) and teams_by_id[team_id] is Dictionary:
			team = teams_by_id[team_id] as Dictionary
		else:
			team = _team_from_entrant_row(row, entrant_profile, narratives, team_id)
		var roster: Array = team.get("roster", []) if team.get("roster", []) is Array else []
		roster.append(_roster_entry_from_row(row))
		team["roster"] = roster
		team["seat_count"] = roster.size()
		var champ := _championship_label(str(row.get("championship_id", "")))
		var championships: Array = team.get("championships", []) if team.get("championships", []) is Array else []
		if not champ.is_empty() and not championships.has(champ):
			championships.append(champ)
		team["championships"] = championships
		team["primary_championship"] = str(championships[0]) if not championships.is_empty() else "No championship"
		teams_by_id[team_id] = team
	for team_variant in teams_by_id.values():
		if team_variant is Dictionary:
			all_teams.append(team_variant)
	for profile_variant in _load_records(TEAM_PROFILES_PATH):
		if not profile_variant is Dictionary:
			continue
		var profile_row: Dictionary = profile_variant as Dictionary
		var profile_team_id := str(profile_row.get("id", "")).strip_edges()
		if used_profile_ids.has(profile_team_id):
			continue
		var name := str(profile_row.get("canonical_public_name", profile_row.get("display_name", ""))).strip_edges()
		if profile_team_id.is_empty() or name.is_empty():
			continue
		var profile_narrative := _resolve_team_narrative(profile_row, narratives)
		var profile_championships := _team_championships(profile_row, [])
		all_teams.append({
			"id": "profile:%s" % profile_team_id,
			"name": name,
			"source_name": str(profile_row.get("source_ams2_display_name", "")),
			"short_name": str(profile_row.get("short_name", "")),
			"tier": str(profile_row.get("tier", "unknown")),
			"prestige": int(profile_row.get("prestige", 0)),
			"budget_band": str(profile_row.get("budget_band", "unknown")),
			"championships": profile_championships,
			"primary_championship": str(profile_championships[0]) if not profile_championships.is_empty() else "No championship",
			"seat_count": 0,
			"roster": [],
			"origin": str(profile_narrative.get("origin", "")),
			"philosophy": str(profile_narrative.get("philosophy", "")),
			"reputation": str(profile_narrative.get("reputation", "")),
			"car": str(profile_row.get("source_ams2_display_name", "")),
		})
	all_teams.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_name := str(a.get("name", ""))
		var b_name := str(b.get("name", ""))
		if a_name == b_name:
			return str(a.get("primary_championship", "")) < str(b.get("primary_championship", ""))
		return a_name < b_name
	)


func _load_records(path: String) -> Array:
	if not FileAccess.file_exists(path):
		return []
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed is Dictionary:
		var records: Variant = (parsed as Dictionary).get("records", [])
		if records is Array:
			return records as Array
	return []


func _team_narratives() -> Dictionary:
	var by_id := {}
	var by_source := {}
	for narrative_variant in _load_records(TEAM_NARRATIVES_PATH):
		if not narrative_variant is Dictionary:
			continue
		var narrative: Dictionary = narrative_variant as Dictionary
		var id := str(narrative.get("id", "")).strip_edges()
		var source_id := str(narrative.get("source_id", "")).strip_edges()
		if not id.is_empty():
			by_id[id] = narrative
		if not source_id.is_empty():
			by_source[source_id] = narrative
	return {"by_id": by_id, "by_source": by_source}


func _resolve_team_narrative(profile: Dictionary, narratives: Dictionary) -> Dictionary:
	var by_id: Dictionary = {}
	if narratives.get("by_id", {}) is Dictionary:
		by_id = narratives.get("by_id", {}) as Dictionary
	var by_source: Dictionary = {}
	if narratives.get("by_source", {}) is Dictionary:
		by_source = narratives.get("by_source", {}) as Dictionary
	var narrative_id := str(profile.get("team_narrative_id", "")).strip_edges()
	if by_id.has(narrative_id) and by_id[narrative_id] is Dictionary:
		return by_id[narrative_id] as Dictionary
	var source_id := str(profile.get("source_ams2_team_id", "")).strip_edges()
	if by_source.has(source_id) and by_source[source_id] is Dictionary:
		return by_source[source_id] as Dictionary
	return {}


func _team_profiles_by_id() -> Dictionary:
	var out := {}
	for profile_variant in _load_records(TEAM_PROFILES_PATH):
		if profile_variant is Dictionary:
			var profile: Dictionary = profile_variant as Dictionary
			var id := str(profile.get("id", "")).strip_edges()
			if not id.is_empty():
				out[id] = profile
	return out


func _entrant_team_id(row: Dictionary) -> String:
	var source_id := str(row.get("source_ams2_team_id", row.get("source_team_name", ""))).strip_edges()
	var team_name := str(row.get("team_name", "")).strip_edges()
	if team_name.is_empty():
		team_name = str(row.get("livery_name", row.get("source_team_name", ""))).strip_edges()
	var car_key := _car_from_livery(str(row.get("livery_name", "")), str(row.get("car_class_id", ""))).strip_edges()
	var identity := "%s:%s:%s" % [source_id, team_name, car_key]
	return "entrant:%s" % identity.strip_edges()


func _team_from_entrant_row(row: Dictionary, profile: Dictionary, narratives: Dictionary, team_id: String) -> Dictionary:
	var livery := str(row.get("livery_name", "")).strip_edges()
	var entrant_name := str(row.get("team_name", "")).strip_edges()
	if entrant_name.is_empty():
		entrant_name = _car_from_livery(livery, str(row.get("car_class_id", "")))
	var narrative := _resolve_team_narrative(profile, narratives) if not profile.is_empty() else {}
	return {
		"id": team_id,
		"name": entrant_name,
		"source_name": str(row.get("source_team_name", profile.get("source_ams2_display_name", ""))).strip_edges(),
		"short_name": str(row.get("short_name", profile.get("short_name", ""))),
		"tier": str(profile.get("tier", "entrant")),
		"prestige": int(profile.get("prestige", 0)),
		"budget_band": str(profile.get("budget_band", "unknown")),
		"championships": [],
		"primary_championship": "No championship",
		"seat_count": 0,
		"roster": [],
		"origin": str(narrative.get("origin", "")),
		"philosophy": str(narrative.get("philosophy", "")),
		"reputation": str(narrative.get("reputation", "")),
		"car": _car_from_livery(livery, str(row.get("car_class_id", ""))),
		"livery": livery if not livery.is_empty() else "Livery TBA",
	}


func _roster_entry_from_row(row: Dictionary) -> Dictionary:
	var livery := str(row.get("livery_name", "")).strip_edges()
	return {
		"driver_profile_id": str(row.get("driver_profile_id", "")),
		"driver_name": str(row.get("canonical_driver_name", row.get("driver_name", "Unknown Driver"))),
		"country": str(row.get("driver_country", "UNK")),
		"championship": _championship_label(str(row.get("championship_id", ""))),
		"car_class": _car_class_label(str(row.get("car_class_id", ""))),
		"car": _car_from_livery(livery, str(row.get("car_class_id", ""))),
		"livery": livery if not livery.is_empty() else "Livery TBA",
		"racing_number": str(row.get("racing_number", "--")),
		"seat_index": int(row.get("seat_index", 0)),
	}


func _team_championships(profile: Dictionary, roster: Array) -> Array:
	var out: Array = []
	var profile_champs: Variant = profile.get("championships", [])
	if profile_champs is Array:
		for champ_variant in profile_champs:
			var label := _championship_label(str(champ_variant))
			if not label.is_empty() and not out.has(label):
				out.append(label)
	for entry_variant in roster:
		if entry_variant is Dictionary:
			var champ := str((entry_variant as Dictionary).get("championship", ""))
			if not champ.is_empty() and not out.has(champ):
				out.append(champ)
	return out


func _selected_team() -> Dictionary:
	for team_variant in all_teams:
		if team_variant is Dictionary and str((team_variant as Dictionary).get("id", "")) == selected_team_id:
			return team_variant as Dictionary
	return {}


func _selected_team_name() -> String:
	var team := _selected_team()
	return str(team.get("name", "None")) if not team.is_empty() else "None"


func _select_first_team_if_needed() -> void:
	if selected_team_id.is_empty() and not all_teams.is_empty():
		selected_team_id = str((all_teams[0] as Dictionary).get("id", ""))


func _on_team_selected(team_id: String) -> void:
	selected_team_id = team_id
	_request_rebuild()


func _on_driver_pressed(driver_id: String) -> void:
	if driver_id.strip_edges().is_empty():
		return
	if PrototypeState != null and PrototypeState.has_method("set_pending_driver_browser_id"):
		PrototypeState.call("set_pending_driver_browser_id", driver_id)
	ScreenTransition.fade_to_scene(DRIVERS_SCENE)


func _prev_page() -> void:
	page_index = maxi(page_index - 1, 0)
	_request_rebuild()


func _next_page() -> void:
	var max_page := maxi(int(ceil(float(all_teams.size()) / float(ROWS_PER_PAGE))) - 1, 0)
	page_index = mini(page_index + 1, max_page)
	_request_rebuild()


func _team_profile_copy(team: Dictionary) -> String:
	var origin := str(team.get("origin", "")).strip_edges()
	if not origin.is_empty():
		return origin
	var philosophy := str(team.get("philosophy", "")).strip_edges()
	if not philosophy.is_empty():
		return philosophy
	var reputation := str(team.get("reputation", "")).strip_edges()
	if not reputation.is_empty():
		return reputation
	return "No generated team narrative is linked yet. The roster data is still available from the AMS2-backed entrant table."


func _car_from_livery(livery: String, car_class_id: String) -> String:
	var cleaned := livery.strip_edges()
	if cleaned.is_empty():
		return _car_class_label(car_class_id)
	var hash_index := cleaned.find("#")
	if hash_index > 0:
		cleaned = cleaned.substr(0, hash_index).strip_edges()
	cleaned = cleaned.replace(" (IMSA 2024)", "").strip_edges()
	return cleaned if not cleaned.is_empty() else _car_class_label(car_class_id)


func _championship_label(championship_id: String) -> String:
	var label := championship_id.replace("championship.", "").replace("_", " ").replace("-", " ").strip_edges()
	return label.capitalize() if not label.is_empty() else "Series TBA"


func _car_class_label(car_class_id: String) -> String:
	var label := car_class_id.replace("car_class.", "").replace("_", " ").replace("-", " ").strip_edges()
	return label.to_upper() if not label.is_empty() else "Class TBA"


func _truncate_copy(value: String, limit: int) -> String:
	var cleaned := value.replace("\r\n", "\n").replace("\n\n", " ").replace("\n", " ").strip_edges()
	if cleaned.length() <= limit:
		return cleaned
	return cleaned.substr(0, max(limit - 3, 1)).rstrip(" ,;:-") + "..."


func _txt(value: String, role: String, size_px: int, color: Color, rect: Rect2) -> Label:
	var label := Label.new()
	label.text = value
	label.position = rect.position
	label.size = rect.size
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_override("font", PrototypeTheme.font(role))
	label.add_theme_font_size_override("font_size", size_px)
	label.add_theme_color_override("font_color", color)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label


func _panel(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var panel := PanelContainer.new()
	panel.size = rect.size
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_BG
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	panel.add_theme_stylebox_override("panel", style)
	wrap.add_child(panel)
	return wrap


func _button_style(bg: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	return style
