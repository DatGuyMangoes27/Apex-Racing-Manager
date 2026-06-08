extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const LAYOUT_WIDTH := 2560.0
const LAYOUT_SCALE := DW / LAYOUT_WIDTH
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const DEFAULT_CAR_TEXTURE = preload("res://assets/images/figma-hq/race-car.png")

const ICON_DIR := "res://assets/images/material-icons"
const OPEN_ICON_PATH := ICON_DIR + "/open_in_new.png"
const SEARCH_ICON_PATH := ICON_DIR + "/search.png"
const STAR_ICON_PATH := ICON_DIR + "/star.png"
const STAR_HALF_ICON_PATH := ICON_DIR + "/star_half.png"
const STAR_OUTLINE_ICON_PATH := ICON_DIR + "/star_outline.png"
const PARTNER_PORTRAIT_DIR := "res://assets/images/generated/partners"
const MARKET_STAT_SEGMENT_FILL_PATH := "res://assets/images/figma-hq/market-stat-segment-fill.svg"
const MARKET_STAT_SEGMENT_OUTLINE_PATH := "res://assets/images/figma-hq/market-stat-segment-outline.svg"
const HOME_METER_SEGMENT_PITCH_RATIO := 12.0 / 20.5
const HOME_METER_SEGMENT_ASPECT_RATIO := 20.5 / 16.0

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("A6A7A8")
const DARK_CHIP := Color("111318")
const GREEN_A := Color("5FC368")
const GREEN_B := Color("73CC63")
const GREEN_C := Color("84CA5A")
const GREEN_D := Color("9BCB57")
const GREEN_E := Color("C9C95A")
const GREEN_F := Color("DAD56A")
const SHADOW_YELLOW := Color(0.968627, 0.921569, 0.32549, 0.42)
const MENU_RADIUS := 4

const HERO_RECT := Rect2(Vector2(89.0, 151.0), Vector2(1567.0, 838.0))
const ANALYTICS_RECT := Rect2(Vector2(1719.0, 151.0), Vector2(752.0, 838.0))
const DESIGN_TILE_RECT := Rect2(Vector2(89.0, 1034.0), Vector2(752.0, 201.0))
const FIT_TILE_RECT := Rect2(Vector2(904.0, 1034.0), Vector2(752.0, 201.0))
const IMPROVE_TILE_RECT := Rect2(Vector2(1719.0, 1034.0), Vector2(752.0, 201.0))

var icon_texture_cache: Dictionary = {}
var icon_tint_shader: Shader
var portrait_texture_cache: Dictionary = {}
var svg_texture_cache: Dictionary = {}
var avatar_mask_material: ShaderMaterial
var driver_avatar_mask_material: ShaderMaterial


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	get_viewport().size_changed.connect(_on_viewport_resized)
	PrototypeState.sync_player_car_display_state()
	_build_ui()


func _on_viewport_resized() -> void:
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

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "car"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	var hero_panel := _build_hero_panel()
	shell.add_child(hero_panel)
	var analytics_panel := _build_analytics_panel()
	shell.add_child(analytics_panel)
	var design_tile := _build_design_tile()
	shell.add_child(design_tile)
	shell.add_child(_build_fit_tile())
	shell.add_child(_build_improve_tile())

	frame.add_child(_build_bottom_nav())
	_register_tutorial(hero_panel, analytics_panel, design_tile)


func _register_tutorial(hero_panel: Control, analytics_panel: Control, design_tile: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": hero_panel,
			"title": "Your Car",
			"body": "The car currently in your garage, with its livery and ownership summary. This is the machine your team prepares for each race weekend.",
			"affects": "It is the car you take to every round.",
		},
		{
			"target": analytics_panel,
			"title": "Live Package",
			"body": "A breakdown of how your current package performs - the strengths and weaknesses of the car as it stands right now.",
			"affects": "Shows where pace is won or lost on track.",
		},
		{
			"target": design_tile,
			"title": "Development Work",
			"body": "Upcoming designs, parts and improvements queue here as the development side of the game grows. For now it shows what is in progress.",
			"affects": "Future upgrades will raise car performance.",
		},
	]
	director.report_screen_ready("car", steps, self)


func _build_hero_panel() -> Control:
	var card := _panel(HERO_RECT)

	var title := _txt(_car_display_text(), "title", 48, Y)
	title.position = Vector2(70.0, 24.0)
	title.size = Vector2(455.0, 225.0)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(title)

	card.add_child(_build_owner_summary())
	if PrototypeState.car_count > 0:
		card.add_child(_build_car_ground_ring())
		card.add_child(_build_hero_car_image())
	else:
		card.add_child(_build_hero_empty_state())

	if PrototypeState.car_count > 1:
		card.add_child(_build_fleet_strip())

	return card


func _build_fleet_strip() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(70.0, 788.0)
	wrap.size = Vector2(1450.0, 40.0)

	var label := _txt("FLEET", "bold", 18, Y)
	label.position = Vector2(0.0, 9.0)
	label.size = Vector2(86.0, 24.0)
	wrap.add_child(label)

	var fleet: Array = PrototypeState.get_owned_fleet()
	var chip_width := 322.0
	var gap := 14.0
	var start_x := 96.0
	var max_chips := 4
	var shown: int = min(fleet.size(), max_chips)
	for index in range(shown):
		var entry: Dictionary = fleet[index] as Dictionary
		var pos := Vector2(start_x + float(index) * (chip_width + gap), 0.0)
		wrap.add_child(_build_fleet_chip(pos, chip_width, entry))

	if fleet.size() > max_chips:
		var more := _txt("+%d more" % (fleet.size() - max_chips), "body", 16, COPY)
		more.position = Vector2(start_x + float(max_chips) * (chip_width + gap), 9.0)
		more.size = Vector2(120.0, 24.0)
		wrap.add_child(more)

	return wrap


func _build_fleet_chip(pos: Vector2, width: float, entry: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(width, 38.0)

	var is_primary: bool = bool(entry.get("is_primary", false))
	var chip := PanelContainer.new()
	chip.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.05, 0.08, 0.78)
	style.border_color = Y if is_primary else Color(1, 1, 1, 0.16)
	style.set_border_width_all(2 if is_primary else 1)
	style.set_corner_radius_all(MENU_RADIUS)
	chip.add_theme_stylebox_override("panel", style)
	wrap.add_child(chip)

	var name_text: String = str(entry.get("name", "Car"))
	if is_primary:
		name_text = "★ " + name_text
	var name_width := width - 28.0
	if not is_primary:
		name_width = width - 96.0
	var name_label := _txt(name_text, "bold", 14, Color.WHITE)
	name_label.position = Vector2(14.0, 4.0)
	name_label.size = Vector2(name_width, 18.0)
	name_label.clip_text = true
	wrap.add_child(name_label)

	if not is_primary:
		var sell_btn := Button.new()
		sell_btn.text = "SELL"
		sell_btn.position = Vector2(width - 74.0, 6.0)
		sell_btn.size = Vector2(60.0, 26.0)
		sell_btn.add_theme_font_size_override("font_size", 13)
		var instance_id := str(entry.get("instance_id", ""))
		sell_btn.pressed.connect(_on_sell_car_pressed.bind(instance_id, str(entry.get("name", "this car"))))
		wrap.add_child(sell_btn)

	var class_label := str(entry.get("class_label", "")).strip_edges()
	var condition_label := str(entry.get("condition_label", "")).strip_edges()
	var meta_text := class_label
	if not condition_label.is_empty():
		meta_text = ("%s · %s" % [class_label, condition_label]) if not class_label.is_empty() else condition_label
	var meta := _txt(meta_text, "body", 12, COPY)
	meta.position = Vector2(14.0, 21.0)
	meta.size = Vector2(width - 28.0, 16.0)
	meta.clip_text = true
	wrap.add_child(meta)

	return wrap


func _on_sell_car_pressed(instance_id: String, car_name: String) -> void:
	if instance_id.is_empty():
		return
	var result: Dictionary = PrototypeState.list_owned_car_for_auction(instance_id)
	_build_ui()
	_show_garage_toast(str(result.get("message", "Listing updated.")), bool(result.get("ok", false)))


func _show_garage_toast(message: String, success: bool) -> void:
	var vp: Vector2 = get_viewport_rect().size
	var toast := PanelContainer.new()
	toast.position = Vector2(vp.x * 0.5 - 360.0, vp.y - 150.0)
	toast.size = Vector2(720.0, 64.0)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.04, 0.07, 0.05, 0.94) if success else Color(0.1, 0.04, 0.04, 0.94)
	style.border_color = GREEN_A if success else Color("D9534F")
	style.set_border_width_all(2)
	style.set_corner_radius_all(6)
	style.set_content_margin_all(16.0)
	toast.add_theme_stylebox_override("panel", style)
	var label := Label.new()
	label.text = message
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_font_size_override("font_size", 22)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	toast.add_child(label)
	add_child(toast)
	var tree := get_tree()
	if tree != null:
		await tree.create_timer(3.0).timeout
	if is_instance_valid(toast):
		toast.queue_free()


func _build_owner_summary() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(820.0, 39.0)
	wrap.size = Vector2(625.0, 120.0)

	var portrait_texture := _load_partner_portrait_texture(str(PrototypeState.founder_portrait_id))
	wrap.add_child(_build_driver_avatar(Vector2(0.0, 0.0), portrait_texture))

	var name := _txt(_founder_display_name(), "body", 24, Color.WHITE)
	name.position = Vector2(122.0, 9.0)
	name.size = Vector2(220.0, 28.0)
	wrap.add_child(name)

	var stats := _owner_stats()
	var wins := _txt("%s wins" % stats["wins"], "body", 16, Color.WHITE)
	wins.position = Vector2(122.0, 43.0)
	wins.size = Vector2(60.0, 18.0)
	wrap.add_child(wins)

	var div1 := ColorRect.new()
	div1.position = Vector2(186.0, 43.0)
	div1.size = Vector2(1.4, 18.0)
	div1.color = Color(1, 1, 1, 0.42)
	wrap.add_child(div1)

	var starts := _txt("%s Starts" % stats["starts"], "body", 16, Color.WHITE)
	starts.position = Vector2(202.0, 43.0)
	starts.size = Vector2(78.0, 18.0)
	wrap.add_child(starts)

	var div2 := ColorRect.new()
	div2.position = Vector2(292.0, 43.0)
	div2.size = Vector2(1.4, 18.0)
	div2.color = Color(1, 1, 1, 0.42)
	wrap.add_child(div2)

	var podiums := _txt("%s Podiums" % stats["podiums"], "body", 16, Color.WHITE)
	podiums.position = Vector2(308.0, 43.0)
	podiums.size = Vector2(88.0, 18.0)
	wrap.add_child(podiums)

	var owner_role := _txt(_owner_status_text(), "bold", 20, Y)
	owner_role.position = Vector2(122.0, 73.0)
	owner_role.size = Vector2(260.0, 24.0)
	wrap.add_child(owner_role)

	var rating := _txt(_car_rating_label(), "title", 32, Y)
	rating.position = Vector2(556.0, 0.0)
	rating.size = Vector2(54.0, 40.0)
	rating.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(rating)

	var pay := _txt(_car_context_label(), "title", 24, Y)
	pay.position = Vector2(320.0, 68.0)
	pay.size = Vector2(150.0, 28.0)
	pay.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(pay)

	return wrap


func _build_hero_car_image() -> Control:
	var frame := Control.new()
	frame.position = Vector2(142.47265625, 307.0)
	frame.size = Vector2(1221.0, 475.0)
	frame.clip_contents = true

	var car_texture := _load_series_car_texture(str(PrototypeState.current_car_image_path))
	var car_image := TextureRect.new()
	car_image.texture = car_texture
	car_image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	car_image.stretch_mode = TextureRect.STRETCH_SCALE
	car_image.position = Vector2(-31.9962, -24.2725)
	car_image.size = Vector2(1452.0132, 544.4925)
	car_image.modulate = Color(1, 1, 1, 1.0)
	frame.add_child(car_image)

	return frame


func _build_hero_empty_state() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(222.0, 330.0)
	wrap.size = Vector2(1062.0, 372.0)

	var shell := PanelContainer.new()
	shell.size = wrap.size
	var shell_style := StyleBoxFlat.new()
	shell_style.bg_color = Color(0.02, 0.03, 0.06, 0.74)
	shell_style.border_color = Color(1, 1, 1, 0.10)
	shell_style.set_border_width_all(1)
	shell_style.set_corner_radius_all(MENU_RADIUS)
	shell.add_theme_stylebox_override("panel", shell_style)
	wrap.add_child(shell)

	var accent := ColorRect.new()
	accent.position = Vector2(52.0, 48.0)
	accent.size = Vector2(110.0, 5.0)
	accent.color = Y
	wrap.add_child(accent)

	var title := _txt("NO CAR IN THE GARAGE", "bold", 38, Color.WHITE)
	title.position = Vector2(52.0, 72.0)
	title.size = Vector2(540.0, 48.0)
	wrap.add_child(title)

	var body := _txt("Your operation has not secured a chassis yet, so the garage view stays empty until a marketplace deal is signed.", "body", 22, COPY)
	body.position = Vector2(52.0, 128.0)
	body.size = Vector2(676.0, 86.0)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(body)

	var step_label := _txt("NEXT STEP", "bold", 18, Y)
	step_label.position = Vector2(52.0, 246.0)
	step_label.size = Vector2(180.0, 24.0)
	wrap.add_child(step_label)

	var step_body := _txt("Open the marketplace, secure the launch car, then come back here to review the live package.", "body", 20, Color.WHITE)
	step_body.position = Vector2(52.0, 274.0)
	step_body.size = Vector2(710.0, 62.0)
	step_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	step_body.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(step_body)

	return wrap


func _build_car_ground_ring() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(114.99900055, 653.64578247)
	wrap.size = Vector2(1336.7845459, 116.92645264)

	var ring_texture := preload("res://assets/images/figma-hq/car-ground-ring.svg")
	var ring := TextureRect.new()
	ring.texture = ring_texture
	ring.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ring.stretch_mode = TextureRect.STRETCH_SCALE
	ring.position = Vector2(-3.7430, -3.9990)
	ring.size = Vector2(1344.5797, 129.9272)
	wrap.add_child(ring)

	return wrap


func _build_analytics_panel() -> Control:
	var card := _panel(ANALYTICS_RECT)

	var accent := ColorRect.new()
	accent.position = Vector2(48.0, 48.0)
	accent.size = Vector2(122.0, 5.0)
	accent.color = Y
	card.add_child(accent)

	var title := _txt("LIVE PACKAGE", "title", 34, Color.WHITE)
	title.position = Vector2(48.0, 72.0)
	title.size = Vector2(360.0, 38.0)
	card.add_child(title)

	var subtitle := _txt("Current package strength and race return using the home segmented meter system.", "body", 16, COPY)
	subtitle.position = Vector2(48.0, 118.0)
	subtitle.size = Vector2(610.0, 52.0)
	subtitle.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	subtitle.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(subtitle)

	if PrototypeState.car_count <= 0:
		card.add_child(_build_live_package_empty_state(Rect2(Vector2(42.0, 186.0), Vector2(668.0, 598.0))))
		return card

	var sections := _live_package_sections()
	card.add_child(_build_live_package_section(Rect2(Vector2(42.0, 186.0), Vector2(668.0, 258.0)), sections[0] as Dictionary))
	card.add_child(_build_live_package_section(Rect2(Vector2(42.0, 470.0), Vector2(668.0, 258.0)), sections[1] as Dictionary))

	return card


func _build_live_package_empty_state(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var shell := PanelContainer.new()
	shell.size = rect.size
	var shell_style := StyleBoxFlat.new()
	shell_style.bg_color = Color(0.03, 0.05, 0.08, 0.74)
	shell_style.border_color = Color(1, 1, 1, 0.10)
	shell_style.set_border_width_all(1)
	shell_style.set_corner_radius_all(MENU_RADIUS)
	shell.add_theme_stylebox_override("panel", shell_style)
	wrap.add_child(shell)

	var header := _txt("NO LIVE PACKAGE YET", "bold", 28, Color.WHITE)
	header.position = Vector2(28.0, 26.0)
	header.size = Vector2(320.0, 34.0)
	wrap.add_child(header)

	var body := RichTextLabel.new()
	body.position = Vector2(28.0, 72.0)
	body.size = Vector2(rect.size.x - 56.0, 92.0)
	body.bbcode_enabled = false
	body.fit_content = false
	body.scroll_active = false
	body.clip_contents = true
	body.text = "Once a launch car is signed, this panel switches to the segmented live package view and tracks chassis performance."
	body.add_theme_font_override("normal_font", PrototypeTheme.font("body"))
	body.add_theme_font_size_override("normal_font_size", 18)
	body.add_theme_color_override("default_color", COPY)
	wrap.add_child(body)

	var note := _txt("Secure the car first, then this section will populate automatically.", "bold", 18, Y)
	note.position = Vector2(28.0, 160.0)
	note.size = Vector2(530.0, 24.0)
	wrap.add_child(note)

	return wrap


func _build_live_package_section(rect: Rect2, section: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var shell := PanelContainer.new()
	shell.size = rect.size
	var shell_style := StyleBoxFlat.new()
	shell_style.bg_color = Color(0.03, 0.05, 0.08, 0.74)
	shell_style.border_color = Color(1, 1, 1, 0.10)
	shell_style.set_border_width_all(1)
	shell_style.set_corner_radius_all(MENU_RADIUS)
	shell.add_theme_stylebox_override("panel", shell_style)
	wrap.add_child(shell)

	var label := _txt(str(section.get("title", "SECTION")), "bold", 18, Color.WHITE)
	label.position = Vector2(22.0, 20.0)
	label.size = Vector2(220.0, 24.0)
	wrap.add_child(label)

	var description := _txt(str(section.get("subtitle", "")), "body", 14, COPY)
	description.position = Vector2(22.0, 48.0)
	description.size = Vector2(rect.size.x - 44.0, 18.0)
	wrap.add_child(description)

	var rows: Array = section.get("rows", [])
	for index in range(rows.size()):
		var row: Dictionary = rows[index] as Dictionary
		wrap.add_child(_build_live_package_metric_row(Vector2(22.0, 86.0 + float(index) * 38.0), rect.size.x - 44.0, row))

	return wrap


func _build_live_package_metric_row(pos: Vector2, width: float, metric: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(width, 30.0)

	var color: Color = metric.get("color", Y)

	var label := _txt(str(metric.get("label", "")).to_upper(), "bold", 14, Color.WHITE)
	label.position = Vector2(0.0, 5.0)
	label.size = Vector2(134.0, 20.0)
	wrap.add_child(label)

	var state := _txt(str(metric.get("state", "")).to_upper(), "body", 12, color)
	state.position = Vector2(136.0, 6.0)
	state.size = Vector2(96.0, 18.0)
	wrap.add_child(state)

	var meter_width: float = maxf(180.0, width - 292.0)
	wrap.add_child(_build_live_package_segment_meter(
		Vector2(236.0, 2.0),
		Vector2(meter_width, 22.0),
		float(metric.get("ratio", 0.0)),
		color,
		18
	))

	var value := _txt(str(metric.get("value_label", "0")), "bold", 14, color)
	value.position = Vector2(width - 52.0, 5.0)
	value.size = Vector2(52.0, 20.0)
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	wrap.add_child(value)

	return wrap


func _build_live_package_segment_meter(pos: Vector2, size: Vector2, ratio: float, fill_color: Color, segment_count: int = 18) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size

	var segment_height: float = maxf(10.0, size.y - 4.0)
	var layout: Dictionary = _home_meter_segment_layout(size.x, segment_count, segment_height)
	var pitch: float = float(layout.get("pitch", 0.0))
	var segment_size: Vector2 = layout.get("segment_size", Vector2.ZERO)

	for index in range(segment_count):
		var progress: float = float(index + 1) / float(segment_count)
		wrap.add_child(_build_live_package_segment(
			Vector2(float(index) * pitch, 0.0),
			segment_size,
			progress <= clampf(ratio, 0.0, 1.0),
			fill_color
		))

	return wrap


func _build_live_package_segment(pos: Vector2, seg_size: Vector2, is_filled: bool, fill_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(seg_size.x, seg_size.y + 4.0)

	var fill_texture := _load_svg_texture(MARKET_STAT_SEGMENT_FILL_PATH, 1.0)
	var outline_texture := _load_svg_texture(MARKET_STAT_SEGMENT_OUTLINE_PATH, 1.0)

	if is_filled and fill_texture != null:
		var shadow := TextureRect.new()
		shadow.texture = fill_texture
		shadow.position = Vector2(0.0, 4.0)
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


func _home_meter_segment_layout(total_width: float, segment_count: int, segment_height: float) -> Dictionary:
	var target_width: float = maxf(6.0, segment_height * HOME_METER_SEGMENT_ASPECT_RATIO)
	var fit_width: float = total_width / (1.0 + float(max(segment_count - 1, 0)) * HOME_METER_SEGMENT_PITCH_RATIO)
	var width: float = min(target_width, fit_width)
	var pitch: float = width * HOME_METER_SEGMENT_PITCH_RATIO
	return {
		"pitch": pitch,
		"segment_size": Vector2(width, segment_height),
	}


func _build_design_tile() -> Control:
	var card := _panel(DESIGN_TILE_RECT)
	card.add_child(_tile_title("Design new parts"))
	card.add_child(_tile_action_icon())

	var rows := _design_queue_rows()
	if rows.is_empty():
		card.add_child(_build_empty_strip("No New Designs"))
	else:
		var y := 84.0
		for row in rows:
			card.add_child(_build_queue_row(row as Dictionary, Vector2(35.0, y)))
			y += 48.0

	return card


func _build_fit_tile() -> Control:
	var card := _panel(FIT_TILE_RECT)
	card.add_child(_tile_title("Fit Parts"))
	card.add_child(_tile_action_icon())
	card.add_child(_build_empty_strip("No New Parts"))
	return card


func _build_improve_tile() -> Control:
	var card := _panel(IMPROVE_TILE_RECT)
	card.add_child(_tile_title("Condition & Service"))

	var car_id := _primary_car_id()
	if car_id.is_empty():
		card.add_child(_build_empty_strip("No Car To Service"))
		return card

	var systems: Array = PrototypeState.get_car_condition_systems(car_id)
	var quote: Dictionary = PrototypeState.get_service_quote(car_id)
	var cost_by_system: Dictionary = {}
	for entry_variant in quote.get("systems", []):
		if entry_variant is Dictionary:
			cost_by_system[str((entry_variant as Dictionary).get("system", ""))] = float((entry_variant as Dictionary).get("cost", 0.0))

	var full_cost := float(quote.get("full_cost", 0.0))
	var full_btn := Button.new()
	full_btn.text = "FULL SERVICE  %s" % _format_money(full_cost) if full_cost > 0.0 else "FULLY SERVICED"
	full_btn.position = Vector2(452.0, 16.0)
	full_btn.size = Vector2(268.0, 36.0)
	full_btn.add_theme_font_size_override("font_size", 17)
	full_btn.disabled = full_cost <= 0.0
	full_btn.pressed.connect(_on_full_service_pressed.bind(car_id))
	card.add_child(full_btn)

	var y := 64.0
	for system_variant in systems:
		if not system_variant is Dictionary:
			continue
		var sys: Dictionary = system_variant
		var system_id := str(sys.get("system", ""))
		var condition := float(sys.get("condition", 1.0))
		var sys_cost := float(cost_by_system.get(system_id, 0.0))
		card.add_child(_build_system_row(Vector2(30.0, y), car_id, sys, condition, sys_cost))
		y += 26.0

	return card


func _build_system_row(pos: Vector2, car_id: String, sys: Dictionary, condition: float, cost: float) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(692.0, 24.0)

	var label := _txt(str(sys.get("label", "System")), "bold", 14, Color.WHITE)
	label.position = Vector2(0.0, 2.0)
	label.size = Vector2(120.0, 20.0)
	wrap.add_child(label)

	var track := PanelContainer.new()
	track.position = Vector2(126.0, 4.0)
	track.size = Vector2(300.0, 16.0)
	var track_style := StyleBoxFlat.new()
	track_style.bg_color = Color(1, 1, 1, 0.12)
	track_style.set_corner_radius_all(MENU_RADIUS)
	track.add_theme_stylebox_override("panel", track_style)
	wrap.add_child(track)

	var fill := ColorRect.new()
	fill.position = Vector2(126.0, 4.0)
	fill.size = Vector2(300.0 * clampf(condition, 0.0, 1.0), 16.0)
	fill.color = _condition_color(condition)
	wrap.add_child(fill)

	var pct := _txt("%d%%" % int(round(condition * 100.0)), "body", 13, COPY)
	pct.position = Vector2(436.0, 2.0)
	pct.size = Vector2(58.0, 20.0)
	wrap.add_child(pct)

	if cost > 0.0:
		var btn := Button.new()
		btn.text = "Service %s" % _format_money(cost)
		btn.position = Vector2(500.0, 0.0)
		btn.size = Vector2(192.0, 24.0)
		btn.add_theme_font_size_override("font_size", 12)
		btn.pressed.connect(_on_service_system_pressed.bind(car_id, str(sys.get("system", ""))))
		wrap.add_child(btn)
	else:
		var ok := _txt("Showroom", "body", 12, Color("5AD37A"))
		ok.position = Vector2(500.0, 2.0)
		ok.size = Vector2(192.0, 20.0)
		wrap.add_child(ok)

	return wrap


func _condition_color(condition: float) -> Color:
	if condition >= 0.78:
		return Color("5AD37A")
	if condition >= 0.6:
		return Color("C9C95A")
	if condition >= 0.42:
		return Color("E0A24A")
	return Color("D9534F")


func _primary_car_id() -> String:
	for entry_variant in PrototypeState.get_owned_fleet():
		if entry_variant is Dictionary and bool((entry_variant as Dictionary).get("is_primary", false)):
			return str((entry_variant as Dictionary).get("instance_id", ""))
	var fleet: Array = PrototypeState.get_owned_fleet()
	if fleet.size() > 0 and fleet[0] is Dictionary:
		return str((fleet[0] as Dictionary).get("instance_id", ""))
	return ""


func _format_money(amount: float) -> String:
	var v := int(round(amount))
	if v >= 1_000_000:
		return "$%.1fM" % (float(v) / 1_000_000.0)
	if v >= 1_000:
		return "$%dK" % int(round(float(v) / 1000.0))
	return "$%d" % v


func _on_service_system_pressed(car_id: String, system: String) -> void:
	var result: Dictionary = PrototypeState.service_car_system(car_id, system)
	_build_ui()
	_show_garage_toast(str(result.get("message", "Service updated.")), bool(result.get("ok", false)))


func _on_full_service_pressed(car_id: String) -> void:
	var result: Dictionary = PrototypeState.service_car_full(car_id)
	_build_ui()
	_show_garage_toast(str(result.get("message", "Service updated.")), bool(result.get("ok", false)))


func _tile_title(text: String) -> Label:
	var title := _txt(text, "title", 32, Color.WHITE)
	title.position = Vector2(30.0, 24.0)
	title.size = Vector2(380.0, 36.0)
	return title


func _tile_action_icon() -> Control:
	var icon := _build_material_icon(OPEN_ICON_PATH, Vector2(691.0, 18.0), Vector2(24.0, 24.0), Y)
	if icon != null:
		return icon
	return Control.new()


func _build_queue_row(row: Dictionary, pos: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(645.0, 35.0)

	var progress_border := PanelContainer.new()
	progress_border.position = Vector2(0.0, 0.0)
	progress_border.size = Vector2(384.0, 35.0)
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = Y
	border_style.set_border_width_all(1)
	border_style.set_corner_radius_all(MENU_RADIUS)
	progress_border.add_theme_stylebox_override("panel", border_style)
	wrap.add_child(progress_border)

	var progress_fill := ColorRect.new()
	progress_fill.position = Vector2(0.0, 0.0)
	progress_fill.size = Vector2(384.0 * float(row.get("progress", 0.61)), 35.0)
	progress_fill.color = Y
	wrap.add_child(progress_fill)

	var name := _txt(str(row.get("name", "Building Test Track")), "body", 13, Color("13131A"))
	name.position = Vector2(20.0, 6.0)
	name.size = Vector2(175.0, 24.0)
	wrap.add_child(name)

	var time_bg := PanelContainer.new()
	time_bg.position = Vector2(402.0, 0.0)
	time_bg.size = Vector2(89.0, 34.0)
	var time_style := StyleBoxFlat.new()
	time_style.bg_color = DARK_CHIP
	time_style.set_corner_radius_all(MENU_RADIUS)
	time_bg.add_theme_stylebox_override("panel", time_style)
	wrap.add_child(time_bg)

	var time := _txt(str(row.get("time_label", "18 Weeks")), "body", 13, MUTED)
	time.position = Vector2(418.0, 6.0)
	time.size = Vector2(64.0, 24.0)
	wrap.add_child(time)

	var target_bg := PanelContainer.new()
	target_bg.position = Vector2(502.0, 0.0)
	target_bg.size = Vector2(166.0, 34.0)
	var target_style := StyleBoxFlat.new()
	target_style.bg_color = Y
	target_style.set_corner_radius_all(MENU_RADIUS)
	target_bg.add_theme_stylebox_override("panel", target_style)
	wrap.add_child(target_bg)

	var target := _txt(str(row.get("target_label", "Headquarters")), "body", 13, Color("13131A"))
	target.position = Vector2(524.0, 6.0)
	target.size = Vector2(126.0, 24.0)
	wrap.add_child(target)

	return wrap


func _build_empty_strip(text: String) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(152.0, 124.0)
	wrap.size = Vector2(415.0, 34.0)

	var fill := PanelContainer.new()
	fill.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y
	fill.add_theme_stylebox_override("panel", style)
	wrap.add_child(fill)

	var label := _txt(text, "body", 13, Color("13131A"))
	label.size = wrap.size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)

	return wrap


func _live_package_sections() -> Array:
	var car_metrics: Dictionary = PrototypeState.get_overview_player_metrics().get("car", {})
	var driver_metrics: Dictionary = PrototypeState.get_overview_player_metrics().get("drivers", {})
	var pace: float = float(car_metrics.get("pace_rating", 0.0))
	var development: float = float(car_metrics.get("development_rating", 0.0))
	var points: float = float(car_metrics.get("points", 0.0))
	var wins: float = float(driver_metrics.get("wins", 0.0))
	var starts: float = maxf(float(driver_metrics.get("starts", 0.0)), 1.0)
	var podiums: float = float(driver_metrics.get("podiums", 0.0))
	var top10: float = float(car_metrics.get("top10_finishes", 0.0))
	var overall: float = clampf(pace * 0.65 + development * 0.35, 0.0, 100.0)
	var reliability: float = clampf(pace * 0.35 + development * 0.35 + (top10 / starts * 100.0) * 0.30, 0.0, 100.0)
	var points_return: float = clampf(points / starts / 25.0 * 100.0, 0.0, 100.0)
	var win_rate: float = clampf(wins / starts * 100.0, 0.0, 100.0)
	var podium_rate: float = clampf(podiums / starts * 100.0, 0.0, 100.0)
	var top10_rate: float = clampf(top10 / starts * 100.0, 0.0, 100.0)
	return [
		{
			"title": "CAR PERFORMANCE",
			"subtitle": "Core chassis quality and the current strength of the package.",
			"rows": [
				_live_package_metric("Overall", overall, "%d" % int(round(overall))),
				_live_package_metric("Pace", pace, "%d" % int(round(pace))),
				_live_package_metric("Development", development, "%d" % int(round(development))),
				_live_package_metric("Reliability", reliability, "%d" % int(round(reliability))),
			],
		},
		{
			"title": "RACE RETURN",
			"subtitle": "What the current save is returning from actual weekends so far.",
			"rows": [
				_live_package_metric("Points Return", points_return, "%d" % int(round(points))),
				_live_package_metric("Wins Rate", win_rate, "%d%%" % int(round(win_rate))),
				_live_package_metric("Podium Rate", podium_rate, "%d%%" % int(round(podium_rate))),
				_live_package_metric("Top 10 Rate", top10_rate, "%d%%" % int(round(top10_rate))),
			],
		},
	]


func _live_package_metric(label: String, score: float, value_label: String) -> Dictionary:
	var clamped_score: float = clampf(score, 0.0, 100.0)
	return {
		"label": label,
		"ratio": clamped_score / 100.0,
		"value_label": value_label,
		"state": _live_package_state_text(clamped_score),
		"color": _live_package_color(clamped_score),
	}


func _live_package_state_text(score: float) -> String:
	if score >= 85.0:
		return "Elite"
	if score >= 75.0:
		return "Strong"
	if score >= 65.0:
		return "Solid"
	if score >= 50.0:
		return "Building"
	if score >= 35.0:
		return "Fragile"
	return "Weak"


func _live_package_color(score: float) -> Color:
	if score >= 85.0:
		return Y
	if score >= 75.0:
		return GREEN_A
	if score >= 65.0:
		return GREEN_B
	if score >= 50.0:
		return GREEN_D
	if score >= 35.0:
		return Color(0.95, 0.73, 0.27, 1.0)
	return Color(0.92, 0.42, 0.35, 1.0)


func _owner_stats() -> Dictionary:
	var driver_metrics: Dictionary = PrototypeState.get_overview_player_metrics().get("drivers", {})
	var wins: int = int(driver_metrics.get("wins", 0.0))
	var starts: int = int(driver_metrics.get("starts", 0.0))
	var podiums: int = int(driver_metrics.get("podiums", 0.0))
	return {
		"wins": wins,
		"starts": starts,
		"podiums": podiums,
	}


func _car_rating_value() -> int:
	var car_metrics: Dictionary = PrototypeState.get_overview_player_metrics().get("car", {})
	var pace: float = float(car_metrics.get("pace_rating", 0.0))
	var development: float = float(car_metrics.get("development_rating", 0.0))
	return int(round(clampf(pace * 0.65 + development * 0.35, 0.0, 100.0)))


func _car_rating_label() -> String:
	if PrototypeState.car_count <= 0:
		return "--"
	return str(_car_rating_value())


func _design_queue_rows() -> Array:
	var rows: Array = []
	var facility_projects: Array = PrototypeState.get_facility_projects()
	for project_variant in facility_projects:
		if typeof(project_variant) != TYPE_DICTIONARY:
			continue
		var project: Dictionary = project_variant
		rows.append({
			"name": str(project.get("name", "Project")),
			"time_label": str(project.get("time_label", "18 Weeks")),
			"target_label": str(project.get("target_label", "Headquarters")),
			"progress": float(project.get("progress", 0.61)),
		})
		if rows.size() == 2:
			break
	return rows


func _owner_status_text() -> String:
	if PrototypeState.car_count <= 0:
		return "NO CAR OWNED"
	var manufacturer: String = str(PrototypeState.player_car_manufacturer).strip_edges()
	if manufacturer.is_empty():
		return "CAR SECURED"
	return manufacturer.to_upper()


func _car_context_label() -> String:
	if PrototypeState.car_count <= 0:
		return "OPEN MARKET"
	var car_class_name: String = str(PrototypeState.player_car_class_name).strip_edges()
	if not car_class_name.is_empty():
		return car_class_name.to_upper()
	var fleet_label: String = str(PrototypeState.fleet_status_label()).strip_edges()
	return fleet_label.to_upper()


func _car_display_text() -> String:
	if PrototypeState.car_count <= 0:
		return "NO CAR\nOWNED"
	var manufacturer: String = str(PrototypeState.player_car_manufacturer).strip_edges()
	var platform_name: String = str(PrototypeState.player_car_platform_display_name()).strip_edges()
	var car_class_name: String = str(PrototypeState.player_car_class_name).strip_edges()
	var segments: Array[String] = []
	if not manufacturer.is_empty():
		segments.append(manufacturer.to_upper())
	if not platform_name.is_empty():
		var model_name := platform_name
		if not manufacturer.is_empty() and model_name.to_lower().begins_with(manufacturer.to_lower()):
			model_name = model_name.substr(manufacturer.length()).strip_edges()
		segments.append(model_name.to_upper())
	elif not car_class_name.is_empty():
		segments.append(car_class_name.to_upper())
	if segments.is_empty():
		return "CAR\nSECURED"
	return "\n".join(segments)


func _founder_display_name() -> String:
	var full_name := ("%s %s" % [str(PrototypeState.founder_first_name), str(PrototypeState.founder_last_name)]).strip_edges()
	return full_name if not full_name.is_empty() else "Founder"


func _founder_initials() -> String:
	var first := str(PrototypeState.founder_first_name).left(1).to_upper()
	var last := str(PrototypeState.founder_last_name).left(1).to_upper()
	var initials := (first + last).strip_edges()
	return initials if not initials.is_empty() else "OW"


func _load_series_car_texture(path: String) -> Texture2D:
	var normalized_path := path.to_lower()
	if normalized_path.contains("generated/partners") or normalized_path.contains("\\generated\\partners"):
		return DEFAULT_CAR_TEXTURE
	if not path.is_empty() and ResourceLoader.exists(path):
		var texture: Texture2D = load(path)
		if texture != null:
			return texture
	return DEFAULT_CAR_TEXTURE


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


func _avatar_mask_material() -> ShaderMaterial:
	if avatar_mask_material != null:
		return avatar_mask_material

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
	avatar_mask_material = ShaderMaterial.new()
	avatar_mask_material.shader = shader
	return avatar_mask_material


func _build_driver_avatar(pos: Vector2, texture: Texture2D) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(101.0, 101.0)

	var outer := PanelContainer.new()
	outer.size = wrap.size
	var outer_style := StyleBoxFlat.new()
	outer_style.bg_color = Color(0, 0, 0, 0)
	outer_style.border_color = Color.WHITE
	outer_style.set_border_width_all(3)
	outer_style.set_corner_radius_all(51)
	outer.add_theme_stylebox_override("panel", outer_style)
	wrap.add_child(outer)

	var inner_bg := PanelContainer.new()
	inner_bg.position = Vector2(5.0, 5.0)
	inner_bg.size = Vector2(91.0, 91.0)
	var inner_bg_style := StyleBoxFlat.new()
	inner_bg_style.bg_color = Color(0.02, 0.03, 0.06, 0.92)
	inner_bg_style.set_corner_radius_all(46)
	inner_bg.add_theme_stylebox_override("panel", inner_bg_style)
	wrap.add_child(inner_bg)

	if texture != null:
		var portrait := TextureRect.new()
		portrait.texture = texture
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_SCALE
		portrait.position = Vector2(5.0, 5.0)
		portrait.size = Vector2(91.0, 91.0)
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


func _build_material_icon(path: String, pos: Vector2, icon_size: Vector2, color: Color) -> TextureRect:
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


func _triangle_marker(pos: Vector2) -> Polygon2D:
	var tri := Polygon2D.new()
	tri.position = pos
	tri.polygon = PackedVector2Array([
		Vector2(0.0, 5.0),
		Vector2(8.0, 0.0),
		Vector2(8.0, 10.0),
	])
	tri.color = Color(1, 1, 1, 0.55)
	return tri


func _format_compact_number(value: float) -> String:
	var rounded: int = int(round(value))
	var whole := "%d" % rounded
	if whole.length() <= 3:
		return whole
	var parts: Array[String] = []
	var remaining := whole
	while remaining.length() > 3:
		parts.push_front(remaining.right(3))
		remaining = remaining.left(remaining.length() - 3)
	parts.push_front(remaining)
	return " ".join(parts)


func _panel(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var bg := PanelContainer.new()
	bg.size = rect.size
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = PANEL_BG
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)

	var border := PanelContainer.new()
	border.size = rect.size
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = BORDER
	border_style.set_border_width_all(2)
	border_style.set_corner_radius_all(MENU_RADIUS)
	border.add_theme_stylebox_override("panel", border_style)
	wrap.add_child(border)

	return wrap


func _txt(text: String, role: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_override("font", PrototypeTheme.font(role))
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label


func _build_bottom_nav() -> Control:
	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "car"
	nav.show_continue_button = true
	nav.position = Vector2(0, 2032)
	nav.size = Vector2(DW, 128)
	nav.z_index = 50
	return nav
