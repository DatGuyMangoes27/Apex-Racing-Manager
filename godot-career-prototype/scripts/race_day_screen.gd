extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const SERIES_SCENE := "res://scenes/series_entry_screen.tscn"
const GARAGE_SCENE := "res://scenes/garage_screen.tscn"
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const DEFAULT_CAR_TEXTURE = preload("res://assets/images/figma-hq/race-car.png")
const GROUND_RING_TEXTURE = preload("res://assets/images/figma-hq/car-ground-ring.svg")

const SESSION_PRACTICE := "practice"
const SESSION_QUALIFYING := "qualifying"
const SESSION_RACE := "race"

const Y := Color("FFFA55")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(1.0, 0.98, 0.33, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("A6A7A8")
const GREEN := Color("6AE28B")
const RED := Color("C93C56")
const CYAN := Color("00FFF7")

const HERO_RECT := Rect2(Vector2(89.0, 151.0), Vector2(1500.0, 770.0))
const LIVE_RECT := Rect2(Vector2(1634.0, 151.0), Vector2(836.0, 770.0))
const DEBRIEF_RECT := Rect2(Vector2(89.0, 956.0), Vector2(1166.0, 368.0))
const STANDINGS_RECT := Rect2(Vector2(1307.0, 956.0), Vector2(1163.0, 368.0))

var action_feedback := ""
var _last_telemetry_signature := ""
const TELEMETRY_POLL_INTERVAL := 0.15
var _telemetry_poll_elapsed := 0.0
var runtime_texture_cache := {}
var standings_scroll := 0
var standings_panel_mode := "result"
var _rebuild_queued := false
var _telemetry_connect_attempts := 0
const MAX_TELEMETRY_CONNECT_ATTEMPTS := 30


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	get_viewport().size_changed.connect(_on_viewport_resized)
	set_process(true)
	_connect_prototype_state_signals()
	_connect_native_telemetry_signals()
	_build_ui()


func _connect_prototype_state_signals() -> void:
	if PrototypeState.has_signal("telemetry_result_applied") and not PrototypeState.is_connected("telemetry_result_applied", Callable(self, "_on_telemetry_result_applied")):
		PrototypeState.connect("telemetry_result_applied", Callable(self, "_on_telemetry_result_applied"))
	if PrototypeState.has_signal("telemetry_ingest_error") and not PrototypeState.is_connected("telemetry_ingest_error", Callable(self, "_on_telemetry_ingest_error")):
		PrototypeState.connect("telemetry_ingest_error", Callable(self, "_on_telemetry_ingest_error"))


func _native_telemetry_node() -> Node:
	if not is_inside_tree():
		return null
	return get_node_or_null("/root/Ams2Telemetry")


func _connect_native_telemetry_signals() -> void:
	var telemetry := _native_telemetry_node()
	if telemetry == null:
		_telemetry_connect_attempts += 1
		if _telemetry_connect_attempts < MAX_TELEMETRY_CONNECT_ATTEMPTS:
			call_deferred("_connect_native_telemetry_signals")
		return
	_telemetry_connect_attempts = 0
	_connect_native_signal(telemetry, ["TelemetryStatusChanged", "telemetry_status_changed"], Callable(self, "_on_native_telemetry_status_changed"))
	_connect_native_signal(telemetry, ["TelemetryError", "telemetry_error"], Callable(self, "_on_native_telemetry_error"))


func _connect_native_signal(telemetry: Node, candidate_names: Array, target: Callable) -> void:
	for name_variant in candidate_names:
		var signal_name: String = str(name_variant)
		if telemetry.has_signal(signal_name) and not telemetry.is_connected(signal_name, target):
			telemetry.connect(signal_name, target)
			return


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


func _process(delta: float) -> void:
	_telemetry_poll_elapsed += delta
	if _telemetry_poll_elapsed < TELEMETRY_POLL_INTERVAL:
		return
	_telemetry_poll_elapsed = 0.0
	_refresh_telemetry_snapshot()


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

	var wash := ColorRect.new()
	wash.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	wash.color = Color(0.0, 0.02, 0.06, 0.74)
	add_child(wash)

	var frame := Control.new()
	frame.position = off
	frame.size = Vector2(DW, DH)
	frame.scale = Vector2(sc, sc)
	add_child(frame)

	var shell := Control.new()
	shell.scale = Vector2(LAYOUT_SCALE, LAYOUT_SCALE)
	frame.add_child(shell)

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "race-day"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	var weekend := _weekend()
	var telemetry := _telemetry()
	var hero_panel := _build_hero_panel(weekend, telemetry)
	shell.add_child(hero_panel)
	var live_panel := _build_live_panel(weekend, telemetry)
	shell.add_child(live_panel)
	var debrief_panel := _build_debrief_panel(weekend)
	shell.add_child(debrief_panel)
	var standings_panel := _build_standings_panel()
	shell.add_child(standings_panel)
	_register_tutorial(hero_panel, live_panel, debrief_panel, standings_panel)

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "race-day"
	nav.show_continue_button = true
	nav.position = Vector2(0.0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)


func _register_tutorial(hero_panel: Control, live_panel: Control, debrief_panel: Control, standings_panel: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": hero_panel,
			"title": "Weekend Overview",
			"body": "The headline for this race weekend - the circuit, your championship position, and which session is up next across practice, qualifying and the race.",
			"affects": "Your at-a-glance briefing for the round.",
		},
		{
			"target": live_panel,
			"title": "Sessions & Setup",
			"body": "Recommended setup and weather for practice, qualifying and the race, plus live telemetry once you are on track in AMS2. Set these before you go racing - you only get one chance per session.",
			"affects": "Good prep directly improves your result.",
		},
		{
			"target": debrief_panel,
			"title": "Weekend Debrief",
			"body": "After the race this fills with your result - finishing position, points scored and prize money earned. It is the summary of how the weekend went.",
			"affects": "Confirms points, cash and stats earned.",
		},
		{
			"target": standings_panel,
			"title": "Championship Standings",
			"body": "A live standings preview so you can see how this result moves you up or down the championship table against your rivals.",
			"affects": "Tracks your title fight round by round.",
		},
	]
	director.report_screen_ready("race-day", steps, self)


func _build_hero_panel(weekend: Dictionary, telemetry: Dictionary) -> Control:
	var card := _panel(HERO_RECT)
	var title := _txt("RACE DAY", "body", 22, Y, Rect2(Vector2(42.0, 28.0), Vector2(220.0, 30.0)))
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(title)

	var series_name := _txt(str(weekend.get("series_name", "Series")).to_upper(), "title", 54, Y, Rect2(Vector2(38.0, 66.0), Vector2(760.0, 132.0)))
	series_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	series_name.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(series_name)

	var round_header := str(weekend.get("round_label", "Week --"))
	var race_label := str(weekend.get("race_label", "")).strip_edges()
	if not race_label.is_empty():
		round_header = "%s  •  %s" % [round_header, race_label]
	var round_line := _txt(
		"%s  •  %s" % [round_header, str(weekend.get("track_name", "TBD"))],
		"body",
		28,
		Color.WHITE,
		Rect2(Vector2(42.0, 214.0), Vector2(740.0, 34.0))
	)
	card.add_child(round_line)

	var layout_line := _txt(str(weekend.get("layout_name", "")), "body", 18, COPY, Rect2(Vector2(42.0, 258.0), Vector2(760.0, 26.0)))
	card.add_child(layout_line)

	card.add_child(_chip(str(weekend.get("status", "Awaiting Weekend")), Vector2(42.0, 314.0), _status_chip_color(str(weekend.get("status", "")))))
	card.add_child(_chip("LIVE %s" % ("CONNECTED" if bool(telemetry.get("connected", false)) else "OFFLINE"), Vector2(240.0, 314.0), GREEN if bool(telemetry.get("connected", false)) else Color(1, 1, 1, 0.16), Color.BLACK if bool(telemetry.get("connected", false)) else Color.WHITE))

	card.add_child(_session_card("Practice", str(weekend.get("session_statuses", {}).get(SESSION_PRACTICE, "Pending")), Vector2(42.0, 388.0), 220.0))
	card.add_child(_session_card("Qualifying", str(weekend.get("session_statuses", {}).get(SESSION_QUALIFYING, "Pending")), Vector2(282.0, 388.0), 220.0))
	card.add_child(_session_card("Race", str(weekend.get("session_statuses", {}).get(SESSION_RACE, "Pending")), Vector2(522.0, 388.0), 220.0))

	var races_in_round := maxi(1, int(weekend.get("races_in_round", 1)))
	var weekend_pts_label := str(int(weekend.get("points_awarded", 0)))
	if races_in_round > 1:
		weekend_pts_label = str(int(weekend.get("round_points_total", weekend.get("points_awarded", 0))))
	card.add_child(_metric_tile("Champ Pos", _short_champ_pos(), Vector2(42.0, 500.0), Vector2(210.0, 112.0)))
	card.add_child(_metric_tile("Weekend Pts", weekend_pts_label, Vector2(272.0, 500.0), Vector2(210.0, 112.0)))
	card.add_child(_metric_tile("Prize Money", str(weekend.get("prize_money_label", "$0")), Vector2(502.0, 500.0), Vector2(240.0, 112.0)))

	var scrutineering: Dictionary = weekend.get("scrutineering", {}) if weekend.get("scrutineering", {}) is Dictionary else {}
	var passes_scrutineering := bool(scrutineering.get("passes", true))
	if not scrutineering.is_empty():
		var scrut_label := "SCRUTINEERING PASS" if passes_scrutineering else "FAILS SCRUTINEERING"
		var scrut_color := GREEN if passes_scrutineering else Color("D9534F")
		var scrut_text_color := Color.BLACK if passes_scrutineering else Color.WHITE
		card.add_child(_chip(scrut_label, Vector2(440.0, 314.0), scrut_color, scrut_text_color))

	var note_text := "Weekend state syncs automatically from AMS2 telemetry and writes consequences straight back into the career."
	if races_in_round > 1:
		note_text = _weekend_race_breakdown_text(weekend)
	if not scrutineering.is_empty() and not passes_scrutineering:
		note_text = "Car fails scrutineering: %d%% condition is below the %d%% minimum for this series. You cannot take the start until the car is serviced." % [int(scrutineering.get("car_condition_pct", 0)), int(scrutineering.get("min_condition_pct", 0))]
		var service_btn := Button.new()
		service_btn.text = "SERVICE CAR IN GARAGE  (%s)" % _fmt_service_cost(float(scrutineering.get("service_cost", 0.0)))
		service_btn.position = Vector2(42.0, 716.0)
		service_btn.size = Vector2(420.0, 44.0)
		service_btn.add_theme_font_size_override("font_size", 18)
		service_btn.pressed.connect(_on_service_car_pressed)
		card.add_child(service_btn)
	var note := _txt(
		note_text,
		"body",
		18,
		COPY,
		Rect2(Vector2(42.0, 640.0), Vector2(760.0, 72.0))
	)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(note)

	card.add_child(_build_hero_car_ring())
	card.add_child(_build_hero_car_image())

	return card


## A one-line summary of each race in a double-header weekend: finished races show
## the player's result + points, races still to run show as upcoming.
func _weekend_race_breakdown_text(weekend: Dictionary) -> String:
	var races_in_round := maxi(1, int(weekend.get("races_in_round", 1)))
	var results: Array = weekend.get("race_results", []) if weekend.get("race_results", []) is Array else []
	var parts: PackedStringArray = PackedStringArray()
	for result_variant: Variant in results:
		if not result_variant is Dictionary:
			continue
		var r: Dictionary = result_variant
		var pos := int(r.get("player_position", 0))
		var pos_label := "DNF" if bool(r.get("dnf", false)) else ("P%d" % pos if pos > 0 else "--")
		parts.append("Race %d: %s • %d pts" % [int(r.get("race_number", 0)), pos_label, int(r.get("points_awarded", 0))])
	for race_number in range(results.size() + 1, races_in_round + 1):
		parts.append("Race %d: upcoming" % race_number)
	return "Double-header — each race runs its own qualifying.   " + "   ".join(parts)


func _build_live_panel(weekend: Dictionary, telemetry: Dictionary) -> Control:
	var card := _panel(LIVE_RECT)
	card.add_child(_txt("WEEKEND SETUP BRIEFING", "title", 30, Y, Rect2(Vector2(36.0, 30.0), Vector2(520.0, 36.0))))

	var race_package: Dictionary = weekend.get("race_package", {}) if weekend.get("race_package", {}) is Dictionary else {}
	var setup: Dictionary = race_package.get("setup", {}) if race_package.get("setup", {}) is Dictionary else {}
	var required_labels: Array = race_package.get("required_class_labels", []) if race_package.get("required_class_labels", []) is Array else []
	var required_text := ", ".join(PackedStringArray(required_labels))
	if required_text.is_empty():
		required_text = str(race_package.get("player_class_label", "Current class"))

	card.add_child(_telemetry_row("AMS2 Classes To Add", required_text, 88.0))
	card.add_child(_telemetry_row("Your Scoring Class", str(race_package.get("player_class_label", "Class TBC")), 150.0))
	card.add_child(_telemetry_row("Recommended Grid", "%d cars" % int(race_package.get("recommended_grid", 0)), 212.0))
	card.add_child(_telemetry_row("Practice", str(setup.get("practice", "Practice length TBC")), 288.0))
	card.add_child(_telemetry_row("Qualifying", str(setup.get("qualifying", "Qualifying length TBC")), 350.0))
	card.add_child(_telemetry_row("Race", str(setup.get("race", "Race length TBC")), 412.0))
	var rules := _txt(str(setup.get("rules_notes", "Use these recommendations for the full weekend setup before starting AMS2.")), "body", 17, COPY, Rect2(Vector2(36.0, 486.0), Vector2(760.0, 54.0)))
	rules.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rules.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(rules)

	var feed_state := "LIVE CONNECTED" if bool(telemetry.get("connected", false)) else "AMS2 WAITING"
	var feed_color := GREEN if bool(telemetry.get("connected", false)) else COPY
	card.add_child(_txt(feed_state, "title", 22, feed_color, Rect2(Vector2(36.0, 566.0), Vector2(240.0, 30.0))))
	card.add_child(_telemetry_row("Live Session", str(telemetry.get("session_type", "Unknown")), 604.0))
	card.add_child(_telemetry_row("Live Track", str(telemetry.get("layout_name", telemetry.get("track_name", "Awaiting session"))), 656.0))

	var latest_result: Dictionary = weekend.get("latest_result", {})
	var result_badge := _chip(_result_label(latest_result), Vector2(572.0, 568.0), _result_color(latest_result), Color.BLACK if _result_color(latest_result) != Color(1, 1, 1, 0.14) else Color.WHITE)
	card.add_child(result_badge)

	card.add_child(_secondary_button("Back To Series", Vector2(36.0, 704.0), Vector2(220.0, 48.0), "_on_back_pressed"))
	if not action_feedback.is_empty():
		var feedback := _txt(action_feedback, "body", 16, COPY, Rect2(Vector2(278.0, 708.0), Vector2(510.0, 42.0)))
		feedback.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		feedback.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		card.add_child(feedback)

	return card


func _build_debrief_panel(weekend: Dictionary) -> Control:
	var card := _panel(DEBRIEF_RECT)
	card.add_child(_txt("WEEKEND DEBRIEF", "title", 28, Y, Rect2(Vector2(34.0, 26.0), Vector2(420.0, 34.0))))
	var latest_result: Dictionary = weekend.get("latest_result", {})
	var player_row: Dictionary = _player_classification_row()

	var left_column := Control.new()
	left_column.position = Vector2(34.0, 74.0)
	left_column.size = Vector2(646.0, 210.0)
	left_column.clip_contents = true
	card.add_child(left_column)

	var headline := _debrief_headline(latest_result, player_row)
	var headline_color := _result_color(latest_result)
	var headline_label := _txt(headline, "title", 38, headline_color, Rect2(Vector2.ZERO, Vector2(500.0, 44.0)))
	headline_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	left_column.add_child(headline_label)

	if bool(player_row.get("fastest_lap", false)):
		left_column.add_child(_chip("FASTEST LAP", Vector2(456.0, 6.0), Color("9B7BFF"), Color.WHITE))

	var session_line := _txt(
		"%s result  •  %s" % [str(latest_result.get("session_type", "pending")).capitalize(), str(weekend.get("track_name", "Track"))],
		"body",
		18,
		Color.WHITE,
		Rect2(Vector2(0.0, 52.0), Vector2(646.0, 24.0))
	)
	left_column.add_child(session_line)

	var grid_line := _grid_to_finish_text(weekend, latest_result, player_row)
	if not grid_line.is_empty():
		left_column.add_child(_txt(grid_line, "body", 16, COPY, Rect2(Vector2(0.0, 78.0), Vector2(646.0, 22.0))))

	var summary := _debrief_text(latest_result, weekend)
	var summary_label := _txt(summary, "body", 17, COPY, Rect2(Vector2(0.0, 108.0), Vector2(646.0, 78.0)))
	summary_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	summary_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	left_column.add_child(summary_label)

	card.add_child(_metric_tile("Points", str(int(weekend.get("points_awarded", 0))), Vector2(812.0, 82.0), Vector2(150.0, 102.0)))
	card.add_child(_metric_tile("Prize", str(weekend.get("prize_money_label", "$0")), Vector2(982.0, 82.0), Vector2(150.0, 102.0)))
	card.add_child(_metric_tile("Standing", _short_champ_pos(), Vector2(812.0, 206.0), Vector2(320.0, 102.0)))

	return card


func _build_standings_panel() -> Control:
	var card := _panel(STANDINGS_RECT)
	card.clip_contents = true
	var race_package: Dictionary = PrototypeState.get_active_race_package()
	var classification_view: Dictionary = _race_classification_view()
	var has_result: bool = bool(classification_view.get("ready", false))
	var mode := standings_panel_mode
	if mode == "result" and not has_result:
		mode = "championship"

	if has_result:
		_build_standings_mode_toggle(card, mode)

	if mode == "result":
		_build_race_result_rows(card, classification_view)
		return card

	var heading := "STANDINGS PREVIEW"
	if bool(race_package.get("is_multiclass", false)):
		heading = "%s STANDINGS" % str(race_package.get("player_class_label", "CLASS")).to_upper()
	card.add_child(_txt(heading, "title", 28, Y, Rect2(Vector2(34.0, 26.0), Vector2(520.0, 34.0))))

	var standings: Array = _standings_rows_for_race_package(race_package)
	if standings.is_empty():
		var empty := _txt("Championship standings will appear here once the weekend has a live championship context.", "body", 20, COPY, Rect2(Vector2(34.0, 92.0), Vector2(760.0, 80.0)))
		empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		empty.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		card.add_child(empty)
		return card
	if bool(race_package.get("is_multiclass", false)):
		var context := _txt("%s field • %s" % [str(race_package.get("championship_name", "Multiclass")), str(race_package.get("player_overall_position_label", "-- overall"))], "body", 15, COPY, Rect2(Vector2(556.0, 32.0), Vector2(520.0, 22.0)))
		context.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		card.add_child(context)

	card.add_child(_txt("Pos", "body", 16, Y, Rect2(Vector2(34.0, 92.0), Vector2(56.0, 22.0))))
	card.add_child(_txt("Driver", "body", 16, Y, Rect2(Vector2(154.0, 92.0), Vector2(320.0, 22.0))))
	card.add_child(_txt("Team", "body", 16, Y, Rect2(Vector2(482.0, 92.0), Vector2(430.0, 22.0))))
	card.add_child(_txt("PTS", "body", 16, Y, Rect2(Vector2(1030.0, 92.0), Vector2(74.0, 22.0))))

	var player_team := _ps_string("team_name", "")
	var visible_rows := mini(5, standings.size())
	var max_scroll := maxi(0, standings.size() - visible_rows)
	standings_scroll = clampi(standings_scroll, 0, max_scroll)
	for idx in range(visible_rows):
		var row_index := standings_scroll + idx
		var row: Dictionary = standings[row_index] if standings[row_index] is Dictionary else {}
		var y := 128.0 + float(idx) * 42.0
		var is_player := str(row.get("team", "")) == player_team
		var row_color := Y if is_player else Color.WHITE
		card.add_child(_txt(str(row.get("class_pos", row.get("pos", row_index + 1))), "body", 17, row_color, Rect2(Vector2(34.0, y), Vector2(56.0, 22.0))))
		var portrait := _build_driver_portrait_thumb(str(row.get("driver_portrait_path", "")), Vector2(114.0, y - 2.0), Vector2(28.0, 28.0))
		if portrait != null:
			card.add_child(portrait)
		var driver_text := str(row.get("driver", ""))
		if is_player and str(row.get("driver_profile_id", "")).strip_edges().is_empty():
			var owner_name := _owner_driver_name()
			if not owner_name.is_empty():
				driver_text = owner_name
		var driver_label := _txt(driver_text, "body", 17, row_color, Rect2(Vector2(154.0, y), Vector2(280.0, 24.0)))
		driver_label.clip_text = true
		driver_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		card.add_child(driver_label)
		var team_label := _txt(str(row.get("team", "")), "body", 17, row_color, Rect2(Vector2(482.0, y), Vector2(470.0, 24.0)))
		team_label.clip_text = true
		team_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		card.add_child(team_label)
		var pts := _txt(str(row.get("pts", "0")), "body", 17, row_color, Rect2(Vector2(1030.0, y), Vector2(74.0, 22.0)))
		pts.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		card.add_child(pts)

		var divider := ColorRect.new()
		divider.position = Vector2(34.0, y + 34.0)
		divider.size = Vector2(1070.0, 1.0)
		divider.color = Color(1.0, 1.0, 1.0, 0.08)
		card.add_child(divider)
	if standings.size() > visible_rows:
		var track := ColorRect.new()
		track.position = Vector2(1112.0, 128.0)
		track.size = Vector2(5.0, 202.0)
		track.color = Color(1.0, 1.0, 1.0, 0.12)
		card.add_child(track)
		var thumb_h := maxf(34.0, track.size.y * (float(visible_rows) / float(standings.size())))
		var thumb_y := track.position.y
		if max_scroll > 0:
			thumb_y = track.position.y + (track.size.y - thumb_h) * (float(standings_scroll) / float(max_scroll))
		var thumb := ColorRect.new()
		thumb.position = Vector2(track.position.x, thumb_y)
		thumb.size = Vector2(track.size.x, thumb_h)
		thumb.color = Y
		card.add_child(thumb)
		_add_standings_scroll_capture(card, standings.size(), visible_rows)

	return card


func _race_classification_view() -> Dictionary:
	if PrototypeState.has_method("get_active_race_classification"):
		var value: Variant = PrototypeState.call("get_active_race_classification")
		if value is Dictionary:
			return value
	return {}


func _build_standings_mode_toggle(card: Control, mode: String) -> void:
	var result_active := mode == "result"
	card.add_child(_mode_chip("RACE RESULT", Vector2(742.0, 24.0), result_active, "_show_result_mode"))
	card.add_child(_mode_chip("CHAMPIONSHIP", Vector2(926.0, 24.0), not result_active, "_show_championship_mode"))


func _mode_chip(text_value: String, pos: Vector2, active: bool, handler_name: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(178.0, 40.0)
	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y if active else Color(1.0, 1.0, 1.0, 0.06)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(text_value, "body", 15, Color.BLACK if active else Y, Rect2(Vector2.ZERO, wrap.size))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.pressed.connect(Callable(self, handler_name))
	wrap.add_child(button)
	return wrap


func _show_result_mode() -> void:
	if standings_panel_mode == "result":
		return
	standings_panel_mode = "result"
	standings_scroll = 0
	_request_rebuild()


func _show_championship_mode() -> void:
	if standings_panel_mode == "championship":
		return
	standings_panel_mode = "championship"
	standings_scroll = 0
	_request_rebuild()


func _build_race_result_rows(card: Control, view: Dictionary) -> void:
	var is_multiclass: bool = bool(view.get("is_multiclass", false))
	var heading := "RACE RESULT"
	if is_multiclass:
		heading = "%s RESULT" % str(view.get("player_class_label", "CLASS")).to_upper()
	card.add_child(_txt(heading, "title", 28, Y, Rect2(Vector2(34.0, 26.0), Vector2(420.0, 34.0))))

	var rows: Array = view.get("rows", []) if view.get("rows", []) is Array else []
	card.add_child(_txt("Pos", "body", 16, Y, Rect2(Vector2(34.0, 92.0), Vector2(56.0, 22.0))))
	card.add_child(_txt("Driver", "body", 16, Y, Rect2(Vector2(96.0, 92.0), Vector2(360.0, 22.0))))
	card.add_child(_txt("Team", "body", 16, Y, Rect2(Vector2(470.0, 92.0), Vector2(420.0, 22.0))))
	card.add_child(_txt("PTS", "body", 16, Y, Rect2(Vector2(1030.0, 92.0), Vector2(74.0, 22.0))))

	var visible_rows := mini(5, rows.size())
	var max_scroll := maxi(0, rows.size() - visible_rows)
	standings_scroll = clampi(standings_scroll, 0, max_scroll)
	for idx in range(visible_rows):
		var row_index := standings_scroll + idx
		var row: Dictionary = rows[row_index] if rows[row_index] is Dictionary else {}
		var y := 128.0 + float(idx) * 42.0
		var is_player := bool(row.get("is_player", false))
		var is_dnf := bool(row.get("dnf", false))
		var row_color := Y if is_player else (Color(1, 1, 1, 0.5) if is_dnf else Color.WHITE)
		var pos_text := "DNF" if is_dnf else str(row.get("pos", row_index + 1))
		card.add_child(_txt(pos_text, "body", 17, RED if is_dnf else row_color, Rect2(Vector2(34.0, y), Vector2(56.0, 22.0))))
		var driver_label := _txt(str(row.get("driver", "")), "body", 17, row_color, Rect2(Vector2(96.0, y), Vector2(360.0, 24.0)))
		driver_label.clip_text = true
		driver_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		card.add_child(driver_label)
		if bool(row.get("fastest_lap", false)):
			card.add_child(_chip("FL", Vector2(396.0, y - 4.0), Color("9B7BFF"), Color.WHITE))
		var team_text := str(row.get("team", ""))
		if is_multiclass and not str(row.get("car_class", "")).is_empty():
			team_text = "%s  •  %s" % [team_text, str(row.get("car_class", ""))]
		var team_label := _txt(team_text, "body", 17, row_color, Rect2(Vector2(470.0, y), Vector2(540.0, 24.0)))
		team_label.clip_text = true
		team_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		card.add_child(team_label)
		var pts := _txt(str(int(row.get("points", 0))), "body", 17, row_color, Rect2(Vector2(1030.0, y), Vector2(74.0, 22.0)))
		pts.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		card.add_child(pts)

		var divider := ColorRect.new()
		divider.position = Vector2(34.0, y + 34.0)
		divider.size = Vector2(1070.0, 1.0)
		divider.color = Color(1.0, 1.0, 1.0, 0.08)
		card.add_child(divider)
	if rows.size() > visible_rows:
		_add_standings_scroll_capture(card, rows.size(), visible_rows)


func _standings_rows_for_race_package(race_package: Dictionary) -> Array:
	var championship_rows := _ps_call_array("get_championship_standings")
	var class_rows: Array = race_package.get("class_standings_rows", []) if race_package.get("class_standings_rows", []) is Array else []
	var overall_rows: Array = race_package.get("overall_standings_rows", []) if race_package.get("overall_standings_rows", []) is Array else []
	if bool(race_package.get("is_multiclass", false)) and not class_rows.is_empty():
		return class_rows
	if not championship_rows.is_empty():
		return championship_rows
	if not overall_rows.is_empty():
		return overall_rows
	return class_rows


func _add_standings_scroll_capture(parent: Control, total_rows: int, visible_rows: int) -> void:
	var capture := Control.new()
	capture.position = Vector2(28.0, 118.0)
	capture.size = Vector2(1088.0, 228.0)
	capture.mouse_filter = Control.MOUSE_FILTER_STOP
	capture.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton and event.pressed:
			var mouse_event: InputEventMouseButton = event as InputEventMouseButton
			var max_scroll := maxi(0, total_rows - visible_rows)
			if mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN and standings_scroll < max_scroll:
				standings_scroll += 1
				_request_rebuild()
			elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP and standings_scroll > 0:
				standings_scroll -= 1
				_request_rebuild()
	)
	parent.add_child(capture)


func _session_card(label_text: String, status: String, pos: Vector2, width: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(width, 92.0)
	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = Color(1.0, 1.0, 1.0, 0.10)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(label_text.to_upper(), "body", 14, COPY, Rect2(Vector2(18.0, 16.0), Vector2(width - 36.0, 18.0))))
	wrap.add_child(_txt(status, "title", 26, _status_text_color(status), Rect2(Vector2(18.0, 42.0), Vector2(width - 36.0, 30.0))))
	return wrap


func _telemetry_row(label_text: String, value: String, y: float) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(36.0, y)
	wrap.size = Vector2(760.0, 42.0)
	wrap.add_child(_txt(label_text.to_upper(), "body", 14, COPY, Rect2(Vector2.ZERO, Vector2(180.0, 18.0))))
	var value_label := _txt(value, "body", 20, Color.WHITE, Rect2(Vector2(0.0, 16.0), Vector2(760.0, 24.0)))
	value_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(value_label)
	return wrap


func _metric_tile(label_text: String, value_text: String, pos: Vector2, size_value: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	var bg := PanelContainer.new()
	bg.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = Color(1.0, 1.0, 1.0, 0.10)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	wrap.add_child(_txt(label_text.to_upper(), "body", 14, COPY, Rect2(Vector2(16.0, 14.0), Vector2(size_value.x - 32.0, 18.0))))
	var value_label := _txt(value_text, "title", 28, Color.WHITE, Rect2(Vector2(16.0, 44.0), Vector2(size_value.x - 32.0, 38.0)))
	value_label.clip_text = true
	value_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(value_label)
	return wrap


func _load_runtime_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
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


func _chip(text_value: String, pos: Vector2, bg_color: Color, text_color: Color = Color.BLACK) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(maxf(132.0, 18.0 + float(text_value.length()) * 10.0), 38.0)
	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.set_corner_radius_all(19)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(text_value, "body", 15, text_color, Rect2(Vector2.ZERO, wrap.size))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	return wrap


func _secondary_button(label_text: String, pos: Vector2, size_value: Vector2, handler_name: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size_value
	var bg := PanelContainer.new()
	bg.size = size_value
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 1.0, 1.0, 0.06)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(label_text, "body", 16, Y, Rect2(Vector2.ZERO, size_value))
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = size_value
	button.pressed.connect(Callable(self, handler_name))
	wrap.add_child(button)
	return wrap


func _panel(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var bg := PanelContainer.new()
	bg.size = rect.size
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = PANEL_BG
	bg_style.set_corner_radius_all(20)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)
	var border := PanelContainer.new()
	border.size = rect.size
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = BORDER
	border_style.set_border_width_all(2)
	border_style.set_corner_radius_all(20)
	border.add_theme_stylebox_override("panel", border_style)
	wrap.add_child(border)
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


func _weekend() -> Dictionary:
	if PrototypeState.has_method("get_active_race_weekend_summary"):
		var value: Variant = PrototypeState.call("get_active_race_weekend_summary")
		if value is Dictionary:
			return value
	return {}


func _telemetry() -> Dictionary:
	var telemetry := _native_telemetry_node()
	if telemetry != null and telemetry.has_method("GetStatus"):
		var value: Variant = telemetry.call("GetStatus")
		if value is Dictionary:
			return value
	return {}


func _refresh_telemetry_snapshot(force_rebuild: bool = false) -> void:
	var telemetry := _telemetry()
	var signature := "%s|%s|%s|%s|%s|%s|%s|%s" % [
		str(telemetry.get("connected", false)),
		str(telemetry.get("message", "")),
		str(telemetry.get("session_type", "")),
		str(telemetry.get("session_phase", "")),
		str(telemetry.get("race_state", "")),
		str(telemetry.get("layout_name", telemetry.get("track_name", ""))),
		str(telemetry.get("participant_count", 0)),
		str(telemetry.get("player_position", 0)),
	]
	if force_rebuild or signature != _last_telemetry_signature:
		_last_telemetry_signature = signature
		_request_rebuild()


func _ps_call_array(method_name: String) -> Array:
	if PrototypeState.has_method(method_name):
		var value: Variant = PrototypeState.call(method_name)
		if value is Array:
			return value
	return []


func _ps_string(property_name: String, fallback: String = "") -> String:
	var value: Variant = PrototypeState.get(property_name)
	return str(value) if value != null else fallback


## Concise championship position for the metric tile. The full label appends the
## class/series name (e.g. "1st Porsche Carrera Cup") which overflows the tile, so
## keep the leading ordinal and only retain a short class tag for multiclass.
## Full name of the team owner/founder. Used as the standings driver label when the
## player has not signed a separate race driver yet (they run under their own name).
func _owner_driver_name() -> String:
	var first := _ps_string("founder_first_name", "")
	var last := _ps_string("founder_last_name", "")
	return ("%s %s" % [first, last]).strip_edges()


func _short_champ_pos() -> String:
	var label := _ps_string("championship_position_label", "--").strip_edges()
	if label.is_empty():
		return "--"
	var regex := RegEx.new()
	regex.compile("^[0-9]+(st|nd|rd|th)")
	var ordinal_match := regex.search(label)
	if ordinal_match == null:
		return label
	var ordinal := ordinal_match.get_string()
	var race_package: Dictionary = PrototypeState.get_active_race_package()
	if bool(race_package.get("is_multiclass", false)):
		var class_label := str(race_package.get("player_class_label", "")).strip_edges()
		# Only append genuine short class codes (GT3, LMP2, TCR...). Long, full
		# series names like "Porsche Carrera Cup" overflow the tile, so drop them.
		if not class_label.is_empty() and class_label.length() <= 8:
			return "%s %s" % [ordinal, class_label]
	return ordinal


func _car_texture() -> Texture2D:
	var path := _ps_string("current_car_image_path", "")
	if not path.is_empty() and ResourceLoader.exists(path):
		var texture: Variant = load(path)
		if texture is Texture2D:
			return texture
	return DEFAULT_CAR_TEXTURE


func _build_hero_car_ring() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(794.0, 458.0)
	wrap.size = Vector2(690.0, 64.0)

	var ring := TextureRect.new()
	ring.texture = GROUND_RING_TEXTURE
	ring.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ring.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	ring.position = Vector2.ZERO
	ring.size = wrap.size
	wrap.add_child(ring)

	return wrap


func _build_hero_car_image() -> Control:
	var frame := Control.new()
	frame.position = Vector2(812.0, 112.0)
	frame.size = Vector2(672.0, 430.0)
	frame.clip_contents = true

	var car_image := TextureRect.new()
	var texture := _car_texture()
	car_image.texture = texture
	car_image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	car_image.stretch_mode = TextureRect.STRETCH_SCALE
	var source_size := texture.get_size()
	var max_stage_size := Vector2(600.0, 300.0)
	var image_size := max_stage_size
	if source_size.x > 0.0 and source_size.y > 0.0:
		var scale_factor := minf(max_stage_size.x / source_size.x, max_stage_size.y / source_size.y)
		image_size = source_size * scale_factor
	car_image.size = image_size
	car_image.position = Vector2(
		(frame.size.x - image_size.x) * 0.5,
		frame.size.y - image_size.y - 18.0
	)
	car_image.modulate = Color(1, 1, 1, 1.0)
	frame.add_child(car_image)

	return frame


func _player_classification_row() -> Dictionary:
	var view := _race_classification_view()
	if not bool(view.get("ready", false)):
		return {}
	for row_variant: Variant in view.get("rows", []):
		if row_variant is Dictionary and bool((row_variant as Dictionary).get("is_player", false)):
			var row: Dictionary = (row_variant as Dictionary).duplicate(true)
			row["is_multiclass"] = bool(view.get("is_multiclass", false))
			return row
	return {}


func _debrief_headline(latest_result: Dictionary, player_row: Dictionary) -> String:
	if latest_result.is_empty():
		return "NO RESULT YET"
	if bool(latest_result.get("dnf", false)) or bool(player_row.get("dnf", false)):
		return "DNF"
	# Prefer the class-aware finishing position from the race classification.
	if not player_row.is_empty() and bool(player_row.get("is_multiclass", false)):
		var class_pos := int(player_row.get("class_pos", 0))
		var class_label := str(player_row.get("car_class", "")).strip_edges()
		if class_pos > 0:
			return "P%d %s" % [class_pos, class_label] if not class_label.is_empty() else "P%d" % class_pos
	return _result_label(latest_result)


func _grid_to_finish_text(weekend: Dictionary, latest_result: Dictionary, player_row: Dictionary) -> String:
	if str(latest_result.get("session_type", "")).to_lower() != "race":
		return ""
	var grid := int(weekend.get("grid_position", weekend.get("qualifying_position", 0)))
	if grid <= 0:
		return ""
	var finish := 0
	if not player_row.is_empty():
		finish = int(player_row.get("pos", 0))
	if finish <= 0:
		finish = int(latest_result.get("player_position", 0))
	if finish <= 0:
		return "Started P%d" % grid
	var delta := grid - finish
	var movement := "held position"
	if delta > 0:
		movement = "gained %d" % delta
	elif delta < 0:
		movement = "lost %d" % absi(delta)
	return "Started P%d  →  Finished P%d  (%s)" % [grid, finish, movement]


func _result_label(latest_result: Dictionary) -> String:
	if latest_result.is_empty():
		return "NO RESULT YET"
	if bool(latest_result.get("dnf", false)):
		return "DNF"
	var position := int(latest_result.get("player_position", 0))
	return "P%d" % position if position > 0 else "CLASSIFIED"


func _result_color(latest_result: Dictionary) -> Color:
	if latest_result.is_empty():
		return Color(1, 1, 1, 0.14)
	if bool(latest_result.get("dnf", false)):
		return RED
	return Y


func _status_chip_color(status: String) -> Color:
	if status.to_lower().contains("done") or status.to_lower().contains("complete"):
		return GREEN
	if status.to_lower().contains("live"):
		return CYAN
	return Color(1, 1, 1, 0.14)


func _status_text_color(status: String) -> Color:
	return GREEN if status == "Complete" else Color.WHITE


func _debrief_text(latest_result: Dictionary, weekend: Dictionary) -> String:
	if latest_result.is_empty():
		return "No session has been committed yet. Once AMS2 completes a weekend session, the result, points, and prize money will surface here automatically."
	if bool(latest_result.get("dnf", false)):
		return "The weekend ended in a non-finish. The result has already fed back into the career state, so this is the moment to steady the programme, protect morale, and prepare a cleaner next outing."
	return "The %s session finished with %s at %s. The outcome has already updated championship standing, team momentum, and cash flow, so this debrief is your management readout rather than a detached result screen." % [
		str(latest_result.get("session_type", "weekend")).capitalize(),
		_result_label(latest_result),
		str(weekend.get("track_name", "the circuit"))
	]


func _on_back_pressed() -> void:
	ScreenTransition.fade_to_scene(SERIES_SCENE)


func _on_service_car_pressed() -> void:
	ScreenTransition.fade_to_scene(GARAGE_SCENE)


func _fmt_service_cost(amount: float) -> String:
	var v := int(round(amount))
	if v >= 1_000_000:
		return "$%.1fM" % (float(v) / 1_000_000.0)
	if v >= 1_000:
		return "$%dK" % int(round(float(v) / 1000.0))
	return "$%d" % v


func _on_telemetry_result_applied(result: Dictionary) -> void:
	action_feedback = "Telemetry synced automatically: %s result applied." % str(result.get("session_type", "weekend")).capitalize()
	_refresh_telemetry_snapshot(true)


func _on_telemetry_ingest_error(message: String) -> void:
	action_feedback = message
	_refresh_telemetry_snapshot(true)


func _on_native_telemetry_status_changed(_status: Dictionary) -> void:
	_refresh_telemetry_snapshot(false)


func _on_native_telemetry_error(message: String) -> void:
	action_feedback = message
	_refresh_telemetry_snapshot(true)
