extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const HOME_SCENE := "res://scenes/main_stats_screen.tscn"
const RACE_DAY_SCENE := "res://scenes/race_day_screen.tscn"
const SESSION_PRACTICE := "practice"
const SESSION_QUALIFYING := "qualifying"
const SESSION_RACE := "race"

const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const MAIN_BADGE_PATH := "res://assets/images/figma-hq/series-entry-main-badge-figma.png"
const CARD_BG_PATH := "res://assets/images/figma-hq/series-entry-carousel-card-bg-figma.png"
const CARD_BADGE_PATH := "res://assets/images/figma-hq/series-entry-carousel-badge-figma.png"
const CAROUSEL_ARROW_TEXTURE = preload("res://assets/images/figma-hq/series-entry-carousel-arrow-figma.svg")

const ICON_DIR := "res://assets/images/material-icons"
const CHEVRON_DOWN_ICON_PATH := ICON_DIR + "/arrow_drop_down.png"
const ARROW_LEFT_ICON_PATH := ICON_DIR + "/keyboard_arrow_left.png"
const ARROW_RIGHT_ICON_PATH := ICON_DIR + "/keyboard_arrow_right.png"
const ADD_ICON_TEXTURE = preload("res://assets/images/material-icons/add.svg")
const AUTORENEW_ICON_TEXTURE = preload("res://assets/images/material-icons/autorenew.svg")
const EDIT_ICON_TEXTURE = preload("res://assets/images/material-icons/edit.svg")
const DELETE_ICON_TEXTURE = preload("res://assets/images/material-icons/delete.svg")
const LOCATION_ICON_TEXTURE = preload("res://assets/images/material-icons/location_on.svg")
const CHECK_ICON_TEXTURE = preload("res://assets/images/material-icons/check.svg")

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const MENU_RADIUS := 4

const STRIP_RECT := Rect2(Vector2(89.0, 151.0), Vector2(2380.0, 122.0))
const LEFT_RECT := Rect2(Vector2(89.0, 292.0), Vector2(1166.0, 645.0))
const RIGHT_RECT := Rect2(Vector2(1307.0, 292.0), Vector2(1166.0, 645.0))
const CAROUSEL_RECT := Rect2(Vector2(89.0, 972.0), Vector2(2380.0, 352.0))

var selected_class_filter := "All"
var selected_car_filter := "All"
var selected_entry_filter := "All"
var selected_sort_filter := "Featured"
var open_filter_id := ""
var selected_series_id := ""
var carousel_offset := 0
var active_right_tab := "schedule"
var schedule_rounds: Array = []
var schedule_series_id := ""
var selected_round_index := -1
var action_feedback := ""
var entry_flow_series_id := ""
var entry_flow_step := "select"
var entry_flow_selected_car_instance_id := ""
var entry_flow_error := ""
var _season_review_dismissed := false

var icon_texture_cache: Dictionary = {}
var runtime_texture_cache: Dictionary = {}
var icon_tint_shader: Shader
var logo_cutout_shader: Shader
var series_directory_cache: Array = []
var series_directory_cache_loaded := false
var filtered_series_cache: Array = []
var filtered_series_cache_key := ""
var _rebuild_queued := false


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	if PrototypeState.series_browser_state_needs_refresh():
		PrototypeState.refresh_series_browser_state()
	_sync_selection()
	_ensure_schedule_rounds(true)
	get_viewport().size_changed.connect(_on_viewport_resized)
	_connect_prototype_state_signals()
	_build_ui()


func _connect_prototype_state_signals() -> void:
	if PrototypeState.has_signal("telemetry_result_applied") and not PrototypeState.is_connected("telemetry_result_applied", Callable(self, "_on_telemetry_result_applied")):
		PrototypeState.connect("telemetry_result_applied", Callable(self, "_on_telemetry_result_applied"))
	if PrototypeState.has_signal("telemetry_ingest_error") and not PrototypeState.is_connected("telemetry_ingest_error", Callable(self, "_on_telemetry_ingest_error")):
		PrototypeState.connect("telemetry_ingest_error", Callable(self, "_on_telemetry_ingest_error"))


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
	bg_dim.color = Color(0.0, 0.02, 0.06, 0.72)
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
	if not series_directory_cache_loaded or PrototypeState.series_browser_state_needs_refresh():
		_refresh_series_directory_cache()

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "series"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	_sync_selection()
	_ensure_schedule_rounds()
	var left_panel := _build_left_panel()
	shell.add_child(left_panel)
	var right_panel := _build_right_panel()
	shell.add_child(right_panel)
	var carousel := _build_series_carousel()
	shell.add_child(carousel)
	var summary_strip := _build_summary_strip()
	shell.add_child(summary_strip)

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "series"
	nav.show_continue_button = true
	nav.position = Vector2(0.0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)
	_register_tutorial(carousel, left_panel, right_panel, summary_strip)

	if not entry_flow_series_id.is_empty():
		frame.add_child(_build_entry_flow_overlay())
	else:
		var pending_summary: Dictionary = {} if _season_review_dismissed else PrototypeState.get_unreviewed_season_summary()
		if not pending_summary.is_empty():
			frame.add_child(_build_season_review_overlay(pending_summary))
		else:
			var reentry_series: Array = PrototypeState.get_series_awaiting_reentry() if PrototypeState.has_method("get_series_awaiting_reentry") else []
			if not reentry_series.is_empty():
				frame.add_child(_build_next_season_banner(reentry_series[0]))


func _register_tutorial(carousel: Control, left_panel: Control, right_panel: Control, summary_strip: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": carousel,
			"title": "Browse Championships",
			"body": "Scroll through the championships you can enter. You must own an eligible car first. Multiclass series are flagged so you know you will share the track with other car classes.",
			"affects": "Picking a series sets your whole season.",
		},
		{
			"target": left_panel,
			"title": "Series Detail",
			"body": "The selected championship's calendar, format and regulations - number of rounds, the regions you travel to, and any class requirements for your car.",
			"affects": "Tells you the commitment before you enter.",
		},
		{
			"target": right_panel,
			"title": "Standings & Entry",
			"body": "The championship standings and the entry action. Confirming entry registers your car, adds the rounds to your calendar, and kicks off the series-office emails.",
			"affects": "Entry turns a plan into a live race programme.",
		},
		{
			"target": summary_strip,
			"title": "Budget & Filters",
			"body": "Your available budget and how many series and cars you have entered, plus filters to narrow the list by class, entry status and sort order.",
			"affects": "Keep an eye on budget before committing.",
		},
	]
	director.report_screen_ready("series", steps, self)


func _build_summary_strip() -> Control:
	var card := _panel(STRIP_RECT)
	card.z_index = 40
	var class_rect := Rect2(Vector2(1468.0, 18.0), Vector2(344.0, 86.0))
	var entry_rect := Rect2(Vector2(1832.0, 18.0), Vector2(180.0, 86.0))
	var sort_rect := Rect2(Vector2(2032.0, 18.0), Vector2(300.0, 86.0))
	var entered_count: int = 0
	for row_variant in _all_series_entries():
		if typeof(row_variant) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = row_variant
		if bool(row.get("entered", false)):
			entered_count += 1
	card.add_child(_build_summary_metric_card("Available Budget", PrototypeState.cash_label(), Rect2(Vector2(24.0, 18.0), Vector2(370.0, 86.0)), false))
	card.add_child(_build_summary_metric_card("Series Entered", str(entered_count), Rect2(Vector2(414.0, 18.0), Vector2(260.0, 86.0)), false))
	card.add_child(_build_summary_metric_card("Cars Entered", str(max(PrototypeState.car_count, 0)), Rect2(Vector2(694.0, 18.0), Vector2(240.0, 86.0)), false))

	card.add_child(_build_summary_filter_button("Class", selected_class_filter, class_rect, "class"))
	card.add_child(_build_summary_filter_button("Entry", selected_entry_filter, entry_rect, "entry"))
	card.add_child(_build_summary_filter_button("Sort", selected_sort_filter, sort_rect, "sort"))

	match open_filter_id:
		"class":
			card.add_child(_build_summary_filter_dropdown(Vector2(class_rect.position.x, 110.0), Vector2(class_rect.size.x, 230.0), _class_filter_options(), selected_class_filter, "class"))
		"entry":
			card.add_child(_build_summary_filter_dropdown(Vector2(entry_rect.position.x, 110.0), Vector2(entry_rect.size.x, 210.0), _entry_filter_options(), selected_entry_filter, "entry"))
		"sort":
			card.add_child(_build_summary_filter_dropdown(Vector2(sort_rect.position.x, 110.0), Vector2(sort_rect.size.x, 250.0), _sort_filter_options(), selected_sort_filter, "sort"))

	return card


func _build_left_panel() -> Control:
	var card := _panel(LEFT_RECT)
	if _series_entries().is_empty():
		card.add_child(_build_empty_state_content(Vector2(48.0, 170.0), Vector2(520.0, 250.0), "No Matches", "No series match these filters", _filtered_empty_state_body()))
		return card
	var series := _current_series()
	var hero_title_lines: Array = _series_title_lines(series)
	card.add_child(_txt(str(hero_title_lines[0]), "title", 48, Y, Rect2(Vector2(25.0, 31.0), Vector2(520.0, 48.0))))
	card.add_child(_txt(str(hero_title_lines[1]), "title", 48, Y, Rect2(Vector2(25.0, 80.0), Vector2(520.0, 48.0))))

	var region_label := _txt("REGION", "title", 24, Y, Rect2(Vector2(25.0, 183.0), Vector2(134.0, 51.0)))
	region_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(region_label)
	var region_value := _txt(str(series.get("region", "EUROPE")), "body", 20, Color.WHITE, Rect2(Vector2(25.0, 222.0), Vector2(124.0, 24.0)))
	region_value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(region_value)

	var rounds_label := _txt("ROUNDS", "title", 24, Y, Rect2(Vector2(25.0, 281.0), Vector2(152.0, 50.0)))
	rounds_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(rounds_label)
	var rounds_count: int = int(series.get("rounds", 0))
	if rounds_count <= 0 and not schedule_rounds.is_empty():
		rounds_count = schedule_rounds.size()
	var rounds_value := _txt(str(rounds_count), "body", 20, Color.WHITE, Rect2(Vector2(25.0, 321.0), Vector2(40.0, 24.0)))
	rounds_value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(rounds_value)

	var prestige_label := _txt("PRESTIGE", "title", 24, Y, Rect2(Vector2(25.0, 379.0), Vector2(180.0, 50.0)))
	prestige_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(prestige_label)
	var prestige_value := _txt(str(series.get("prestige", 22)), "body", 20, Color.WHITE, Rect2(Vector2(25.0, 417.0), Vector2(56.0, 24.0)))
	prestige_value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(prestige_value)

	var prize_label := _txt("PRIZE POOL", "title", 24, Y, Rect2(Vector2(25.0, 476.0), Vector2(221.0, 51.0)))
	prize_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(prize_label)
	var prize_value := _txt(str(series.get("prize_pool", "$140 000")), "body", 20, Color(0.37, 0.76, 0.41, 1.0), Rect2(Vector2(25.0, 516.0), Vector2(135.0, 24.0)))
	prize_value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(prize_value)

	var class_groups: Array = series.get("class_groups", []) if series.get("class_groups", []) is Array else []
	var class_label := "MULTICLASS" if bool(series.get("is_multiclass", false)) else "SINGLE CLASS"
	card.add_child(_txt(class_label, "title", 22, Y, Rect2(Vector2(25.0, 594.0), Vector2(250.0, 30.0))))
	var class_lines: Array[String] = []
	for group_variant in class_groups:
		if not group_variant is Dictionary:
			continue
		var group: Dictionary = group_variant
		var label := str(group.get("label", "")).strip_edges()
		if label.is_empty():
			continue
		var entrant_count := int(group.get("entrant_count", 0))
		var count_suffix := " (%d)" % entrant_count if entrant_count > 0 else ""
		class_lines.append("%s%s" % [label, count_suffix])
	var class_body := ", ".join(PackedStringArray(class_lines))
	if class_body.is_empty():
		var eligible_labels: Array = series.get("eligible_car_class_labels", []) if series.get("eligible_car_class_labels", []) is Array else []
		class_body = ", ".join(PackedStringArray(eligible_labels))
	var class_copy := _txt(class_body, "body", 18, Color.WHITE, Rect2(Vector2(25.0, 628.0), Vector2(430.0, 66.0)))
	class_copy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	class_copy.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(class_copy)

	var logo_frame := CenterContainer.new()
	logo_frame.position = Vector2(585.0, 72.0)
	logo_frame.size = Vector2(500.0, 500.0)
	logo_frame.clip_contents = true
	card.add_child(logo_frame)

	var logo := TextureRect.new()
	var runtime_logo_path := str(series.get("logo_path", ""))
	logo.texture = _load_runtime_texture(runtime_logo_path) if not runtime_logo_path.is_empty() else _load_runtime_texture(MAIN_BADGE_PATH)
	if logo.texture == null:
		logo.texture = _load_runtime_texture(MAIN_BADGE_PATH)
	logo.custom_minimum_size = Vector2(510.0, 510.0)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	logo.modulate = Color(1, 1, 1, 0.98)
	logo.material = _logo_cutout_material()
	logo_frame.add_child(logo)

	return card


func _build_right_panel() -> Control:
	var card := _panel(RIGHT_RECT)
	if _series_entries().is_empty():
		card.add_child(_build_empty_state_content(Vector2(56.0, 170.0), Vector2(760.0, 250.0), "Browser Empty", "Adjust filters to keep browsing", _filtered_empty_state_body()))
		return card
	var series := _current_series()
	_ensure_schedule_rounds()
	if active_right_tab == "schedule":
		card.add_child(_build_schedule_list(series))
	elif active_right_tab == "drivers":
		card.add_child(_build_driver_standings_list(series))
	else:
		card.add_child(_build_standings_list(series))
	card.add_child(_build_right_panel_footer(series))
	card.add_child(_build_right_panel_header(series))
	return card


func _build_right_panel_header(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2.ZERO
	wrap.size = RIGHT_RECT.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.z_index = 20
	wrap.add_child(_build_schedule_tabs())
	var rounds_count: int = int(series.get("rounds", schedule_rounds.size()))
	if rounds_count <= 0:
		rounds_count = schedule_rounds.size()
	var format_label := str(series.get("format", "Open")).capitalize()
	var region_label := str(series.get("region", "Unknown"))
	# Series/class name is already the panel context, so keep the meta strip to
	# the at-a-glance facts (rounds / format / region). For multiclass we add a
	# short "Multiclass" tag, but never the long championship name, which used to
	# overflow into the tab row and the points column.
	var meta_text := "%d Rounds  •  %s  •  %s" % [rounds_count, format_label, region_label]
	if bool(series.get("is_multiclass", false)):
		meta_text += "  •  Multiclass"
	var meta := _txt(meta_text, "body", 16, Color("BCBCBD"), Rect2(Vector2(620.0, 36.0), Vector2(460.0, 22.0)))
	meta.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	meta.clip_text = true
	meta.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(meta)
	var divider := ColorRect.new()
	divider.position = Vector2(45.0, 88.0)
	divider.size = Vector2(1074.0, 1.0)
	divider.color = Color(1.0, 1.0, 1.0, 0.10)
	wrap.add_child(divider)
	return wrap


func _build_right_panel_footer(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2.ZERO
	wrap.size = RIGHT_RECT.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.z_index = 10
	var divider := ColorRect.new()
	divider.position = Vector2(45.0, 456.0)
	divider.size = Vector2(1074.0, 1.0)
	divider.color = Color(1.0, 1.0, 1.0, 0.10)
	wrap.add_child(divider)

	var state_title := _txt(_entry_state_title(series), "body", 16, Y if bool(series.get("entered", false)) else Color("BCBCBD"), Rect2(Vector2(47.0, 480.0), Vector2(320.0, 22.0)))
	wrap.add_child(state_title)
	var state_detail := _txt(_entry_state_detail(series), "body", 14, Color("BCBCBD"), Rect2(Vector2(47.0, 512.0), Vector2(560.0, 44.0)))
	state_detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	state_detail.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(state_detail)

	var fee_label := _txt("FEE", "title", 24, Y, Rect2(Vector2(955.0, 472.0), Vector2(164.0, 29.0)))
	fee_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(fee_label)
	var fee_value := _txt(str(series.get("fee", "$190 000")), "title", 48, Y, Rect2(Vector2(690.0, 498.0), Vector2(429.0, 58.0)))
	fee_value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(fee_value)
	wrap.add_child(_build_enter_button(series, Vector2(944.0, 571.0), Vector2(175.0, 42.0)))
	return wrap


func _build_schedule_tabs() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(45.0, 22.0)
	wrap.size = Vector2(633.0, 55.0)
	wrap.add_child(_build_tab("schedule", "Schedule", Rect2(Vector2(0.0, 0.0), Vector2(195.0, 55.0))))
	wrap.add_child(_build_tab("standings", "Teams", Rect2(Vector2(219.0, 0.0), Vector2(195.0, 55.0))))
	wrap.add_child(_build_tab("drivers", "Drivers", Rect2(Vector2(438.0, 0.0), Vector2(195.0, 55.0))))
	return wrap


func _build_tab(tab_id: String, text_value: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var shell := PanelContainer.new()
	shell.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y if tab_id == active_right_tab else Color(0, 0, 0, 0)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	shell.add_theme_stylebox_override("panel", style)
	wrap.add_child(shell)

	var label := _txt(text_value, "title", 24, Color("13131A") if tab_id == active_right_tab else Y, Rect2(Vector2(0.0, 13.0), Vector2(rect.size.x, 29.0)))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.pressed.connect(func() -> void:
		active_right_tab = tab_id
		_request_rebuild()
	)
	wrap.add_child(button)
	return wrap


func _build_schedule_actions(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2.ZERO
	wrap.size = RIGHT_RECT.size
	return wrap


func _build_schedule_list(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2.ZERO
	wrap.size = RIGHT_RECT.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(47.0, 108.0)
	scroll.size = Vector2(1032.0, 324.0)
	scroll.clip_contents = true
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	wrap.add_child(scroll)

	var content := Control.new()
	content.custom_minimum_size = Vector2(1012.0, max(scroll.size.y, float(schedule_rounds.size()) * 70.0 + 8.0))
	scroll.add_child(content)

	var vbar := scroll.get_v_scroll_bar()
	if vbar != null:
		vbar.custom_minimum_size = Vector2(8.0, 0.0)
		var grab := StyleBoxFlat.new()
		grab.bg_color = Y
		grab.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("grabber", grab)
		vbar.add_theme_stylebox_override("grabber_highlight", grab)
		vbar.add_theme_stylebox_override("grabber_pressed", grab)
		var rail := StyleBoxFlat.new()
		rail.bg_color = Color(1.0, 1.0, 1.0, 0.12)
		rail.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("scroll", rail)

	for idx in range(schedule_rounds.size()):
		var row: Dictionary = schedule_rounds[idx]
		var row_top: float = float(idx) * 70.0
		var is_row_selected := selected_round_index == idx
		var dot_bg := PanelContainer.new()
		dot_bg.position = Vector2(10.0, row_top + 7.0)
		dot_bg.size = Vector2(34.0, 34.0)
		var dot_style := StyleBoxFlat.new()
		dot_style.bg_color = Y
		dot_style.border_color = Color("202022")
		dot_style.set_border_width_all(2)
		dot_style.set_corner_radius_all(17)
		dot_bg.add_theme_stylebox_override("panel", dot_style)
		content.add_child(dot_bg)

		var dot := _txt(str(idx + 1), "body", 13, Color("000000"), Rect2(Vector2(18.0, row_top + 13.0), Vector2(18.0, 16.0)))
		dot.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		dot.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		content.add_child(dot)

		var track := _txt(str(row.get("track", "")), "body", 14, Color.WHITE, Rect2(Vector2(64.0, row_top + 1.0), Vector2(220.0, 18.0)))
		track.add_theme_font_override("font", PrototypeTheme.font("body_strong"))
		track.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		content.add_child(track)

		var pin := _build_preloaded_icon(LOCATION_ICON_TEXTURE, Vector2(64.0, row_top + 25.0), Vector2(10.0, 12.0), Color(0.72, 0.72, 0.78, 1.0))
		if pin != null:
			content.add_child(pin)
		var layout := _txt(str(row.get("layout", "")), "body", 13, Color.WHITE, Rect2(Vector2(82.0, row_top + 21.0), Vector2(610.0, 18.0)))
		layout.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		content.add_child(layout)

		var date_x: float = 792.0
		var weekday_label := str(row.get("weekday_label", ""))
		if not weekday_label.is_empty():
			var weekday := _txt(weekday_label, "body", 12, Color("BCBCBD"), Rect2(Vector2(date_x, row_top + 1.0), Vector2(208.0, 16.0)))
			weekday.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			weekday.vertical_alignment = VERTICAL_ALIGNMENT_TOP
			content.add_child(weekday)
		var date_label := str(row.get("date_label", row.get("week", "")))
		var race_date := _txt(date_label, "body", 15, Color.WHITE, Rect2(Vector2(date_x, row_top + 16.0), Vector2(208.0, 20.0)))
		race_date.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		race_date.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		content.add_child(race_date)

		var status_text := str(row.get("status", ""))
		if not status_text.is_empty():
			var status := _txt(status_text, "body", 13, Color("0E4F28"), Rect2(Vector2(date_x, row_top + 37.0), Vector2(208.0, 17.0)))
			status.add_theme_font_override("font", PrototypeTheme.font("body_strong"))
			status.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
			status.vertical_alignment = VERTICAL_ALIGNMENT_TOP
			content.add_child(status)

		var row_btn := Button.new()
		row_btn.flat = true
		row_btn.text = ""
		row_btn.position = Vector2(0.0, row_top)
		row_btn.size = Vector2(976.0, 48.0)
		row_btn.pressed.connect(_on_round_row_pressed.bind(idx))
		content.add_child(row_btn)

	return wrap


func _build_standings_list(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(45.0, 108.0)
	wrap.size = Vector2(1045.0, 324.0)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var standings_rows: Variant = series.get("standings_rows", [])
	var rows: Array = standings_rows if typeof(standings_rows) == TYPE_ARRAY else []
	if rows.is_empty():
		wrap.add_child(_build_empty_state_content(Vector2(0.0, 22.0), Vector2(910.0, 180.0), "Standings Pending", "This championship has not started yet", "Standings will appear here once the series is entered and results begin to land for the field."))
		return wrap
	var scope_text := "Class Standings" if bool(series.get("is_multiclass", false)) else "Current Entrants"
	if bool(series.get("is_multiclass", false)) and not str(series.get("overall_position_label", "")).is_empty():
		scope_text += " • %s" % str(series.get("overall_position_label", ""))
	wrap.add_child(_txt("%s: %d" % [scope_text, rows.size()], "body", 16, Color("BCBCBD"), Rect2(Vector2(0.0, 0.0), Vector2(520.0, 22.0))))
	wrap.add_child(_txt("Pos", "body", 18, Y, Rect2(Vector2(0.0, 30.0), Vector2(50.0, 24.0))))
	wrap.add_child(_txt("Driver", "body", 18, Y, Rect2(Vector2(92.0, 30.0), Vector2(250.0, 24.0))))
	wrap.add_child(_txt("Team", "body", 18, Y, Rect2(Vector2(420.0, 30.0), Vector2(410.0, 24.0))))
	wrap.add_child(_txt("PTS", "body", 18, Y, Rect2(Vector2(930.0, 30.0), Vector2(80.0, 24.0))))

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0.0, 62.0)
	scroll.size = Vector2(1028.0, 244.0)
	scroll.clip_contents = true
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	wrap.add_child(scroll)

	var content := Control.new()
	content.custom_minimum_size = Vector2(1008.0, max(scroll.size.y, float(rows.size()) * 56.0 + 10.0))
	scroll.add_child(content)

	var vbar := scroll.get_v_scroll_bar()
	if vbar != null:
		vbar.custom_minimum_size = Vector2(8.0, 0.0)
		var grab := StyleBoxFlat.new()
		grab.bg_color = Y
		grab.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("grabber", grab)
		vbar.add_theme_stylebox_override("grabber_highlight", grab)
		vbar.add_theme_stylebox_override("grabber_pressed", grab)
		var rail := StyleBoxFlat.new()
		rail.bg_color = Color(1.0, 1.0, 1.0, 0.12)
		rail.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("scroll", rail)

	for idx in range(rows.size()):
		var row: Dictionary = rows[idx] if rows[idx] is Dictionary else {}
		var y: float = float(idx) * 56.0
		var is_player: bool = str(row.get("team", "")) == PrototypeState.team_name
		var row_color: Color = Y if is_player else Color.WHITE
		content.add_child(_txt(str(row.get("class_pos", row.get("pos", idx + 1))), "body", 16, row_color, Rect2(Vector2(0.0, y), Vector2(50.0, 20.0))))
		var portrait := _build_driver_portrait_thumb(str(row.get("driver_portrait_path", "")), Vector2(92.0, y - 2.0), Vector2(28.0, 28.0))
		if portrait != null:
			content.add_child(portrait)
		var driver_label := _txt(str(row.get("driver", "TBA")), "body", 16, row_color, Rect2(Vector2(132.0, y), Vector2(280.0, 24.0)))
		driver_label.clip_text = true
		driver_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		content.add_child(driver_label)
		var team_label := _txt(str(row.get("team", "")), "body", 16, row_color, Rect2(Vector2(420.0, y), Vector2(500.0, 24.0)))
		team_label.clip_text = true
		team_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		content.add_child(team_label)
		if bool(series.get("is_multiclass", false)):
			var class_line := _txt("%s class • %s overall" % [str(row.get("car_class_label", "Class")), str(row.get("pos", "--"))], "body", 12, Color("BCBCBD"), Rect2(Vector2(132.0, y + 22.0), Vector2(700.0, 20.0)))
			class_line.vertical_alignment = VERTICAL_ALIGNMENT_TOP
			class_line.clip_text = true
			class_line.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
			content.add_child(class_line)
		var pts := _txt(str(row.get("pts", "0")), "body", 16, row_color, Rect2(Vector2(930.0, y), Vector2(60.0, 20.0)))
		pts.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		content.add_child(pts)
		var divider := ColorRect.new()
		divider.position = Vector2(0.0, y + 48.0)
		divider.size = Vector2(990.0, 1.0)
		divider.color = Color(1.0, 1.0, 1.0, 0.08)
		content.add_child(divider)
	return wrap


func _build_driver_standings_list(series: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(45.0, 108.0)
	wrap.size = Vector2(1045.0, 324.0)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var driver_rows: Variant = series.get("driver_standings_rows", [])
	var rows: Array = driver_rows if typeof(driver_rows) == TYPE_ARRAY else []
	if rows.is_empty():
		wrap.add_child(_build_empty_state_content(Vector2(0.0, 22.0), Vector2(910.0, 180.0), "Drivers' Championship Pending", "No race results yet", "The drivers' championship populates once race weekends in this series have been completed."))
		return wrap
	wrap.add_child(_txt("Drivers' Championship: %d" % rows.size(), "body", 16, Color("BCBCBD"), Rect2(Vector2(0.0, 0.0), Vector2(520.0, 22.0))))
	wrap.add_child(_txt("Pos", "body", 18, Y, Rect2(Vector2(0.0, 30.0), Vector2(50.0, 24.0))))
	wrap.add_child(_txt("Driver", "body", 18, Y, Rect2(Vector2(92.0, 30.0), Vector2(250.0, 24.0))))
	wrap.add_child(_txt("Team", "body", 18, Y, Rect2(Vector2(420.0, 30.0), Vector2(410.0, 24.0))))
	wrap.add_child(_txt("PTS", "body", 18, Y, Rect2(Vector2(930.0, 30.0), Vector2(80.0, 24.0))))

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(0.0, 62.0)
	scroll.size = Vector2(1028.0, 244.0)
	scroll.clip_contents = true
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	wrap.add_child(scroll)

	var content := Control.new()
	content.custom_minimum_size = Vector2(1008.0, max(scroll.size.y, float(rows.size()) * 56.0 + 10.0))
	scroll.add_child(content)

	var vbar := scroll.get_v_scroll_bar()
	if vbar != null:
		vbar.custom_minimum_size = Vector2(8.0, 0.0)
		var grab := StyleBoxFlat.new()
		grab.bg_color = Y
		grab.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("grabber", grab)
		vbar.add_theme_stylebox_override("grabber_highlight", grab)
		vbar.add_theme_stylebox_override("grabber_pressed", grab)
		var rail := StyleBoxFlat.new()
		rail.bg_color = Color(1.0, 1.0, 1.0, 0.12)
		rail.set_corner_radius_all(4)
		vbar.add_theme_stylebox_override("scroll", rail)

	for idx in range(rows.size()):
		var row: Dictionary = rows[idx] if rows[idx] is Dictionary else {}
		var y: float = float(idx) * 56.0
		var is_player: bool = bool(row.get("is_player", false))
		var row_color: Color = Y if is_player else Color.WHITE
		content.add_child(_txt(str(row.get("pos", idx + 1)), "body", 16, row_color, Rect2(Vector2(0.0, y), Vector2(50.0, 20.0))))
		var portrait := _build_driver_portrait_thumb(str(row.get("driver_portrait_path", "")), Vector2(92.0, y - 2.0), Vector2(28.0, 28.0))
		if portrait != null:
			content.add_child(portrait)
		var driver_label := _txt(str(row.get("driver", "TBA")), "body", 16, row_color, Rect2(Vector2(132.0, y), Vector2(280.0, 24.0)))
		driver_label.clip_text = true
		driver_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		content.add_child(driver_label)
		var team_label := _txt(str(row.get("team", "")), "body", 16, row_color, Rect2(Vector2(420.0, y), Vector2(500.0, 24.0)))
		team_label.clip_text = true
		team_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		content.add_child(team_label)
		var detail := _txt("%d wins • %d podiums" % [int(row.get("wins", 0)), int(row.get("podiums", 0))], "body", 12, Color("BCBCBD"), Rect2(Vector2(132.0, y + 22.0), Vector2(400.0, 20.0)))
		detail.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		content.add_child(detail)
		var pts := _txt(str(row.get("pts", "0")), "body", 16, row_color, Rect2(Vector2(930.0, y), Vector2(60.0, 20.0)))
		pts.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		content.add_child(pts)
		var divider := ColorRect.new()
		divider.position = Vector2(0.0, y + 48.0)
		divider.size = Vector2(990.0, 1.0)
		divider.color = Color(1.0, 1.0, 1.0, 0.08)
		content.add_child(divider)
	return wrap


func _build_enter_button(series: Dictionary, pos: Vector2, size_value: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	var button_label: String = "Enter"
	if PrototypeState.car_count <= 0:
		button_label = "Need Car"
	elif not bool(series.get("player_car_eligible", true)):
		button_label = "Ineligible"
	elif bool(series.get("entered", false)):
		button_label = "Entered"
	var panel := PanelContainer.new()
	panel.size = size_value
	var st := StyleBoxFlat.new()
	st.bg_color = Color(0.45, 0.46, 0.48, 1.0) if button_label == "Need Car" or button_label == "Ineligible" else Y
	st.set_corner_radius_all(MENU_RADIUS)
	panel.add_theme_stylebox_override("panel", st)
	wrap.add_child(panel)
	var label := _txt(button_label, "title", 24, Color("13131A"), Rect2(Vector2(0.0, 5.0), size_value))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(label)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = size_value
	button.disabled = button_label == "Need Car" or button_label == "Ineligible" or button_label == "Entered"
	button.pressed.connect(_on_enter_pressed)
	wrap.add_child(button)
	return wrap


func _build_entry_flow_overlay() -> Control:
	var root := Control.new()
	root.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	root.z_index = 300

	var dim := ColorRect.new()
	dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	dim.color = Color(0.0, 0.0, 0.0, 0.74)
	root.add_child(dim)

	var modal := Control.new()
	modal.position = Vector2(720.0, 380.0)
	modal.size = Vector2(2400.0, 1280.0)
	root.add_child(modal)

	var shell := PanelContainer.new()
	shell.size = modal.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.06, 0.09, 0.98)
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(18)
	shell.add_theme_stylebox_override("panel", style)
	modal.add_child(shell)

	var series := _current_series()
	modal.add_child(_txt("SERIES ENTRY", "body", 18, Y, Rect2(Vector2(76.0, 54.0), Vector2(400.0, 24.0))))
	var title := _txt(str(series.get("name", "Championship Entry")), "title", 44, Color.WHITE, Rect2(Vector2(76.0, 96.0), Vector2(1500.0, 56.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	modal.add_child(title)

	var subtitle_text := "Select the car you want to commit to this programme." if entry_flow_step == "select" else "Confirm the selected car and championship entry before the team commits."
	var subtitle := _txt(subtitle_text, "body", 22, Color("BCBCBD"), Rect2(Vector2(76.0, 166.0), Vector2(1600.0, 56.0)))
	subtitle.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	modal.add_child(subtitle)

	if not entry_flow_error.is_empty():
		var error_label := _txt(entry_flow_error, "body", 18, Color("FF8B8B"), Rect2(Vector2(76.0, 236.0), Vector2(1500.0, 24.0)))
		error_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		modal.add_child(error_label)

	if entry_flow_step == "select":
		modal.add_child(_build_entry_car_selection_list())
	else:
		modal.add_child(_build_entry_confirmation_panel())

	modal.add_child(_build_entry_flow_footer())
	return root


func _build_next_season_banner(series_info: Dictionary) -> Control:
	var series_id := str(series_info.get("id", ""))
	var series_name := str(series_info.get("name", "this championship"))
	var year := int(series_info.get("next_year", 0))
	var root := Control.new()
	root.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	root.z_index = 260

	var bar := Control.new()
	bar.position = Vector2(1120.0, 1840.0)
	bar.size = Vector2(1600.0, 150.0)
	root.add_child(bar)

	var shell := PanelContainer.new()
	shell.size = bar.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.06, 0.09, 0.97)
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(14)
	shell.add_theme_stylebox_override("panel", style)
	bar.add_child(shell)

	bar.add_child(_txt("SEASON COMPLETE", "body", 20, Y, Rect2(Vector2(48.0, 30.0), Vector2(700.0, 26.0))))
	var detail := _txt("%s has crowned its champion. Re-sign for the %d running to take the grid again." % [series_name, year], "body", 24, Color.WHITE, Rect2(Vector2(48.0, 70.0), Vector2(960.0, 50.0)))
	detail.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	bar.add_child(detail)

	var btn_wrap := Control.new()
	btn_wrap.position = Vector2(1120.0, 36.0)
	btn_wrap.size = Vector2(430.0, 80.0)
	var btn_panel := PanelContainer.new()
	btn_panel.size = btn_wrap.size
	var btn_style := StyleBoxFlat.new()
	btn_style.bg_color = Y
	btn_style.set_corner_radius_all(MENU_RADIUS)
	btn_panel.add_theme_stylebox_override("panel", btn_style)
	btn_wrap.add_child(btn_panel)
	var btn_label := _txt("Re-enter for %d" % year, "title", 28, Color("13131A"), Rect2(Vector2(0.0, 22.0), btn_wrap.size))
	btn_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	btn_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	btn_wrap.add_child(btn_label)
	var btn := Button.new()
	btn.flat = true
	btn.text = ""
	btn.size = btn_wrap.size
	btn.pressed.connect(func() -> void:
		var result: Dictionary = PrototypeState.commit_series_entry(series_id)
		if bool(result.get("ok", false)):
			_season_review_dismissed = false
			selected_series_id = series_id
			active_right_tab = "schedule"
			_refresh_series_directory_cache()
		_request_rebuild()
	)
	btn_wrap.add_child(btn)
	bar.add_child(btn_wrap)
	return root


func _build_season_review_overlay(summary: Dictionary) -> Control:
	var root := Control.new()
	root.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	root.z_index = 320

	var dim := ColorRect.new()
	dim.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	dim.color = Color(0.0, 0.0, 0.0, 0.78)
	root.add_child(dim)

	var modal := Control.new()
	modal.position = Vector2(820.0, 300.0)
	modal.size = Vector2(2200.0, 1560.0)
	root.add_child(modal)

	var shell := PanelContainer.new()
	shell.size = modal.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.06, 0.09, 0.98)
	style.border_color = BORDER
	style.set_border_width_all(2)
	style.set_corner_radius_all(18)
	shell.add_theme_stylebox_override("panel", style)
	modal.add_child(shell)

	var player_position := int(summary.get("player_position", 0))
	var eyebrow := "SEASON REVIEW · %d" % int(summary.get("year", 2026))
	modal.add_child(_txt(eyebrow, "body", 20, Y, Rect2(Vector2(76.0, 54.0), Vector2(900.0, 26.0))))
	var title := _txt(str(summary.get("series_label", "Championship")), "title", 52, Color.WHITE, Rect2(Vector2(76.0, 92.0), Vector2(2040.0, 64.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.clip_text = true
	title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	modal.add_child(title)

	var champion_line := "Champion: %s" % str(summary.get("champion_team", "TBD"))
	if not str(summary.get("champion_driver", "")).strip_edges().is_empty():
		champion_line += "  •  %s" % str(summary.get("champion_driver", ""))
	modal.add_child(_txt(champion_line, "body", 26, Color.WHITE, Rect2(Vector2(76.0, 178.0), Vector2(2040.0, 34.0))))

	var finish_text := "Your team finished P%d  •  Payout banked %s" % [player_position, str(summary.get("player_payout_label", "$0"))] if player_position > 0 else "Season complete  •  Payout banked %s" % str(summary.get("player_payout_label", "$0"))
	var finish := _txt(finish_text, "body", 24, Y if player_position == 1 else Color("BCBCBD"), Rect2(Vector2(76.0, 224.0), Vector2(2040.0, 32.0)))
	modal.add_child(finish)

	var verdict := str(summary.get("board_verdict", ""))
	if not verdict.is_empty():
		var verdict_label: String = {"exceeded": "ABOVE TARGET", "met": "TARGET MET", "missed": "BELOW TARGET"}.get(verdict, verdict.to_upper())
		var bonus := float(summary.get("board_bonus", 0.0))
		var bonus_text := ""
		if bonus > 1.0:
			bonus_text = "  ·  bonus %s" % str(summary.get("board_bonus_label", ""))
		elif bonus < -1.0:
			bonus_text = "  ·  penalty %s" % str(summary.get("board_bonus_label", ""))
		var verdict_color := Color(0.37, 0.76, 0.41, 1.0) if verdict == "exceeded" else (Color("FF8B8B") if verdict == "missed" else Color("BCBCBD"))
		var verdict_line := _txt("Board: %s (target P%d)%s" % [verdict_label, int(summary.get("board_target_position", 0)), bonus_text], "body", 22, verdict_color, Rect2(Vector2(76.0, 262.0), Vector2(2040.0, 30.0)))
		modal.add_child(verdict_line)

	modal.add_child(_build_season_review_column("Constructors", summary.get("constructor_standings", []), Vector2(76.0, 300.0), true))
	modal.add_child(_build_season_review_column("Drivers", summary.get("driver_standings", []), Vector2(1140.0, 300.0), false))

	var owner_season: Dictionary = summary.get("owner_season", {}) if summary.get("owner_season", {}) is Dictionary else {}
	if int(owner_season.get("starts", 0)) > 0:
		var bests := "Your season: %d starts · %d wins · %d podiums · best finish P%d" % [
			int(owner_season.get("starts", 0)),
			int(owner_season.get("wins", 0)),
			int(owner_season.get("podiums", 0)),
			int(owner_season.get("best_finish", 99)),
		]
		modal.add_child(_txt(bests, "body", 22, Color.WHITE, Rect2(Vector2(76.0, 1360.0), Vector2(2040.0, 30.0))))

	var btn_wrap := Control.new()
	btn_wrap.position = Vector2(1860.0, 1420.0)
	btn_wrap.size = Vector2(264.0, 86.0)
	var btn_panel := PanelContainer.new()
	btn_panel.size = btn_wrap.size
	var btn_style := StyleBoxFlat.new()
	btn_style.bg_color = Y
	btn_style.set_corner_radius_all(MENU_RADIUS)
	btn_panel.add_theme_stylebox_override("panel", btn_style)
	btn_wrap.add_child(btn_panel)
	var btn_label := _txt("Continue", "title", 30, Color("13131A"), Rect2(Vector2(0.0, 22.0), btn_wrap.size))
	btn_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	btn_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	btn_wrap.add_child(btn_label)
	var btn := Button.new()
	btn.flat = true
	btn.text = ""
	btn.size = btn_wrap.size
	btn.pressed.connect(func() -> void:
		_season_review_dismissed = true
		PrototypeState.mark_season_summary_reviewed(str(summary.get("championship_id", "")))
		_request_rebuild()
	)
	btn_wrap.add_child(btn)
	modal.add_child(btn_wrap)
	return root


func _build_season_review_column(heading: String, rows_variant: Variant, origin: Vector2, is_constructor: bool) -> Control:
	var wrap := Control.new()
	wrap.position = origin
	wrap.size = Vector2(1000.0, 1040.0)
	wrap.add_child(_txt(heading, "title", 30, Y, Rect2(Vector2(0.0, 0.0), Vector2(1000.0, 38.0))))
	wrap.add_child(_txt("Pos", "body", 22, Color("BCBCBD"), Rect2(Vector2(0.0, 52.0), Vector2(90.0, 28.0))))
	wrap.add_child(_txt("Constructor" if is_constructor else "Driver", "body", 22, Color("BCBCBD"), Rect2(Vector2(110.0, 52.0), Vector2(620.0, 28.0))))
	wrap.add_child(_txt("PTS", "body", 22, Color("BCBCBD"), Rect2(Vector2(830.0, 52.0), Vector2(150.0, 28.0))))
	var rows: Array = rows_variant if rows_variant is Array else []
	var limit: int = mini(rows.size(), 8)
	for idx in range(limit):
		var row: Dictionary = rows[idx] if rows[idx] is Dictionary else {}
		var y: float = 100.0 + float(idx) * 64.0
		var is_player: bool = bool(row.get("is_player", false))
		var row_color: Color = Y if is_player else Color.WHITE
		wrap.add_child(_txt("P%d" % int(row.get("position", idx + 1)), "body", 24, row_color, Rect2(Vector2(0.0, y), Vector2(90.0, 30.0))))
		var name_text := str(row.get("team", "")) if is_constructor else str(row.get("driver", ""))
		var name_label := _txt(name_text, "body", 24, row_color, Rect2(Vector2(110.0, y), Vector2(700.0, 30.0)))
		name_label.clip_text = true
		name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		wrap.add_child(name_label)
		var pts := _txt(str(int(row.get("points", 0))), "body", 24, row_color, Rect2(Vector2(830.0, y), Vector2(150.0, 30.0)))
		wrap.add_child(pts)
	return wrap


func _build_entry_car_selection_list() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(76.0, 286.0)
	wrap.size = Vector2(2248.0, 760.0)
	var options := PrototypeState.get_series_entry_car_options(entry_flow_series_id)
	if options.is_empty():
		wrap.add_child(_build_empty_state_content(Vector2.ZERO, Vector2(1200.0, 180.0), "No Cars", "No owned cars available", "Secure a car in the marketplace before trying to enter a series."))
		return wrap
	var y := 0.0
	for option_variant: Variant in options:
		if not option_variant is Dictionary:
			continue
		var option: Dictionary = option_variant
		wrap.add_child(_build_entry_car_option(option, Rect2(Vector2(0.0, y), Vector2(2248.0, 132.0))))
		y += 152.0
	return wrap


func _build_entry_car_option(option: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var shell := PanelContainer.new()
	shell.size = rect.size
	var selected := str(option.get("car_instance_id", "")) == entry_flow_selected_car_instance_id
	var eligible := bool(option.get("eligible", false))
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.10) if selected else Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = Y if selected else (Color("5AD37A") if eligible else Color(1.0, 1.0, 1.0, 0.16))
	style.set_border_width_all(2 if selected else 1)
	style.set_corner_radius_all(14)
	shell.add_theme_stylebox_override("panel", style)
	wrap.add_child(shell)

	var title := _txt(str(option.get("car_label", "Team car")), "title", 28, Color.WHITE, Rect2(Vector2(34.0, 26.0), Vector2(900.0, 34.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(title)
	var meta_text := str(option.get("manufacturer_label", "")).strip_edges()
	if not meta_text.is_empty():
		meta_text += "  •  "
	meta_text += str(option.get("car_class_label", "Unknown class"))
	var meta := _txt(meta_text, "body", 18, Color("BCBCBD"), Rect2(Vector2(34.0, 70.0), Vector2(1100.0, 24.0)))
	meta.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(meta)

	var meets_condition := bool(option.get("meets_condition", true))
	if option.has("condition"):
		var condition_pct := int(round(float(option.get("condition", 1.0)) * 100.0))
		var min_pct := int(round(float(option.get("min_condition", 0.0)) * 100.0))
		var cond_text := "Condition %d%%  •  Scrutineering min %d%%" % [condition_pct, min_pct]
		var cond_color := Color("5AD37A") if meets_condition else Color("E0703A")
		var cond := _txt(cond_text, "body", 16, cond_color, Rect2(Vector2(34.0, 100.0), Vector2(1400.0, 22.0)))
		cond.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		wrap.add_child(cond)
	var reason := str(option.get("status_reason", "")).strip_edges()
	if not reason.is_empty() and not eligible:
		var reason_label := _txt(reason, "body", 15, Color("E0703A"), Rect2(Vector2(34.0, 126.0), Vector2(1700.0, 22.0)))
		reason_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		wrap.add_child(reason_label)

	var status_text := "Eligible" if eligible else ("Service Required" if (bool(option.get("class_eligible", false)) and not meets_condition) else "Ineligible")
	var status_color := Color("5AD37A") if eligible else (Color("E0703A") if not meets_condition and bool(option.get("class_eligible", false)) else Color("BCBCBD"))
	var status := _txt(status_text, "title", 24, status_color, Rect2(Vector2(1800.0, 42.0), Vector2(260.0, 30.0)))
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	status.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(status)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_entry_car_selected.bind(str(option.get("car_instance_id", ""))))
	wrap.add_child(button)
	return wrap


func _build_entry_confirmation_panel() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(76.0, 286.0)
	wrap.size = Vector2(2248.0, 760.0)
	var selected := _entry_flow_selected_option()
	var series := _current_series()

	var body := PanelContainer.new()
	body.size = Vector2(2248.0, 420.0)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = Color(1.0, 1.0, 1.0, 0.14)
	style.set_border_width_all(1)
	style.set_corner_radius_all(16)
	body.add_theme_stylebox_override("panel", style)
	wrap.add_child(body)

	wrap.add_child(_txt("Selected Car", "body", 18, Y, Rect2(Vector2(48.0, 44.0), Vector2(360.0, 24.0))))
	var car_title := _txt(str(selected.get("car_label", "No car selected")), "title", 40, Color.WHITE, Rect2(Vector2(48.0, 82.0), Vector2(1200.0, 48.0)))
	car_title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(car_title)
	var car_meta := _txt("%s  •  %s" % [str(selected.get("manufacturer_label", "Unknown manufacturer")), str(selected.get("car_class_label", "Unknown class"))], "body", 22, Color("BCBCBD"), Rect2(Vector2(48.0, 138.0), Vector2(1200.0, 26.0)))
	car_meta.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(car_meta)

	wrap.add_child(_txt("Championship", "body", 18, Y, Rect2(Vector2(48.0, 214.0), Vector2(360.0, 24.0))))
	var series_title := _txt(str(series.get("name", "Selected series")), "title", 34, Color.WHITE, Rect2(Vector2(48.0, 250.0), Vector2(1200.0, 42.0)))
	series_title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(series_title)
	var series_meta := _txt("%s  •  %s rounds  •  %s" % [str(series.get("region", "Unknown")), str(series.get("rounds", 0)), str(series.get("calendar_profile_badge", "Championship season"))], "body", 20, Color("BCBCBD"), Rect2(Vector2(48.0, 302.0), Vector2(1400.0, 26.0)))
	series_meta.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(series_meta)

	var fee_label := _txt("ENTRY FEE", "body", 18, Y, Rect2(Vector2(1640.0, 52.0), Vector2(460.0, 24.0)))
	fee_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(fee_label)
	var fee_value := _txt(str(series.get("fee", "$0")), "title", 48, Y, Rect2(Vector2(1480.0, 92.0), Vector2(620.0, 58.0)))
	fee_value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(fee_value)

	var confirm_note := _txt("Confirming will mark this series as entered, assign the selected car to the programme, and switch the browser to standings.", "body", 20, Color("BCBCBD"), Rect2(Vector2(48.0, 486.0), Vector2(1800.0, 54.0)))
	confirm_note.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	confirm_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(confirm_note)
	return wrap


func _build_entry_flow_footer() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(76.0, 1086.0)
	wrap.size = Vector2(2248.0, 110.0)

	var cancel_btn := _build_entry_flow_action_button("Cancel", Vector2(0.0, 20.0), Vector2(220.0, 54.0), false)
	cancel_btn.pressed.connect(_close_entry_flow)
	wrap.add_child(cancel_btn)

	if entry_flow_step == "confirm":
		var back_btn := _build_entry_flow_action_button("Back", Vector2(1648.0, 20.0), Vector2(220.0, 54.0), false)
		back_btn.pressed.connect(_on_entry_flow_back)
		wrap.add_child(back_btn)
		var confirm_btn := _build_entry_flow_action_button("Confirm Entry", Vector2(1890.0, 20.0), Vector2(358.0, 54.0), true)
		confirm_btn.pressed.connect(_on_entry_flow_confirm)
		wrap.add_child(confirm_btn)
	else:
		var selected := _entry_flow_selected_option()
		var continue_btn := _build_entry_flow_action_button("Continue", Vector2(1890.0, 20.0), Vector2(358.0, 54.0), true)
		continue_btn.disabled = selected.is_empty() or not bool(selected.get("eligible", false))
		continue_btn.pressed.connect(_on_entry_flow_continue)
		wrap.add_child(continue_btn)
	return wrap


func _build_entry_flow_action_button(text_value: String, pos: Vector2, size_value: Vector2, accent: bool) -> Button:
	var button := Button.new()
	button.position = pos
	button.size = size_value
	button.text = text_value
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	var normal := StyleBoxFlat.new()
	normal.bg_color = Y if accent else Color(1.0, 1.0, 1.0, 0.06)
	normal.border_color = Y if accent else Color(1.0, 1.0, 1.0, 0.16)
	normal.set_border_width_all(1)
	normal.set_corner_radius_all(8)
	var disabled_style := StyleBoxFlat.new()
	disabled_style.bg_color = Color(1.0, 1.0, 1.0, 0.04)
	disabled_style.border_color = Color(1.0, 1.0, 1.0, 0.10)
	disabled_style.set_border_width_all(1)
	disabled_style.set_corner_radius_all(8)
	button.add_theme_stylebox_override("normal", normal)
	button.add_theme_stylebox_override("hover", normal)
	button.add_theme_stylebox_override("pressed", normal)
	button.add_theme_stylebox_override("disabled", disabled_style)
	button.add_theme_color_override("font_color", Color("13131A") if accent else Color.WHITE)
	button.add_theme_color_override("font_hover_color", Color("13131A") if accent else Color.WHITE)
	button.add_theme_color_override("font_pressed_color", Color("13131A") if accent else Color.WHITE)
	button.add_theme_color_override("font_disabled_color", Color("8D8D93"))
	button.add_theme_font_override("font", PrototypeTheme.font("title"))
	button.add_theme_font_size_override("font_size", 22)
	return button


func _entry_flow_selected_option() -> Dictionary:
	for option_variant: Variant in PrototypeState.get_series_entry_car_options(entry_flow_series_id):
		if not option_variant is Dictionary:
			continue
		var option: Dictionary = option_variant
		if str(option.get("car_instance_id", "")) == entry_flow_selected_car_instance_id:
			return option
	return {}


func _entry_state_title(series: Dictionary) -> String:
	if PrototypeState.car_count <= 0:
		return "No Eligible Car Entered"
	if bool(series.get("entered", false)):
		return "Entry Confirmed"
	if not bool(series.get("player_car_eligible", true)):
		return "Current Car Is Ineligible"
	return "Eligible To Enter"


func _entry_state_detail(series: Dictionary) -> String:
	var eligible_labels: Variant = series.get("eligible_car_class_labels", [])
	var labels: Array = eligible_labels if typeof(eligible_labels) == TYPE_ARRAY else []
	var eligible_text := ", ".join(PackedStringArray(labels))
	if PrototypeState.car_count <= 0:
		return "Acquire and assign a race car before this programme can be entered."
	if bool(series.get("entered", false)):
		var entered_car_label := str(series.get("entered_car_label", "")).strip_edges()
		if entered_car_label.is_empty():
			return "This championship is active for your team. Review the schedule or standings before advancing."
		return "This championship is active for your team with %s entered for the programme." % entered_car_label
	if not bool(series.get("player_car_eligible", true)):
		if eligible_text.is_empty():
			return "Your current car package does not meet this series' entry requirements."
		return "Requires an eligible car class: %s." % eligible_text
	return "Your current car package matches this series. Entry can be confirmed from the action area."


func _standings_row_blurb(row: Dictionary) -> String:
	var team_tier := str(row.get("team_tier", "")).strip_edges()
	var prestige_value := int(row.get("team_prestige", 0))
	var driver_bio := _first_sentence(str(row.get("driver_bio", "")))
	var team_bio := _first_sentence(str(row.get("team_bio", "")))
	var meta_parts: PackedStringArray = PackedStringArray()
	if not team_tier.is_empty():
		meta_parts.append(team_tier.capitalize())
	if prestige_value > 0:
		meta_parts.append("Prestige %d" % prestige_value)
	var meta := "  •  ".join(meta_parts)
	if not driver_bio.is_empty():
		return _truncate_copy(("%s%s%s" % [meta, "  •  " if not meta.is_empty() else "", driver_bio]).strip_edges(), 150)
	if not team_bio.is_empty():
		return _truncate_copy(("%s%s%s" % [meta, "  •  " if not meta.is_empty() else "", team_bio]).strip_edges(), 150)
	return meta


func _first_sentence(text: String) -> String:
	var trimmed := text.strip_edges()
	if trimmed.is_empty():
		return ""
	for separator in [". ", "! ", "? "]:
		var idx := trimmed.find(separator)
		if idx >= 0:
			return trimmed.substr(0, idx + 1)
	return trimmed


func _truncate_copy(text: String, limit: int) -> String:
	var trimmed := text.strip_edges()
	if trimmed.length() <= limit:
		return trimmed
	return trimmed.substr(0, max(limit - 1, 0)).strip_edges() + "…"


func _build_series_carousel() -> Control:
	var card := _panel(CAROUSEL_RECT)
	if _series_entries().is_empty():
		card.add_child(_build_empty_state_content(Vector2(650.0, 86.0), Vector2(1080.0, 170.0), "No Results", "No championships available with these filters", "Set `Class` or `Entry` back to `All` to browse the full catalogue again."))
		return card
	var left_arrow_pos := Vector2(24.0, 125.0)
	var right_arrow_pos := Vector2(2270.0, 125.0)
	var arrow_size := Vector2(86.0, 86.0)
	card.add_child(_build_arrow_button(left_arrow_pos, true))
	card.add_child(_build_arrow_button(right_arrow_pos, false))
	var visible := _visible_series()
	var card_size := Vector2(372.0, 295.0)
	var visible_count := visible.size()
	if visible_count <= 0:
		return card
	var usable_left: float = left_arrow_pos.x + arrow_size.x
	var usable_right: float = right_arrow_pos.x
	var available_width: float = usable_right - usable_left
	var total_card_width: float = card_size.x * float(visible_count)
	var gap: float = maxf(24.0, (available_width - total_card_width) / float(visible_count + 1))
	var start_x: float = usable_left + gap
	for idx in range(visible_count):
		card.add_child(_build_series_card(visible[idx], Rect2(Vector2(start_x + float(idx) * (card_size.x + gap), 27.0), card_size)))
	return card


func _build_series_card(row: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true

	var base := PanelContainer.new()
	base.size = rect.size
	var base_style := StyleBoxFlat.new()
	var is_selected: bool = str(row.get("id", "")) == selected_series_id
	base_style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.09) if is_selected else Color(1.0, 1.0, 1.0, 0.05)
	base_style.border_color = Y if is_selected else Color(1.0, 1.0, 1.0, 0.20)
	base_style.set_border_width_all(2 if is_selected else 1)
	base_style.set_corner_radius_all(MENU_RADIUS)
	base.add_theme_stylebox_override("panel", base_style)
	wrap.add_child(base)

	var logo_frame := CenterContainer.new()
	logo_frame.position = Vector2(8.0, 28.0)
	logo_frame.size = Vector2(356.0, 140.0)
	logo_frame.clip_contents = true
	wrap.add_child(logo_frame)

	var logo := TextureRect.new()
	var runtime_logo_path := str(row.get("logo_path", ""))
	logo.texture = _load_runtime_texture(CARD_BADGE_PATH)
	logo.custom_minimum_size = Vector2(270.0, 180.0)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	logo.modulate = Color(1, 1, 1, 0.98)
	logo.material = _logo_cutout_material()
	logo_frame.add_child(logo)
	if not runtime_logo_path.is_empty():
		call_deferred("_apply_deferred_logo_texture", logo, runtime_logo_path, CARD_BADGE_PATH)

	var title := _txt(str(row.get("name", "Brands Hatch Club\nMeet")), "title", 24, Y, Rect2(Vector2(14.0, 196.0), Vector2(344.0, 84.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(title)

	var btn := Button.new()
	btn.flat = true
	btn.text = ""
	btn.size = rect.size
	btn.pressed.connect(_on_series_selected.bind(str(row.get("id", ""))))
	wrap.add_child(btn)
	return wrap


func _build_arrow_button(pos: Vector2, is_left: bool) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(86.0, 86.0)
	var circle := PanelContainer.new()
	circle.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.border_color = Y
	style.set_border_width_all(2)
	style.set_corner_radius_all(43)
	circle.add_theme_stylebox_override("panel", style)
	wrap.add_child(circle)
	var arrow := _build_icon(ARROW_LEFT_ICON_PATH if is_left else ARROW_RIGHT_ICON_PATH, Vector2(21.0, 21.0), Vector2(44.0, 44.0), Y)
	if arrow != null:
		wrap.add_child(arrow)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.disabled = (_series_entries().size() <= 5) or (is_left and carousel_offset <= 0) or ((not is_left) and carousel_offset >= max(0, _series_entries().size() - 5))
	button.pressed.connect(_on_arrow_pressed.bind(is_left))
	wrap.add_child(button)
	return wrap


func _apply_deferred_logo_texture(target: TextureRect, logo_path: String, fallback_path: String) -> void:
	if not is_instance_valid(target):
		return
	var texture := _load_runtime_texture(logo_path)
	if texture == null:
		texture = _load_runtime_texture(fallback_path)
	if texture != null and is_instance_valid(target):
		target.texture = texture


func _build_inline_filter(prefix: String, selected_value: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var left := _txt(prefix, "body", 24, Color.WHITE, Rect2(Vector2(0, 0), Vector2(rect.size.x * 0.62, rect.size.y)))
	wrap.add_child(left)
	var value := _txt(selected_value, "body", 24, Color.WHITE, Rect2(Vector2(rect.size.x * 0.62, 3.0), Vector2(rect.size.x * 0.22, rect.size.y - 4.0)))
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(value)
	var chev := _build_icon(CHEVRON_DOWN_ICON_PATH, Vector2(rect.size.x - 16.0, 6.0), Vector2(16.0, 16.0), Y)
	if chev != null:
		wrap.add_child(chev)
	return wrap


func _build_summary_metric_card(title_text: String, value_text: String, rect: Rect2, accent: bool) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var shell := PanelContainer.new()
	shell.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 0.98, 0.33, 0.08) if accent else Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = BORDER if accent else Color(1.0, 1.0, 1.0, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	shell.add_theme_stylebox_override("panel", style)
	wrap.add_child(shell)
	var title := _txt(title_text.to_upper(), "body", 14, Color("BCBCBD"), Rect2(Vector2(18.0, 14.0), Vector2(rect.size.x - 36.0, 18.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(title)
	var value := _txt(value_text, "title", 30, Y if accent else Color.WHITE, Rect2(Vector2(18.0, 36.0), Vector2(rect.size.x - 36.0, 36.0)))
	value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(value)
	return wrap


func _build_summary_filter_button(prefix: String, selected_value: String, rect: Rect2, filter_id: String) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var shell := PanelContainer.new()
	shell.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = BORDER if open_filter_id == filter_id else Color(1.0, 1.0, 1.0, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	shell.add_theme_stylebox_override("panel", style)
	wrap.add_child(shell)

	var title := _txt(prefix.to_upper(), "body", 14, Color("BCBCBD"), Rect2(Vector2(18.0, 14.0), Vector2(rect.size.x - 50.0, 18.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(title)
	var display_value := _summary_filter_display_value(filter_id, selected_value)
	var value := _txt(display_value, "title", 20, Color.WHITE, Rect2(Vector2(18.0, 40.0), Vector2(rect.size.x - 56.0, 24.0)))
	value.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	value.clip_contents = true
	wrap.add_child(value)
	var chev := _build_icon(CHEVRON_DOWN_ICON_PATH, Vector2(rect.size.x - 34.0, 34.0), Vector2(18.0, 18.0), Y)
	if chev != null:
		wrap.add_child(chev)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_filter_button_pressed.bind(filter_id))
	wrap.add_child(button)
	return wrap


func _build_summary_filter_dropdown(pos: Vector2, size_value: Vector2, options: Array[String], selected_value: String, filter_id: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.z_as_relative = false
	wrap.z_index = 120
	var bg := PanelContainer.new()
	bg.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.08, 0.11, 1.0)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var scroll := ScrollContainer.new()
	scroll.position = Vector2(8.0, 8.0)
	scroll.size = size_value - Vector2(16.0, 16.0)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.clip_contents = true
	scroll.z_index = 121
	wrap.add_child(scroll)
	var list := VBoxContainer.new()
	list.custom_minimum_size = Vector2(scroll.size.x - 10.0, max(scroll.size.y, float(options.size()) * 44.0))
	list.add_theme_constant_override("separation", 6)
	scroll.add_child(list)
	for option in options:
		list.add_child(_build_summary_filter_option(option, selected_value, filter_id, scroll.size.x - 10.0))
	return wrap


func _build_summary_filter_option(option: String, selected_value: String, filter_id: String, width: float) -> Control:
	var wrap := Control.new()
	wrap.custom_minimum_size = Vector2(width, 38.0)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var bg := PanelContainer.new()
	bg.size = Vector2(width, 38.0)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.18) if option == selected_value else Color(0, 0, 0, 0)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(option, "body", 18, Y if option == selected_value else Color.WHITE, Rect2(Vector2(12.0, 4.0), Vector2(width - 24.0, 28.0)))
	wrap.add_child(label)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = Vector2(width, 38.0)
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_filter_option_pressed.bind(filter_id, option))
	wrap.add_child(button)
	return wrap


func _build_empty_state_content(pos: Vector2, size_value: Vector2, eyebrow: String, title_text: String, body_text: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var eyebrow_label := _txt(eyebrow.to_upper(), "body", 14, Y, Rect2(Vector2.ZERO, Vector2(size_value.x, 18.0)))
	eyebrow_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(eyebrow_label)

	var title := _txt(title_text, "title", 38, Color.WHITE, Rect2(Vector2(0.0, 34.0), Vector2(size_value.x, 44.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(title)

	var body := _txt(body_text, "body", 20, Color("BCBCBD"), Rect2(Vector2(0.0, 96.0), Vector2(size_value.x, size_value.y - 96.0)))
	body.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(body)
	return wrap


func _summary_filter_display_value(filter_id: String, selected_value: String) -> String:
	match filter_id:
		"class":
			return _truncate_with_ellipsis(selected_value, 20)
		"entry":
			return _truncate_with_ellipsis(selected_value, 10)
		"sort":
			return _truncate_with_ellipsis(selected_value, 14)
	return selected_value


func _truncate_with_ellipsis(value: String, max_chars: int) -> String:
	if max_chars <= 0 or value.length() <= max_chars:
		return value
	if max_chars <= 3:
		return value.substr(0, max_chars)
	return value.substr(0, max_chars - 3) + "..."


func _filtered_empty_state_body() -> String:
	var filters: Array[String] = []
	if selected_class_filter != "All":
		filters.append("Class: %s" % selected_class_filter)
	if selected_entry_filter != "All":
		filters.append("Entry: %s" % selected_entry_filter)
	if selected_sort_filter != "Featured":
		filters.append("Sort: %s" % selected_sort_filter)
	if filters.is_empty():
		return "No championships are available to browse right now. Try reopening the screen after the catalogue refreshes."
	return "No championships match %s. Broaden one of the active filters to get back to the full series catalogue." % ", ".join(PackedStringArray(filters))


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
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = PANEL_BG
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)
	var border := PanelContainer.new()
	border.size = rect.size
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var b_style := StyleBoxFlat.new()
	b_style.bg_color = Color(0, 0, 0, 0)
	b_style.border_color = BORDER
	b_style.set_border_width_all(2)
	b_style.set_corner_radius_all(MENU_RADIUS)
	border.add_theme_stylebox_override("panel", b_style)
	wrap.add_child(border)
	return wrap


func _on_series_selected(series_id: String) -> void:
	selected_series_id = series_id
	PrototypeState.set_active_series_by_id(series_id)
	var series := _current_series()
	active_right_tab = "standings" if bool(series.get("entered", false)) else "schedule"
	open_filter_id = ""
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_arrow_pressed(is_left: bool) -> void:
	var rows: Array = _series_entries()
	if rows.is_empty():
		return
	var current_index := 0
	for idx in range(rows.size()):
		if str((rows[idx] as Dictionary).get("id", "")) == selected_series_id:
			current_index = idx
			break
	var delta: int = -1 if is_left else 1
	var max_offset: int = max(0, rows.size() - 5)
	carousel_offset = clampi(carousel_offset + delta, 0, max_offset)
	current_index = clampi(current_index + delta, 0, rows.size() - 1)
	selected_series_id = str((rows[current_index] as Dictionary).get("id", ""))
	PrototypeState.set_active_series_by_id(selected_series_id)
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_enter_pressed() -> void:
	var series: Dictionary = _current_series()
	if PrototypeState.car_count <= 0:
		return
	if bool(series.get("entered", false)):
		active_right_tab = "standings"
		_request_rebuild()
		return
	_open_entry_flow(str(series.get("id", "")))


func _open_entry_flow(series_id: String) -> void:
	entry_flow_series_id = series_id
	entry_flow_step = "select"
	entry_flow_error = ""
	entry_flow_selected_car_instance_id = ""
	for option_variant: Variant in PrototypeState.get_series_entry_car_options(series_id):
		if not option_variant is Dictionary:
			continue
		var option: Dictionary = option_variant
		if bool(option.get("selected", false)) or bool(option.get("eligible", false)):
			entry_flow_selected_car_instance_id = str(option.get("car_instance_id", ""))
			break
	_request_rebuild()


func _close_entry_flow() -> void:
	entry_flow_series_id = ""
	entry_flow_step = "select"
	entry_flow_selected_car_instance_id = ""
	entry_flow_error = ""
	_request_rebuild()


func _on_entry_car_selected(car_instance_id: String) -> void:
	entry_flow_selected_car_instance_id = car_instance_id
	entry_flow_error = ""
	_request_rebuild()


func _on_entry_flow_continue() -> void:
	var selected := _entry_flow_selected_option()
	if selected.is_empty():
		entry_flow_error = "Select a car before continuing."
		_request_rebuild()
		return
	if not bool(selected.get("eligible", false)):
		var reason := str(selected.get("status_reason", "")).strip_edges()
		entry_flow_error = reason if not reason.is_empty() else "That car is not eligible for this series."
		_request_rebuild()
		return
	entry_flow_step = "confirm"
	entry_flow_error = ""
	_request_rebuild()


func _on_entry_flow_back() -> void:
	entry_flow_step = "select"
	entry_flow_error = ""
	_request_rebuild()


func _on_entry_flow_confirm() -> void:
	var result: Dictionary = PrototypeState.commit_series_entry(entry_flow_series_id, entry_flow_selected_car_instance_id)
	if not bool(result.get("ok", false)):
		entry_flow_error = str(result.get("message", "Series entry could not be confirmed."))
		entry_flow_step = "confirm"
		_request_rebuild()
		return
	action_feedback = str(result.get("message", "Series entry confirmed."))
	active_right_tab = "standings"
	_close_entry_flow()
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_add_round_pressed() -> void:
	_ensure_schedule_rounds()
	var index := schedule_rounds.size() + 1
	var week := 12 + int((index - 1) * 7)
	var is_indy := (index % 2) == 0
	var layout := "United Kingdom-Brands Hatch Indy-1.944km" if is_indy else "United Kingdom-Brands Hatch GP-3.916km"
	schedule_rounds.append({
		"track": "Brands Hatch",
		"layout": layout,
		"week": "Week %d" % week,
		"status": ""
	})
	_request_rebuild()


func _on_regenerate_pressed() -> void:
	PrototypeState.repair_series_schedule(selected_series_id)
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_filter_button_pressed(filter_id: String) -> void:
	open_filter_id = "" if open_filter_id == filter_id else filter_id
	_request_rebuild()


func _on_filter_option_pressed(filter_id: String, option: String) -> void:
	match filter_id:
		"class":
			selected_class_filter = option
		"entry":
			selected_entry_filter = option
		"sort":
			selected_sort_filter = option
	open_filter_id = ""
	carousel_offset = 0
	var rows := _series_entries()
	if not rows.is_empty():
		var still_visible := false
		for row in rows:
			if str(row.get("id", "")) == selected_series_id:
				still_visible = true
				break
		if not still_visible:
			selected_series_id = str(rows[0].get("id", ""))
			PrototypeState.set_active_series_by_id(selected_series_id)
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_telemetry_result_applied(result: Dictionary) -> void:
	action_feedback = "Telemetry synced automatically: %s result applied." % str(result.get("session_type", "weekend")).capitalize()
	_ensure_schedule_rounds(true)
	_request_rebuild()


func _on_telemetry_ingest_error(message: String) -> void:
	action_feedback = message
	_request_rebuild()


func _on_round_row_pressed(idx: int) -> void:
	selected_round_index = idx
	_request_rebuild()


func _visible_series() -> Array:
	var rows := _series_entries()
	var visible: Array = []
	for index in range(carousel_offset, min(rows.size(), carousel_offset + 5)):
		visible.append(rows[index])
	return visible


func _current_series() -> Dictionary:
	var rows: Array = _series_entries()
	for row in rows:
		if str(row.get("id", "")) == selected_series_id:
			return row
	return rows[0] if not rows.is_empty() else {}


func _sync_selection() -> void:
	var active_series: Dictionary = PrototypeState.get_active_series_detail()
	if selected_series_id.is_empty():
		selected_series_id = str(active_series.get("id", ""))
	var rows: Array = _series_entries()
	for row in rows:
		if str(row.get("id", "")) == selected_series_id:
			return
	selected_series_id = str(rows[0].get("id", "")) if not rows.is_empty() else ""


func _ensure_schedule_rounds(force_reset: bool = false) -> void:
	if force_reset or schedule_series_id != selected_series_id or schedule_rounds.is_empty():
		schedule_series_id = selected_series_id
		schedule_rounds = []
		var rounds_src: Array = _current_series().get("rounds_data", [])
		if rounds_src.is_empty() and not selected_series_id.is_empty():
			rounds_src = PrototypeState.repair_series_schedule(selected_series_id)
		for row in rounds_src:
			if row is Dictionary:
				schedule_rounds.append((row as Dictionary).duplicate(true))
		var weekend: Dictionary = PrototypeState.get_active_race_weekend_summary()
		var preferred_index: int = int(weekend.get("round_index", -1))
		selected_round_index = clampi(preferred_index, 0, schedule_rounds.size() - 1) if preferred_index >= 0 and not schedule_rounds.is_empty() else -1


func _selected_round() -> Dictionary:
	if selected_round_index >= 0 and selected_round_index < schedule_rounds.size() and schedule_rounds[selected_round_index] is Dictionary:
		return schedule_rounds[selected_round_index]
	return schedule_rounds[0] if not schedule_rounds.is_empty() and schedule_rounds[0] is Dictionary else {}


func _build_preloaded_icon(texture: Texture2D, pos: Vector2, icon_size: Vector2, color: Color) -> TextureRect:
	if texture == null:
		return null
	var icon := TextureRect.new()
	icon.position = pos
	icon.size = icon_size
	icon.texture = texture
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_SCALE
	icon.material = _icon_tint_material(color)
	return icon


func _series_entries() -> Array:
	var cache_key := "%s|%s|%s" % [selected_class_filter, selected_entry_filter, selected_sort_filter]
	if filtered_series_cache_key == cache_key:
		return filtered_series_cache
	var rows: Array = _all_series_entries()
	var filtered: Array = []
	for row_variant in rows:
		if typeof(row_variant) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = row_variant
		if selected_class_filter != "All":
			var eligible_variant: Variant = row.get("eligible_car_class_labels", [])
			var eligible_labels: Array = eligible_variant if typeof(eligible_variant) == TYPE_ARRAY else []
			if not eligible_labels.has(selected_class_filter):
				continue
		match selected_entry_filter:
			"Entered":
				if not bool(row.get("entered", false)):
					continue
			"Eligible":
				if not bool(row.get("player_car_eligible", true)):
					continue
			"Ineligible":
				if bool(row.get("player_car_eligible", true)):
					continue
		filtered.append(row)
	match selected_sort_filter:
		"Prestige":
			filtered.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("prestige", 0)) > int(b.get("prestige", 0)))
		"Prize Pool":
			filtered.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return _series_money_value(a, "prize_pool_value", "prize_pool") > _series_money_value(b, "prize_pool_value", "prize_pool"))
		"Entry Fee":
			filtered.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return _series_money_value(a, "fee_value", "fee") < _series_money_value(b, "fee_value", "fee"))
		"Alphabetical":
			filtered.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return str(a.get("name", "")) < str(b.get("name", "")))
	filtered_series_cache = filtered
	filtered_series_cache_key = cache_key
	return filtered


func _all_series_entries() -> Array:
	if not series_directory_cache_loaded:
		_refresh_series_directory_cache()
	return series_directory_cache


func _refresh_series_directory_cache() -> void:
	series_directory_cache = PrototypeState.get_series_directory()
	series_directory_cache_loaded = true
	filtered_series_cache = []
	filtered_series_cache_key = ""


func _class_filter_options() -> Array[String]:
	var options: Array[String] = ["All"]
	for row_variant in _all_series_entries():
		if typeof(row_variant) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = row_variant
		var eligible_variant: Variant = row.get("eligible_car_class_labels", [])
		if typeof(eligible_variant) != TYPE_ARRAY:
			continue
		for item in eligible_variant as Array:
			var label: String = str(item)
			if not label.is_empty() and not options.has(label):
				options.append(label)
	options.sort()
	if options.size() > 1 and options[0] != "All":
		options.insert(0, "All")
	return options


func _entry_filter_options() -> Array[String]:
	return ["All", "Entered", "Eligible", "Ineligible"]


func _sort_filter_options() -> Array[String]:
	return ["Featured", "Prestige", "Prize Pool", "Entry Fee", "Alphabetical"]


func _series_money_value(row: Dictionary, numeric_key: String, label_key: String) -> float:
	if row.has(numeric_key):
		return float(row.get(numeric_key, 0.0))
	var text: String = str(row.get(label_key, "0"))
	var cleaned := ""
	for idx in range(text.length()):
		var ch := text.substr(idx, 1)
		if ch >= "0" and ch <= "9":
			cleaned += ch
	return float(cleaned) if not cleaned.is_empty() else 0.0


func _series_title_lines(series: Dictionary) -> Array:
	var raw_name: String = str(series.get("name", "Series\nUnavailable"))
	var parts: PackedStringArray = raw_name.split("\n")
	if parts.size() >= 2:
		return [parts[0], parts[1]]
	return [raw_name, ""]


func _build_icon(path: String, pos: Vector2, icon_size: Vector2, color: Color) -> TextureRect:
	var texture := _load_icon_texture(path)
	if texture == null:
		return null
	var icon := TextureRect.new()
	icon.position = pos
	icon.size = icon_size
	icon.texture = texture
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_SCALE
	icon.material = _icon_tint_material(color)
	return icon


func _load_icon_texture(path: String) -> Texture2D:
	if icon_texture_cache.has(path):
		return icon_texture_cache[path]
	if ResourceLoader.exists(path):
		var resource: Variant = load(path)
		if resource is Texture2D:
			icon_texture_cache[path] = resource
			return resource
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		return null
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	icon_texture_cache[path] = texture
	return texture


func _load_runtime_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if runtime_texture_cache.has(path):
		return runtime_texture_cache[path]
	if ResourceLoader.exists(path):
		var res_texture: Texture2D = load(path)
		if res_texture != null:
			runtime_texture_cache[path] = res_texture
			return res_texture
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		file_path = path
	if not FileAccess.file_exists(file_path):
		return null
	if runtime_texture_cache.has(file_path):
		return runtime_texture_cache[file_path]
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	runtime_texture_cache[file_path] = texture
	return texture


func _build_driver_portrait_thumb(path: String, pos: Vector2, size_value: Vector2) -> Control:
	var texture := _load_runtime_texture(path)
	if texture == null:
		return null
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	var frame := PanelContainer.new()
	frame.size = size_value
	frame.clip_contents = true
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.08)
	style.border_color = Color(1.0, 1.0, 1.0, 0.18)
	style.set_border_width_all(1)
	style.set_corner_radius_all(int(round(size_value.x / 2.0)))
	frame.add_theme_stylebox_override("panel", style)
	wrap.add_child(frame)
	var image := TextureRect.new()
	image.texture = texture
	image.size = size_value
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	frame.add_child(image)
	return wrap


func _icon_tint_material(color: Color) -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = _icon_tint_shader()
	material.set_shader_parameter("tint", color)
	return material


func _icon_tint_shader() -> Shader:
	if icon_tint_shader != null:
		return icon_tint_shader
	icon_tint_shader = Shader.new()
	icon_tint_shader.code = """
shader_type canvas_item;
uniform vec4 tint : source_color = vec4(1.0);

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	COLOR = vec4(tint.rgb, tex.a * tint.a);
}
"""
	return icon_tint_shader


func _logo_cutout_material() -> ShaderMaterial:
	var material := ShaderMaterial.new()
	material.shader = _logo_cutout_shader()
	return material


func _logo_cutout_shader() -> Shader:
	if logo_cutout_shader != null:
		return logo_cutout_shader
	logo_cutout_shader = Shader.new()
	logo_cutout_shader.code = """
shader_type canvas_item;

void fragment() {
	vec4 tex = texture(TEXTURE, UV);
	float whiteness = min(tex.r, min(tex.g, tex.b));
	float alpha_mask = 1.0 - smoothstep(0.90, 0.985, whiteness);
	COLOR = vec4(tex.rgb, tex.a * alpha_mask);
}
"""
	return logo_cutout_shader
