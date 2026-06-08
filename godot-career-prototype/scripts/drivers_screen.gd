extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const DRIVER_FALLBACK_TEXTURE = preload("res://assets/images/figma-hq/driver-avatar.png")

const DRIVER_PROFILES_PATH := "res://data/generated/driver_profiles.json"
const DRIVER_NARRATIVES_PATH := "res://data/generated/driver_narratives.json"
const PORTRAIT_PROFILES_PATH := "res://data/generated/portrait_profiles.json"
const ROSTER_PATH := "res://data/generated/championship_entrants.json"
const GENERATED_IMAGE_ROOT := "res://../public/images/generated"
const DIST_GENERATED_IMAGE_ROOT := "res://../dist/images/generated"

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("8C8E91")
const GREEN := Color("7ED56F")
const RED := Color("E43E3F")
const COUNTRY_NAMES := {
	"ARG": "Argentina", "AUS": "Australia", "AUT": "Austria", "BEL": "Belgium", "BRA": "Brazil",
	"CAN": "Canada", "CHE": "Switzerland", "CHL": "Chile", "CHN": "China", "COL": "Colombia",
	"CZE": "Czech Republic", "DEU": "Germany", "DNK": "Denmark", "ESP": "Spain", "FIN": "Finland",
	"FRA": "France", "GBR": "United Kingdom", "GRC": "Greece", "HKG": "Hong Kong", "HUN": "Hungary",
	"IND": "India", "IRL": "Ireland", "ITA": "Italy", "JPN": "Japan", "KOR": "South Korea",
	"MEX": "Mexico", "MYS": "Malaysia", "NLD": "Netherlands", "NOR": "Norway", "NZL": "New Zealand",
	"POL": "Poland", "PRT": "Portugal", "ROU": "Romania", "RUS": "Russia", "SWE": "Sweden",
	"THA": "Thailand", "TUR": "Turkey", "URY": "Uruguay", "USA": "United States", "VEN": "Venezuela",
	"ZAF": "South Africa",
}

const SUMMARY_RECT := Rect2(Vector2(89.0, 151.0), Vector2(2380.0, 122.0))
const LIST_RECT := Rect2(Vector2(89.0, 292.0), Vector2(955.0, 1032.0))
const DETAIL_RECT := Rect2(Vector2(1084.0, 292.0), Vector2(1385.0, 1032.0))
const ROWS_PER_PAGE := 12

var all_drivers: Array = []
var selected_driver_id := ""
var page_index := 0
var sort_mode := "Overall"
var roster_filter := "All"
var country_filter := "All"
var country_search_text := ""
var open_filter_id := ""
var active_profile_tab := "bio"
var portrait_texture_cache: Dictionary = {}
var driver_avatar_mask_material: ShaderMaterial
var filtered_driver_cache: Array = []
var filtered_driver_cache_key := ""
var _rebuild_queued := false


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_load_driver_browser_data()
	_apply_pending_driver_selection()
	_select_first_driver_if_needed()
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
	top_bar.active_section_id = "drivers"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	var summary_strip := _build_summary_strip()
	shell.add_child(summary_strip)
	var driver_list := _build_driver_list_panel()
	shell.add_child(driver_list)
	var driver_detail := _build_driver_detail_panel()
	shell.add_child(driver_detail)

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "drivers"
	nav.show_continue_button = true
	nav.position = Vector2(0.0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)
	_register_tutorial(summary_strip, driver_list, driver_detail)


func _register_tutorial(summary_strip: Control, driver_list: Control, driver_detail: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": summary_strip,
			"title": "Driver Pool",
			"body": "An overview of the drivers in the world. Use it to gauge the depth of talent available across the grid.",
			"affects": "Context for scouting and signings.",
		},
		{
			"target": driver_list,
			"title": "Browse Drivers",
			"body": "Every driver in the world, with filters, sorting and country search. Ratings reflect current ability, and they shift as a driver's season unfolds.",
			"affects": "This is where you find talent to sign.",
		},
		{
			"target": driver_detail,
			"title": "Driver Profile",
			"body": "Tabs for a driver's bio, traits and ratings. Once a driver has raced, a season record appears here showing their starts, wins, podiums and best finish.",
			"affects": "Helps you judge who is worth a seat.",
		},
	]
	director.report_screen_ready("drivers", steps, self)


func _build_summary_strip() -> Control:
	var card := _panel(SUMMARY_RECT)
	var rows := _filtered_drivers()
	var rostered_count := 0
	var countries: Array = []
	for driver_variant in all_drivers:
		if not driver_variant is Dictionary:
			continue
		var driver: Dictionary = driver_variant as Dictionary
		if int(driver.get("seat_count", 0)) > 0:
			rostered_count += 1
		var country := str(driver.get("country_name", driver.get("country", ""))).strip_edges()
		if not country.is_empty() and not countries.has(country):
			countries.append(country)

	card.add_child(_summary_metric("Drivers", str(all_drivers.size()), Rect2(Vector2(24.0, 18.0), Vector2(290.0, 86.0))))
	card.add_child(_summary_metric("Roster Seats", str(rostered_count), Rect2(Vector2(334.0, 18.0), Vector2(300.0, 86.0))))
	card.add_child(_summary_metric("Countries", str(countries.size()), Rect2(Vector2(654.0, 18.0), Vector2(270.0, 86.0))))
	card.add_child(_summary_metric("Showing", str(rows.size()), Rect2(Vector2(944.0, 18.0), Vector2(250.0, 86.0))))

	var roster_rect := Rect2(Vector2(1438.0, 24.0), Vector2(210.0, 74.0))
	var country_rect := Rect2(Vector2(1670.0, 24.0), Vector2(290.0, 74.0))
	var sort_rect := Rect2(Vector2(1982.0, 24.0), Vector2(300.0, 74.0))
	card.add_child(_filter_button("Roster", roster_filter, roster_rect, "roster"))
	card.add_child(_filter_button("Country", country_filter, country_rect, "country"))
	card.add_child(_filter_button("Sort", sort_mode, sort_rect, "sort"))
	match open_filter_id:
		"roster":
			card.add_child(_build_option_dropdown(Vector2(roster_rect.position.x, 108.0), Vector2(roster_rect.size.x, 156.0), _roster_options(), roster_filter, "_on_roster_option_selected"))
		"sort":
			card.add_child(_build_option_dropdown(Vector2(sort_rect.position.x, 108.0), Vector2(sort_rect.size.x, 196.0), _sort_options(), sort_mode, "_on_sort_option_selected"))
		"country":
			card.add_child(_build_country_dropdown(Vector2(country_rect.position.x, 108.0), Vector2(420.0, 430.0)))
	return card


func _build_driver_list_panel() -> Control:
	var card := _panel(LIST_RECT)
	var rows := _filtered_drivers()
	var page_count: int = max(1, int(ceil(float(rows.size()) / float(ROWS_PER_PAGE))))
	page_index = clampi(page_index, 0, page_count - 1)

	var title := _txt("WORLD DRIVER BROWSER", "title", 24, Y, Rect2(Vector2(32.0, 30.0), Vector2(410.0, 30.0)))
	card.add_child(title)
	var sub := _txt("Read-only roster view. Contracts and scouting actions come later.", "body", 17, COPY, Rect2(Vector2(32.0, 62.0), Vector2(600.0, 24.0)))
	card.add_child(sub)

	if rows.is_empty():
		card.add_child(_empty_state(Vector2(44.0, 270.0), "No drivers match these filters.", "Cycle roster or country filters to return to the full world list."))
		return card

	var start := page_index * ROWS_PER_PAGE
	var end: int = min(rows.size(), start + ROWS_PER_PAGE)
	var y := 112.0
	for idx in range(start, end):
		card.add_child(_build_driver_row(rows[idx] as Dictionary, idx + 1, y))
		y += 68.0

	var page_label := _txt("PAGE %d / %d" % [page_index + 1, page_count], "body", 17, COPY, Rect2(Vector2(364.0, 958.0), Vector2(180.0, 28.0)))
	page_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card.add_child(page_label)
	card.add_child(_pager_button("PREV", Rect2(Vector2(44.0, 950.0), Vector2(150.0, 42.0)), _prev_page, page_index <= 0))
	card.add_child(_pager_button("NEXT", Rect2(Vector2(720.0, 950.0), Vector2(150.0, 42.0)), _next_page, page_index >= page_count - 1))
	return card


func _build_driver_row(driver: Dictionary, rank: int, y: float) -> Control:
	var row := Control.new()
	row.position = Vector2(24.0, y)
	row.size = Vector2(907.0, 58.0)
	row.clip_contents = true
	var selected := str(driver.get("id", "")) == selected_driver_id
	var bg := PanelContainer.new()
	bg.size = row.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.12) if selected else Color(1, 1, 1, 0.045)
	style.border_color = Y if selected else Color(1, 1, 1, 0.10)
	style.set_border_width_all(2 if selected else 1)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	row.add_child(bg)

	row.add_child(_txt("%02d" % rank, "body", 17, Y if selected else COPY, Rect2(Vector2(16.0, 16.0), Vector2(44.0, 24.0))))
	row.add_child(_txt(str(driver.get("name", "Unknown Driver")), "bold", 20, Color.WHITE, Rect2(Vector2(72.0, 9.0), Vector2(330.0, 25.0))))
	row.add_child(_txt("%s  •  %s" % [str(driver.get("country_name", "Unknown")), str(driver.get("stage", "unknown")).capitalize()], "body", 14, COPY, Rect2(Vector2(72.0, 34.0), Vector2(330.0, 20.0))))
	row.add_child(_txt(str(driver.get("primary_team", "Unassigned")), "body", 16, COPY, Rect2(Vector2(430.0, 12.0), Vector2(260.0, 24.0))))
	var overall := _rating_label(float(driver.get("overall", 0.0)))
	var overall_label := _txt(overall, "bold", 21, _rating_color(float(driver.get("overall", 0.0))), Rect2(Vector2(760.0, 11.0), Vector2(80.0, 28.0)))
	overall_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(overall_label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = row.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_driver_selected.bind(str(driver.get("id", ""))))
	row.add_child(button)
	return row


func _build_driver_detail_panel() -> Control:
	var card := _panel(DETAIL_RECT)
	var driver := _selected_driver()
	if driver.is_empty():
		card.add_child(_empty_state(Vector2(56.0, 270.0), "No driver selected.", "Choose a driver from the world list to inspect their profile."))
		return card

	card.add_child(_build_driver_portrait(driver, Vector2(46.0, 46.0), Vector2(250.0, 250.0)))
	var name := _txt(str(driver.get("name", "Unknown Driver")), "title", 46, Y, Rect2(Vector2(330.0, 42.0), Vector2(760.0, 56.0)))
	name.clip_text = true
	name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	card.add_child(name)
	card.add_child(_txt("%s (%s)  •  %s  •  %s" % [str(driver.get("country_name", "Unknown")), str(driver.get("country", "UNK")).to_upper(), str(driver.get("stage", "unknown")).capitalize(), _age_label(int(driver.get("age", 0)))], "body", 22, Color.WHITE, Rect2(Vector2(334.0, 108.0), Vector2(760.0, 30.0))))
	card.add_child(_txt("CURRENT WORLD PLACEMENT", "title", 18, Y, Rect2(Vector2(334.0, 172.0), Vector2(390.0, 24.0))))
	card.add_child(_txt(str(driver.get("primary_team", "No active roster seat")), "body", 22, Color.WHITE, Rect2(Vector2(334.0, 202.0), Vector2(620.0, 30.0))))
	card.add_child(_txt(str(driver.get("primary_championship", "Free agent / generated pool")), "body", 18, COPY, Rect2(Vector2(334.0, 234.0), Vector2(620.0, 26.0))))
	if int(driver.get("season_starts", 0)) > 0:
		card.add_child(_txt("SEASON RECORD", "title", 18, Y, Rect2(Vector2(334.0, 272.0), Vector2(390.0, 24.0))))
		var best_finish := int(driver.get("season_best_finish", 99))
		var best_text := ("P%d" % best_finish) if best_finish < 99 else "--"
		var record_text := "%d starts  •  %d wins  •  %d podiums  •  %d pts  •  best %s" % [
			int(driver.get("season_starts", 0)),
			int(driver.get("season_wins", 0)),
			int(driver.get("season_podiums", 0)),
			int(round(float(driver.get("season_points", 0.0)))),
			best_text,
		]
		card.add_child(_txt(record_text, "body", 17, Color.WHITE, Rect2(Vector2(334.0, 300.0), Vector2(620.0, 24.0))))

	var badge_text := "%d roster entries" % int(driver.get("seat_count", 0))
	card.add_child(_badge(badge_text, Vector2(1080.0, 62.0), Vector2(220.0, 36.0), Y if int(driver.get("seat_count", 0)) > 0 else Color(1, 1, 1, 0.14), Color.BLACK if int(driver.get("seat_count", 0)) > 0 else Color.WHITE))

	card.add_child(_rating_block("Overall", float(driver.get("overall", 0.0)), Vector2(46.0, 350.0)))
	card.add_child(_rating_block("Race Skill", float(driver.get("race_skill", 0.0)), Vector2(46.0, 438.0)))
	card.add_child(_rating_block("Qualifying", float(driver.get("qualifying_skill", 0.0)), Vector2(46.0, 526.0)))
	card.add_child(_rating_block("Consistency", float(driver.get("consistency", 0.0)), Vector2(46.0, 614.0)))
	card.add_child(_rating_block("Aggression", float(driver.get("aggression", 0.0)), Vector2(46.0, 702.0)))

	card.add_child(_build_profile_tabs(driver, Rect2(Vector2(760.0, 322.0), Vector2(560.0, 560.0))))

	card.add_child(_txt("This is a browser-only view for now. No contracts, offers, scouting locks, or gameplay actions are wired yet.", "body", 18, MUTED, Rect2(Vector2(46.0, 934.0), Vector2(1120.0, 36.0))))
	return card


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
	wrap.add_child(_txt(value_text, "title", 34, Y, Rect2(Vector2(18.0, 34.0), Vector2(rect.size.x - 36.0, 42.0))))
	return wrap


func _filter_button(label_text: String, value_text: String, rect: Rect2, filter_id: String) -> Control:
	var button := Button.new()
	button.position = rect.position
	button.size = rect.size
	button.text = "%s\n%s" % [label_text.to_upper(), value_text]
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_font_override("font", PrototypeTheme.font("bold"))
	button.add_theme_font_size_override("font_size", 15)
	button.add_theme_stylebox_override("normal", _button_style(Color(1, 1, 1, 0.055), Color(1, 1, 1, 0.14)))
	button.add_theme_stylebox_override("hover", _button_style(Color(0.968627, 0.921569, 0.32549, 0.12), Y))
	button.add_theme_stylebox_override("pressed", _button_style(Color(0.968627, 0.921569, 0.32549, 0.18), Y))
	button.add_theme_color_override("font_color", Color.WHITE)
	button.pressed.connect(_toggle_filter_dropdown.bind(filter_id))
	return button


func _build_option_dropdown(pos: Vector2, size_value: Vector2, options: Array, selected_value: String, callback_name: String) -> Control:
	var wrap := _dropdown_shell(pos, size_value)
	var y := 12.0
	for option_variant in options:
		var option := str(option_variant)
		var btn := Button.new()
		btn.position = Vector2(12.0, y)
		btn.size = Vector2(size_value.x - 24.0, 36.0)
		btn.text = option
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_override("font", PrototypeTheme.font("bold"))
		btn.add_theme_font_size_override("font_size", 15)
		btn.add_theme_stylebox_override("normal", _button_style(Y if option == selected_value else Color(1, 1, 1, 0.055), Color(1, 1, 1, 0.12)))
		btn.add_theme_stylebox_override("hover", _button_style(Color(0.968627, 0.921569, 0.32549, 0.14), Y))
		btn.add_theme_color_override("font_color", Color.BLACK if option == selected_value else Color.WHITE)
		btn.pressed.connect(Callable(self, StringName(callback_name)).bind(option))
		wrap.add_child(btn)
		y += 44.0
	return wrap


func _build_country_dropdown(pos: Vector2, size_value: Vector2) -> Control:
	var wrap := _dropdown_shell(pos, size_value)
	var search := LineEdit.new()
	search.position = Vector2(12.0, 12.0)
	search.size = Vector2(size_value.x - 24.0, 40.0)
	search.placeholder_text = "Search country..."
	search.text = country_search_text
	search.add_theme_font_override("font", PrototypeTheme.font("body"))
	search.add_theme_font_size_override("font_size", 16)
	search.text_changed.connect(_on_country_search_changed)
	wrap.add_child(search)

	var y := 62.0
	var visible_count := 0
	for option_variant in _country_options():
		var option := str(option_variant)
		if not _country_matches_search(option):
			continue
		if visible_count >= 8:
			break
		var btn := Button.new()
		btn.position = Vector2(12.0, y)
		btn.size = Vector2(size_value.x - 24.0, 36.0)
		btn.text = option
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_override("font", PrototypeTheme.font("bold"))
		btn.add_theme_font_size_override("font_size", 15)
		btn.add_theme_stylebox_override("normal", _button_style(Y if option == country_filter else Color(1, 1, 1, 0.055), Color(1, 1, 1, 0.12)))
		btn.add_theme_stylebox_override("hover", _button_style(Color(0.968627, 0.921569, 0.32549, 0.14), Y))
		btn.add_theme_color_override("font_color", Color.BLACK if option == country_filter else Color.WHITE)
		btn.pressed.connect(_on_country_option_selected.bind(option))
		wrap.add_child(btn)
		y += 42.0
		visible_count += 1
	if visible_count == 0:
		wrap.add_child(_txt("No country matches.", "body", 15, COPY, Rect2(Vector2(18.0, 74.0), Vector2(size_value.x - 36.0, 24.0))))
	return wrap


func _dropdown_shell(pos: Vector2, size_value: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	wrap.z_index = 80
	var bg := PanelContainer.new()
	bg.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.04, 0.08, 0.98)
	style.border_color = Y
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
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


func _rating_block(label_text: String, value: float, pos: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(610.0, 64.0)
	wrap.add_child(_txt(label_text.to_upper(), "body", 15, COPY, Rect2(Vector2.ZERO, Vector2(220.0, 20.0))))
	var value_label := _txt(_rating_label(value), "bold", 24, _rating_color(value), Rect2(Vector2(500.0, -4.0), Vector2(90.0, 30.0)))
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(value_label)
	var track := ColorRect.new()
	track.position = Vector2(0.0, 34.0)
	track.size = Vector2(590.0, 10.0)
	track.color = Color(1, 1, 1, 0.10)
	wrap.add_child(track)
	var fill := ColorRect.new()
	fill.position = track.position
	fill.size = Vector2(track.size.x * clampf(_rating_fraction(value), 0.0, 1.0), track.size.y)
	fill.color = _rating_color(value)
	wrap.add_child(fill)
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


func _profile_note(text_value: String, rect: Rect2) -> Control:
	var note := RichTextLabel.new()
	note.position = rect.position
	note.size = rect.size
	note.bbcode_enabled = false
	note.fit_content = false
	note.scroll_active = false
	note.clip_contents = true
	note.text = text_value
	note.add_theme_font_override("normal_font", PrototypeTheme.font("body"))
	note.add_theme_font_size_override("normal_font_size", 17)
	note.add_theme_color_override("default_color", Color.WHITE)
	return note


func _build_profile_tabs(driver: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true
	var tabs := [
		{"id": "bio", "label": "Bio"},
		{"id": "traits", "label": "Traits"},
		{"id": "career", "label": "Career"},
		{"id": "world", "label": "World"},
	]
	var x := 0.0
	for tab_variant in tabs:
		var tab: Dictionary = tab_variant as Dictionary
		wrap.add_child(_profile_tab_button(str(tab.get("id", "")), str(tab.get("label", "")), Vector2(x, 0.0), Vector2(126.0, 42.0)))
		x += 138.0
	var divider := ColorRect.new()
	divider.position = Vector2(0.0, 56.0)
	divider.size = Vector2(rect.size.x, 1.0)
	divider.color = Color(1, 1, 1, 0.12)
	wrap.add_child(divider)
	wrap.add_child(_build_profile_tab_content(driver, Rect2(Vector2(0.0, 76.0), Vector2(rect.size.x, rect.size.y - 76.0))))
	return wrap


func _profile_tab_button(tab_id: String, label_text: String, pos: Vector2, size_value: Vector2) -> Control:
	var button := Button.new()
	button.position = pos
	button.size = size_value
	button.text = label_text
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_font_override("font", PrototypeTheme.font("bold"))
	button.add_theme_font_size_override("font_size", 16)
	var active := tab_id == active_profile_tab
	button.add_theme_stylebox_override("normal", _button_style(Y if active else Color(1, 1, 1, 0.055), Y if active else Color(1, 1, 1, 0.16)))
	button.add_theme_stylebox_override("hover", _button_style(Color(0.968627, 0.921569, 0.32549, 0.14), Y))
	button.add_theme_color_override("font_color", Color.BLACK if active else Color.WHITE)
	button.pressed.connect(_on_profile_tab_selected.bind(tab_id))
	return button


func _build_profile_tab_content(driver: Dictionary, rect: Rect2) -> Control:
	match active_profile_tab:
		"traits":
			return _build_traits_tab(driver, rect)
		"career":
			return _build_career_tab(driver, rect)
		"world":
			return _build_world_tab(driver, rect)
		_:
			return _build_bio_tab(driver, rect)


func _build_bio_tab(driver: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.add_child(_txt("PROFILE BIO", "title", 20, Y, Rect2(Vector2.ZERO, Vector2(rect.size.x, 28.0))))
	wrap.add_child(_profile_note(_bio_summary(str(driver.get("bio", "No profile biography generated yet."))), Rect2(Vector2(0.0, 44.0), Vector2(rect.size.x, 180.0))))
	wrap.add_child(_info_text_block("QUICK READ", "%s driver from %s with %s reputation and %s personality." % [
		str(driver.get("stage", "unknown")).capitalize(),
		str(driver.get("country_name", "Unknown")),
		str(int(driver.get("reputation", 0))),
		str(driver.get("personality", "unknown")).capitalize()
	], Rect2(Vector2(0.0, 252.0), Vector2(rect.size.x, 86.0))))
	return wrap


func _build_traits_tab(driver: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.add_child(_trait_card("PERSONALITY", str(driver.get("personality", "unknown")).capitalize(), "Pressure style", Rect2(Vector2(0.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_trait_card("REPUTATION", str(int(driver.get("reputation", 0))), "Paddock standing", Rect2(Vector2(290.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_info_text_block("DRIVING STYLE", _truncate_copy(str(driver.get("driving_style", "No driving style note generated yet.")), 220), Rect2(Vector2(0.0, 154.0), Vector2(rect.size.x, 118.0))))
	wrap.add_child(_info_text_block("QUIRKS", _array_summary(driver.get("quirks", []), "No quirks generated yet."), Rect2(Vector2(0.0, 296.0), Vector2(rect.size.x, 104.0))))
	return wrap


func _build_career_tab(driver: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.add_child(_trait_card("NICKNAME", _fallback_text(str(driver.get("nickname", "")), "None"), "Media identity", Rect2(Vector2(0.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_trait_card("CAREER STAGE", str(driver.get("stage", "unknown")).capitalize(), "Development arc", Rect2(Vector2(290.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_info_text_block("CAREER HIGHLIGHT", _truncate_copy(str(driver.get("career_highlight", "No highlight generated yet.")), 190), Rect2(Vector2(0.0, 154.0), Vector2(rect.size.x, 104.0))))
	wrap.add_child(_info_text_block("LOW POINT", _truncate_copy(str(driver.get("career_low_point", "No low point generated yet.")), 190), Rect2(Vector2(0.0, 280.0), Vector2(rect.size.x, 104.0))))
	return wrap


func _build_world_tab(driver: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.add_child(_trait_card("ROSTER SEATS", str(int(driver.get("seat_count", 0))), "Active world links", Rect2(Vector2(0.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_trait_card("COUNTRY", str(driver.get("country_name", "Unknown")), str(driver.get("country", "UNK")).to_upper(), Rect2(Vector2(290.0, 0.0), Vector2(260.0, 130.0))))
	wrap.add_child(_info_text_block("CURRENT TEAM", str(driver.get("primary_team", "Unassigned")), Rect2(Vector2(0.0, 154.0), Vector2(rect.size.x, 70.0))))
	wrap.add_child(_info_text_block("CURRENT CHAMPIONSHIP", str(driver.get("primary_championship", "Free agent / generated pool")), Rect2(Vector2(0.0, 240.0), Vector2(rect.size.x, 70.0))))
	wrap.add_child(_info_text_block("QUOTE", _truncate_copy(str(driver.get("famous_quote", "No quote generated yet.")), 150), Rect2(Vector2(0.0, 326.0), Vector2(rect.size.x, 92.0))))
	return wrap


func _info_text_block(title_text: String, body_text: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true
	wrap.add_child(_txt(title_text, "title", 16, Y, Rect2(Vector2.ZERO, Vector2(rect.size.x, 22.0))))
	wrap.add_child(_profile_note(_truncate_copy(body_text, 220), Rect2(Vector2(0.0, 32.0), Vector2(rect.size.x, rect.size.y - 32.0))))
	return wrap


func _trait_card(label_text: String, value_text: String, detail_text: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true
	var bg := PanelContainer.new()
	bg.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1, 1, 1, 0.055)
	style.border_color = Color(0.968627, 0.921569, 0.32549, 0.34)
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(label_text, "body", 13, COPY, Rect2(Vector2(18.0, 14.0), Vector2(rect.size.x - 36.0, 20.0))))
	var value_size := 30 if value_text.length() <= 10 else 24
	var value := _txt(value_text, "title", value_size, Y, Rect2(Vector2(18.0, 36.0), Vector2(rect.size.x - 36.0, 44.0)))
	value.clip_text = true
	value.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(value)
	var detail := _txt(detail_text, "body", 14, MUTED, Rect2(Vector2(18.0, 86.0), Vector2(rect.size.x - 36.0, 24.0)))
	detail.clip_text = true
	detail.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(detail)
	return wrap


func _empty_state(pos: Vector2, title_text: String, body_text: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(720.0, 190.0)
	wrap.add_child(_txt(title_text, "title", 32, Y, Rect2(Vector2.ZERO, Vector2(680.0, 42.0))))
	var body := _txt(body_text, "body", 20, COPY, Rect2(Vector2(0.0, 58.0), Vector2(680.0, 90.0)))
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(body)
	return wrap


func _build_driver_portrait(driver: Dictionary, pos: Vector2, size_value: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	var frame := PanelContainer.new()
	frame.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.14, 0.16, 0.20, 0.98)
	style.border_color = Y
	style.set_border_width_all(2)
	style.set_corner_radius_all(int(round(size_value.x * 0.5)))
	frame.add_theme_stylebox_override("panel", style)
	wrap.add_child(frame)
	var portrait := TextureRect.new()
	portrait.texture = _load_portrait_texture(str(driver.get("portrait_path", "")))
	if portrait.texture == null:
		portrait.texture = DRIVER_FALLBACK_TEXTURE
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.position = Vector2(8.0, 8.0)
	portrait.size = size_value - Vector2(16.0, 16.0)
	portrait.material = _driver_avatar_mask_material()
	wrap.add_child(portrait)
	return wrap


func _load_driver_browser_data() -> void:
	var narratives := _records_by_key(_load_records(DRIVER_NARRATIVES_PATH), "id")
	var portrait_paths := _driver_portrait_paths()
	var roster := _roster_by_driver()
	var live_stats: Dictionary = {}
	if PrototypeState != null and PrototypeState.has_method("get_live_driver_stats"):
		var live_variant: Variant = PrototypeState.call("get_live_driver_stats")
		if live_variant is Dictionary:
			live_stats = live_variant
	all_drivers = []
	for profile_variant in _load_records(DRIVER_PROFILES_PATH):
		if not profile_variant is Dictionary:
			continue
		var profile: Dictionary = profile_variant as Dictionary
		var driver_id := str(profile.get("id", "")).strip_edges()
		var name := str(profile.get("canonical_display_name", profile.get("display_name", ""))).strip_edges()
		if driver_id.is_empty() or name.is_empty():
			continue
		var ratings_variant: Variant = profile.get("ratings", {})
		var ratings: Dictionary = {}
		if ratings_variant is Dictionary:
			ratings = ratings_variant as Dictionary
		var narrative_id := str(profile.get("driver_narrative_id", ""))
		var narrative: Dictionary = {}
		if narratives.has(narrative_id) and narratives[narrative_id] is Dictionary:
			narrative = narratives[narrative_id] as Dictionary
		var roster_meta: Dictionary = {}
		if roster.has(driver_id) and roster[driver_id] is Dictionary:
			roster_meta = roster[driver_id] as Dictionary
		var live: Dictionary = live_stats.get(driver_id, {}) if live_stats.get(driver_id, {}) is Dictionary else {}
		var base_overall := float(ratings.get("overall", 0.0))
		var live_rating := float(live.get("dynamic_rating", 0.0))
		var effective_overall := live_rating if live_rating > 0.0 else base_overall
		all_drivers.append({
			"id": driver_id,
			"name": name,
			"country": _country_code(profile),
			"country_name": _country_name(profile),
			"nationality": str(profile.get("nationality", "")),
			"age": int(profile.get("age", 0)),
			"stage": str(profile.get("career_stage", ratings.get("career_stage", "unknown"))),
			"personality": str(profile.get("personality", "")),
			"overall": effective_overall,
			"base_overall": base_overall,
			"race_skill": float(ratings.get("race_skill", 0.0)),
			"qualifying_skill": float(ratings.get("qualifying_skill", 0.0)),
			"consistency": float(ratings.get("consistency", 0.0)),
			"aggression": float(ratings.get("aggression", 0.0)),
			"reputation": int(ratings.get("reputation", 0)),
			"season_starts": int(live.get("starts", 0)),
			"season_wins": int(live.get("wins", 0)),
			"season_podiums": int(live.get("podiums", 0)),
			"season_points": float(live.get("points", 0.0)),
			"season_top10": int(live.get("top10", 0)),
			"season_best_finish": int(live.get("best_finish", 99)),
			"portrait_path": str(portrait_paths.get(str(profile.get("portrait_profile_id", "")), "")),
			"bio": str(narrative.get("biography", profile.get("bio", ""))),
			"driving_style": str(narrative.get("driving_style", "")),
			"nickname": str(narrative.get("nickname", "")),
			"famous_quote": str(narrative.get("famous_quote", "")),
			"career_highlight": str(narrative.get("career_highlight", "")),
			"career_low_point": str(narrative.get("career_low_point", "")),
			"quirks": narrative.get("quirks", []),
			"primary_team": str(roster_meta.get("primary_team", "Unassigned")),
			"primary_championship": str(roster_meta.get("primary_championship", "Free agent / generated pool")),
			"seat_count": int(roster_meta.get("seat_count", 0)),
		})
	_sort_driver_list(all_drivers)


func _load_records(path: String) -> Array:
	if not FileAccess.file_exists(path):
		return []
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if parsed is Dictionary:
		var records: Variant = (parsed as Dictionary).get("records", [])
		if records is Array:
			return records as Array
	return []


func _records_by_key(records: Array, key: String) -> Dictionary:
	var out := {}
	for record_variant in records:
		if not record_variant is Dictionary:
			continue
		var record: Dictionary = record_variant as Dictionary
		var id := str(record.get(key, "")).strip_edges()
		if not id.is_empty():
			out[id] = record
	return out


func _driver_portrait_paths() -> Dictionary:
	var out := {}
	for portrait_variant in _load_records(PORTRAIT_PROFILES_PATH):
		if not portrait_variant is Dictionary:
			continue
		var portrait: Dictionary = portrait_variant as Dictionary
		if str(portrait.get("entity_type", "")) != "driver":
			continue
		var portrait_id := str(portrait.get("id", "")).strip_edges()
		var asset_path := str(portrait.get("asset_path", "")).strip_edges()
		if portrait_id.is_empty() or asset_path.is_empty():
			continue
		out[portrait_id] = _resolve_generated_image_path(asset_path)
	return out


func _resolve_generated_image_path(asset_path: String) -> String:
	var normalized := asset_path
	if normalized.begins_with("portraits/"):
		normalized = normalized.substr("portraits/".length())
	var candidates := [
		"%s/portraits/%s" % [DIST_GENERATED_IMAGE_ROOT, normalized],
		"%s/%s" % [DIST_GENERATED_IMAGE_ROOT, asset_path],
		"%s/%s" % [DIST_GENERATED_IMAGE_ROOT, normalized],
		"res://assets/images/generated/portraits/%s" % normalized,
		"%s/portraits/%s" % [GENERATED_IMAGE_ROOT, normalized],
		"res://assets/images/generated/%s" % asset_path,
		"%s/%s" % [GENERATED_IMAGE_ROOT, asset_path],
		"res://assets/images/generated/%s" % normalized,
		"%s/%s" % [GENERATED_IMAGE_ROOT, normalized],
	]
	for candidate_variant in candidates:
		var candidate := str(candidate_variant)
		if FileAccess.file_exists(ProjectSettings.globalize_path(candidate)):
			return candidate
	return str(candidates[0])


func _roster_by_driver() -> Dictionary:
	var out := {}
	for row_variant in _load_records(ROSTER_PATH):
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		var driver_id := str(row.get("driver_profile_id", "")).strip_edges()
		if driver_id.is_empty():
			continue
		var meta: Dictionary = out.get(driver_id, {
			"teams": [],
			"championships": [],
			"primary_team": str(row.get("team_name", "Unassigned")),
			"primary_championship": _championship_label(str(row.get("championship_id", ""))),
			"seat_count": 0,
		}) as Dictionary
		var team_name := str(row.get("team_name", "")).strip_edges()
		var teams_variant: Variant = meta.get("teams", [])
		var teams: Array = []
		if teams_variant is Array:
			teams = teams_variant as Array
		if not team_name.is_empty() and not teams.has(team_name):
			teams.append(team_name)
		meta["teams"] = teams
		var championship := _championship_label(str(row.get("championship_id", "")))
		var championships_variant: Variant = meta.get("championships", [])
		var championships: Array = []
		if championships_variant is Array:
			championships = championships_variant as Array
		if not championship.is_empty() and not championships.has(championship):
			championships.append(championship)
		meta["championships"] = championships
		meta["seat_count"] = int(meta.get("seat_count", 0)) + 1
		out[driver_id] = meta
	return out


func _country_code(profile: Dictionary) -> String:
	var code := str(profile.get("country_code", profile.get("country_name", "UNK"))).strip_edges().to_upper()
	if code.length() > 3:
		return code.substr(0, 3)
	return code


func _country_name(profile: Dictionary) -> String:
	var raw_name := str(profile.get("country_name", "")).strip_edges()
	if raw_name.length() > 3:
		return raw_name
	var code := _country_code(profile)
	return str(COUNTRY_NAMES.get(code, code))


func _filtered_drivers() -> Array:
	var cache_key := "%s|%s|%s|%d" % [roster_filter, country_filter, sort_mode, all_drivers.size()]
	if filtered_driver_cache_key == cache_key:
		return filtered_driver_cache
	var rows: Array = []
	for driver_variant in all_drivers:
		if not driver_variant is Dictionary:
			continue
		var driver: Dictionary = driver_variant as Dictionary
		match roster_filter:
			"Rostered":
				if int(driver.get("seat_count", 0)) <= 0:
					continue
			"Free":
				if int(driver.get("seat_count", 0)) > 0:
					continue
		if country_filter != "All" and str(driver.get("country_name", "")) != country_filter:
			continue
		rows.append(driver)
	_sort_driver_list(rows)
	filtered_driver_cache = rows
	filtered_driver_cache_key = cache_key
	return rows


func _sort_driver_list(rows: Array) -> void:
	match sort_mode:
		"Name":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return str(a.get("name", "")) < str(b.get("name", "")))
		"Reputation":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("reputation", 0)) > int(b.get("reputation", 0)))
		"Roster":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("seat_count", 0)) > int(b.get("seat_count", 0)))
		_:
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a.get("overall", 0.0)) > float(b.get("overall", 0.0)))


func _selected_driver() -> Dictionary:
	for driver_variant in all_drivers:
		if not driver_variant is Dictionary:
			continue
		var driver: Dictionary = driver_variant as Dictionary
		if str(driver.get("id", "")) == selected_driver_id:
			return driver
	return {}


func _select_first_driver_if_needed() -> void:
	var rows := _filtered_drivers()
	if selected_driver_id.is_empty() and not rows.is_empty():
		selected_driver_id = str((rows[0] as Dictionary).get("id", ""))


func _apply_pending_driver_selection() -> void:
	if PrototypeState == null or not PrototypeState.has_method("consume_pending_driver_browser_id"):
		return
	var pending_id := str(PrototypeState.call("consume_pending_driver_browser_id")).strip_edges()
	if pending_id.is_empty():
		return
	for driver_variant in all_drivers:
		if driver_variant is Dictionary and str((driver_variant as Dictionary).get("id", "")) == pending_id:
			selected_driver_id = pending_id
			page_index = _page_for_driver_id(pending_id)
			return


func _page_for_driver_id(driver_id: String) -> int:
	var rows := _filtered_drivers()
	for index in range(rows.size()):
		if rows[index] is Dictionary and str((rows[index] as Dictionary).get("id", "")) == driver_id:
			return int(floor(float(index) / float(ROWS_PER_PAGE)))
	return page_index


func _load_portrait_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if portrait_texture_cache.has(path):
		return portrait_texture_cache[path]
	if ResourceLoader.exists(path):
		var res_texture: Texture2D = load(path)
		if res_texture != null:
			portrait_texture_cache[path] = res_texture
			return res_texture
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		return null
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	portrait_texture_cache[path] = texture
	return texture


func _on_driver_selected(driver_id: String) -> void:
	selected_driver_id = driver_id
	open_filter_id = ""
	active_profile_tab = "bio"
	_request_rebuild()


func _prev_page() -> void:
	page_index = max(0, page_index - 1)
	_request_rebuild()


func _next_page() -> void:
	page_index += 1
	_request_rebuild()


func _next_roster_filter() -> void:
	_on_roster_option_selected(_next_option(_roster_options(), roster_filter))


func _next_country_filter() -> void:
	_toggle_filter_dropdown("country")


func _next_sort_mode() -> void:
	_on_sort_option_selected(_next_option(_sort_options(), sort_mode))


func _toggle_filter_dropdown(filter_id: String) -> void:
	open_filter_id = "" if open_filter_id == filter_id else filter_id
	_request_rebuild()


func _on_roster_option_selected(option: String) -> void:
	roster_filter = option
	open_filter_id = ""
	page_index = 0
	_clear_filtered_driver_cache()
	_select_first_visible_driver()
	_request_rebuild()


func _on_sort_option_selected(option: String) -> void:
	sort_mode = option
	open_filter_id = ""
	page_index = 0
	_clear_filtered_driver_cache()
	_select_first_visible_driver()
	_request_rebuild()


func _on_country_option_selected(option: String) -> void:
	country_filter = option
	open_filter_id = ""
	country_search_text = ""
	page_index = 0
	_clear_filtered_driver_cache()
	_select_first_visible_driver()
	_request_rebuild()


func _on_country_search_changed(value: String) -> void:
	country_search_text = value
	open_filter_id = "country"
	_request_rebuild()


func _roster_options() -> Array:
	return ["All", "Rostered", "Free"]


func _sort_options() -> Array:
	return ["Overall", "Reputation", "Name", "Roster"]


func _next_option(options: Array, current: String) -> String:
	var index := options.find(current)
	if index < 0:
		return str(options[0])
	return str(options[(index + 1) % options.size()])


func _select_first_visible_driver() -> void:
	var rows := _filtered_drivers()
	selected_driver_id = str((rows[0] as Dictionary).get("id", "")) if not rows.is_empty() else ""


func _clear_filtered_driver_cache() -> void:
	filtered_driver_cache = []
	filtered_driver_cache_key = ""


func _country_options() -> Array:
	var options: Array = ["All"]
	for driver_variant in all_drivers:
		if not driver_variant is Dictionary:
			continue
		var country := str((driver_variant as Dictionary).get("country_name", "")).strip_edges()
		if not country.is_empty() and not options.has(country):
			options.append(country)
	options.sort()
	if options.has("All"):
		options.erase("All")
	options.insert(0, "All")
	return options


func _country_matches_search(country_name: String) -> bool:
	var query := country_search_text.strip_edges().to_lower()
	return query.is_empty() or country_name.to_lower().contains(query)


func _on_profile_tab_selected(tab_id: String) -> void:
	active_profile_tab = tab_id
	_request_rebuild()


func _array_summary(value: Variant, fallback: String) -> String:
	if not value is Array:
		return fallback
	var parts: PackedStringArray = PackedStringArray()
	for item_variant in value as Array:
		if item_variant is Dictionary:
			var dict: Dictionary = item_variant as Dictionary
			var text := str(dict.get("text", dict.get("reason", dict.get("driver", "")))).strip_edges()
			if not text.is_empty():
				parts.append(_truncate_copy(text, 70))
		else:
			var text := str(item_variant).strip_edges()
			if not text.is_empty():
				parts.append(_truncate_copy(text, 70))
		if parts.size() >= 2:
			break
	return "  •  ".join(parts) if not parts.is_empty() else fallback


func _bio_summary(value: String) -> String:
	var cleaned := value.replace("\r\n", "\n").replace("\n\n", " ").replace("\n", " ").strip_edges()
	if cleaned.is_empty():
		return "No profile biography generated yet."
	var sentences: PackedStringArray = PackedStringArray()
	var start := 0
	for idx in range(cleaned.length()):
		var ch := cleaned.substr(idx, 1)
		if [".", "!", "?"].has(ch):
			var sentence := cleaned.substr(start, idx - start + 1).strip_edges()
			if not sentence.is_empty():
				sentences.append(sentence)
			start = idx + 1
		if sentences.size() >= 2:
			break
	if sentences.is_empty():
		return _truncate_copy(cleaned, 340)
	return _truncate_copy(" ".join(sentences), 360)


func _fallback_text(value: String, fallback: String) -> String:
	var cleaned := value.strip_edges()
	return cleaned if not cleaned.is_empty() else fallback


func _rating_fraction(value: float) -> float:
	return value if value <= 1.0 else value / 100.0


func _age_label(age: int) -> String:
	return "Age %d" % age if age > 0 else "Age TBA"


func _rating_label(value: float) -> String:
	return "%d" % int(round(_rating_fraction(value) * 100.0))


func _rating_color(value: float) -> Color:
	var fraction := _rating_fraction(value)
	if fraction >= 0.76:
		return GREEN
	if fraction >= 0.58:
		return Y
	return RED


func _championship_label(id: String) -> String:
	var cleaned := id.replace("championship.", "").replace("_", " ").replace("-", " ").strip_edges()
	return cleaned.capitalize() if not cleaned.is_empty() else ""


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
	var bg := PanelContainer.new()
	bg.size = rect.size
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_BG
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	return wrap


func _button_style(bg_color: Color, border_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	return style


func _driver_avatar_mask_material() -> ShaderMaterial:
	if driver_avatar_mask_material != null:
		return driver_avatar_mask_material
	var shader := Shader.new()
	shader.code = """
shader_type canvas_item;

void fragment() {
	vec2 texture_size = 1.0 / TEXTURE_PIXEL_SIZE;
	float aspect = texture_size.x / texture_size.y;
	vec2 sample_uv = UV;
	if (aspect > 1.0) {
		float width = 1.0 / aspect;
		sample_uv.x = (UV.x - 0.5) * width + 0.5;
	} else if (aspect < 1.0) {
		float height = aspect;
		sample_uv.y = (UV.y - 0.5) * height + 0.5;
	}
	vec2 centered_uv = UV * 2.0 - vec2(1.0);
	if (dot(centered_uv, centered_uv) > 1.0) {
		discard;
	}
	COLOR = texture(TEXTURE, sample_uv);
}
"""
	driver_avatar_mask_material = ShaderMaterial.new()
	driver_avatar_mask_material.shader = shader
	return driver_avatar_mask_material
