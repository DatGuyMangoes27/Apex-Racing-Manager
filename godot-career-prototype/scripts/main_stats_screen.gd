extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const RACE_CAR_TEXTURE = preload("res://assets/images/figma-hq/race-car.png")
const CAR_GROUND_RING_TEXTURE = preload("res://assets/images/figma-hq/car-ground-ring.svg")
const FEATURE_BG_TEXTURE = preload("res://assets/images/figma-hq/feature-bg-new.png")
const DRIVER_AVATAR_TEXTURE = preload("res://assets/images/figma-hq/driver-avatar.png")
const MARKET_STAT_SEGMENT_FILL_PATH := "res://assets/images/figma-hq/market-stat-segment-fill.svg"
const MARKET_STAT_SEGMENT_OUTLINE_PATH := "res://assets/images/figma-hq/market-stat-segment-outline.svg"
const MATERIAL_ICON_DIR := "res://assets/images/material-icons"
const OPEN_IN_NEW_ICON_PATH := MATERIAL_ICON_DIR + "/open_in_new.png"
const ARROW_DOWNWARD_ICON_PATH := MATERIAL_ICON_DIR + "/arrow_downward.png"
const HANDSHAKE_ICON_PATH := MATERIAL_ICON_DIR + "/handshake.png"
const MOOD_BAD_ICON_PATH := MATERIAL_ICON_DIR + "/mood_bad.png"
const WARNING_AMBER_ICON_PATH := MATERIAL_ICON_DIR + "/warning_amber.png"
const PARTNER_PORTRAIT_DIR := "res://assets/images/generated/partners"
const MAIL_SCENE_PATH := "res://scenes/mail_screen.tscn"
const MARKETPLACE_SCENE_PATH := "res://scenes/marketplace_screen.tscn"
const SERIES_SCENE_PATH := "res://scenes/series_entry_screen.tscn"
const RACE_DAY_SCENE_PATH := "res://scenes/race_day_screen.tscn"

const DW := 3840.0
const DH := 2160.0

const LEFT_POS := Vector2(198.0, 187.0)
const LEFT_SIZE := Vector2(1112.0, 1786.0)
const LC_SOURCE_W := 717.3300170898438
const LC_SOURCE_H := 1152.0
const LC_SX := LEFT_SIZE.x / LC_SOURCE_W
const LC_SY := LEFT_SIZE.y / LC_SOURCE_H
const CT_POS := Vector2(1362.0, 187.0)
const CT_SIZE := Vector2(1112.0, 848.6)
const CB_POS := Vector2(1345.0, 1124.4)
const CB_SIZE := Vector2(1120.5, 848.6)
const RT_POS := Vector2(2525.0, 187.0)
const RT_SIZE := Vector2(1112.0, 848.6)
const RB_POS := Vector2(2525.0, 1124.4)
const RB_SIZE := Vector2(1112.0, 848.6)

const CARD_BG := Color(0, 0, 0, 0.38)
const Y := Color("F7EB53")
const BORDER_70 := Color(0.968627, 0.921569, 0.32549, 0.7)
const BORDER_SOLID := Color("F7EB53")
const MENU_RADIUS := 4
const HOME_METER_SEGMENT_PITCH_RATIO := 12.0 / 20.5
const HOME_METER_MARKER_OFFSET_RATIO := 7.0 / 20.5
const HOME_METER_SEGMENT_ASPECT_RATIO := 20.5 / 16.0
const CYAN := Color("00FFF7")
const TL := Color("D5D2D2")
const TM := Color("999999")
const TE := Color("C0BEBF")
const TS := Color("C9C6C7")
const RED := Color("C93C56")
const TEAL := Color("0BA6A6")
const DARK := Color("111318")
const GREY := Color("8C8E91")
const BODY_GREY := Color("B9B7B8")
const SOFT_GREY := Color("A6A7A8")

var portrait_texture_cache := {}
var material_icon_texture_cache := {}
var svg_texture_cache := {}
var driver_avatar_mask_material: ShaderMaterial
var icon_tint_shader: Shader
var overview_facilities_open := true
var overview_car_dev_open := true
var overview_standings_scroll := 0
var overview_wip_scroll := 0
var _rebuild_queued := false


func _ready() -> void:
	AudioManager.play_menu_music()
	PrototypeState.save_game()
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

	var frame := Control.new()
	frame.position = off
	frame.size = Vector2(DW, DH)
	frame.scale = Vector2(sc, sc)
	add_child(frame)

	frame.add_child(_build_top_bar())
	var overview_card := _build_left_card()
	frame.add_child(overview_card)
	var drivers_card := _build_center_top_card()
	frame.add_child(drivers_card)
	var programme_card := _build_center_bottom_card()
	frame.add_child(programme_card)
	var mentality_card := _build_right_top_card()
	frame.add_child(mentality_card)
	var events_card := _build_right_bottom_card()
	frame.add_child(events_card)
	var nav := _build_bottom_nav()
	frame.add_child(nav)
	_register_tutorial(overview_card, drivers_card, programme_card, mentality_card, events_card, nav)


func _register_tutorial(overview: Control, drivers: Control, programme: Control, mentality: Control, events: Control, nav: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": overview,
			"title": "Team Overview",
			"body": "Your headquarters dashboard. The meters track your team's core ratings, the standings table shows where you sit in the championship, and Work In Progress lists what is still being built up.",
			"affects": "Every department rating here feeds your on-track performance.",
		},
		{
			"target": drivers,
			"title": "Driver Lineup",
			"body": "Your race seats. Until you sign a driver you race as the owner yourself, so your personal record builds in this slot. Reserve seats fill in as you expand.",
			"affects": "Driver skill directly changes race pace and results.",
		},
		{
			"target": programme,
			"title": "Current Race Programme",
			"body": "The series you are entered in and your next race weekend. Once you buy a car and enter a championship, this becomes your live programme card.",
			"affects": "Drives your calendar, prize money, and weekend prep.",
		},
		{
			"target": mentality,
			"title": "Team Mentality",
			"body": "A read on team morale and the pressure stacking up on the operation. Strong results ease it; missed expectations build it.",
			"affects": "Influences staff confidence and board patience.",
		},
		{
			"target": events,
			"title": "Upcoming Events",
			"body": "Scheduled team activity at a glance - races, deadlines, and actions coming up. Empty until you start a programme.",
			"affects": "Tells you what needs attention next.",
		},
		{
			"target": nav,
			"title": "Navigation & Continue",
			"body": "Jump to any screen from the bar at the bottom. The Continue button on the right advances time to the next meaningful moment - and warns you when something needs attention first.",
			"affects": "Continue is how you move the season forward.",
		},
	]
	director.report_screen_ready("home", steps, self)


# ── Top Bar ──────────────────────────────────────────────────────────────────

func _build_top_bar() -> Control:
	var bar := PrototypeTopBar.new()
	bar.active_section_id = "home"
	bar.size = Vector2(DW, 127)
	return bar


# ── Left Card: Overview ──────────────────────────────────────────────────────

func _build_left_card() -> Control:
	var card := _card(LEFT_POS, LEFT_SIZE, BORDER_70)
	var b := _body(card)

	var header := _txt("MERCER RACING", "caps", _ovf(24), Color.WHITE)
	header.position = _ovp(40.0, 29.0)
	header.size = _ovs(426.0, 28.0)
	b.add_child(header)

	var big := _txt("OVERVIEW", "caps", _ovf(48), Y)
	big.position = _ovp(34.0, 50.0)
	big.size = _ovs(500.0, 64.0)
	b.add_child(big)

	_build_bar_chart(b)
	_build_standings(b)
	_build_work_in_progress(b)

	return card


func _build_bar_chart(parent: Control) -> void:
	var origin := _ovp(38.0, 127.0)
	var metrics: Array = _overview_rating_metrics()

	for i in range(metrics.size()):
		var metric: Dictionary = metrics[i] as Dictionary
		parent.add_child(_build_overview_metric_meter(metric, origin + _ovp(0.0, float(i) * 40.0)))


func _build_overview_metric_meter(metric: Dictionary, pos: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = _ovs(629.0, 34.0)

	var label := _txt(str(metric.get("label", "")).to_upper(), "bold", _ovf(16), Color.WHITE)
	label.position = _ovp(0.0, 4.0)
	label.size = _ovs(124.0, 20.0)
	wrap.add_child(label)

	var state_label := _txt(str(metric.get("state", "Building")).to_upper(), "body", _ovf(13), metric.get("color", Y))
	state_label.position = _ovp(124.0, 5.0)
	state_label.size = _ovs(100.0, 18.0)
	wrap.add_child(state_label)

	var fill_ratio: float = clampf(float(metric.get("value", 0.0)) / 100.0, 0.0, 1.0)
	var avg_ratio: float = clampf(float(metric.get("average", 0.0)) / 100.0, 0.0, 1.0)
	wrap.add_child(_build_overview_segment_meter(Vector2(_ovp(232.0, 0.0).x, _ovp(0.0, 2.0).y), fill_ratio, avg_ratio, metric.get("color", Y)))

	var value_label := _txt("%d" % int(round(float(metric.get("value", 0.0)))), "bold", _ovf(16), metric.get("color", Y))
	value_label.position = _ovp(586.0, 4.0)
	value_label.size = _ovs(42.0, 20.0)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(value_label)

	return wrap


func _build_overview_segment_meter(pos: Vector2, ratio: float, avg_ratio: float, fill_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = _ovs(330.0, 28.0)

	var segment_count := 25
	var segment_height := _ovs(20.5, 16.0).y
	var layout := _home_meter_segment_layout(wrap.size.x, segment_count, segment_height)
	var pitch: float = float(layout.get("pitch", 0.0))
	var segment_size: Vector2 = layout.get("segment_size", Vector2.ZERO)
	for index in range(segment_count):
		var progress := float(index + 1) / float(segment_count)
		var segment := _build_overview_stat_segment(
			Vector2(float(index) * pitch, 0.0),
			segment_size,
			progress <= ratio,
			fill_color
		)
		wrap.add_child(segment)

	var marker_x := clampf(avg_ratio, 0.0, 1.0) * (float(segment_count - 1) * pitch + segment_size.x)
	var marker := _triangle_left(
		Vector2(marker_x + segment_size.x * HOME_METER_MARKER_OFFSET_RATIO, segment_size.y + _ovp(0.0, 2.0).y),
		float(_ovf(8.0)),
		GREY
	)
	wrap.add_child(marker)

	return wrap


func _build_overview_stat_segment(pos: Vector2, seg_size: Vector2, is_filled: bool, fill_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(seg_size.x, seg_size.y + _ovp(0.0, 5.0).y)
	var fill_texture := _load_svg_texture(MARKET_STAT_SEGMENT_FILL_PATH, 1.0)
	var outline_texture := _load_svg_texture(MARKET_STAT_SEGMENT_OUTLINE_PATH, 1.0)

	if is_filled and fill_texture != null:
		var shadow := TextureRect.new()
		shadow.texture = fill_texture
		shadow.position = Vector2(0.0, _ovp(0.0, 5.0).y)
		shadow.size = seg_size
		shadow.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		shadow.stretch_mode = TextureRect.STRETCH_SCALE
		shadow.modulate = Color(fill_color.r, fill_color.g, fill_color.b, 0.35)
		wrap.add_child(shadow)

	if is_filled and fill_texture != null:
		var fill := TextureRect.new()
		fill.texture = fill_texture
		fill.position = Vector2.ZERO
		fill.size = seg_size
		fill.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		fill.stretch_mode = TextureRect.STRETCH_SCALE
		fill.modulate = fill_color
		wrap.add_child(fill)

	if outline_texture != null:
		var outline := TextureRect.new()
		outline.texture = outline_texture
		outline.position = Vector2.ZERO
		outline.size = seg_size
		outline.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		outline.stretch_mode = TextureRect.STRETCH_SCALE
		wrap.add_child(outline)

	return wrap


func _build_standings(parent: Control) -> void:
	var origin := _ovp(37.0, 418.0)
	var standings := _overview_standings_state()

	var hdr := _txt("STANDINGS", "bold", _ovf(20), Color.WHITE)
	hdr.position = origin + _ovp(1.0, 0.0)
	hdr.size = _ovs(258.0, 31.0)
	parent.add_child(hdr)

	if not bool(standings["entered"]):
		_build_standings_empty_state(parent, origin, "No championship entered yet", "Enter a series to start tracking your driver standings.")
		return

	var rows: Array = standings["rows"]
	if rows.is_empty():
		_build_standings_empty_state(parent, origin, "Season standings not available yet", "Standings will appear here once your championship grid is populated.")
		return

	var col_pos := _txt("Pos", "body", _ovf(17), Y)
	col_pos.position = origin + _ovp(4.0, 37.0)
	col_pos.size = _ovs(30.0, 21.0)
	parent.add_child(col_pos)

	var col_drv := _txt("Driver", "body", _ovf(17), Y)
	col_drv.position = origin + _ovp(114.0, 37.0)
	col_drv.size = _ovs(48.0, 21.0)
	parent.add_child(col_drv)

	var col_team := _txt("Team", "body", _ovf(17), Y)
	col_team.position = origin + _ovp(313.0, 37.0)
	col_team.size = _ovs(44.0, 21.0)
	parent.add_child(col_team)

	var col_pts := _txt("PTS", "body", _ovf(17), Y)
	col_pts.position = origin + _ovp(571.0, 36.0)
	col_pts.size = _ovs(33.0, 21.0)
	parent.add_child(col_pts)
	var row_y_slots: Array = [62.0, 91.0, 119.0, 148.0, 176.0, 204.0, 233.0, 261.0, 290.0, 318.0]
	var total_rows: int = rows.size()
	var visible_rows: int = min(10, total_rows)
	var max_scroll: int = max(0, total_rows - visible_rows)
	overview_standings_scroll = clamp(overview_standings_scroll, 0, max_scroll)

	# Only show the per-row class tag when the field is genuinely multiclass.
	# For single-make/one-class series it is just the championship name repeated
	# on every row, which overlaps the points column and adds no information.
	var distinct_classes: Dictionary = {}
	for row_variant: Variant in rows:
		if row_variant is Dictionary:
			var label := str((row_variant as Dictionary).get("car_class_label", "")).strip_edges()
			if not label.is_empty():
				distinct_classes[label] = true
	var show_class_badge: bool = distinct_classes.size() > 1

	for visible_index in range(visible_rows):
		var row: Dictionary = rows[overview_standings_scroll + visible_index]
		var y: float = float(row_y_slots[visible_index])

		var pos_lbl := _txt(str(row.get("class_pos", row.get("pos", visible_index + 1))), "body", _ovf(15), Color.WHITE)
		pos_lbl.position = origin + _ovp(0.0, y)
		pos_lbl.size = _ovs(21.0, 14.0)
		parent.add_child(pos_lbl)

		var portrait_path := str(row.get("driver_portrait_path", ""))
		var avatar := _build_standings_avatar(portrait_path, origin + _ovp(61.0, y - 6.0), _ovs(28.0, 28.0))
		if avatar != null:
			parent.add_child(avatar)
		else:
			parent.add_child(_flag(str(row["flag"]), origin + _ovp(71.0, y)))

		var driver_text := str(row["driver"])
		if bool(row.get("is_player", false)) and str(row.get("driver_profile_id", "")).strip_edges().is_empty():
			var owner_name := _founder_display_name()
			if not owner_name.is_empty():
				driver_text = owner_name
		var drv := _txt(driver_text, "body", _ovf(15), Color.WHITE)
		drv.position = origin + _ovp(113.0, y)
		drv.size = _ovs(128.0, 16.0)
		drv.clip_text = true
		drv.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		parent.add_child(drv)

		var team := _txt(str(row["team"]), "body", _ovf(15), Color.WHITE)
		team.position = origin + _ovp(312.0, y)
		team.size = _ovs(220.0, 16.0)
		parent.add_child(team)

		if show_class_badge and str(row.get("car_class_label", "")).strip_edges() != "":
			var class_badge := _txt(str(row.get("car_class_label", "")), "body", _ovf(10), Color("BCBCBD"))
			class_badge.position = origin + _ovp(535.0, y)
			class_badge.size = _ovs(44.0, 14.0)
			class_badge.clip_text = true
			class_badge.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
			parent.add_child(class_badge)

		var pts := _txt(str(row["pts"]), "body", _ovf(15), Y)
		pts.position = origin + _ovp(584.0, y)
		pts.size = _ovs(11.0, 13.0)
		parent.add_child(pts)

	var scroll_track := _bordered_rect(origin + _ovp(649.06640625, 41.83203125), _ovs(9.003707151117851, 289.6834384960712), Y, Color(0, 0, 0, 0))
	parent.add_child(scroll_track)
	var track_pos := origin + _ovp(649.06640625, 41.83203125)
	var track_size := _ovs(8.901266214954376, 289.6834384960712)
	var thumb_h: float = track_size.y if total_rows <= 10 else track_size.y * (float(visible_rows) / float(total_rows))
	var thumb_y: float = track_pos.y if max_scroll == 0 else track_pos.y + (track_size.y - thumb_h) * (float(overview_standings_scroll) / float(max_scroll))
	var scroll_thumb := _rounded_rect(Vector2(track_pos.x, thumb_y), Vector2(track_size.x, thumb_h), Y)
	parent.add_child(scroll_thumb)
	_add_standings_scroll_capture(parent, origin, total_rows)


func _overview_rating_metrics() -> Array:
	var player_strengths: Dictionary = _player_outfit_strengths()
	var benchmark_grid: Array = PrototypeState.get_overview_benchmark_grid()
	return [
		_overview_metric("Car", float(player_strengths["Car"]), benchmark_grid),
		_overview_metric("Drivers", float(player_strengths["Drivers"]), benchmark_grid),
		_overview_metric("Facilities", float(player_strengths["Facilities"]), benchmark_grid),
		_overview_metric("Staff", float(player_strengths["Staff"]), benchmark_grid),
		_overview_metric("Sponsors", float(player_strengths["Sponsors"]), benchmark_grid),
		_overview_metric("Finances", float(player_strengths["Finances"]), benchmark_grid),
	]


func _player_outfit_strengths() -> Dictionary:
	var player_metrics: Dictionary = PrototypeState.get_overview_player_metrics()
	return {
		"Car": _pillar_value_from_team_metrics("Car", player_metrics),
		"Drivers": _pillar_value_from_team_metrics("Drivers", player_metrics),
		"Facilities": _pillar_value_from_team_metrics("Facilities", player_metrics),
		"Staff": _pillar_value_from_team_metrics("Staff", player_metrics),
		"Sponsors": _pillar_value_from_team_metrics("Sponsors", player_metrics),
		"Finances": _pillar_value_from_team_metrics("Finances", player_metrics),
	}


func _overview_metric(label: String, value: float, benchmark_grid: Array) -> Dictionary:
	var clamped_value: float = clamp(value, 18.0, 100.0)
	var field_values: Array = []
	for team_variant in benchmark_grid:
		if typeof(team_variant) != TYPE_DICTIONARY:
			continue
		var team: Dictionary = team_variant
		var metrics_variant: Variant = team.get("metrics", {})
		if typeof(metrics_variant) != TYPE_DICTIONARY:
			continue
		var metrics: Dictionary = metrics_variant
		field_values.append(_pillar_value_from_team_metrics(label, metrics))
	if field_values.is_empty():
		field_values.append(50.0)
	var total: float = 0.0
	var best_value: float = clamped_value
	for field_value_variant in field_values:
		var field_value: float = float(field_value_variant)
		total += field_value
		best_value = max(best_value, field_value)
	var clamped_average: float = clamp(total / float(field_values.size()), 18.0, 100.0)
	var clamped_best: float = clamp(best_value, 18.0, 100.0)
	var color := Color("FF8A80")
	var state := "Weak"
	if clamped_value >= 80.0:
		color = Color("5FC368")
		state = "Elite"
	elif clamped_value >= 70.0:
		color = Color("73CC63")
		state = "Strong"
	elif clamped_value >= 60.0:
		color = Color("F7ED8B")
		state = "Competitive"
	elif clamped_value >= 50.0:
		color = Color("FFBE6A")
		state = "Building"
	return {
		"label": label,
		"value": clamped_value,
		"average": clamped_average,
		"best": clamped_best,
		"color": color,
		"state": state,
	}


func _truncate_copy(text: String, limit: int) -> String:
	var trimmed := text.strip_edges()
	if trimmed.length() <= limit:
		return trimmed
	return trimmed.substr(0, max(limit - 1, 0)).strip_edges() + "…"


func _pillar_value_from_team_metrics(label: String, team_metrics: Dictionary) -> float:
	match label:
		"Car":
			return _score_car_from_metrics(team_metrics)
		"Drivers":
			return _score_drivers_from_metrics(team_metrics)
		"Facilities":
			return _score_facilities_from_metrics(team_metrics)
		"Staff":
			return _score_staff_from_metrics(team_metrics)
		"Sponsors":
			return _score_sponsors_from_metrics(team_metrics)
		"Finances":
			return _score_finances_from_metrics(team_metrics)
	return 18.0


func _score_car_from_metrics(team_metrics: Dictionary) -> float:
	var car_metrics: Dictionary = team_metrics.get("car", {})
	var pace_score: float = clamp(float(car_metrics.get("pace_rating", 0.0)), 0.0, 100.0)
	var results_score: float = _results_score_from_metrics(car_metrics, 8.0, 16.0, 240.0, 24.0, 24.0)
	var development_score: float = clamp(float(car_metrics.get("development_rating", 0.0)), 0.0, 100.0)
	return clamp(pace_score * 0.45 + results_score * 0.35 + development_score * 0.20, 18.0, 100.0)


func _score_drivers_from_metrics(team_metrics: Dictionary) -> float:
	var driver_metrics: Dictionary = team_metrics.get("drivers", {})
	var quality_score: float = clamp(float(driver_metrics.get("lead_driver_rating", 0.0)) * 0.6 + float(driver_metrics.get("support_driver_rating", 0.0)) * 0.4, 0.0, 100.0)
	var results_score: float = _results_score_from_metrics(driver_metrics, 8.0, 16.0, 240.0, 24.0, 24.0)
	return clamp(quality_score * 0.55 + results_score * 0.45, 18.0, 100.0)


func _score_facilities_from_metrics(team_metrics: Dictionary) -> float:
	var facilities_metrics: Dictionary = team_metrics.get("facilities", {})
	var quality_score: float = clamp(float(facilities_metrics.get("quality", 18.0)), 0.0, 100.0)
	var capacity_score: float = clamp(float(facilities_metrics.get("capacity", 18.0)), 0.0, 100.0)
	var capability_score: float = clamp(float(facilities_metrics.get("capability", 18.0)), 0.0, 100.0)
	return clamp(quality_score * 0.45 + capacity_score * 0.30 + capability_score * 0.25, 18.0, 100.0)


func _score_staff_from_metrics(team_metrics: Dictionary) -> float:
	var staff_metrics: Dictionary = team_metrics.get("staff", {})
	var target_headcount: float = max(1.0, float(staff_metrics.get("target_headcount", 24.0)))
	var headcount_ratio_score: float = clamp((float(staff_metrics.get("headcount", 0.0)) / target_headcount) * 100.0, 0.0, 100.0)
	var average_rating_score: float = clamp(float(staff_metrics.get("average_rating", 18.0)), 0.0, 100.0)
	var leadership_score: float = clamp(float(staff_metrics.get("leadership_rating", 18.0)), 0.0, 100.0)
	return clamp(headcount_ratio_score * 0.30 + average_rating_score * 0.45 + leadership_score * 0.25, 18.0, 100.0)


func _score_sponsors_from_metrics(team_metrics: Dictionary) -> float:
	var sponsor_metrics: Dictionary = team_metrics.get("sponsors", {})
	var income_score: float = _scale_to_range(float(sponsor_metrics.get("weekly_income", 0.0)), 0.0, 150000.0, 0.0, 100.0)
	var level_score: float = _scale_to_range(float(sponsor_metrics.get("portfolio_level", 0.0)), 0.0, 5.0, 0.0, 100.0)
	var quality_score: float = clamp(float(sponsor_metrics.get("portfolio_quality", 18.0)), 0.0, 100.0)
	return clamp(income_score * 0.45 + level_score * 0.25 + quality_score * 0.30, 18.0, 100.0)


func _score_finances_from_metrics(team_metrics: Dictionary) -> float:
	var finance_metrics: Dictionary = team_metrics.get("finances", {})
	var cash_score: float = _scale_to_range(float(finance_metrics.get("cash_reserve", 0.0)), 0.0, 4000000.0, 0.0, 100.0)
	var burn_score: float = _scale_to_range(float(finance_metrics.get("weekly_burn", 0.0)), 10000.0, 100000.0, 100.0, 0.0)
	var runway_score: float = _scale_to_range(float(finance_metrics.get("runway_weeks", 0.0)), 0.0, 24.0, 0.0, 100.0)
	var debt_score: float = _scale_to_range(float(finance_metrics.get("debt", 0.0)), 0.0, 500000.0, 100.0, 0.0)
	return clamp(cash_score * 0.35 + burn_score * 0.20 + runway_score * 0.30 + debt_score * 0.15, 18.0, 100.0)


func _results_score_from_metrics(metrics: Dictionary, max_wins: float, max_podiums: float, max_points: float, max_top10: float, max_starts: float) -> float:
	var wins_score: float = _scale_to_range(float(metrics.get("wins", 0.0)), 0.0, max_wins, 0.0, 100.0)
	var podium_score: float = _scale_to_range(float(metrics.get("podiums", 0.0)), 0.0, max_podiums, 0.0, 100.0)
	var points_score: float = _scale_to_range(float(metrics.get("points", 0.0)), 0.0, max_points, 0.0, 100.0)
	var top10_score: float = _scale_to_range(float(metrics.get("top10_finishes", 0.0)), 0.0, max_top10, 0.0, 100.0)
	var starts_score: float = _scale_to_range(float(metrics.get("starts", 0.0)), 0.0, max_starts, 0.0, 100.0)
	return wins_score * 0.30 + podium_score * 0.22 + points_score * 0.28 + top10_score * 0.15 + starts_score * 0.05


func _scale_to_range(value: float, input_min: float, input_max: float, output_min: float, output_max: float) -> float:
	if is_equal_approx(input_min, input_max):
		return output_min
	var t: float = clamp((value - input_min) / (input_max - input_min), 0.0, 1.0)
	return lerp(output_min, output_max, t)


func _driver_focus_score(focus: String) -> float:
	match focus:
		"Race craft":
			return 80.0
		"Technical feedback":
			return 70.0
		"Qualifying pace":
			return 74.0
		"Consistency":
			return 72.0
	return 66.0


func _second_driver_score(state: String) -> float:
	match state:
		"Second driver signed":
			return 82.0
		"Second driver shortlist prepared":
			return 66.0
		"Second seat fully open":
			return 48.0
		"Not needed at launch":
			return 44.0
	return 52.0


func _headquarters_location_score(location_name: String) -> float:
	var location_lower: String = location_name.to_lower()
	if location_lower.contains("silverstone") or location_lower.contains("cologne") or location_lower.contains("suzuka") or location_lower.contains("graz"):
		return 78.0
	if location_lower.contains("eindhoven") or location_lower.contains("barcelona") or location_lower.contains("le mans"):
		return 70.0
	if location_lower.contains("portimao") or location_lower.contains("sao paulo"):
		return 62.0
	if location_lower.contains("modena") or location_lower.contains("indianapolis"):
		return 68.0
	return 64.0


func _public_persona_score(persona: String) -> float:
	match persona:
		"Corporate face":
			return 78.0
		"Paddock charmer":
			return 74.0
		"Underdog voice":
			return 62.0
		"Reserved professional":
			return 56.0
	return 60.0


func _keyword_score(text: String, mapping: Dictionary, fallback: float) -> float:
	var normalized: String = text.to_lower()
	for key_variant in mapping.keys():
		var key := str(key_variant)
		if normalized.contains(key):
			return float(mapping[key_variant])
	return fallback


func _parse_money_label(text: String) -> float:
	var normalized: String = text.strip_edges().to_upper().replace("$", "").replace(",", "")
	var multiplier: float = 1.0
	if normalized.ends_with("M"):
		multiplier = 1000000.0
		normalized = normalized.left(normalized.length() - 1)
	elif normalized.ends_with("K"):
		multiplier = 1000.0
		normalized = normalized.left(normalized.length() - 1)
	return normalized.to_float() * multiplier


func _parse_numeric_label(text: String) -> float:
	var filtered: String = ""
	for ch in text:
		if (ch >= "0" and ch <= "9") or ch == ".":
			filtered += ch
	return filtered.to_float() if not filtered.is_empty() else 0.0


func _overview_standings_state() -> Dictionary:
	if not PrototypeState.has_championship_entry():
		overview_standings_scroll = 0
		return {"entered": false, "rows": []}
	var rows: Array = PrototypeState.get_championship_standings()
	return {"entered": true, "rows": rows}


func _build_standings_empty_state(parent: Control, origin: Vector2, title_text: String, body_text: String) -> void:
	var empty_title := _txt(title_text, "bold", _ovf(18), Color.WHITE)
	empty_title.position = origin + _ovp(0.0, 114.0)
	empty_title.size = _ovs(520.0, 24.0)
	parent.add_child(empty_title)

	var empty_body := _txt(body_text, "body", _ovf(14), SOFT_GREY)
	empty_body.position = origin + _ovp(0.0, 148.0)
	empty_body.size = _ovs(560.0, 44.0)
	empty_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(empty_body)


func _add_standings_scroll_capture(parent: Control, origin: Vector2, total_rows: int) -> void:
	if total_rows <= 10:
		return
	var capture: Control = Control.new()
	capture.position = origin + _ovp(0.0, 56.0)
	capture.size = _ovs(612.0, 273.0)
	capture.mouse_filter = Control.MOUSE_FILTER_STOP
	capture.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton and event.pressed:
			var mouse_event: InputEventMouseButton = event as InputEventMouseButton
			var max_scroll: int = max(0, total_rows - 10)
			if mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN and overview_standings_scroll < max_scroll:
				overview_standings_scroll += 1
				_request_rebuild()
			elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP and overview_standings_scroll > 0:
				overview_standings_scroll -= 1
				_request_rebuild()
	)
	parent.add_child(capture)


func _build_work_in_progress(parent: Control) -> void:
	var origin := _ovp(31.0, 784.0)
	var entries: Array = _overview_wip_entries()
	var project_entry_count: int = _count_wip_project_entries(entries)
	var visible_entries: int = min(7, entries.size())
	var max_scroll: int = max(0, entries.size() - visible_entries)
	overview_wip_scroll = clamp(overview_wip_scroll, 0, max_scroll)

	var wip_hdr := _txt("WORK IN PROGRESS", "bold", _ovf(20), Color.WHITE)
	wip_hdr.position = origin + _ovp(0.0, 0.0)
	wip_hdr.size = _ovs(452.0, 31.0)
	parent.add_child(wip_hdr)

	var y_cursor: float = 51.0
	for entry_index in range(overview_wip_scroll, min(entries.size(), overview_wip_scroll + visible_entries)):
		var entry: Dictionary = entries[entry_index]
		var kind: String = str(entry["kind"])
		if kind == "section":
			_build_wip_section_header(parent, origin, y_cursor, str(entry["title"]), bool(entry["expanded"]), str(entry["section_key"]))
			y_cursor += 24.0
		elif kind == "project":
			_build_progress_row(parent, origin, y_cursor, entry["project"])
			y_cursor += 48.1669921875
		elif kind == "empty":
			_build_wip_empty_state(parent, origin, y_cursor, str(entry["title"]), str(entry["body"]))
			y_cursor += 46.0

	if project_entry_count > 0:
		var wip_scroll_track := _bordered_rect(origin + _ovp(650.84375, 51.0), _ovs(9.207683345754049, 289.68345174722526), Y, Color(0, 0, 0, 0))
		parent.add_child(wip_scroll_track)
		var track_pos: Vector2 = origin + _ovp(650.84375, 51.0)
		var track_size: Vector2 = _ovs(9.102921603065624, 289.68345174722526)
		var thumb_h: float = track_size.y if entries.size() <= visible_entries else track_size.y * (float(visible_entries) / float(entries.size()))
		var thumb_y: float = track_pos.y if max_scroll == 0 else track_pos.y + (track_size.y - thumb_h) * (float(overview_wip_scroll) / float(max_scroll))
		var wip_scroll_thumb := _rounded_rect(Vector2(track_pos.x, thumb_y), Vector2(track_size.x, thumb_h), Y)
		parent.add_child(wip_scroll_thumb)
		_add_wip_scroll_capture(parent, origin, entries.size(), visible_entries)


func _build_progress_row(parent: Control, origin: Vector2, y: float, project: Dictionary) -> void:
	var fill_x: float = 0.0
	var outline_x: float = 0.08203125
	var progress: float = clamp(float(project.get("progress", 0.0)), 0.0, 1.0)
	var fill_w: float = 341.0 * progress
	var time_x: float = 388.0
	var action_x: float = 467.0
	var item_name: String = str(project.get("name", "Project"))
	var time_text: String = str(project.get("time_label", "TBD"))
	var action_text: String = str(project.get("target_label", "Open"))

	var fill := _right_rounded_rect(origin + _ovp(fill_x, y - 0.1669921875), _ovs(fill_w, 34.83090591430664), Y)
	parent.add_child(fill)

	var outline := _bordered_rect(origin + _ovp(outline_x, y), _ovs(341.0, 35.0), Y, Color(0, 0, 0, 0))
	parent.add_child(outline)

	var name_lbl := _txt(item_name, "body", _ovf(13), DARK)
	name_lbl.position = origin + _ovp(fill_x + 20.640625, y + 3.703125)
	name_lbl.size = _ovs(155.4490509033203, 24.510639190673828)
	parent.add_child(name_lbl)

	var time_bg_style := StyleBoxFlat.new()
	time_bg_style.bg_color = DARK
	time_bg_style.set_corner_radius_all(0)
	var time_panel := PanelContainer.new()
	time_panel.position = origin + _ovp(time_x, y)
	time_panel.size = _ovs(79.0, 34.0)
	time_panel.add_theme_stylebox_override("panel", time_bg_style)
	parent.add_child(time_panel)

	var time_lbl := _txt(time_text, "body", _ovf(13), SOFT_GREY)
	time_lbl.position = origin + _ovp(time_x + 10.0, y + 9.0)
	time_lbl.size = _ovs(60.0, 16.0)
	parent.add_child(time_lbl)

	var action_s := StyleBoxFlat.new()
	action_s.bg_color = Y
	action_s.set_corner_radius_all(0)
	var action_bg := PanelContainer.new()
	action_bg.position = origin + _ovp(action_x, y)
	action_bg.size = _ovs(148.0, 34.0)
	action_bg.add_theme_stylebox_override("panel", action_s)
	parent.add_child(action_bg)
	var action_lbl := _txt(action_text, "body", _ovf(13), DARK)
	action_lbl.position = origin + _ovp(action_x + 15.7421875, y + 3.703125)
	action_lbl.size = _ovs(119.9731216430664, 24.510639190673828)
	parent.add_child(action_lbl)

	var project_data: Dictionary = project.duplicate(true)
	_add_click_button(parent, origin + _ovp(action_x, y), _ovs(148.0, 34.0), func():
		_navigate_to_wip_target(project_data)
	)


func _overview_wip_entries() -> Array:
	var entries: Array = []
	entries.append({"kind": "section", "title": "Facilities", "expanded": overview_facilities_open, "section_key": "facilities"})
	if overview_facilities_open:
		var facility_projects: Array = PrototypeState.get_facility_projects()
		if facility_projects.is_empty():
			entries.append({
				"kind": "empty",
				"title": "No facilities work in progress",
				"body": "Start a facility project to track construction progress here."
			})
		else:
			for project_variant in facility_projects:
				entries.append({"kind": "project", "project": _normalized_wip_project(project_variant, "Headquarters", "facilities")})

	entries.append({"kind": "section", "title": "Car Development", "expanded": overview_car_dev_open, "section_key": "car_dev"})
	if overview_car_dev_open:
		var rd_projects: Array = PrototypeState.get_rd_projects()
		if rd_projects.is_empty():
			entries.append({
				"kind": "empty",
				"title": "No R&D projects active",
				"body": "Queue a development item to track engineering progress in this panel."
			})
		else:
			for project_variant in rd_projects:
				entries.append({"kind": "project", "project": _normalized_wip_project(project_variant, "R&D", "car_dev")})
	return entries


func _count_wip_project_entries(entries: Array) -> int:
	var count: int = 0
	for entry_variant in entries:
		if typeof(entry_variant) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = entry_variant
		if str(entry.get("kind", "")) == "project":
			count += 1
	return count


func _normalized_wip_project(project_variant: Variant, default_action: String, section_key: String) -> Dictionary:
	var project: Dictionary = project_variant if typeof(project_variant) == TYPE_DICTIONARY else {}
	return {
		"name": str(project.get("name", "Project")),
		"progress": clamp(float(project.get("progress", 0.0)), 0.0, 1.0),
		"time_label": str(project.get("time_label", "TBD")),
		"target_label": str(project.get("target_label", default_action)),
		"target_scene": str(project.get("target_scene", "")),
		"target_context": str(project.get("target_context", section_key))
	}


func _build_wip_section_header(parent: Control, origin: Vector2, y: float, title_text: String, expanded: bool, section_key: String) -> void:
	var header := _txt(title_text, "body", _ovf(16), Color.WHITE)
	header.position = origin + _ovp(1.8359375, y)
	header.size = _ovs(190.0, 24.0)
	parent.add_child(header)

	var chevron_x: float = 126.0 if section_key == "facilities" else 146.0
	var click_w: float = 150.0 if section_key == "facilities" else 180.0
	parent.add_child(_section_chevron(origin + _ovp(chevron_x, y + 7.0), float(_ovf(8)), Color.WHITE, expanded))
	_add_click_button(parent, origin + _ovp(0.0, y - 2.0), _ovs(click_w, 28.0), func():
		_toggle_wip_section(section_key)
	)


func _build_wip_empty_state(parent: Control, origin: Vector2, y: float, title_text: String, body_text: String) -> void:
	var empty_title := _txt(title_text, "body", _ovf(13), Color.WHITE)
	empty_title.position = origin + _ovp(2.0, y)
	empty_title.size = _ovs(330.0, 16.0)
	parent.add_child(empty_title)

	var empty_body := _txt(body_text, "body", _ovf(12), SOFT_GREY)
	empty_body.position = origin + _ovp(2.0, y + 15.0)
	empty_body.size = _ovs(520.0, 28.0)
	empty_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(empty_body)


func _toggle_wip_section(section_key: String) -> void:
	if section_key == "facilities":
		overview_facilities_open = not overview_facilities_open
	else:
		overview_car_dev_open = not overview_car_dev_open
	overview_wip_scroll = 0
	_request_rebuild()


func _navigate_to_wip_target(project: Dictionary) -> void:
	var target_scene: String = str(project.get("target_scene", ""))
	var target_label: String = str(project.get("target_label", "Open"))
	var target_context: String = str(project.get("target_context", ""))
	var target_name: String = str(project.get("name", "Project"))
	if not target_scene.is_empty() and ResourceLoader.exists(target_scene):
		PrototypeState.clear_pending_navigation()
		ScreenTransition.fade_to_scene(target_scene)
		return
	PrototypeState.set_pending_navigation("%s > %s" % [target_label, target_name], target_context, target_scene)
	_request_rebuild()


func _add_wip_scroll_capture(parent: Control, origin: Vector2, total_entries: int, visible_entries: int) -> void:
	if total_entries <= visible_entries:
		return
	var capture: Control = Control.new()
	capture.position = origin + _ovp(0.0, 46.0)
	capture.size = _ovs(640.0, 305.0)
	capture.mouse_filter = Control.MOUSE_FILTER_STOP
	capture.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton and event.pressed:
			var mouse_event: InputEventMouseButton = event as InputEventMouseButton
			var max_scroll: int = max(0, total_entries - visible_entries)
			if mouse_event.button_index == MOUSE_BUTTON_WHEEL_DOWN and overview_wip_scroll < max_scroll:
				overview_wip_scroll += 1
				_request_rebuild()
			elif mouse_event.button_index == MOUSE_BUTTON_WHEEL_UP and overview_wip_scroll > 0:
				overview_wip_scroll -= 1
				_request_rebuild()
	)
	parent.add_child(capture)


# ── Center Top Card: Drivers ─────────────────────────────────────────────────

func _build_center_top_card() -> Control:
	var design_size: Vector2 = Vector2(729.0, 552.0)
	var sx: float = CT_SIZE.x / design_size.x
	var sy: float = CT_SIZE.y / design_size.y
	var ss: float = min(sx, sy)

	var card := Control.new()
	card.position = CT_POS
	card.size = CT_SIZE
	card.clip_contents = true

	var bg_panel := PanelContainer.new()
	bg_panel.size = CT_SIZE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0, 0, 0, 0.38)
	bg_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	bg_panel.add_theme_stylebox_override("panel", bg_style)
	card.add_child(bg_panel)

	var border := PanelContainer.new()
	border.size = CT_SIZE
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = Y
	border_style.set_border_width_all(max(1, int(round(1.0 * ss))))
	border_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	border.add_theme_stylebox_override("panel", border_style)
	card.add_child(border)

	var title := _txt("DRIVERS", "caps", int(round(36.0 * ss)), Color.WHITE)
	title.position = Vector2(21.4 * sx, 22.1 * sy)
	title.size = Vector2(206.0 * sx, 43.0 * sy)
	card.add_child(title)

	card.add_child(_build_driver_card_action(Vector2(675.0 * sx, 30.0 * sy), ss))

	var drivers := _driver_rows()
	var row_origins := [
		Vector2(20.0, 114.0),
		Vector2(18.0, 256.0),
		Vector2(16.0, 398.0),
	]
	for i in min(drivers.size(), row_origins.size()):
		_build_driver_entry(
			card,
			Vector2(row_origins[i].x * sx, row_origins[i].y * sy),
			sx,
			sy,
			ss,
			drivers[i]
		)

	return card


func _build_driver_entry(parent: Control, pos: Vector2, sx: float, sy: float, ss: float, data: Dictionary) -> void:
	var avatar_texture: Texture2D = null
	var portrait_id := str(data.get("portrait_id", ""))
	if not portrait_id.is_empty():
		avatar_texture = _load_partner_portrait_texture(portrait_id)
	if avatar_texture == null and bool(data.get("use_fallback_avatar", false)):
		avatar_texture = DRIVER_AVATAR_TEXTURE
	parent.add_child(_build_driver_avatar(pos + Vector2(6.0 * sx, 7.0 * sy), avatar_texture, sx, sy, ss))

	var name_lbl := _txt(str(data["name"]), "body", int(round(24.0 * ss)), Color.WHITE)
	name_lbl.position = pos + Vector2(143.0 * sx, 15.0 * sy)
	name_lbl.size = Vector2(136.0 * sx, 29.0 * sy)
	parent.add_child(name_lbl)

	var stats_font := int(round(16.0 * ss))
	var stats_y := 48.0 * sy

	var wins_lbl := _txt(_driver_stat_piece(data, 0), "body", stats_font, Color.WHITE)
	wins_lbl.position = pos + Vector2(143.0 * sx, stats_y)
	wins_lbl.size = Vector2(60.0 * sx, 20.2 * sy)
	parent.add_child(wins_lbl)

	var divider_a := ColorRect.new()
	divider_a.position = pos + Vector2(200.84 * sx, stats_y)
	divider_a.size = Vector2(max(1.0, 1.388 * sx), 18.046 * sy)
	divider_a.color = Color(1, 1, 1, 0.32)
	parent.add_child(divider_a)

	var starts_lbl := _txt(_driver_stat_piece(data, 1), "body", stats_font, Color.WHITE)
	starts_lbl.position = pos + Vector2(210.328 * sx, stats_y)
	starts_lbl.size = Vector2(80.0 * sx, 20.2 * sy)
	parent.add_child(starts_lbl)

	var divider_b := ColorRect.new()
	divider_b.position = pos + Vector2(290.84 * sx, stats_y)
	divider_b.size = Vector2(max(1.0, 1.388 * sx), 18.046 * sy)
	divider_b.color = Color(1, 1, 1, 0.32)
	parent.add_child(divider_b)

	var podiums_lbl := _txt(_driver_stat_piece(data, 2), "body", stats_font, Color.WHITE)
	podiums_lbl.position = pos + Vector2(300.328 * sx, stats_y)
	podiums_lbl.size = Vector2(96.0 * sx, 20.2 * sy)
	parent.add_child(podiums_lbl)

	var role_lbl := _txt(str(data["role"]), "bold", int(round(20.0 * ss)), Y)
	role_lbl.position = pos + Vector2(143.0 * sx, 77.0 * sy)
	role_lbl.size = Vector2(80.0 * sx, 24.0 * sy)
	parent.add_child(role_lbl)

	var rating := _txt(str(data.get("rating", "--")), "caps", int(round(32.0 * ss)), Y)
	rating.position = pos + Vector2(635.0 * sx, 11.0 * sy)
	rating.size = Vector2(52.0 * sx, 39.0 * sy)
	rating.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	parent.add_child(rating)

	var salary := _txt(str(data.get("salary", "$-- P/W")), "caps", int(round(24.0 * ss)), Y)
	salary.position = pos + Vector2(521.0 * sx, 46.0 * sy)
	salary.size = Vector2(166.0 * sx, 29.0 * sy)
	salary.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	parent.add_child(salary)


func _driver_stat_piece(data: Dictionary, index: int) -> String:
	var raw := str(data.get("stats_text", "-- wins | -- Starts | -- Podiums"))
	var parts := raw.split("|")
	if index < 0 or index >= parts.size():
		return "--"
	return parts[index].strip_edges()


func _build_driver_card_action(pos: Vector2, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(28.0 * scale, 28.0 * scale)

	var icon := _build_material_icon(OPEN_IN_NEW_ICON_PATH, Vector2.ZERO, wrap.size, Y)
	if icon != null:
		wrap.add_child(icon)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(func(): pass)
	_hover(button)
	wrap.add_child(button)
	return wrap


func _build_driver_avatar(pos: Vector2, texture: Texture2D, sx: float, sy: float, ss: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(101.0 * sx, 101.0 * sy)

	var outer := PanelContainer.new()
	outer.size = wrap.size
	var outer_style := StyleBoxFlat.new()
	outer_style.bg_color = Color(0, 0, 0, 0)
	outer_style.border_color = Color.WHITE
	outer_style.set_border_width_all(max(2, int(round(3.0 * ss))))
	outer_style.set_corner_radius_all(int(round(50.5 * ss)))
	outer.add_theme_stylebox_override("panel", outer_style)
	wrap.add_child(outer)

	var inner_bg := PanelContainer.new()
	inner_bg.position = Vector2(5.0 * sx, 5.0 * sy)
	inner_bg.size = Vector2(91.0 * sx, 91.0 * sy)
	var inner_bg_style := StyleBoxFlat.new()
	inner_bg_style.bg_color = Color(0.02, 0.03, 0.06, 0.92)
	inner_bg_style.set_corner_radius_all(int(round(45.5 * ss)))
	inner_bg.add_theme_stylebox_override("panel", inner_bg_style)
	wrap.add_child(inner_bg)

	if texture != null:
		var portrait := TextureRect.new()
		portrait.texture = texture
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_SCALE
		portrait.position = Vector2(5.0 * sx, 5.0 * sy)
		portrait.size = Vector2(91.0 * sx, 91.0 * sy)
		portrait.material = _driver_avatar_mask_material()
		wrap.add_child(portrait)

	return wrap


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


func _driver_card_team_name() -> String:
	var team_name := str(PrototypeState.team_name).strip_edges()
	if team_name.is_empty():
		team_name = "Mercer Racing"
	return team_name.to_upper()


func _driver_rows() -> Array:
	var rows: Array = []
	rows.append({
		"name": _founder_display_name(),
		"stats_text": _owner_driver_stats_text(),
		"rating": _owner_driver_rating_label(),
		"salary": "$-- P/W",
		"role": "OWNER",
		"portrait_id": str(PrototypeState.founder_portrait_id),
		"use_fallback_avatar": true,
	})
	rows.append(_second_driver_row())
	rows.append({
		"name": "Reserve Seat",
		"stats_text": _empty_driver_stats(),
		"rating": "--",
		"salary": "$-- P/W",
		"role": "RESERVE",
	})
	return rows


func _founder_display_name() -> String:
	var full_name := ("%s %s" % [str(PrototypeState.founder_first_name), str(PrototypeState.founder_last_name)]).strip_edges()
	return full_name if not full_name.is_empty() else "Founder"


func _second_driver_row() -> Dictionary:
	var state := str(PrototypeState.second_driver_state).strip_edges()
	var seat_name := "Open Seat"
	if state == "Second driver shortlist prepared":
		seat_name = "Shortlisted Seat"
	elif state == "Second driver signed":
		seat_name = "Signed Seat"
	return {
		"name": seat_name,
		"stats_text": _empty_driver_stats(),
		"rating": "--",
		"salary": "$-- P/W",
		"role": "2ND DRIVER",
	}


func _empty_driver_stats() -> String:
	return "-- wins  |  -- Starts  |  -- Podiums"


func _owner_driver_stats() -> Dictionary:
	if PrototypeState != null and PrototypeState.has_method("get_owner_driver_stats"):
		var stats_variant: Variant = PrototypeState.call("get_owner_driver_stats")
		if stats_variant is Dictionary:
			return stats_variant
	return {}


func _owner_driver_stats_text() -> String:
	var stats := _owner_driver_stats()
	if int(stats.get("starts", 0)) <= 0:
		return _empty_driver_stats()
	return "%d wins  |  %d Starts  |  %d Podiums" % [
		int(stats.get("wins", 0)),
		int(stats.get("starts", 0)),
		int(stats.get("podiums", 0)),
	]


func _owner_driver_rating_label() -> String:
	var stats := _owner_driver_stats()
	var rating := float(stats.get("rating", 0.0))
	if rating <= 0.0:
		return "--"
	return "%d" % int(round(rating))


func _load_partner_portrait_texture(portrait_id: String) -> Texture2D:
	if portrait_id.is_empty():
		return null
	if portrait_texture_cache.has(portrait_id):
		return portrait_texture_cache[portrait_id]

	var path := _resolve_partner_portrait_path(portrait_id)
	if path.is_empty():
		return null

	var image := Image.new()
	var err := image.load(path)
	if err != OK:
		return null

	var texture := ImageTexture.create_from_image(image)
	portrait_texture_cache[portrait_id] = texture
	return texture


func _load_external_portrait_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if portrait_texture_cache.has(path):
		return portrait_texture_cache[path]
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		file_path = path
	if not FileAccess.file_exists(file_path):
		return null
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	portrait_texture_cache[path] = texture
	return texture


func _build_standings_avatar(path: String, pos: Vector2, size_value: Vector2) -> Control:
	var texture := _load_external_portrait_texture(path)
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
	style.border_color = Color(1.0, 1.0, 1.0, 0.16)
	style.set_border_width_all(1)
	style.set_corner_radius_all(int(round(size_value.x / 2.0)))
	frame.add_theme_stylebox_override("panel", style)
	wrap.add_child(frame)
	var portrait := TextureRect.new()
	portrait.texture = texture
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.position = Vector2.ZERO
	portrait.size = size_value
	portrait.material = _driver_avatar_mask_material()
	frame.add_child(portrait)
	return wrap

func _resolve_partner_portrait_path(portrait_id: String) -> String:
	var base_path := ProjectSettings.globalize_path(PARTNER_PORTRAIT_DIR)
	var candidates := [
		base_path.path_join(portrait_id + ".png.jpg"),
		base_path.path_join(portrait_id + ".png"),
		base_path.path_join(portrait_id + ".jpg"),
	]
	for candidate in candidates:
		if FileAccess.file_exists(candidate):
			return candidate
	return ""


# ── Center Bottom Card: Series ───────────────────────────────────────────────

func _build_center_bottom_card() -> Control:
	var design_size: Vector2 = Vector2(730.0, 552.1828)
	var sx: float = CB_SIZE.x / design_size.x
	var sy: float = CB_SIZE.y / design_size.y
	var ss: float = min(sx, sy)
	var has_car: bool = PrototypeState.car_count > 0
	var has_championship: bool = PrototypeState.has_championship_entry()
	var series_data: Dictionary = PrototypeState.get_series_card_data()
	var track_background_texture: Texture2D = _load_series_track_texture(str(series_data.get("track_image_path", "")))
	var eyebrow_text: String = str(series_data.get("eyebrow", "SERIES"))
	var title_text: String = str(series_data.get("title", "CURRENT SERIES"))
	if not has_car or not has_championship:
		eyebrow_text = "CURRENT RACE PROGRAMME"
		title_text = "SERIES\nUNAVAILABLE"

	var card := Control.new()
	card.position = CB_POS
	card.size = CB_SIZE
	card.clip_contents = true

	var bg_panel := PanelContainer.new()
	bg_panel.size = CB_SIZE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0, 0, 0, 0.38)
	bg_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	bg_panel.add_theme_stylebox_override("panel", bg_style)
	card.add_child(bg_panel)

	if has_car and has_championship and track_background_texture != null:
		var bg_img := TextureRect.new()
		bg_img.texture = track_background_texture
		bg_img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg_img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		bg_img.modulate = Color(1, 1, 1, 0.20)
		bg_img.size = CB_SIZE
		card.add_child(bg_img)
	elif has_car and has_championship:
		_build_series_card_background_empty_state(card, sx, sy, ss)

	var border := PanelContainer.new()
	border.size = CB_SIZE
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = Color(1.0, 0.98, 0.33, 0.7)
	border_style.set_border_width_all(max(1, int(round(ss))))
	border_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	border.add_theme_stylebox_override("panel", border_style)
	card.add_child(border)

	card.add_child(_build_card_action_icon(Vector2(683.0 * sx, 15.0 * sy), ss, func():
		_open_garage_from_series_card()
	))

	var eyebrow := _txt(eyebrow_text, "caps", int(round(16.0 * ss)), Color.WHITE)
	eyebrow.position = Vector2(25.0 * sx, 15.0 * sy)
	eyebrow.size = Vector2(323.0 * sx, 24.0 * sy)
	card.add_child(eyebrow)

	var title := _txt(_series_card_title_text(title_text), "caps", int(round(36.0 * ss)), Y)
	title.position = Vector2(25.0 * sx, 37.0 * sy)
	title.size = Vector2(650.0 * sx, 96.0 * sy)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(title)

	if not has_car or not has_championship:
		_build_series_card_empty_state(card, sx, sy, ss, has_car, has_championship)
		return card

	var ground_ring := TextureRect.new()
	ground_ring.texture = CAR_GROUND_RING_TEXTURE
	ground_ring.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ground_ring.stretch_mode = TextureRect.STRETCH_SCALE
	ground_ring.position = Vector2(63.0 * sx, 305.0 * sy)
	ground_ring.size = Vector2(578.0 * sx, 78.0 * sy)
	ground_ring.modulate = Color(1, 1, 1, 0.86)
	card.add_child(ground_ring)

	var car := TextureRect.new()
	car.texture = _load_series_car_texture(str(series_data.get("car_image_path", "")))
	car.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	car.stretch_mode = TextureRect.STRETCH_SCALE
	car.position = Vector2(39.0 * sx, 151.2 * sy)
	car.size = Vector2(663.3 * sx, 248.8 * sy)
	car.modulate = Color(1, 1, 1, 0.90)
	card.add_child(car)

	var tiles: Array = [
		{"value": str(series_data.get("days_label", "--")), "label": "Til Next Race", "x": 18.2},
		{"value": str(series_data.get("track_label", "--")), "label": "Track", "x": 261.0},
		{"value": str(series_data.get("standings_label", "--")), "label": "Standings", "x": 503.8},
	]
	for tile in tiles:
		var tile_rect := Rect2(
			Vector2(float(tile["x"]) * sx, 452.8 * sy),
			Vector2(220.1 * sx, 73.0 * sy)
		)
		card.add_child(_build_car_card_metric_tile(tile_rect, str(tile["value"]), str(tile["label"]), ss))

	return card


func _build_car_card_metric_tile(rect: Rect2, value: String, label_text: String, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var background := PanelContainer.new()
	background.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y
	style.set_corner_radius_all(int(round(MENU_RADIUS * scale)))
	background.add_theme_stylebox_override("panel", style)
	wrap.add_child(background)

	var normalized_value: String = value.strip_edges()
	var compact_value: bool = normalized_value.length() > 10 or normalized_value.contains(" ")
	var wrap_value: bool = normalized_value.length() > 16 or normalized_value.contains("\n")
	var value_font_size: float = 24.0
	if normalized_value.length() > 20:
		value_font_size = 16.0
	elif compact_value:
		value_font_size = 20.0
	var value_label := _txt(value, "caps", int(round(value_font_size * scale)), DARK)
	value_label.position = Vector2(10.0 * scale, 9.0 * scale)
	value_label.size = Vector2(wrap.size.x - 20.0 * scale, 34.0 * scale)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	value_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	value_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if wrap_value else TextServer.AUTOWRAP_OFF
	wrap.add_child(value_label)

	var sub_label := _txt(label_text, "caps", int(round(13.0 * scale)), DARK)
	sub_label.position = Vector2(0, 43.0 * scale)
	sub_label.size = Vector2(wrap.size.x, 18.0 * scale)
	sub_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(sub_label)

	return wrap


func _series_card_title_text(title_text: String) -> String:
	var cleaned: String = title_text.replace("\n", " ").strip_edges()
	if cleaned.is_empty():
		return "CURRENT SERIES"
	var words: PackedStringArray = cleaned.split(" ", false)
	if words.size() <= 2:
		return cleaned
	var split_index: int = maxi(1, int(ceil(float(words.size()) / 2.0)))
	var first_half: PackedStringArray = PackedStringArray()
	var second_half: PackedStringArray = PackedStringArray()
	for index in range(words.size()):
		if index < split_index:
			first_half.append(words[index])
		else:
			second_half.append(words[index])
	var first_line: String = " ".join(first_half)
	var second_line: String = " ".join(second_half)
	if second_line.is_empty():
		return first_line
	return "%s\n%s" % [first_line, second_line]


func _build_series_card_empty_state(card: Control, sx: float, sy: float, ss: float, has_car: bool, has_championship: bool) -> void:
	var panel := PanelContainer.new()
	panel.position = Vector2(25.0 * sx, 165.0 * sy)
	panel.size = Vector2(680.0 * sx, 205.0 * sy)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.04, 0.07, 0.74)
	style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	style.border_color = Color(1, 1, 1, 0.08)
	style.set_border_width_all(max(1, int(round(ss))))
	panel.add_theme_stylebox_override("panel", style)
	card.add_child(panel)

	var title_text := "No car owned"
	var body_text := "Buy or assign a car in the Garage to show your current series and next race details here."
	if has_car and not has_championship:
		title_text = "No series entered"
		body_text = "You already own a car, so the next step is choosing a championship. Once you enter one, this card will populate with the countdown, track, and standings."
	elif not has_car and not has_championship:
		title_text = "No active race programme"
		body_text = "Own a car and enter a championship to unlock the current series view for this card."

	var empty_title := _txt(title_text, "bold", int(round(26.0 * ss)), Color.WHITE)
	empty_title.position = Vector2(52.0 * sx, 212.0 * sy)
	empty_title.size = Vector2(610.0 * sx, 34.0 * sy)
	card.add_child(empty_title)

	var empty_body := _txt(body_text, "body", int(round(18.0 * ss)), SOFT_GREY)
	empty_body.position = Vector2(52.0 * sx, 262.0 * sy)
	empty_body.size = Vector2(590.0 * sx, 66.0 * sy)
	empty_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card.add_child(empty_body)

	var tile_y: float = 452.8
	var tiles: Array = [
		{"value": "--", "label": "Til Next Race", "x": 18.2},
		{"value": "--", "label": "Track", "x": 261.0},
		{"value": "--", "label": "Standings", "x": 503.8},
	]
	for tile_variant in tiles:
		var tile: Dictionary = tile_variant
		var tile_rect := Rect2(
			Vector2(float(tile["x"]) * sx, tile_y * sy),
			Vector2(220.1 * sx, 73.0 * sy)
		)
		card.add_child(_build_car_card_metric_tile(tile_rect, str(tile["value"]), str(tile["label"]), ss))


func _build_series_card_background_empty_state(card: Control, sx: float, sy: float, ss: float) -> void:
	var panel := PanelContainer.new()
	panel.position = Vector2(25.0 * sx, 146.0 * sy)
	panel.size = Vector2(680.0 * sx, 255.0 * sy)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.04, 0.07, 0.45)
	style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	style.border_color = Color(1, 1, 1, 0.06)
	style.set_border_width_all(max(1, int(round(ss))))
	panel.add_theme_stylebox_override("panel", style)
	card.add_child(panel)

	var title := _txt("No track image available", "body", int(round(18.0 * ss)), Color.WHITE)
	title.position = Vector2(218.0 * sx, 248.0 * sy)
	title.size = Vector2(300.0 * sx, 24.0 * sy)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	card.add_child(title)

	var body := _txt("Assign a next-race background image to show the circuit backdrop on this card.", "body", int(round(14.0 * ss)), SOFT_GREY)
	body.position = Vector2(145.0 * sx, 278.0 * sy)
	body.size = Vector2(446.0 * sx, 38.0 * sy)
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card.add_child(body)


func _open_garage_from_series_card() -> void:
	var series_data: Dictionary = PrototypeState.get_series_card_data()
	var garage_scene: String = str(series_data.get("garage_scene_path", ""))
	if not garage_scene.is_empty() and ResourceLoader.exists(garage_scene):
		PrototypeState.clear_pending_navigation()
		ScreenTransition.fade_to_scene(garage_scene)
		return
	PrototypeState.set_pending_navigation("Garage", "garage", garage_scene)
	_request_rebuild()


func _load_series_car_texture(path: String) -> Texture2D:
	if not path.is_empty() and ResourceLoader.exists(path):
		var texture: Texture2D = load(path)
		if texture != null:
			return texture
	return RACE_CAR_TEXTURE


func _load_series_track_texture(path: String) -> Texture2D:
	if not path.is_empty() and ResourceLoader.exists(path):
		var texture: Texture2D = load(path)
		if texture != null:
			return texture
	if not path.is_empty() and FileAccess.file_exists(path):
		var image := Image.new()
		if image.load(path) == OK:
			return ImageTexture.create_from_image(image)
	return null


func _build_card_action_icon(pos: Vector2, scale: float, on_press: Callable) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(28.0 * scale, 28.0 * scale)

	var glyph := _build_material_icon(
		OPEN_IN_NEW_ICON_PATH,
		Vector2.ZERO,
		wrap.size,
		Y
	)
	if glyph != null:
		wrap.add_child(glyph)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(on_press)
	_hover(button)
	wrap.add_child(button)

	return wrap


# ── Right Top Card: Team Mentality ───────────────────────────────────────────

func _build_right_top_card() -> Control:
	var design_size: Vector2 = Vector2(729.0, 552.0)
	var sx: float = RT_SIZE.x / design_size.x
	var sy: float = RT_SIZE.y / design_size.y
	var ss: float = min(sx, sy)

	var card := Control.new()
	card.position = RT_POS
	card.size = RT_SIZE
	card.clip_contents = true

	var bg_panel := PanelContainer.new()
	bg_panel.size = RT_SIZE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0, 0, 0, 0.38)
	bg_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	bg_panel.add_theme_stylebox_override("panel", bg_style)
	card.add_child(bg_panel)

	var border := PanelContainer.new()
	border.size = RT_SIZE
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = Y
	border_style.set_border_width_all(max(1, int(round(1.0 * ss))))
	border_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	border.add_theme_stylebox_override("panel", border_style)
	card.add_child(border)

	var title := _txt("TEAM MENTALITY", "caps", int(round(36.0 * ss)), Color.WHITE)
	title.position = Vector2(21.4 * sx, 22.1 * sy)
	title.size = Vector2(415.0 * sx, 43.0 * sy)
	card.add_child(title)

	var snapshot := _mentality_snapshot_data()

	var kicker := _txt(str(snapshot.get("kicker", "WAR ROOM DOSSIER")), "caps", int(round(14.0 * ss)), Y)
	kicker.position = Vector2(25.0 * sx, 73.0 * sy)
	kicker.size = Vector2(228.0 * sx, 22.0 * sy)
	card.add_child(kicker)

	var summary := _txt(str(snapshot.get("summary", "")), "body", int(round(16.0 * ss)), SOFT_GREY)
	summary.position = Vector2(25.0 * sx, 97.0 * sy)
	summary.size = Vector2(681.0 * sx, 34.0 * sy)
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card.add_child(summary)

	card.add_child(_build_mentality_signal_panel(Rect2(Vector2(25.0 * sx, 145.0 * sy), Vector2(300.0 * sx, 176.0 * sy)), ss, snapshot))
	card.add_child(_build_mentality_pressure_panel(Rect2(Vector2(348.0 * sx, 145.0 * sy), Vector2(358.0 * sx, 176.0 * sy)), ss, snapshot))

	var briefings: Array = snapshot.get("briefings", [])
	var briefing_rects := [
		Rect2(Vector2(25.0 * sx, 344.0 * sy), Vector2(681.0 * sx, 54.0 * sy)),
		Rect2(Vector2(25.0 * sx, 411.0 * sy), Vector2(681.0 * sx, 54.0 * sy)),
		Rect2(Vector2(25.0 * sx, 478.0 * sy), Vector2(681.0 * sx, 54.0 * sy)),
	]
	for i in range(min(briefings.size(), briefing_rects.size())):
		card.add_child(_build_mentality_briefing_tile(briefing_rects[i], ss, briefings[i] as Dictionary))

	return card


func _mentality_snapshot_data() -> Dictionary:
	return {
		"kicker": "WAR ROOM DOSSIER",
		"headline": "GARAGE STABLE",
		"headline_color": Color("73CC63"),
		"overall_score": 72.0,
		"average_score": 64.0,
		"trend_label": "+6 THIS WEEK",
		"trend_color": Color("73CC63"),
		"outlook": "Momentum Building",
		"summary": "Drivers are calm. Staff energy is rising. Board patience is holding.",
		"pressure_rows": [
			{"label": "Drivers", "value": 58.0, "color": Color("FFBE6A")},
			{"label": "Staff", "value": 71.0, "color": Color("73CC63")},
			{"label": "Board", "value": 66.0, "color": Color("F7ED8B")},
			{"label": "Commercial", "value": 43.0, "color": Color("FF8A80")},
		],
		"briefings": [
			{"label": "BIGGEST RISK", "value": "Commercial pressure spikes if the next result feels flat.", "accent": Color("FF8A80")},
			{"label": "MOST FRAGILE", "value": "Second-driver confidence is the easiest thing to unsettle.", "accent": Color("FFBE6A")},
			{"label": "NEXT CONSEQUENCE", "value": "A weak weekend cools board patience before staff morale cracks.", "accent": Y},
		],
	}


func _build_mentality_signal_panel(rect: Rect2, scale: float, snapshot: Dictionary) -> Control:
	var panel := _build_mentality_inset_panel(rect, Color(1, 1, 1, 0.10))

	var label := _txt("OVERALL SIGNAL", "caps", int(round(12.0 * scale)), SOFT_GREY)
	label.position = Vector2(26.0 * scale, 16.0 * scale)
	label.size = Vector2(160.0 * scale, 18.0 * scale)
	panel.add_child(label)

	var score := _txt("%d" % int(round(float(snapshot.get("overall_score", 0.0)))), "caps", int(round(48.0 * scale)), Y)
	score.position = Vector2(26.0 * scale, 34.0 * scale)
	score.size = Vector2(86.0 * scale, 50.0 * scale)
	panel.add_child(score)

	var headline := _txt(str(snapshot.get("headline", "STABLE")), "caps", int(round(20.0 * scale)), snapshot.get("headline_color", Color.WHITE))
	headline.position = Vector2(118.0 * scale, 44.0 * scale)
	headline.size = Vector2(154.0 * scale, 24.0 * scale)
	panel.add_child(headline)

	var outlook := _txt(str(snapshot.get("outlook", "")), "body", int(round(15.0 * scale)), BODY_GREY)
	outlook.position = Vector2(118.0 * scale, 71.0 * scale)
	outlook.size = Vector2(154.0 * scale, 18.0 * scale)
	panel.add_child(outlook)

	panel.add_child(_build_mentality_segment_meter(
		Vector2(26.0 * scale, 108.0 * scale),
		Vector2(246.0 * scale, 22.0 * scale),
		float(snapshot.get("overall_score", 0.0)) / 100.0,
		float(snapshot.get("average_score", 0.0)) / 100.0,
		snapshot.get("headline_color", Y),
		16,
		false,
		false
	))

	var trend := _txt(str(snapshot.get("trend_label", "")), "caps", int(round(13.0 * scale)), snapshot.get("trend_color", Y))
	trend.position = Vector2(26.0 * scale, 140.0 * scale)
	trend.size = Vector2(120.0 * scale, 18.0 * scale)
	panel.add_child(trend)

	var average := _txt("GRID AVG %d" % int(round(float(snapshot.get("average_score", 0.0)))), "body", int(round(13.0 * scale)), SOFT_GREY)
	average.position = Vector2(166.0 * scale, 140.0 * scale)
	average.size = Vector2(106.0 * scale, 18.0 * scale)
	average.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	panel.add_child(average)

	return panel


func _build_mentality_pressure_panel(rect: Rect2, scale: float, snapshot: Dictionary) -> Control:
	var panel := _build_mentality_inset_panel(rect, Color(1, 1, 1, 0.10))

	var label := _txt("PRESSURE STACK", "caps", int(round(12.0 * scale)), SOFT_GREY)
	label.position = Vector2(16.0 * scale, 16.0 * scale)
	label.size = Vector2(160.0 * scale, 18.0 * scale)
	panel.add_child(label)

	var rows: Array = snapshot.get("pressure_rows", [])
	for i in range(rows.size()):
		panel.add_child(_build_mentality_pressure_row(Vector2(16.0 * scale, (46.0 + float(i) * 29.0) * scale), 326.0 * scale, 18.0 * scale, rows[i] as Dictionary))

	return panel


func _build_mentality_pressure_row(pos: Vector2, width: float, height: float, row: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(width, height)
	var label_width: float = 96.0
	var value_width: float = 24.0
	var label_to_meter_gap: float = 14.0
	var meter_to_value_gap: float = 4.0
	var meter_x: float = 10.0 + label_width + label_to_meter_gap
	var meter_width: float = max(92.0, width - meter_x - value_width - meter_to_value_gap)

	var accent := ColorRect.new()
	accent.position = Vector2(0.0, 3.0)
	accent.size = Vector2(3.0, height - 6.0)
	accent.color = row.get("color", Y)
	wrap.add_child(accent)

	var label_text := str(row.get("label", "")).to_upper()
	var label_font_size := int(round(height * 0.54)) if label_text.length() > 8 else int(round(height * 0.62))
	var label := _txt(label_text, "caps", label_font_size, Color.WHITE)
	label.position = Vector2(10.0, 0.0)
	label.size = Vector2(label_width, height)
	wrap.add_child(label)

	wrap.add_child(_build_mentality_segment_meter(
		Vector2(meter_x, -1.0),
		Vector2(meter_width, height + 4.0),
		float(row.get("value", 0.0)) / 100.0,
		0.60,
		row.get("color", Y),
		16,
		true,
		false
	))

	var value := _txt("%d" % int(round(float(row.get("value", 0.0)))), "caps", int(round(height * 0.68)), row.get("color", Y))
	value.position = Vector2(width - 24.0, 0.0)
	value.size = Vector2(24.0, height)
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(value)

	return wrap


func _build_mentality_briefing_tile(rect: Rect2, scale: float, briefing: Dictionary) -> Control:
	var is_wide := rect.size.x > rect.size.y * 4.0
	var panel_border_color: Color = Color(1, 1, 1, 0.10) if is_wide else briefing.get("accent", Color(1, 1, 1, 0.12))
	var panel := _build_mentality_inset_panel(rect, panel_border_color)
	if is_wide:
		var accent := ColorRect.new()
		accent.position = Vector2(16.0 * scale, 12.0 * scale)
		accent.size = Vector2(max(2.0, 3.0 * scale), rect.size.y - 24.0 * scale)
		accent.color = briefing.get("accent", Y)
		panel.add_child(accent)

		var label := _txt(str(briefing.get("label", "")), "caps", int(round(12.0 * scale)), Color.WHITE)
		label.position = Vector2(32.0 * scale, 18.0 * scale)
		label.size = Vector2(170.0 * scale, 18.0 * scale)
		panel.add_child(label)

		var value := _txt(str(briefing.get("value", "")), "body", int(round(14.0 * scale)), BODY_GREY)
		value.position = Vector2(196.0 * scale, 13.0 * scale)
		value.size = Vector2((rect.size.x - 218.0 * scale), 30.0 * scale)
		value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		value.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		panel.add_child(value)
	else:
		var accent_small := ColorRect.new()
		accent_small.position = Vector2(14.0 * scale, 14.0 * scale)
		accent_small.size = Vector2(42.0 * scale, max(2.0, 3.0 * scale))
		accent_small.color = briefing.get("accent", Y)
		panel.add_child(accent_small)

		var label_small := _txt(str(briefing.get("label", "")), "caps", int(round(12.0 * scale)), Color.WHITE)
		label_small.position = Vector2(14.0 * scale, 24.0 * scale)
		label_small.size = Vector2((rect.size.x - 28.0 * scale), 18.0 * scale)
		panel.add_child(label_small)

		var value_small := _txt(str(briefing.get("value", "")), "body", int(round(14.0 * scale)), BODY_GREY)
		value_small.position = Vector2(14.0 * scale, 50.0 * scale)
		value_small.size = Vector2((rect.size.x - 28.0 * scale), 76.0 * scale)
		value_small.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		value_small.vertical_alignment = VERTICAL_ALIGNMENT_TOP
		panel.add_child(value_small)

	return panel


func _build_mentality_inset_panel(rect: Rect2, border_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true

	var bg := PanelContainer.new()
	bg.size = rect.size
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0.03, 0.05, 0.08, 0.74)
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)

	var border := PanelContainer.new()
	border.size = rect.size
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = border_color
	border_style.set_border_width_all(1)
	border_style.set_corner_radius_all(MENU_RADIUS)
	border.add_theme_stylebox_override("panel", border_style)
	wrap.add_child(border)

	return wrap


func _build_mentality_segment_meter(pos: Vector2, size: Vector2, ratio: float, avg_ratio: float, fill_color: Color, segment_count: int = 16, align_right: bool = false, show_marker: bool = true) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size
	var segment_height: float = maxf(10.0, size.y - 8.0)
	var layout: Dictionary = _home_meter_segment_layout(size.x, segment_count, segment_height)
	var pitch: float = float(layout.get("pitch", 0.0))
	var segment_size: Vector2 = layout.get("segment_size", Vector2.ZERO)
	var meter_content_width: float = float(max(segment_count - 1, 0)) * pitch + segment_size.x
	var meter_origin_x: float = maxf(0.0, size.x - meter_content_width) if align_right else 0.0
	for index in range(segment_count):
		var progress := float(index + 1) / float(segment_count)
		wrap.add_child(_build_overview_stat_segment(
			Vector2(meter_origin_x + float(index) * pitch, 0.0),
			segment_size,
			progress <= clampf(ratio, 0.0, 1.0),
			fill_color
		))

	if show_marker:
		var marker_x := meter_origin_x + clampf(avg_ratio, 0.0, 1.0) * meter_content_width
		var marker := _triangle_left(
			Vector2(marker_x + segment_size.x * HOME_METER_MARKER_OFFSET_RATIO, segment_size.y + 2.0),
			6.0,
			GREY
		)
		wrap.add_child(marker)

	return wrap


func _home_meter_segment_layout(total_width: float, segment_count: int, segment_height: float) -> Dictionary:
	var target_width: float = maxf(6.0, segment_height * HOME_METER_SEGMENT_ASPECT_RATIO)
	var fit_width: float = total_width / (1.0 + float(max(segment_count - 1, 0)) * HOME_METER_SEGMENT_PITCH_RATIO)
	var width: float = min(target_width, fit_width)
	var pitch: float = width * HOME_METER_SEGMENT_PITCH_RATIO
	return {
		"pitch": pitch,
		"segment_size": Vector2(width, segment_height),
	}


func _build_mentality_ring(pos: Vector2, size: Vector2, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size

	var diameter: float = min(size.x, size.y)
	var outer_diameter: float = diameter - (8.0 * scale)
	var outer_radius: float = outer_diameter * 0.5
	var ring_thickness: float = 26.0 * scale
	var inner_radius: float = outer_radius - ring_thickness
	var center: Vector2 = Vector2(size.x * 0.5, size.y * 0.5)

	var outer_circle := PanelContainer.new()
	outer_circle.position = center - Vector2.ONE * outer_radius
	outer_circle.size = Vector2.ONE * outer_diameter
	var outer_style := StyleBoxFlat.new()
	outer_style.bg_color = Y
	outer_style.set_corner_radius_all(int(round(outer_radius)))
	outer_circle.add_theme_stylebox_override("panel", outer_style)
	wrap.add_child(outer_circle)

	var neutral_segment := Polygon2D.new()
	neutral_segment.polygon = _ring_segment_polygon(center, outer_radius, inner_radius, -148.0, -92.0, 28)
	neutral_segment.color = Color(0.88, 0.88, 0.90)
	wrap.add_child(neutral_segment)

	var inner_circle := PanelContainer.new()
	inner_circle.position = center - Vector2.ONE * inner_radius
	inner_circle.size = Vector2.ONE * (inner_radius * 2.0)
	var inner_style := StyleBoxFlat.new()
	inner_style.bg_color = Color(0.01, 0.02, 0.06, 0.98)
	inner_style.set_corner_radius_all(int(round(inner_radius)))
	inner_circle.add_theme_stylebox_override("panel", inner_style)
	wrap.add_child(inner_circle)

	var face_radius: float = 28.0 * scale
	var face := PanelContainer.new()
	face.position = center - Vector2.ONE * face_radius
	face.size = Vector2.ONE * (face_radius * 2.0)
	var face_style := StyleBoxFlat.new()
	face_style.bg_color = Y
	face_style.set_corner_radius_all(int(round(face_radius)))
	face.add_theme_stylebox_override("panel", face_style)
	wrap.add_child(face)

	var eye_radius: float = max(2.0, 3.0 * scale)
	for eye_x in [center.x - 11.0 * scale, center.x + 11.0 * scale]:
		var eye := PanelContainer.new()
		eye.position = Vector2(eye_x - eye_radius, center.y - 8.0 * scale - eye_radius)
		eye.size = Vector2.ONE * (eye_radius * 2.0)
		var eye_style := StyleBoxFlat.new()
		eye_style.bg_color = DARK
		eye_style.set_corner_radius_all(int(round(eye_radius)))
		eye.add_theme_stylebox_override("panel", eye_style)
		wrap.add_child(eye)

	var smile := Line2D.new()
	smile.width = max(2.0, 3.0 * scale)
	smile.default_color = DARK
	smile.begin_cap_mode = Line2D.LINE_CAP_ROUND
	smile.end_cap_mode = Line2D.LINE_CAP_ROUND
	smile.joint_mode = Line2D.LINE_JOINT_ROUND
	smile.position = center + Vector2(0, 2.0 * scale)
	smile.points = PackedVector2Array([
		Vector2(-12.0 * scale, 6.0 * scale),
		Vector2(-6.0 * scale, 10.0 * scale),
		Vector2(0, 11.5 * scale),
		Vector2(6.0 * scale, 10.0 * scale),
		Vector2(12.0 * scale, 6.0 * scale),
	])
	wrap.add_child(smile)

	return wrap


func _ring_segment_polygon(center: Vector2, outer_radius: float, inner_radius: float, start_deg: float, end_deg: float, steps: int) -> PackedVector2Array:
	var points := PackedVector2Array()
	for i in range(steps + 1):
		var t := float(i) / float(steps)
		var angle := deg_to_rad(lerpf(start_deg, end_deg, t))
		points.append(center + Vector2(cos(angle), sin(angle)) * outer_radius)
	for i in range(steps, -1, -1):
		var t := float(i) / float(steps)
		var angle := deg_to_rad(lerpf(start_deg, end_deg, t))
		points.append(center + Vector2(cos(angle), sin(angle)) * inner_radius)
	return points


func _build_lowest_mentality_row_icon(pos: Vector2, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(28.0 * scale, 32.0 * scale)
	var icon := _build_material_icon(
		ARROW_DOWNWARD_ICON_PATH,
		Vector2(0, 1.0 * scale),
		wrap.size,
		Color(0.88, 0.88, 0.92)
	)
	if icon != null:
		wrap.add_child(icon)

	return wrap


func _build_biggest_issue_row_icon(pos: Vector2, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(35.0 * scale, 33.0 * scale)
	var icon := _build_material_icon(
		WARNING_AMBER_ICON_PATH,
		Vector2.ZERO,
		wrap.size,
		Color.WHITE
	)
	if icon != null:
		wrap.add_child(icon)

	return wrap


func _build_mentality_row(parent: Control, pos: Vector2, left_text: String, right_text: String, right_color: Color) -> void:
	var left := _txt(left_text, "body", 36, BODY_GREY)
	left.position = pos
	left.size = Vector2(380, 50)
	parent.add_child(left)

	var marker := ColorRect.new()
	marker.position = pos + Vector2(560, 6)
	marker.size = Vector2(8, 38)
	marker.color = Y
	parent.add_child(marker)

	var right := _txt(right_text, "body", 41, right_color)
	right.position = pos + Vector2(600, 0)
	right.size = Vector2(370, 50)
	right.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	parent.add_child(right)


# ── Right Bottom Card: Upcoming Events ───────────────────────────────────────

func _build_right_bottom_card() -> Control:
	var design_size: Vector2 = Vector2(729.0, 552.0)
	var sx: float = RB_SIZE.x / design_size.x
	var sy: float = RB_SIZE.y / design_size.y
	var ss: float = min(sx, sy)

	var card := Control.new()
	card.position = RB_POS
	card.size = RB_SIZE
	card.clip_contents = true

	var bg_panel := PanelContainer.new()
	bg_panel.size = RB_SIZE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0, 0, 0, 0.38)
	bg_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	bg_panel.add_theme_stylebox_override("panel", bg_style)
	card.add_child(bg_panel)

	var border := PanelContainer.new()
	border.size = RB_SIZE
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = Y
	border_style.set_border_width_all(max(1, int(round(1.0 * ss))))
	border_style.set_corner_radius_all(int(round(MENU_RADIUS * ss)))
	border.add_theme_stylebox_override("panel", border_style)
	card.add_child(border)

	var title := _txt("UPCOMING EVENTS", "caps", int(round(36.0 * ss)), Color.WHITE)
	title.position = Vector2(21.4 * sx, 22.1 * sy)
	title.size = Vector2(447.0 * sx, 43.0 * sy)
	card.add_child(title)

	var events := _home_upcoming_events()
	if events.is_empty():
		card.add_child(_build_upcoming_events_empty_state(Vector2(27.52 * sx, 112.6538 * sy), sx, sy, ss))
		return card
	var last_group := ""
	var y_cursor := 82.0
	var rows_drawn := 0
	for event_variant in events:
		if rows_drawn >= 4 or not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant as Dictionary
		var group_label := _upcoming_event_group_label(int(event.get("days_until", 0)))
		if group_label != last_group:
			var header := _txt(group_label, "bold", int(round(20.0 * ss)), TS)
			header.position = Vector2(21.0 * sx, y_cursor * sy)
			header.size = Vector2(300.0 * sx, 29.0 * sy)
			card.add_child(header)
			y_cursor += 40.0
			last_group = group_label
		card.add_child(_build_upcoming_event_row(Vector2(27.52 * sx, y_cursor * sy), event, sx, sy, ss))
		y_cursor += 86.0
		rows_drawn += 1

	return card


func _build_upcoming_event_row(pos: Vector2, event: Dictionary, sx: float, sy: float, ss: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(678.48 * sx, 62.83 * sy)

	wrap.add_child(_build_event_row_icon(Vector2(1.48 * sx, 6.21 * sy), ss))

	var cyan_bar := ColorRect.new()
	cyan_bar.position = Vector2(64.83 * sx, 0)
	cyan_bar.size = Vector2(6.63 * sx, 51.78 * sy)
	cyan_bar.color = CYAN
	wrap.add_child(cyan_bar)

	var label := _txt(str(event.get("title", "Upcoming Event")), "body", int(round(20.0 * ss)), TE)
	label.position = Vector2(90.61 * sx, 8.98 * sy)
	label.size = Vector2(420.0 * sx, 29.0 * sy)
	label.clip_text = true
	label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(label)
	var meta := _txt(str(event.get("subtitle", "")), "body", int(round(13.0 * ss)), SOFT_GREY)
	meta.position = Vector2(90.61 * sx, 36.0 * sy)
	meta.size = Vector2(470.0 * sx, 19.0 * sy)
	meta.clip_text = true
	meta.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	wrap.add_child(meta)

	var action_scale := ss * 0.72
	var action_size := 28.0 * action_scale
	var action_y := label.position.y + (label.size.y - action_size) * 0.5
	wrap.add_child(_build_card_action_icon(Vector2(619.0 * sx, action_y), action_scale, func():
		_open_upcoming_event(event)
	))

	var line := ColorRect.new()
	line.position = Vector2(0, 59.38 * sy)
	line.size = Vector2(678.48 * sx, max(1.0, 3.45 * sy))
	line.color = Y
	wrap.add_child(line)

	return wrap


func _build_event_row_icon(pos: Vector2, scale: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(44.94 * scale, 39.35 * scale)
	var icon := _build_material_icon(
		HANDSHAKE_ICON_PATH,
		Vector2.ZERO,
		wrap.size,
		CYAN
	)
	if icon != null:
		wrap.add_child(icon)

	return wrap


func _build_upcoming_events_empty_state(pos: Vector2, sx: float, sy: float, ss: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(678.48 * sx, 240.0 * sy)
	var title := _txt("No scheduled actions", "bold", int(round(22.0 * ss)), Color.WHITE)
	title.position = Vector2(0, 0)
	title.size = Vector2(520.0 * sx, 32.0 * sy)
	wrap.add_child(title)
	var body := _txt("Buy a car, enter a series, or advance the calendar to populate live team events here.", "body", int(round(17.0 * ss)), TE)
	body.position = Vector2(0, 44.0 * sy)
	body.size = Vector2(600.0 * sx, 82.0 * sy)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(body)
	return wrap


func _home_upcoming_events() -> Array:
	var events: Array = []
	for mail_variant in PrototypeState.get_mail_items():
		if not mail_variant is Dictionary:
			continue
		var mail: Dictionary = mail_variant as Dictionary
		if bool(mail.get("resolved", false)) or bool(mail.get("archived", false)):
			continue
		if not bool(mail.get("requires_response", false)) and str(mail.get("action_type", "")) != "navigate":
			continue
		events.append({
			"title": str(mail.get("subject", "Inbox action")),
			"subtitle": str(mail.get("sender", "Inbox")),
			"days_until": 0,
			"scene_path": str(mail.get("action_scene_path", MAIL_SCENE_PATH)) if not str(mail.get("action_scene_path", "")).is_empty() else MAIL_SCENE_PATH,
			"context": str(mail.get("action_target_context", "mail")),
			"label": str(mail.get("action_target_label", "Mail")),
			"priority": 10 if bool(mail.get("requires_response", false)) else 40,
		})
		if events.size() >= 2:
			break
	if int(PrototypeState.car_count) <= 0:
		events.append({
			"title": "Buy First Car",
			"subtitle": "Marketplace launch task",
			"days_until": 0,
			"scene_path": MARKETPLACE_SCENE_PATH,
			"context": "marketplace",
			"label": "Marketplace",
			"priority": 20,
		})
	elif not PrototypeState.has_championship_entry():
		events.append({
			"title": "Enter A Series",
			"subtitle": str(PrototypeState.player_car_class_name) if not str(PrototypeState.player_car_class_name).is_empty() else "Choose your first championship",
			"days_until": 0,
			"scene_path": SERIES_SCENE_PATH,
			"context": "series",
			"label": "Series",
			"priority": 20,
		})
	_append_race_weekend_events(events)
	events.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_days := int(a.get("days_until", 999))
		var b_days := int(b.get("days_until", 999))
		if a_days != b_days:
			return a_days < b_days
		return int(a.get("priority", 50)) < int(b.get("priority", 50))
	)
	return events


func _append_race_weekend_events(events: Array) -> void:
	if not PrototypeState.has_championship_entry():
		return
	var series: Dictionary = PrototypeState.get_active_series_detail()
	var rounds_variant: Variant = series.get("rounds_data", [])
	if not rounds_variant is Array:
		return
	var best_round: Dictionary = {}
	var best_days := 9999
	for round_variant in rounds_variant:
		if not round_variant is Dictionary:
			continue
		var round_row: Dictionary = round_variant as Dictionary
		if str(round_row.get("status", "")).to_lower() == "done":
			continue
		var week_number := _home_parse_week(str(round_row.get("week", "")))
		if week_number <= 0:
			continue
		var days_until := maxi((week_number - int(PrototypeState.current_week)) * 7 + (5 - int(PrototypeState.current_day)), 0)
		if days_until < best_days:
			best_days = days_until
			best_round = round_row
	if best_round.is_empty():
		return
	var track := str(best_round.get("track", PrototypeState.next_race_track_name)).strip_edges()
	var title := "Race Weekend"
	if best_days == 0 and int(PrototypeState.current_day) >= 7:
		title = "Race Day"
	events.append({
		"title": "%s: %s" % [title, track if not track.is_empty() else "TBD"],
		"subtitle": str(PrototypeState.championship_name) if not str(PrototypeState.championship_name).is_empty() else "Active championship",
		"days_until": best_days,
		"scene_path": RACE_DAY_SCENE_PATH if best_days == 0 else SERIES_SCENE_PATH,
		"context": "race-day" if best_days == 0 else "series",
		"label": "Race Day" if best_days == 0 else "Series",
		"priority": 5 if best_days == 0 else 30,
	})


func _home_parse_week(label: String) -> int:
	var normalized := label.strip_edges().to_lower().replace("week", "").replace("w", "").strip_edges()
	return int(normalized) if not normalized.is_empty() else -1


func _upcoming_event_group_label(days_until: int) -> String:
	if days_until <= 0:
		return "TODAY"
	if days_until == 1:
		return "TOMORROW"
	return "IN %d DAYS" % days_until


func _open_upcoming_event(event: Dictionary) -> void:
	var scene_path := str(event.get("scene_path", ""))
	var label := str(event.get("label", event.get("title", "Event")))
	var context := str(event.get("context", ""))
	if not scene_path.is_empty() and ResourceLoader.exists(scene_path):
		PrototypeState.clear_pending_navigation()
		ScreenTransition.fade_to_scene(scene_path)
		return
	PrototypeState.set_pending_navigation(label, context, scene_path)


# ── Bottom Nav ───────────────────────────────────────────────────────────────

func _build_bottom_nav() -> Control:
	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "home"
	nav.show_continue_button = true
	nav.position = Vector2(0, 2032)
	nav.size = Vector2(DW, 128)
	return nav


# ── Continue Button ──────────────────────────────────────────────────────────

func _build_continue_button() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(3035, 2033)
	wrap.size = Vector2(805, 127)

	var bg := PanelContainer.new()
	bg.size = wrap.size
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0, 0, 0, 0.72)
	bg_style.border_color = Y
	bg_style.set_border_width_all(2)
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)

	var accent := ColorRect.new()
	accent.position = Vector2(18, 18)
	accent.size = Vector2(160, 4)
	accent.color = Y
	wrap.add_child(accent)

	var btn := Button.new()
	btn.flat = true
	btn.text = ""
	btn.size = Vector2(805, 127)
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.pressed.connect(func(): pass)
	_hover(btn)
	wrap.add_child(btn)

	var arrow := _build_material_icon(OPEN_IN_NEW_ICON_PATH, Vector2(288, 37), Vector2(44, 44), Y)
	if arrow != null:
		wrap.add_child(arrow)

	var lbl := _txt("Continue", "caps", 48, Y)
	lbl.position = Vector2(350, 30)
	lbl.size = Vector2(280, 58)
	wrap.add_child(lbl)

	return wrap


# ── Helpers ──────────────────────────────────────────────────────────────────

func _ovp(x: float, y: float) -> Vector2:
	return Vector2(x * LC_SX, y * LC_SY)


func _ovs(w: float, h: float) -> Vector2:
	return Vector2(w * LC_SX, h * LC_SY)


func _ovf(px: float) -> int:
	return int(round(px * LC_SX))

func _card(pos: Vector2, sz: Vector2, border_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = sz
	wrap.clip_contents = true

	var bg_s := StyleBoxFlat.new()
	bg_s.bg_color = CARD_BG
	bg_s.set_corner_radius_all(MENU_RADIUS)
	var bg := PanelContainer.new()
	bg.size = sz
	bg.add_theme_stylebox_override("panel", bg_s)
	wrap.add_child(bg)

	var bdr_s := StyleBoxFlat.new()
	bdr_s.bg_color = Color(0, 0, 0, 0)
	bdr_s.border_color = border_color
	bdr_s.set_border_width_all(2)
	bdr_s.set_corner_radius_all(MENU_RADIUS)
	var bdr := PanelContainer.new()
	bdr.size = sz
	bdr.z_index = 1
	bdr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bdr.add_theme_stylebox_override("panel", bdr_s)
	wrap.add_child(bdr)

	return wrap


func _body(card: Control) -> Control:
	var b := Control.new()
	b.size = card.size
	card.add_child(b)
	return b


func _txt(text: String, role: String, sz: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", PrototypeTheme.font(role))
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", color)
	l.autowrap_mode = TextServer.AUTOWRAP_OFF
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l


func _action_icon(pos: Vector2) -> Control:
	var w := Control.new()
	w.position = pos
	w.size = Vector2(28, 28)
	var glyph := _build_material_icon(OPEN_IN_NEW_ICON_PATH, Vector2.ZERO, w.size, Y)
	if glyph != null:
		w.add_child(glyph)
	return w


func _build_material_icon(path: String, pos: Vector2, size: Vector2, color: Color) -> TextureRect:
	var texture := _load_material_icon_texture(path)
	if texture == null:
		return null

	var icon := TextureRect.new()
	icon.position = pos
	icon.size = size
	icon.texture = texture
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_SCALE
	icon.material = _icon_tint_material(color)
	return icon


func _load_material_icon_texture(path: String) -> Texture2D:
	if material_icon_texture_cache.has(path):
		return material_icon_texture_cache[path]

	if ResourceLoader.exists(path):
		var resource: Variant = load(path)
		if resource is Texture2D:
			material_icon_texture_cache[path] = resource
			return resource

	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		return null

	var image := Image.new()
	if image.load(file_path) != OK:
		return null

	var texture := ImageTexture.create_from_image(image)
	material_icon_texture_cache[path] = texture
	return texture


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


func _rounded_rect(pos: Vector2, sz: Vector2, color: Color) -> Control:
	var p := PanelContainer.new()
	p.position = pos
	p.size = sz
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(int(min(sz.x, sz.y) / 2.0))
	p.add_theme_stylebox_override("panel", s)
	return p


func _right_rounded_rect(pos: Vector2, sz: Vector2, color: Color) -> Control:
	var p := PanelContainer.new()
	p.position = pos
	p.size = sz
	var s := StyleBoxFlat.new()
	s.bg_color = color
	var radius := int(min(sz.x, sz.y) / 2.0)
	s.corner_radius_top_left = 0
	s.corner_radius_bottom_left = 0
	s.corner_radius_top_right = radius
	s.corner_radius_bottom_right = radius
	p.add_theme_stylebox_override("panel", s)
	return p


func _bordered_rect(pos: Vector2, sz: Vector2, border_color: Color, bg_color: Color) -> Control:
	var p := PanelContainer.new()
	p.position = pos
	p.size = sz
	var s := StyleBoxFlat.new()
	s.bg_color = bg_color
	s.border_color = border_color
	s.set_border_width_all(1)
	s.set_corner_radius_all(int(min(sz.x, sz.y) / 2.0))
	p.add_theme_stylebox_override("panel", s)
	return p


func _load_svg_texture(path: String, scale: float = 1.0) -> Texture2D:
	var cache_key := "%s|%s" % [path, scale]
	if svg_texture_cache.has(cache_key):
		return svg_texture_cache[cache_key]

	if ResourceLoader.exists(path):
		var resource: Variant = load(path)
		if resource is Texture2D:
			svg_texture_cache[cache_key] = resource
			return resource

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null

	var svg_text := file.get_as_text()
	var image := Image.new()
	if image.load_svg_from_string(svg_text, scale) != OK:
		return null

	var texture := ImageTexture.create_from_image(image)
	svg_texture_cache[cache_key] = texture
	return texture


func _bell_icon(pos: Vector2, sz: Vector2, color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = sz
	var cx: float = sz.x / 2.0
	var body_w: float = sz.x * 0.6
	var body_h: float = sz.y * 0.50
	var body_y: float = sz.y * 0.22
	var body_s := StyleBoxFlat.new()
	body_s.bg_color = color
	body_s.corner_radius_top_left = int(body_w * 0.45)
	body_s.corner_radius_top_right = int(body_w * 0.45)
	body_s.corner_radius_bottom_left = 2
	body_s.corner_radius_bottom_right = 2
	var body := PanelContainer.new()
	body.position = Vector2(cx - body_w / 2.0, body_y)
	body.size = Vector2(body_w, body_h)
	body.add_theme_stylebox_override("panel", body_s)
	wrap.add_child(body)
	var rim_w: float = sz.x * 0.78
	var rim_h: float = sz.y * 0.10
	var rim_y: float = body_y + body_h
	var rim_s := StyleBoxFlat.new()
	rim_s.bg_color = color
	rim_s.set_corner_radius_all(int(rim_h / 2.0))
	var rim := PanelContainer.new()
	rim.position = Vector2(cx - rim_w / 2.0, rim_y)
	rim.size = Vector2(rim_w, rim_h)
	rim.add_theme_stylebox_override("panel", rim_s)
	wrap.add_child(rim)
	var knob_r: float = sz.x * 0.08
	var knob_s := StyleBoxFlat.new()
	knob_s.bg_color = color
	knob_s.set_corner_radius_all(int(knob_r))
	var knob := PanelContainer.new()
	knob.position = Vector2(cx - knob_r, body_y - knob_r * 1.2)
	knob.size = Vector2(knob_r * 2, knob_r * 2)
	knob.add_theme_stylebox_override("panel", knob_s)
	wrap.add_child(knob)
	var clapper_r: float = sz.x * 0.07
	var clapper_s := StyleBoxFlat.new()
	clapper_s.bg_color = color
	clapper_s.set_corner_radius_all(int(clapper_r))
	var clapper := PanelContainer.new()
	clapper.position = Vector2(cx - clapper_r, rim_y + rim_h + 1)
	clapper.size = Vector2(clapper_r * 2, clapper_r * 2)
	clapper.add_theme_stylebox_override("panel", clapper_s)
	wrap.add_child(clapper)
	return wrap


func _chevron_down(pos: Vector2, sz: float, color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(sz, sz * 0.6)
	var half := sz / 2.0
	var thick: float = max(2.0, sz * 0.15)
	var left_leg := ColorRect.new()
	left_leg.size = Vector2(half + thick / 2.0, thick)
	left_leg.position = Vector2(0, 0)
	left_leg.rotation = 0.52
	left_leg.color = color
	wrap.add_child(left_leg)
	var right_leg := ColorRect.new()
	right_leg.size = Vector2(half + thick / 2.0, thick)
	right_leg.position = Vector2(sz, 0)
	right_leg.rotation = PI - 0.52
	right_leg.color = color
	wrap.add_child(right_leg)
	return wrap


func _flag(country: String, pos: Vector2) -> Control:
	var fw := 53.0
	var fh := 24.0
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(fw, fh)
	wrap.clip_contents = true

	match country:
		"UK":
			_cr(wrap, Vector2.ZERO, Vector2(fw, fh), Color("012169"))
			_cr(wrap, Vector2(0, fh / 2.0 - 3), Vector2(fw, 6), Color.WHITE)
			_cr(wrap, Vector2(fw / 2.0 - 3, 0), Vector2(6, fh), Color.WHITE)
			_cr(wrap, Vector2(0, fh / 2.0 - 1.5), Vector2(fw, 3), Color("CF142B"))
			_cr(wrap, Vector2(fw / 2.0 - 1.5, 0), Vector2(3, fh), Color("CF142B"))
		"DE":
			var sh := fh / 3.0
			_cr(wrap, Vector2(0, 0), Vector2(fw, sh), Color("000000"))
			_cr(wrap, Vector2(0, sh), Vector2(fw, sh), Color("DD0000"))
			_cr(wrap, Vector2(0, sh * 2), Vector2(fw, sh), Color("FFCC00"))
		"JP":
			_cr(wrap, Vector2.ZERO, Vector2(fw, fh), Color.WHITE)
			var r := fh * 0.3
			var cs := StyleBoxFlat.new()
			cs.bg_color = Color("BC002D")
			cs.set_corner_radius_all(int(r))
			var circle := PanelContainer.new()
			circle.position = Vector2(fw / 2.0 - r, fh / 2.0 - r)
			circle.size = Vector2(r * 2, r * 2)
			circle.add_theme_stylebox_override("panel", cs)
			wrap.add_child(circle)
		"IT":
			var sw := fw / 3.0
			_cr(wrap, Vector2(0, 0), Vector2(sw, fh), Color("009246"))
			_cr(wrap, Vector2(sw, 0), Vector2(sw, fh), Color("FFFFFF"))
			_cr(wrap, Vector2(sw * 2, 0), Vector2(sw, fh), Color("CE2B37"))
		"IS":
			_cr(wrap, Vector2.ZERO, Vector2(fw, fh), Color("003897"))
			_cr(wrap, Vector2(0, fh / 2.0 - 3), Vector2(fw, 6), Color.WHITE)
			_cr(wrap, Vector2(fw * 0.33 - 3, 0), Vector2(6, fh), Color.WHITE)
			_cr(wrap, Vector2(0, fh / 2.0 - 1.5), Vector2(fw, 3), Color("D72828"))
			_cr(wrap, Vector2(fw * 0.33 - 1.5, 0), Vector2(3, fh), Color("D72828"))
		"CH":
			_cr(wrap, Vector2.ZERO, Vector2(fw, fh), Color("FF0000"))
			_cr(wrap, Vector2(fw / 2.0 - 7, fh / 2.0 - 2), Vector2(14, 4), Color.WHITE)
			_cr(wrap, Vector2(fw / 2.0 - 2, fh / 2.0 - 7), Vector2(4, 14), Color.WHITE)
		"US":
			var sh := fh / 7.0
			for j in 7:
				var col: Color = Color("B22234") if j % 2 == 0 else Color.WHITE
				_cr(wrap, Vector2(0, j * sh), Vector2(fw, sh + 1), col)
			_cr(wrap, Vector2.ZERO, Vector2(fw * 0.4, fh * 0.57), Color("3C3B6E"))
		"IN":
			var sh := fh / 3.0
			_cr(wrap, Vector2(0, 0), Vector2(fw, sh), Color("FF9933"))
			_cr(wrap, Vector2(0, sh), Vector2(fw, sh), Color.WHITE)
			_cr(wrap, Vector2(0, sh * 2), Vector2(fw, sh), Color("138808"))
		"PT":
			_cr(wrap, Vector2(0, 0), Vector2(fw * 0.4, fh), Color("006600"))
			_cr(wrap, Vector2(fw * 0.4, 0), Vector2(fw * 0.6, fh), Color("FF0000"))

	return wrap


func _cr(parent: Control, pos: Vector2, sz: Vector2, color: Color) -> void:
	var r := ColorRect.new()
	r.position = pos
	r.size = sz
	r.color = color
	parent.add_child(r)


func _triangle_left(pos: Vector2, sz: float, color: Color) -> Polygon2D:
	var tri := Polygon2D.new()
	tri.position = pos
	tri.polygon = PackedVector2Array([
		Vector2(sz, 0),
		Vector2(0, sz / 2.0),
		Vector2(sz, sz)
	])
	tri.color = color
	return tri


func _section_chevron(pos: Vector2, sz: float, color: Color, expanded: bool) -> Control:
	var wrap: Control = Control.new()
	wrap.position = pos
	wrap.size = Vector2(sz, sz)

	var stroke: float = max(1.5, sz * 0.16)
	var line: Line2D = Line2D.new()
	line.default_color = color
	line.width = stroke
	line.begin_cap_mode = Line2D.LINE_CAP_ROUND
	line.end_cap_mode = Line2D.LINE_CAP_ROUND
	line.joint_mode = Line2D.LINE_JOINT_ROUND
	if expanded:
		line.points = PackedVector2Array([
			Vector2(0, sz * 0.28),
			Vector2(sz * 0.5, sz * 0.72),
			Vector2(sz, sz * 0.28),
		])
	else:
		line.points = PackedVector2Array([
			Vector2(sz * 0.28, 0),
			Vector2(sz * 0.72, sz * 0.5),
			Vector2(sz * 0.28, sz),
		])
	wrap.add_child(line)
	return wrap


func _add_click_button(parent: Control, pos: Vector2, size: Vector2, on_press: Callable) -> void:
	var button: Button = Button.new()
	button.flat = true
	button.text = ""
	button.position = pos
	button.size = size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(on_press)
	parent.add_child(button)


func _hover(button: Control) -> void:
	button.pivot_offset = button.size / 2.0
	button.mouse_entered.connect(func():
		var tw := button.create_tween()
		tw.tween_property(button, "scale", Vector2(1.015, 1.015), 0.1).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	)
	button.mouse_exited.connect(func():
		var tw := button.create_tween()
		tw.tween_property(button, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	)
