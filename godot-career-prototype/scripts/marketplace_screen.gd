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
const GROUND_RING_TEXTURE = preload("res://assets/images/figma-hq/car-ground-ring.svg")
const MARKET_STAT_SEGMENT_FILL_PATH := "res://assets/images/figma-hq/market-stat-segment-fill.svg"
const MARKET_STAT_SEGMENT_OUTLINE_PATH := "res://assets/images/figma-hq/market-stat-segment-outline.svg"
const ICON_DIR := "res://assets/images/material-icons"
const CHEVRON_DOWN_ICON_PATH := ICON_DIR + "/arrow_drop_down.png"
const ARROW_LEFT_ICON_PATH := ICON_DIR + "/keyboard_arrow_left.png"
const ARROW_RIGHT_ICON_PATH := ICON_DIR + "/keyboard_arrow_right.png"

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("8C8E91")
const DARK := Color("1E232A")
const BAR_BG := Color(1, 1, 1, 0.18)
const BAR_FILL := Color("F7EB53")
const BAR_FILL_ALT := Color("F7EB53")
const POSITIVE_STRONG := Color("5FC368")
const POSITIVE_GOOD := Color("73CC63")
const POSITIVE_MID := Color("F7ED8B")
const WARNING_MID := Color("FFBE6A")
const WARNING_STRONG := Color("FF8A80")
const MENU_RADIUS := 4

const FILTER_BAR_RECT := Rect2(Vector2(89.0, 151.0), Vector2(2380.0, 103.0))
const HERO_RECT := Rect2(Vector2(89.0, 292.0), Vector2(2380.0, 645.0))
const LIST_RECT := Rect2(Vector2(89.0, 972.0), Vector2(2380.0, 352.0))

var selected_market_tab := "new"
var selected_condition_filter := "All"
var selected_class_filter := "All"
var selected_sort_filter := "Price: Low"
var open_filter_id := ""
var market_notice_text := ""
var market_notice_kind := "info"
var carousel_offset := 0
var selected_listing_id := "porsche-new-1"
var selected_detail_tab := "overview"
var pending_buy_listing_id := ""
var pending_bid_listing_id := ""
var detail_listing_id := ""
var icon_texture_cache: Dictionary = {}
var svg_texture_cache: Dictionary = {}
var icon_tint_shader: Shader


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	get_viewport().size_changed.connect(_on_viewport_resized)
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
	top_bar.active_section_id = "marketplace"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	_sync_selection()
	var hero_panel := _build_hero_panel()
	shell.add_child(hero_panel)
	var listing_strip := _build_listing_strip()
	shell.add_child(listing_strip)
	var filter_bar := _build_filter_bar()
	shell.add_child(filter_bar)
	_register_tutorial(hero_panel, listing_strip, filter_bar)
	if not market_notice_text.is_empty():
		shell.add_child(_build_notice_banner())
	if not pending_buy_listing_id.is_empty():
		frame.add_child(_build_buy_confirmation_modal())
	if not pending_bid_listing_id.is_empty():
		frame.add_child(_build_bid_modal())

	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "marketplace"
	nav.show_continue_button = true
	nav.position = Vector2(0.0, 2032.0)
	nav.size = Vector2(DW, 128.0)
	frame.add_child(nav)


func _register_tutorial(hero_panel: Control, listing_strip: Control, filter_bar: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": listing_strip,
			"title": "Available Cars",
			"body": "Every car you can buy or lease appears here. Select one to load its details. Your first car is the commitment that lets you enter a championship.",
			"affects": "Your car determines which series you are eligible for.",
		},
		{
			"target": hero_panel,
			"title": "Car Details & Deal",
			"body": "Stats for the selected car, plus the buy or lease action. Leasing costs less up front; buying is yours outright. Confirm a deal here to add it to your garage.",
			"affects": "Sets your performance baseline and your spending.",
		},
		{
			"target": filter_bar,
			"title": "Filters & Sort",
			"body": "Narrow the list by class or condition and re-sort it, so you can quickly find a car that fits the series you want to race.",
			"affects": "Just filters what you see.",
		},
	]
	director.report_screen_ready("marketplace", steps, self)


func _build_filter_bar() -> Control:
	var card := _panel(FILTER_BAR_RECT)
	card.z_index = 40

	var tabs := [
		{"id": "new", "label": "New"},
		{"id": "used", "label": "Used"},
		{"id": "auction", "label": "Auction"},
	]
	var x := 24.0
	for tab in tabs:
		card.add_child(_build_tab_button(tab["id"], tab["label"], Rect2(Vector2(x, 9.0), Vector2(230.0, 86.0))))
		x += 250.0

	card.add_child(_build_filter_button("Condition", selected_condition_filter, Rect2(Vector2(1568.0, 9.0), Vector2(230.0, 86.0)), "condition"))
	card.add_child(_build_filter_button("Class", selected_class_filter, Rect2(Vector2(1818.0, 9.0), Vector2(210.0, 86.0)), "class"))
	card.add_child(_build_filter_button("Sort", selected_sort_filter, Rect2(Vector2(2048.0, 9.0), Vector2(298.0, 86.0)), "sort"))

	if open_filter_id == "condition":
		card.add_child(_build_filter_dropdown(Vector2(1568.0, 96.0), Vector2(244.0, 270.0), _condition_filter_options(), selected_condition_filter, "condition"))
	elif open_filter_id == "class":
		card.add_child(_build_filter_dropdown(Vector2(1818.0, 96.0), Vector2(224.0, 270.0), _class_filter_options(), selected_class_filter, "class"))
	elif open_filter_id == "sort":
		card.add_child(_build_filter_dropdown(Vector2(2048.0, 96.0), Vector2(312.0, 270.0), _sort_filter_options(), selected_sort_filter, "sort"))

	return card


func _build_hero_panel() -> Control:
	var card := _panel(HERO_RECT)
	var listing := _current_listing()
	var hero_title_text := _hero_display_title(listing)
	var hero_title_font_size := _hero_title_font_size(hero_title_text)
	var hero_title_height := _hero_title_height(hero_title_text, hero_title_font_size)
	var hero_meta_top := 31.0 + hero_title_height

	var title := _txt(hero_title_text, "title", hero_title_font_size, Y)
	title.position = Vector2(46.0, 31.0)
	title.size = Vector2(1180.0, hero_title_height)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.clip_contents = true
	card.add_child(title)

	var class_label := _txt(str(listing.get("class_name", "Open Class")).to_upper(), "body", 22, Color.WHITE)
	class_label.position = Vector2(52.0, hero_meta_top + 6.0)
	class_label.size = Vector2(820.0, 30.0)
	class_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	class_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	card.add_child(class_label)
	card.add_child(_build_inline_detail_panel(listing, hero_meta_top + 40.0))

	var price := _txt(str(listing.get("price_label", "$190 000")), "title", 40, Y)
	price.position = Vector2(2073.0, 33.0)
	price.size = Vector2(271.0, 58.0)
	price.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	card.add_child(price)

	card.add_child(_build_market_stat(
		"pace",
		"PACE",
		_stat_ratio(listing, "pace"),
		Vector2(2079.0, 119.0),
		148.0,
		113.0,
		_market_stat_tooltip("pace", listing),
		listing
	))
	card.add_child(_build_market_stat(
		"driveability",
		"DRIVEABILITY",
		_stat_ratio(listing, "driveability"),
		Vector2(2079.0, 211.0),
		92.0,
		169.0,
		_market_stat_tooltip("driveability", listing),
		listing
	))
	card.add_child(_build_market_stat(
		"reliability_rating",
		"RELIABILITY",
		_stat_ratio(listing, "reliability_rating"),
		Vector2(2079.0, 303.0),
		102.0,
		159.0,
		_market_stat_tooltip("reliability_rating", listing),
		listing
	))
	card.add_child(_build_market_stat(
		"operating_cost",
		"OPERATING COST",
		_stat_ratio(listing, "operating_cost"),
		Vector2(2078.0, 395.0),
		73.0,
		188.0,
		_market_stat_tooltip("operating_cost", listing),
		listing
	))
	var action_state := _market_action_state(listing)
	var action_callable := Callable(self, "_open_bid_modal") if bool(action_state.get("is_auction", false)) else Callable(self, "_buy_selected_listing")
	card.add_child(_build_action_button(
		str(action_state.get("label", "BUY")),
		Vector2(2124.0, 500.0),
		Vector2(220.0, 48.0),
		22,
		action_callable,
		bool(action_state.get("disabled", false))
	))

	card.add_child(_build_hero_car_ring(listing))
	card.add_child(_build_hero_car_image(listing))

	return card


func _build_hero_car_ring(listing: Dictionary) -> Control:
	var stage := _hero_stage_profile(listing)
	var ring_size: Vector2 = stage.get("ring_size", Vector2(1560.0, 136.0))
	var ring_y: float = float(stage.get("ring_y", 497.0))
	var wrap := Control.new()
	wrap.position = Vector2(_hero_stage_center_x() - ring_size.x * 0.5, ring_y)
	wrap.size = ring_size

	var ring := TextureRect.new()
	ring.texture = GROUND_RING_TEXTURE
	ring.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ring.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	ring.position = Vector2.ZERO
	ring.size = wrap.size
	wrap.add_child(ring)

	return wrap


func _build_notice_banner() -> Control:
	var bg_color := Color(0.17, 0.08, 0.08, 0.88)
	var border_color := Color(1.0, 0.45, 0.45, 0.65)
	var text_color := Color.WHITE
	if market_notice_kind == "success":
		bg_color = Color(0.09, 0.14, 0.08, 0.88)
		border_color = Color(0.62, 0.92, 0.45, 0.65)
		text_color = Color("E9F7D1")

	var wrap := _panel_with_colors(Rect2(Vector2(1646.0, 268.0), Vector2(698.0, 54.0)), bg_color, border_color)
	var label := _txt(market_notice_text, "body", 15, text_color)
	label.position = Vector2(18.0, 8.0)
	label.size = Vector2(662.0, 38.0)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(label)
	return wrap


func _build_buy_confirmation_modal() -> Control:
	var listing := _pending_buy_listing()
	if listing.is_empty():
		return Control.new()

	var overlay := Control.new()
	overlay.size = Vector2(DW, DH)

	var dim := ColorRect.new()
	dim.color = Color(0.0, 0.0, 0.0, 0.74)
	dim.size = overlay.size
	overlay.add_child(dim)

	var panel := _panel_with_colors(
		Rect2(Vector2(1120.0, 620.0), Vector2(1600.0, 760.0)),
		Color(0.03, 0.05, 0.08, 0.97),
		Color(0.968627, 0.921569, 0.32549, 0.62)
	)
	overlay.add_child(panel)

	var eyebrow := _txt("CONFIRM PURCHASE", "body", 17, MUTED)
	eyebrow.position = Vector2(46.0, 34.0)
	eyebrow.size = Vector2(360.0, 24.0)
	panel.add_child(eyebrow)

	var title := _txt(_hero_display_title(listing), "title", 36, Y)
	title.position = Vector2(46.0, 62.0)
	title.size = Vector2(1180.0, 96.0)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	panel.add_child(title)

	var summary := _txt(
		"You're about to commit your launch budget to this car. Once signed, the programme moves on to series entry.",
		"body",
		21,
		Color.WHITE
	)
	summary.position = Vector2(46.0, 176.0)
	summary.size = Vector2(1180.0, 72.0)
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel.add_child(summary)

	panel.add_child(_build_compact_confirm_row("Class", str(listing.get("class_name", "Unknown")), Vector2(46.0, 292.0)))
	panel.add_child(_build_compact_confirm_row("Condition", str(listing.get("condition", "excellent")).capitalize(), Vector2(46.0, 366.0)))
	panel.add_child(_build_compact_confirm_row("Series Fit", str(listing.get("series_filter_label", "Open Market")), Vector2(46.0, 440.0)))
	panel.add_child(_build_compact_confirm_row("Purchase Price", str(listing.get("price_label", "$0")), Vector2(46.0, 514.0), true))

	var consequence := _txt(
		"Effects: offer removed from market, garage updated, inbox advanced, and Series Entry becomes the next required step.",
		"body",
		18,
		MUTED
	)
	consequence.position = Vector2(46.0, 616.0)
	consequence.size = Vector2(1180.0, 60.0)
	consequence.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel.add_child(consequence)

	panel.add_child(_build_modal_button("Cancel", Vector2(46.0, 690.0), Vector2(240.0, 52.0), false, Callable(self, "_cancel_buy_confirmation")))
	panel.add_child(_build_modal_button("Confirm Buy", Vector2(954.0, 690.0), Vector2(600.0, 52.0), true, Callable(self, "_confirm_buy_selected_listing")))

	return overlay


func _build_compact_confirm_row(label_text: String, value_text: String, pos: Vector2, emphasize: bool = false) -> Control:
	var row := Control.new()
	row.position = pos
	row.size = Vector2(1508.0, 58.0)

	var divider := ColorRect.new()
	divider.position = Vector2.ZERO
	divider.size = Vector2(1508.0, 1.0)
	divider.color = Color(0.968627, 0.921569, 0.32549, 0.10)
	row.add_child(divider)

	var label := _txt(label_text.to_upper(), "body", 15, MUTED)
	label.position = Vector2(0.0, 18.0)
	label.size = Vector2(260.0, 22.0)
	row.add_child(label)

	var value := _txt(value_text, "body", 22 if emphasize else 19, Y if emphasize else Color.WHITE)
	value.position = Vector2(300.0, 12.0)
	value.size = Vector2(1208.0, 30.0)
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(value)

	return row


func _build_modal_button(text: String, pos: Vector2, button_size: Vector2, is_primary: bool, action: Callable) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = button_size

	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y if is_primary else Color(0.03, 0.05, 0.08, 0.72)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var label := _txt(text, "title", 22, Color("13131A") if is_primary else Y)
	label.position = Vector2(0.0, 0.0)
	label.size = wrap.size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(action)
	wrap.add_child(button)
	return wrap


func _pending_buy_listing() -> Dictionary:
	for listing_variant in _market_listings():
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("id", "")) == pending_buy_listing_id:
			return listing
	return {}


func _build_hero_car_image(listing: Dictionary) -> Control:
	var stage := _hero_stage_profile(listing)
	var frame_size: Vector2 = stage.get("frame_size", Vector2(1168.0, 456.0))
	var frame_y: float = float(stage.get("frame_y", 172.0))
	var image_pos: Vector2 = stage.get("image_pos", Vector2((frame_size.x - 1340.0) * 0.5, (frame_size.y - 514.0) * 0.5))
	var image_size: Vector2 = stage.get("image_size", Vector2(1340.0, 514.0))
	var frame := Control.new()
	frame.position = Vector2(_hero_stage_center_x() - frame_size.x * 0.5, frame_y)
	frame.size = frame_size
	frame.clip_contents = true

	var car_image := TextureRect.new()
	car_image.texture = _current_listing_texture()
	car_image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	car_image.stretch_mode = TextureRect.STRETCH_SCALE
	car_image.position = image_pos
	car_image.size = image_size
	car_image.modulate = Color(1, 1, 1, 1.0)
	frame.add_child(car_image)

	return frame


func _hero_stage_center_x() -> float:
	var dossier_right_x: float = 52.0 + 476.0
	var right_section_left_x: float = 1935.0
	return (dossier_right_x + right_section_left_x) * 0.5


func _hero_stage_profile(listing: Dictionary) -> Dictionary:
	var category := str(listing.get("car_category", "gt"))
	match category:
		"formula":
			return {
				"frame_y": 156.0,
				"frame_size": Vector2(1200.0, 470.0),
				"image_size": Vector2(1420.0, 520.0),
				"image_pos": Vector2(-112.0, -6.0),
				"ring_y": 478.0,
				"ring_size": Vector2(1600.0, 134.0),
			}
		"prototype":
			return {
				"frame_y": 160.0,
				"frame_size": Vector2(1240.0, 472.0),
				"image_size": Vector2(1440.0, 532.0),
				"image_pos": Vector2(-104.0, -10.0),
				"ring_y": 476.0,
				"ring_size": Vector2(1620.0, 138.0),
			}
		"touring", "road":
			return {
				"frame_y": 182.0,
				"frame_size": Vector2(1130.0, 432.0),
				"image_size": Vector2(1270.0, 482.0),
				"image_pos": Vector2(-72.0, -12.0),
				"ring_y": 470.0,
				"ring_size": Vector2(1500.0, 132.0),
			}
		"stock":
			return {
				"frame_y": 176.0,
				"frame_size": Vector2(1180.0, 446.0),
				"image_size": Vector2(1340.0, 500.0),
				"image_pos": Vector2(-82.0, -10.0),
				"ring_y": 468.0,
				"ring_size": Vector2(1560.0, 136.0),
			}
		"kart":
			return {
				"frame_y": 206.0,
				"frame_size": Vector2(980.0, 388.0),
				"image_size": Vector2(1120.0, 420.0),
				"image_pos": Vector2(-70.0, -8.0),
				"ring_y": 480.0,
				"ring_size": Vector2(1260.0, 112.0),
			}
		_:
			return {
				"frame_y": 172.0,
				"frame_size": Vector2(1168.0, 456.0),
				"image_size": Vector2(1340.0, 514.0),
				"image_pos": Vector2(-86.0, -29.0),
				"ring_y": 472.0,
				"ring_size": Vector2(1560.0, 136.0),
			}


func _build_inline_detail_panel(listing: Dictionary, top_y: float) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(52.0, top_y)
	wrap.size = Vector2(488.0, 362.0)

	var tabs := [
		{"id": "overview", "label": "Overview"},
		{"id": "condition", "label": "Condition"},
		{"id": "value", "label": "Value"},
		{"id": "history", "label": "History"},
	]
	var tab_x := 0.0
	for tab_variant in tabs:
		var tab: Dictionary = tab_variant
		wrap.add_child(_build_detail_tab_button(str(tab.get("id", "")), str(tab.get("label", "")), Vector2(tab_x, 0.0)))
		tab_x += 118.0

	var body := Control.new()
	body.position = Vector2(0.0, 54.0)
	body.size = Vector2(476.0, 308.0)
	wrap.add_child(body)

	var listing_title := _txt(_detail_tab_title(), "title", 17, Y)
	listing_title.position = Vector2(0.0, 4.0)
	listing_title.size = Vector2(420.0, 22.0)
	body.add_child(listing_title)

	var summary := _txt(_detail_tab_summary(listing), "body", 15, MUTED)
	summary.position = Vector2(0.0, 30.0)
	summary.size = Vector2(452.0, 42.0)
	summary.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(summary)

	var content := VBoxContainer.new()
	content.position = Vector2(0.0, 88.0)
	content.size = Vector2(476.0, 214.0)
	content.add_theme_constant_override("separation", 8)
	body.add_child(content)

	for row_variant in _detail_tab_rows(listing):
		if typeof(row_variant) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = row_variant as Dictionary
		content.add_child(_build_compact_detail_row(str(row.get("label", "")), str(row.get("value", ""))))

	return wrap


func _build_detail_tab_button(tab_id: String, label_text: String, pos: Vector2) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(108.0, 36.0)
	var active := tab_id == selected_detail_tab

	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Y if active else Color(0.03, 0.05, 0.08, 0.52)
	style.border_color = Y if active else Color(0.968627, 0.921569, 0.32549, 0.55)
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var label := _txt(label_text, "title", 14, Color("13131A") if active else Y)
	label.position = Vector2(0.0, 0.0)
	label.size = wrap.size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.tooltip_text = "Open %s details." % label_text
	button.pressed.connect(_on_detail_tab_pressed.bind(tab_id))
	wrap.add_child(button)
	return wrap


func _build_compact_detail_row(label_text: String, value_text: String) -> Control:
	var row := Control.new()
	row.custom_minimum_size = Vector2(476.0, 40.0)

	var label := _txt(label_text.to_upper(), "body", 12, MUTED)
	label.position = Vector2(0.0, 2.0)
	label.size = Vector2(128.0, 16.0)
	row.add_child(label)

	var value := _txt(value_text, "body", 16, Color.WHITE)
	value.position = Vector2(128.0, 0.0)
	value.size = Vector2(348.0, 32.0)
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(value)

	var divider := ColorRect.new()
	divider.position = Vector2(0.0, 39.0)
	divider.size = Vector2(476.0, 1.0)
	divider.color = Color(0.968627, 0.921569, 0.32549, 0.10)
	row.add_child(divider)
	return row


func _detail_tab_title() -> String:
	match selected_detail_tab:
		"condition":
			return "Condition Report"
		"value":
			return "Value Snapshot"
		"history":
			return "History File"
		_:
			return "Listing Overview"


func _detail_tab_summary(listing: Dictionary) -> String:
	match selected_detail_tab:
		"condition":
			return "Subsystem wear and current running confidence."
		"value":
			return "Price composition, demand and installed extras."
		"history":
			return "Ownership trail and notable background notes."
		_:
			return "%s | %s" % [
				str(listing.get("manufacturer_name", listing.get("car_filter", "Unknown"))),
				str(listing.get("condition", "excellent")).capitalize()
			]


func _detail_tab_rows(listing: Dictionary) -> Array:
	var rows: Array = []
	match selected_detail_tab:
		"condition":
			var wear: Dictionary = listing.get("part_wear", {})
			rows.append({"label": "Reliability", "value": "%s%%" % str(listing.get("reliability", 0))})
			rows.append({"label": "Engine", "value": "%s%% wear" % str(wear.get("engine", 0))})
			rows.append({"label": "Chassis", "value": "%s%% wear" % str(wear.get("chassis", 0))})
			rows.append({"label": "Gearbox", "value": "%s%% wear" % str(wear.get("gearbox", 0))})
			rows.append({"label": "Brakes", "value": "%s%% wear" % str(wear.get("brakes", 0))})
		"value":
			var pricing: Dictionary = listing.get("price_breakdown", {})
			rows.append({"label": "Ask", "value": str(listing.get("price_label", "$0"))})
			rows.append({"label": "Base", "value": _fmt_money_detail(float(pricing.get("base", 0.0)))})
			rows.append({"label": "Wear Adj.", "value": _fmt_money_detail(float(pricing.get("wearDiscount", 0.0)))})
			rows.append({"label": "Upgrades", "value": _fmt_money_detail(float(pricing.get("upgradeValue", 0.0)))})
			rows.append({"label": "Demand", "value": _fmt_money_detail(float(pricing.get("marketDemand", 0.0)))})
		"history":
			var provenance: Dictionary = listing.get("provenance", {})
			var latest_service: String = "No recent service recorded."
			var service_history: Variant = listing.get("service_history", [])
			if service_history is Array and not (service_history as Array).is_empty():
				var service_variant: Variant = (service_history as Array)[0]
				if service_variant is Dictionary:
					var service: Dictionary = service_variant as Dictionary
					latest_service = _fmt_service_entry(service)
			rows.append({"label": "Owners", "value": _fmt_whole_number(provenance.get("previousOwners", 0))})
			rows.append({"label": "Origin Year", "value": _fmt_year_value(provenance.get("originalPurchaseYear", "Unknown"))})
			rows.append({"label": "Accidents", "value": _fmt_whole_number(provenance.get("accidentHistory", 0))})
			rows.append({"label": "Highlight", "value": _history_highlight_text(provenance)})
			rows.append({"label": "Last Service", "value": latest_service})
		_:
			rows.append({"label": "Livery", "value": str(listing.get("livery_name", listing.get("card_title", "")))})
			rows.append({"label": "Class", "value": str(listing.get("class_name", "Unknown"))})
			rows.append({"label": "Series Fit", "value": str(listing.get("series_filter_label", "Open Market"))})
			rows.append({"label": "Mileage", "value": _fmt_distance_km(listing.get("mileage", 0))})
	return rows


func _history_highlight_text(provenance: Dictionary) -> String:
	var notable: Array[String] = _stringify_array(provenance.get("notableResults", []))
	if not notable.is_empty():
		return notable[0]
	return "No notable result listed."


func _fmt_money_detail(value: float) -> String:
	var rounded: int = int(round(value))
	var sign := "-" if rounded < 0 else ""
	return "%s$%s" % [sign, _fmt_thousands(abs(rounded))]


func _fmt_distance_km(value: Variant) -> String:
	return "%s km" % _fmt_thousands(_as_rounded_int(value))


func _fmt_whole_number(value: Variant) -> String:
	return str(_as_rounded_int(value))


func _fmt_year_value(value: Variant) -> String:
	if typeof(value) == TYPE_STRING:
		return str(value)
	return str(_as_rounded_int(value))


func _fmt_service_entry(service: Dictionary) -> String:
	var year_value := _fmt_year_value(service.get("year", ""))
	var week_value := _as_rounded_int(service.get("week", 0))
	var service_type := str(service.get("type", "service")).capitalize()
	if year_value.is_empty():
		return service_type
	return "%s W%s %s" % [year_value, str(week_value).pad_zeros(2), service_type]


func _as_rounded_int(value: Variant) -> int:
	match typeof(value):
		TYPE_FLOAT:
			return int(round(float(value)))
		TYPE_INT:
			return int(value)
		TYPE_STRING:
			return int(round(float(str(value).to_float())))
		_:
			return int(round(float(value)))


func _fmt_thousands(value: int) -> String:
	var digits := str(abs(value))
	var groups: Array = []
	while digits.length() > 3:
		groups.push_front(digits.substr(digits.length() - 3, 3))
		digits = digits.substr(0, digits.length() - 3)
	groups.push_front(digits)
	return ",".join(groups)


func _build_market_stat(stat_id: String, label_text: String, ratio: float, pos: Vector2, label_x: float, label_width: float, hover_text: String, listing: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(271.0, 78.0)
	wrap.tooltip_text = hover_text
	var fill_color := _market_stat_fill_color(stat_id, ratio)

	var label := _txt(label_text, "title", 16, Color.WHITE)
	label.position = Vector2(0.0, 0.0)
	label.size = Vector2(271.0, 18.0)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	wrap.add_child(label)

	var descriptor := _txt(_market_stat_descriptor(stat_id, ratio, listing), "body", 15, fill_color)
	descriptor.position = Vector2(0.0, 20.0)
	descriptor.size = Vector2(138.0, 18.0)
	descriptor.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	wrap.add_child(descriptor)

	var segment_count := 25
	var pitch := 10.52617
	var segment_size := Vector2(18.39749, 22.4901)
	for index in range(segment_count):
		var progress := float(index + 1) / float(segment_count)
		var seg := _build_market_stat_segment(
			Vector2(float(index) * pitch, 48.0),
			segment_size,
			progress <= ratio,
			fill_color
		)
		wrap.add_child(seg)

	return wrap


func _stat_ratio(listing: Dictionary, stat_id: String) -> float:
	match stat_id:
		"pace":
			return float(listing.get("pace", (float(listing.get("acc", 0.86)) + float(listing.get("top_speed", 0.88))) * 0.5))
		"driveability":
			return float(listing.get("driveability", float(listing.get("handling", 0.83))))
		"reliability_rating":
			return float(listing.get("reliability_rating", clampf(float(listing.get("reliability", 78)) / 100.0, 0.4, 0.95)))
		"operating_cost":
			return float(listing.get("operating_cost", 0.52))
		_:
			return 0.0


func _market_stat_descriptor(stat_id: String, ratio: float, listing: Dictionary) -> String:
	var scale: Array[String] = _market_stat_descriptor_scale(stat_id)
	var index: int = _market_stat_descriptor_index(stat_id, ratio)
	var percentile: float = _market_stat_percentile(stat_id, listing, ratio)
	if percentile >= 0.85 and index > 0:
		index -= 1
	elif percentile <= 0.20 and index < scale.size() - 1:
		index += 1
	return scale[index]


func _market_stat_descriptor_scale(stat_id: String) -> Array[String]:
	if stat_id == "operating_cost":
		return ["Lean", "Managed", "Heavy", "Costly", "Punishing"]
	return ["Elite", "Excellent", "Strong", "Competitive", "Promising", "Mixed", "Weak"]


func _market_stat_descriptor_index(stat_id: String, ratio: float) -> int:
	if stat_id == "operating_cost":
		if ratio <= 0.22:
			return 0
		if ratio <= 0.34:
			return 1
		if ratio <= 0.48:
			return 2
		if ratio <= 0.62:
			return 3
		return 4
	if ratio >= 0.92:
		return 0
	if ratio >= 0.84:
		return 1
	if ratio >= 0.76:
		return 2
	if ratio >= 0.68:
		return 3
	if ratio >= 0.58:
		return 4
	if ratio >= 0.48:
		return 5
	return 6


func _market_stat_percentile(stat_id: String, listing: Dictionary, ratio: float) -> float:
	var filtered := _filtered_listings()
	if filtered.size() < 3:
		return 0.5
	var favorable_count := 0.0
	var considered := 0.0
	for listing_variant in filtered:
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var peer: Dictionary = listing_variant as Dictionary
		var peer_ratio: float = _stat_ratio(peer, stat_id)
		if stat_id == "operating_cost":
			if ratio <= peer_ratio:
				favorable_count += 1.0
		else:
			if ratio >= peer_ratio:
				favorable_count += 1.0
		considered += 1.0
	if considered <= 0.0:
		return 0.5
	return favorable_count / considered


func _market_stat_fill_color(stat_id: String, ratio: float) -> Color:
	var effective_ratio := ratio
	if stat_id == "operating_cost":
		effective_ratio = 1.0 - ratio
	if effective_ratio >= 0.80:
		return POSITIVE_STRONG
	if effective_ratio >= 0.68:
		return POSITIVE_GOOD
	if effective_ratio >= 0.56:
		return POSITIVE_MID
	if effective_ratio >= 0.44:
		return WARNING_MID
	return WARNING_STRONG


func _market_stat_tooltip(stat_id: String, listing: Dictionary) -> String:
	var descriptor := _market_stat_descriptor(stat_id, _stat_ratio(listing, stat_id), listing)
	match stat_id:
		"pace":
			return "PACE||%s||Class-relative outright speed. This car sits inside its own class ladder, so prototypes and top formula packages naturally read faster than GT, touring, road, or kart machinery." % descriptor
		"driveability":
			return "DRIVEABILITY||%s||Higher values mean the car is easier to trust on braking, rotation, and long runs when the setup is not perfect." % descriptor
		"reliability_rating":
			return "RELIABILITY||%s||This reads how likely the package is to survive prep and race weekends without turning into a workshop problem." % descriptor
		"operating_cost":
			return "OPERATING COST||%s||Lower is better here. This covers service burden, wear sensitivity, and the money needed to campaign the package." % descriptor
		_:
			return descriptor


func _make_custom_tooltip(for_text: String) -> Object:
	var parts: PackedStringArray = for_text.split("||")
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.03, 0.05, 0.08, 0.97)
	style.border_color = Color(0.968627, 0.921569, 0.32549, 0.58)
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	panel.add_theme_stylebox_override("panel", style)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 14)
	panel.add_child(margin)

	var stack := VBoxContainer.new()
	stack.custom_minimum_size = Vector2(360.0, 0.0)
	stack.add_theme_constant_override("separation", 4)
	margin.add_child(stack)

	if parts.size() >= 1:
		var title := _txt(parts[0], "title", 15, Y)
		title.custom_minimum_size = Vector2(360.0, 20.0)
		title.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		stack.add_child(title)
	if parts.size() >= 2:
		var descriptor := _txt(parts[1], "body", 13, Color("D9F9A5"))
		descriptor.custom_minimum_size = Vector2(360.0, 18.0)
		descriptor.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		stack.add_child(descriptor)
	if parts.size() >= 3:
		var body := _txt(parts[2], "body", 14, Color.WHITE)
		body.custom_minimum_size = Vector2(360.0, 0.0)
		body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		body.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		stack.add_child(body)

	return panel


func _market_action_state(listing: Dictionary) -> Dictionary:
	var listing_id := str(listing.get("id", ""))
	if str(listing.get("market_type", "")) == "auction":
		var block: Variant = listing.get("auction", {})
		var status := "open"
		var leading := false
		if block is Dictionary:
			status = str((block as Dictionary).get("status", "open"))
			leading = str((block as Dictionary).get("high_bidder_id", "")) == "player"
		if status in ["sold", "won", "unsold"]:
			return {"label": "CLOSED", "disabled": true, "is_auction": true}
		if status == "closing":
			return {"label": "ATTEND", "disabled": false, "is_auction": true}
		return {"label": ("LEADING" if leading else "BID"), "disabled": false, "is_auction": true}
	if PrototypeState.startup_car_purchased and listing_id == PrototypeState.startup_last_purchase_listing_id:
		return {"label": "SIGNED", "disabled": true}
	return {"label": "BUY", "disabled": false}


func _build_market_stat_segment(pos: Vector2, seg_size: Vector2, is_filled: bool, fill_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(seg_size.x, seg_size.y + 7.196)
	var fill_texture := _load_svg_texture(MARKET_STAT_SEGMENT_FILL_PATH, 1.0)
	var outline_texture := _load_svg_texture(MARKET_STAT_SEGMENT_OUTLINE_PATH, 1.0)

	if is_filled and fill_texture != null:
		var shadow := TextureRect.new()
		shadow.texture = fill_texture
		shadow.position = Vector2(0.0, 7.196)
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


func _build_action_button(text: String, pos: Vector2, button_size: Vector2, font_size: int, action: Callable, is_disabled: bool = false) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = button_size

	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.92) if not is_disabled else Color(0.22, 0.24, 0.28, 0.92)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var label := _txt(text, "title", font_size, Color("13131A") if not is_disabled else Color("D0D3D6"))
	label.position = Vector2(0.0, 1.0)
	label.size = wrap.size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.disabled = is_disabled
	button.pressed.connect(action)
	wrap.add_child(button)

	return wrap


func _build_listing_strip() -> Control:
	var card := _panel(LIST_RECT)
	var left_arrow_pos := Vector2(24.0, 125.0)
	var right_arrow_pos := Vector2(2270.0, 125.0)
	var arrow_size := Vector2(86.0, 86.0)
	var filtered := _filtered_listings()
	if filtered.is_empty():
		card.add_child(_build_empty_listing_state())
		return card
	card.add_child(_build_arrow_button(left_arrow_pos, true))
	card.add_child(_build_arrow_button(right_arrow_pos, false))

	var visible := _visible_listings()
	var card_size := Vector2(372.0, 295.0)
	var visible_count := visible.size()
	if visible_count <= 0:
		card.add_child(_build_empty_listing_state())
		return card

	var usable_left: float = left_arrow_pos.x + arrow_size.x
	var usable_right: float = right_arrow_pos.x
	var available_width: float = usable_right - usable_left
	var total_card_width: float = card_size.x * float(visible_count)
	var gap: float = maxf(24.0, (available_width - total_card_width) / float(visible_count + 1))
	var start_x: float = usable_left + gap
	for index in range(visible_count):
		card.add_child(
			_build_listing_card(
				visible[index],
				Rect2(Vector2(start_x + float(index) * (card_size.x + gap), 27.0), card_size)
			)
		)

	return card


func _build_empty_listing_state() -> Control:
	var wrap := _panel_with_colors(
		Rect2(Vector2(260.0, 46.0), Vector2(1860.0, 260.0)),
		Color(0.03, 0.05, 0.08, 0.64),
		Color(1.0, 1.0, 1.0, 0.08)
	)
	var title := _txt("No Cars Match", "title", 36, Y)
	title.position = Vector2(0.0, 54.0)
	title.size = Vector2(1860.0, 42.0)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(title)

	var body := _txt(
		"No listings fit the current market tab and filter combination.",
		"body",
		20,
		Color.WHITE
	)
	body.position = Vector2(240.0, 112.0)
	body.size = Vector2(1380.0, 28.0)
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(body)

	var hint := _txt(
		"Try switching market type or broadening the class, condition, or sort filters.",
		"body",
		17,
		MUTED
	)
	hint.position = Vector2(180.0, 150.0)
	hint.size = Vector2(1500.0, 24.0)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(hint)
	return wrap


func _build_listing_card(listing: Dictionary, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	wrap.clip_contents = true
	var listing_id := str(listing.get("id", ""))
	var is_selected := listing_id == selected_listing_id

	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.10, 0.12, 0.15, 0.96) if is_selected else Color(0.10, 0.12, 0.15, 0.92)
	style.border_color = Y if is_selected else Color(1, 1, 1, 0.10)
	style.set_border_width_all(3 if is_selected else 2)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var img_frame := Control.new()
	img_frame.position = Vector2(8.0, 35.8)
	img_frame.size = Vector2(372.2901, 144.7218)
	img_frame.clip_contents = true
	wrap.add_child(img_frame)

	var img := TextureRect.new()
	img.texture = _texture_from_listing(listing)
	img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	img.stretch_mode = TextureRect.STRETCH_SCALE
	img.position = Vector2(-9.754, -5.268)
	img.size = Vector2(431.430, 161.653)
	img.modulate = Color(1, 1, 1, 0.95)
	img_frame.add_child(img)

	var card_title_text := _card_display_title(listing)
	var title := _txt(card_title_text, "title", _card_title_font_size(card_title_text), Y)
	title.position = Vector2(14.0, 182.0)
	title.size = Vector2(344.0, 108.0)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.clip_contents = true
	wrap.add_child(title)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.tooltip_text = _listing_quick_summary(listing)
	button.pressed.connect(_on_listing_pressed.bind(listing_id))
	wrap.add_child(button)

	return wrap


func _build_tab_button(tab_id: String, label_text: String, rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size
	var active := tab_id == selected_market_tab
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var shell := PanelContainer.new()
	shell.size = rect.size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1.0, 0.98, 0.33, 0.08) if active else Color(1.0, 1.0, 1.0, 0.04)
	style.border_color = BORDER if active else Color(1.0, 1.0, 1.0, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(14)
	shell.add_theme_stylebox_override("panel", style)
	wrap.add_child(shell)

	var title := _txt("MARKET", "body", 14, Color("BCBCBD"))
	title.position = Vector2(18.0, 14.0)
	title.size = Vector2(rect.size.x - 36.0, 18.0)
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(title)

	var label := _txt(label_text, "title", 24, Y if active else Color.WHITE)
	label.position = Vector2(18.0, 38.0)
	label.size = Vector2(rect.size.x - 36.0, 28.0)
	label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.tooltip_text = "Show %s listings." % label_text
	button.pressed.connect(_on_tab_pressed.bind(tab_id))
	wrap.add_child(button)

	return wrap


func _build_filter_button(prefix: String, selected_value: String, rect: Rect2, filter_id: String) -> Control:
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

	var prefix_label := _txt(prefix.to_upper(), "body", 11, MUTED)
	prefix_label.position = Vector2(18.0, 14.0)
	prefix_label.size = Vector2(rect.size.x - 50.0, 18.0)
	prefix_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	prefix_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	wrap.add_child(prefix_label)

	var value_label := _txt(selected_value, "title", 24, Color.WHITE)
	value_label.position = Vector2(18.0, 38.0)
	value_label.size = Vector2(rect.size.x - 56.0, 28.0)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	value_label.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	value_label.clip_contents = true
	wrap.add_child(value_label)

	var chevron := _build_material_icon(CHEVRON_DOWN_ICON_PATH, Vector2(rect.size.x - 34.0, 34.0), Vector2(18.0, 18.0), Y)
	if chevron != null:
		wrap.add_child(chevron)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = rect.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_filter_button_pressed.bind(filter_id))
	wrap.add_child(button)

	return wrap


func _build_filter_dropdown(pos: Vector2, size: Vector2, options: Array[String], selected_value: String, filter_id: String) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = size
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.z_as_relative = false
	wrap.z_index = 120

	var bg := PanelContainer.new()
	bg.size = size
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.08, 0.11, 1.0)
	style.border_color = Y
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(8.0, 8.0)
	scroll.size = size - Vector2(16.0, 16.0)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.clip_contents = true
	scroll.z_index = 121
	wrap.add_child(scroll)

	var list := VBoxContainer.new()
	list.custom_minimum_size = Vector2(scroll.size.x - 10.0, max(scroll.size.y, float(options.size()) * 44.0))
	list.add_theme_constant_override("separation", 6)
	scroll.add_child(list)

	for option in options:
		list.add_child(_build_filter_option(option, selected_value, filter_id))

	return wrap


func _build_filter_option(option: String, selected_value: String, filter_id: String) -> Control:
	var wrap := Control.new()
	wrap.custom_minimum_size = Vector2(180.0, 38.0)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var bg := PanelContainer.new()
	bg.size = Vector2(180.0, 38.0)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.968627, 0.921569, 0.32549, 0.18) if option == selected_value else Color(0, 0, 0, 0)
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)

	var label := _txt(option, "body", 19, Y if option == selected_value else Color.WHITE)
	label.position = Vector2(12.0, 4.0)
	label.size = Vector2(150.0, 28.0)
	wrap.add_child(label)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = Vector2(180.0, 38.0)
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_on_filter_option_pressed.bind(filter_id, option))
	wrap.add_child(button)

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

	var icon := _build_material_icon(ARROW_LEFT_ICON_PATH if is_left else ARROW_RIGHT_ICON_PATH, Vector2(21.0, 21.0), Vector2(44.0, 44.0), Y)
	if icon != null:
		wrap.add_child(icon)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.disabled = (_filtered_listings().size() <= 5) or (is_left and carousel_offset <= 0) or ((not is_left) and carousel_offset >= max(0, _filtered_listings().size() - 5))
	button.pressed.connect(_on_arrow_pressed.bind(is_left))
	wrap.add_child(button)

	return wrap


func _on_tab_pressed(tab_id: String) -> void:
	selected_market_tab = tab_id
	market_notice_text = ""
	if not _condition_filter_options().has(selected_condition_filter):
		selected_condition_filter = "All"
	selected_class_filter = "All"
	selected_sort_filter = "Price: Low"
	open_filter_id = ""
	carousel_offset = 0
	_sync_selection()
	_build_ui()


func _on_filter_button_pressed(filter_id: String) -> void:
	open_filter_id = "" if open_filter_id == filter_id else filter_id
	_build_ui()


func _on_filter_option_pressed(filter_id: String, option: String) -> void:
	if filter_id == "condition":
		selected_condition_filter = option
		if not _class_filter_options().has(selected_class_filter):
			selected_class_filter = "All"
	elif filter_id == "class":
		selected_class_filter = option
	elif filter_id == "sort":
		selected_sort_filter = option
	else:
		selected_condition_filter = option
	open_filter_id = ""
	market_notice_text = ""
	carousel_offset = 0
	_sync_selection()
	_build_ui()


func _on_detail_tab_pressed(tab_id: String) -> void:
	selected_detail_tab = tab_id
	_build_ui()


func _on_arrow_pressed(is_left: bool) -> void:
	var filtered := _filtered_listings()
	if filtered.is_empty():
		return
	var current_index: int = _selected_listing_index(filtered)
	var delta: int = -1 if is_left else 1
	var max_offset: int = max(0, filtered.size() - 5)
	carousel_offset = clampi(carousel_offset + delta, 0, max_offset)
	current_index = clampi(current_index + delta, 0, filtered.size() - 1)
	selected_listing_id = str((filtered[current_index] as Dictionary).get("id", ""))
	_build_ui()


func _on_listing_pressed(listing_id: String) -> void:
	selected_listing_id = listing_id
	_build_ui()


func _open_listing_detail() -> void:
	var listing := _current_listing()
	if listing.is_empty():
		return
	detail_listing_id = str(listing.get("id", ""))
	_build_ui()


func _close_listing_detail() -> void:
	detail_listing_id = ""
	_build_ui()


func _buy_selected_listing() -> void:
	var listing := _current_listing()
	if listing.is_empty():
		return
	pending_buy_listing_id = str(listing.get("id", ""))
	_build_ui()


func _cancel_buy_confirmation() -> void:
	pending_buy_listing_id = ""
	_build_ui()


func _confirm_buy_selected_listing() -> void:
	if pending_buy_listing_id.is_empty():
		return
	var result: Dictionary = PrototypeState.acquire_marketplace_listing(pending_buy_listing_id, "buy")
	market_notice_text = "Deal signed. %s" % str(result.get("message", ""))
	market_notice_kind = "success" if bool(result.get("ok", false)) else "error"
	pending_buy_listing_id = ""
	detail_listing_id = ""
	if bool(result.get("ok", false)):
		selected_listing_id = ""
	_build_ui()


func _lease_selected_listing() -> void:
	var listing := _current_listing()
	if listing.is_empty():
		return
	PrototypeState.acquire_marketplace_listing(str(listing.get("id", "")), "lease")
	detail_listing_id = ""
	_build_ui()


func _open_bid_modal() -> void:
	var listing := _current_listing()
	if listing.is_empty() or str(listing.get("market_type", "")) != "auction":
		return
	pending_bid_listing_id = str(listing.get("id", ""))
	_build_ui()


func _close_bid_modal() -> void:
	pending_bid_listing_id = ""
	_build_ui()


func _pending_bid_listing() -> Dictionary:
	for listing_variant in _market_listings():
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("id", "")) == pending_bid_listing_id:
			return listing
	return {}


func _bid_min() -> void:
	_submit_bid(0.0)


func _bid_max_step_low() -> void:
	_submit_bid(5.0)


func _bid_max_step_high() -> void:
	_submit_bid(10.0)


func _submit_bid(extra_increments: float) -> void:
	var listing := _pending_bid_listing()
	if listing.is_empty():
		return
	var block: Dictionary = listing.get("auction", {}) if listing.get("auction", {}) is Dictionary else {}
	var current_bid := float(block.get("current_bid", 0.0))
	var increment := float(block.get("min_increment", 1000.0))
	var min_next := float(listing.get("minimum_bid", current_bid + increment))
	var proxy_max := min_next + extra_increments * increment
	var result: Dictionary = PrototypeState.place_auction_bid(pending_bid_listing_id, min_next, proxy_max)
	market_notice_text = str(result.get("message", ""))
	market_notice_kind = "success" if bool(result.get("ok", false)) and bool(result.get("leading", false)) else ("info" if bool(result.get("ok", false)) else "error")
	_build_ui()


func _build_bid_modal() -> Control:
	var listing := _pending_bid_listing()
	if listing.is_empty():
		return Control.new()
	var block: Dictionary = listing.get("auction", {}) if listing.get("auction", {}) is Dictionary else {}

	var overlay := Control.new()
	overlay.size = Vector2(DW, DH)
	var dim := ColorRect.new()
	dim.color = Color(0.0, 0.0, 0.0, 0.74)
	dim.size = overlay.size
	overlay.add_child(dim)

	var panel := _panel_with_colors(
		Rect2(Vector2(1120.0, 560.0), Vector2(1600.0, 940.0)),
		Color(0.03, 0.05, 0.08, 0.97),
		Color(0.788, 0.635, 0.153, 0.7)
	)
	overlay.add_child(panel)

	var status := str(block.get("status", "open")).to_upper()
	var eyebrow := _txt("LIVE AUCTION · %s" % status, "body", 17, MUTED)
	eyebrow.position = Vector2(46.0, 30.0)
	eyebrow.size = Vector2(700.0, 24.0)
	panel.add_child(eyebrow)

	var title := _txt(_hero_display_title(listing), "title", 34, Y)
	title.position = Vector2(46.0, 56.0)
	title.size = Vector2(1500.0, 90.0)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	panel.add_child(title)

	var current_bid := float(block.get("current_bid", 0.0))
	var increment := float(block.get("min_increment", 1000.0))
	var min_next := float(listing.get("minimum_bid", current_bid + increment))
	var leading := str(block.get("high_bidder_id", "")) == "player"
	var high_name: String = "You" if leading else str(block.get("high_bidder_name", "—"))
	var reserve_text := "Met" if bool(block.get("reserve_met", false)) else "Not met"
	var your_max := float(block.get("player_proxy_max", 0.0))
	var close_week := int(block.get("close_week", 0))

	panel.add_child(_build_compact_confirm_row("Current Bid", _format_money(current_bid), Vector2(46.0, 170.0), true))
	panel.add_child(_build_compact_confirm_row("High Bidder", high_name, Vector2(46.0, 234.0)))
	panel.add_child(_build_compact_confirm_row("Reserve", reserve_text, Vector2(46.0, 298.0)))
	panel.add_child(_build_compact_confirm_row("Your Max", _format_money(your_max) if your_max > 0.0 else "None", Vector2(46.0, 362.0)))
	panel.add_child(_build_compact_confirm_row("Min Next Bid", _format_money(min_next), Vector2(46.0, 426.0)))
	panel.add_child(_build_compact_confirm_row("Closes", "Week %d (now %d)" % [close_week, PrototypeState.current_week], Vector2(46.0, 490.0)))

	var history_label := _txt("RECENT BIDS", "body", 15, MUTED)
	history_label.position = Vector2(46.0, 566.0)
	history_label.size = Vector2(400.0, 22.0)
	panel.add_child(history_label)

	var history: Array = block.get("bid_history", [])
	var shown_history: Array = history.slice(maxi(0, history.size() - 4), history.size())
	var hy := 596.0
	if shown_history.is_empty():
		var none := _txt("No bids yet — opening price stands.", "body", 17, Color.WHITE)
		none.position = Vector2(46.0, hy)
		none.size = Vector2(1500.0, 26.0)
		panel.add_child(none)
	else:
		shown_history.reverse()
		for entry_variant in shown_history:
			if typeof(entry_variant) != TYPE_DICTIONARY:
				continue
			var entry: Dictionary = entry_variant as Dictionary
			var bidder: String = "You" if str(entry.get("bidder_id", "")) == "player" else str(entry.get("bidder_name", "Rival"))
			var line := _txt("%s — %s" % [bidder, _format_money(float(entry.get("amount", 0.0)))], "body", 17, Color.WHITE)
			line.position = Vector2(46.0, hy)
			line.size = Vector2(1500.0, 26.0)
			panel.add_child(line)
			hy += 30.0

	var disabled := str(block.get("status", "open")) in ["sold", "won", "unsold"]
	if not disabled:
		panel.add_child(_build_modal_button("Bid %s" % _format_money(min_next), Vector2(46.0, 850.0), Vector2(480.0, 54.0), true, Callable(self, "_bid_min")))
		panel.add_child(_build_modal_button("Max %s" % _format_money(min_next + 5.0 * increment), Vector2(556.0, 850.0), Vector2(480.0, 54.0), false, Callable(self, "_bid_max_step_low")))
		panel.add_child(_build_modal_button("Max %s" % _format_money(min_next + 10.0 * increment), Vector2(1066.0, 850.0), Vector2(488.0, 54.0), false, Callable(self, "_bid_max_step_high")))
	panel.add_child(_build_modal_button("Close", Vector2(1300.0, 30.0), Vector2(254.0, 50.0), false, Callable(self, "_close_bid_modal")))

	return overlay


func _format_money(value: float) -> String:
	var rounded: int = int(round(value))
	var whole := "%d" % absi(rounded)
	var parts: Array[String] = []
	var remaining := whole
	while remaining.length() > 3:
		parts.push_front(remaining.right(3))
		remaining = remaining.left(remaining.length() - 3)
	parts.push_front(remaining)
	return "$%s" % " ".join(parts)


func _sync_selection() -> void:
	var filtered := _filtered_listings()
	if filtered.is_empty():
		selected_listing_id = ""
		return
	for listing in filtered:
		if str(listing.get("id", "")) == selected_listing_id:
			return
	selected_listing_id = str(filtered[0].get("id", ""))


func _selected_listing_index(filtered: Array) -> int:
	for index in range(filtered.size()):
		var listing_variant: Variant = filtered[index]
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("id", "")) == selected_listing_id:
			return index
	return 0


func _current_listing() -> Dictionary:
	for listing in _filtered_listings():
		if str(listing.get("id", "")) == selected_listing_id:
			return listing
	var filtered := _filtered_listings()
	return filtered[0] if not filtered.is_empty() else {}


func _current_listing_texture() -> Texture2D:
	return _texture_from_listing(_current_listing())


func _listing_quick_summary(listing: Dictionary) -> String:
	return "%s | %s | %s | %s" % [
		str(listing.get("class_name", "Unknown")),
		_market_stat_descriptor("pace", _stat_ratio(listing, "pace"), listing),
		_market_stat_descriptor("reliability_rating", _stat_ratio(listing, "reliability_rating"), listing),
		str(listing.get("price_label", "$0"))
	]


func _detail_listing() -> Dictionary:
	for listing_variant in _market_listings():
		var listing: Dictionary = listing_variant
		if str(listing.get("id", "")) == detail_listing_id:
			return listing
	return _current_listing()


func _texture_from_listing(listing: Dictionary) -> Texture2D:
	var path := str(listing.get("image_path", ""))
	var texture := _load_listing_texture(path)
	if texture != null:
		return texture
	return DEFAULT_CAR_TEXTURE


func _load_listing_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if ResourceLoader.exists(path):
		var res_texture: Texture2D = load(path)
		if res_texture != null:
			return res_texture
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		file_path = path
	if not FileAccess.file_exists(file_path):
		return null
	if icon_texture_cache.has(file_path):
		return icon_texture_cache[file_path]
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	icon_texture_cache[file_path] = texture
	return texture


func _visible_listings() -> Array:
	var filtered := _filtered_listings()
	var visible: Array = []
	for index in range(carousel_offset, min(filtered.size(), carousel_offset + 5)):
		visible.append(filtered[index])
	return visible


func _filtered_listings() -> Array:
	var rows: Array = []
	for listing_variant in _market_listings():
		var listing: Dictionary = listing_variant
		if str(listing.get("market_type", "")) != selected_market_tab:
			continue
		if selected_condition_filter != "All" and str(listing.get("condition", "")).capitalize() != selected_condition_filter:
			continue
		if selected_class_filter != "All" and str(listing.get("class_name", "")) != selected_class_filter:
			continue
		rows.append(listing)
	match selected_sort_filter:
		"Price: High":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a.get("current_price", 0.0)) > float(b.get("current_price", 0.0)))
		"Condition":
			var rank := {"excellent": 0, "good": 1, "fair": 2, "project": 3}
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
				return int(rank.get(str(a.get("condition", "project")), 99)) < int(rank.get(str(b.get("condition", "project")), 99))
			)
		"Performance":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("performance", 0)) > int(b.get("performance", 0)))
		"Reliability":
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("reliability", 0)) > int(b.get("reliability", 0)))
		_:
			rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a.get("current_price", 0.0)) < float(b.get("current_price", 0.0)))
	return rows


func _condition_filter_options() -> Array[String]:
	return ["All", "Excellent", "Good", "Fair", "Project"]


func _class_filter_options() -> Array[String]:
	var options: Array[String] = ["All"]
	for listing_variant in _market_listings():
		var listing: Dictionary = listing_variant
		if str(listing.get("market_type", "")) != selected_market_tab:
			continue
		if selected_condition_filter != "All" and str(listing.get("condition", "")).capitalize() != selected_condition_filter:
			continue
		var value := str(listing.get("class_name", ""))
		if not options.has(value):
			options.append(value)
	return options


func _sort_filter_options() -> Array[String]:
	return ["Price: Low", "Price: High", "Condition", "Performance", "Reliability"]


func _market_listings() -> Array:
	var runtime_listings: Array = PrototypeState.get_marketplace_listings()
	if not runtime_listings.is_empty():
		if PrototypeState.startup_car_purchased and not PrototypeState.startup_last_purchase_listing_id.is_empty():
			var sale_rows: Array = []
			for listing_variant in runtime_listings:
				if typeof(listing_variant) != TYPE_DICTIONARY:
					continue
				var listing: Dictionary = listing_variant as Dictionary
				if str(listing.get("id", "")) == PrototypeState.startup_last_purchase_listing_id:
					continue
				sale_rows.append(listing)
			return sale_rows
		return runtime_listings
	return [
		{"id": "porsche-new-1", "market_type": "new", "class_name": "One-Make", "car_filter": "Porsche", "hero_title": "PORSCHE 911\nCARRERA CUP\n3.8", "card_title": "PORSCHE 911\nCARRERA CUP 3.8", "price_label": "$190 000", "acc": 0.88, "top_speed": 0.91, "braking": 0.86, "handling": 0.84, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "porsche-new-2", "market_type": "new", "class_name": "One-Make", "car_filter": "Porsche", "hero_title": "PORSCHE 911\nCARRERA CUP\n3.8", "card_title": "PORSCHE 911\nCARRERA CUP 3.8", "price_label": "$193 000", "acc": 0.87, "top_speed": 0.90, "braking": 0.85, "handling": 0.83, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "porsche-new-3", "market_type": "new", "class_name": "Cup", "car_filter": "Porsche", "hero_title": "PORSCHE 718\nGT4 CLUBSPORT", "card_title": "PORSCHE 718\nGT4 CLUBSPORT", "price_label": "$167 000", "acc": 0.79, "top_speed": 0.83, "braking": 0.82, "handling": 0.85, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "bmw-new-2", "market_type": "new", "class_name": "Touring", "car_filter": "BMW", "hero_title": "BMW M4\nTC EVO", "card_title": "BMW M4\nTC EVO", "price_label": "$176 000", "acc": 0.80, "top_speed": 0.82, "braking": 0.79, "handling": 0.80, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "mustang-new-1", "market_type": "new", "class_name": "GT", "car_filter": "Ford", "hero_title": "FORD MUSTANG\nGT4", "card_title": "FORD MUSTANG\nGT4", "price_label": "$184 000", "acc": 0.81, "top_speed": 0.84, "braking": 0.78, "handling": 0.79, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "alpine-new-1", "market_type": "new", "class_name": "Prototype", "car_filter": "Alpine", "hero_title": "ALPINE A110\nCUP", "card_title": "ALPINE A110\nCUP", "price_label": "$171 000", "acc": 0.78, "top_speed": 0.80, "braking": 0.82, "handling": 0.84, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "ferrari-used-1", "market_type": "used", "class_name": "GT", "car_filter": "Ferrari", "hero_title": "FERRARI 430\nSCUDERIA\n'07", "card_title": "FERRARI 430\nSCUDERIA '07", "price_label": "$148 000", "acc": 0.82, "top_speed": 0.88, "braking": 0.78, "handling": 0.80, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "bmw-used-1", "market_type": "used", "class_name": "Touring", "car_filter": "BMW", "hero_title": "BMW M4\nCOUPÉ\n'18", "card_title": "BMW M4\nCOUPÉ '18", "price_label": "$132 000", "acc": 0.74, "top_speed": 0.80, "braking": 0.76, "handling": 0.77, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "civic-used-2", "market_type": "used", "class_name": "Touring", "car_filter": "Honda", "hero_title": "HONDA CIVIC\nTCR\n'20", "card_title": "HONDA CIVIC\nTCR '20", "price_label": "$118 000", "acc": 0.73, "top_speed": 0.78, "braking": 0.77, "handling": 0.79, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "merc-used-1", "market_type": "used", "class_name": "GT", "car_filter": "Mercedes", "hero_title": "MERCEDES AMG\nGT4", "card_title": "MERCEDES AMG\nGT4", "price_label": "$139 000", "acc": 0.79, "top_speed": 0.82, "braking": 0.80, "handling": 0.78, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "mazda-auction-1", "market_type": "auction", "class_name": "Road", "car_filter": "Mazda", "hero_title": "MAZDA RX-7\nSPIRIT R\n'03", "card_title": "MAZDA RX-7\n'03", "price_label": "$86 000", "acc": 0.69, "top_speed": 0.78, "braking": 0.70, "handling": 0.79, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "supra-auction-1", "market_type": "auction", "class_name": "GT", "car_filter": "Toyota", "hero_title": "TOYOTA GR\nSUPRA RACING\n'18", "card_title": "TOYOTA GR\nSUPRA RACING '18", "price_label": "$101 000", "acc": 0.76, "top_speed": 0.82, "braking": 0.73, "handling": 0.78, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "lotus-auction-1", "market_type": "auction", "class_name": "Cup", "car_filter": "Lotus", "hero_title": "LOTUS EXIGE\nCUP 430", "card_title": "LOTUS EXIGE\nCUP 430", "price_label": "$95 000", "acc": 0.74, "top_speed": 0.79, "braking": 0.75, "handling": 0.81, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "civic-used-1", "market_type": "used", "class_name": "Touring", "car_filter": "Honda", "hero_title": "HONDA CIVIC\nTYPE R\n'98", "card_title": "HONDA CIVIC\nTYPE R '98", "price_label": "$72 000", "acc": 0.65, "top_speed": 0.70, "braking": 0.72, "handling": 0.75, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "bmw-new-1", "market_type": "new", "class_name": "GT", "car_filter": "BMW", "hero_title": "BMW M4\nGT PACK\n'24", "card_title": "BMW M4\nGT PACK '24", "price_label": "$205 000", "acc": 0.84, "top_speed": 0.86, "braking": 0.81, "handling": 0.82, "image_path": "res://assets/images/figma-hq/race-car.png"},
		{"id": "toyota-new-1", "market_type": "new", "class_name": "GT", "car_filter": "Toyota", "hero_title": "TOYOTA GR\nSUPRA EVO\n'24", "card_title": "TOYOTA GR\nSUPRA EVO '24", "price_label": "$198 000", "acc": 0.83, "top_speed": 0.85, "braking": 0.80, "handling": 0.81, "image_path": "res://assets/images/figma-hq/race-car.png"},
	]


func _build_listing_detail_modal() -> Control:
	var overlay := Control.new()
	overlay.size = Vector2(DW, DH)

	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.76)
	dim.size = overlay.size
	overlay.add_child(dim)

	var rect := Rect2(Vector2(430.0, 250.0), Vector2(2980.0, 1420.0))
	var panel := _panel_with_colors(rect, Color(0.03, 0.05, 0.08, 0.985), Color(0.968627, 0.921569, 0.32549, 0.75))
	overlay.add_child(panel)

	var listing := _detail_listing()
	var title := _txt(str(listing.get("card_title", "MARKET LISTING")), "title", 30, Y)
	title.position = Vector2(52.0, 38.0)
	title.size = Vector2(1700.0, 72.0)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	title.clip_contents = true
	panel.add_child(title)

	var subtitle := _txt(
		"%s  |  %s  |  %s" % [
			str(listing.get("manufacturer_name", listing.get("car_filter", "Unknown"))),
			str(listing.get("class_name", "Unknown Class")),
			str(listing.get("condition", "excellent")).capitalize()
		],
		"body",
		18,
		Color.WHITE
	)
	subtitle.position = Vector2(52.0, 102.0)
	subtitle.size = Vector2(1700.0, 28.0)
	panel.add_child(subtitle)

	var close_button := _build_action_button("CLOSE", Vector2(2768.0, 38.0), Vector2(156.0, 40.0), 16, Callable(self, "_close_listing_detail"))
	panel.add_child(close_button)

	var image_frame := Control.new()
	image_frame.position = Vector2(52.0, 154.0)
	image_frame.size = Vector2(1088.0, 452.0)
	image_frame.clip_contents = true
	panel.add_child(image_frame)

	var image_bg := ColorRect.new()
	image_bg.color = Color(0.06, 0.08, 0.11, 1.0)
	image_bg.size = image_frame.size
	image_frame.add_child(image_bg)

	var image := TextureRect.new()
	image.texture = _texture_from_listing(listing)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	image.size = image_frame.size
	image_frame.add_child(image)

	var primary_price := _txt(str(listing.get("price_label", "$0")), "title", 30, Y)
	primary_price.position = Vector2(52.0, 634.0)
	primary_price.size = Vector2(440.0, 42.0)
	panel.add_child(primary_price)

	var type_label := _txt(
		"TYPE: %s    PERF: %s    REL: %s%%    MILEAGE: %s KM" % [
			str(listing.get("market_type", "new")).to_upper(),
			str(listing.get("performance", 0)),
			str(listing.get("reliability", 0)),
			str(listing.get("mileage", 0))
		],
		"body",
		18,
		Color.WHITE
	)
	type_label.position = Vector2(52.0, 684.0)
	type_label.size = Vector2(1088.0, 56.0)
	type_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	panel.add_child(type_label)

	if str(listing.get("market_type", "")) == "auction":
		var auction_block: Variant = listing.get("auction", {})
		var auction_status := str((auction_block as Dictionary).get("status", "open")) if auction_block is Dictionary else "open"
		var bid_label := "ATTEND LIVE" if auction_status == "closing" else "PLACE BID"
		var bid_disabled := auction_status in ["sold", "won", "unsold"]
		panel.add_child(_build_action_button(bid_label, Vector2(52.0, 766.0), Vector2(318.0, 42.0), 18, Callable(self, "_open_bid_modal"), bid_disabled))
	else:
		var open_buy := _build_action_button("BUY", Vector2(52.0, 766.0), Vector2(150.0, 42.0), 18, Callable(self, "_buy_selected_listing"))
		var open_lease := _build_action_button("LEASE", Vector2(220.0, 766.0), Vector2(150.0, 42.0), 18, Callable(self, "_lease_selected_listing"))
		panel.add_child(open_buy)
		panel.add_child(open_lease)

	var scroll := ScrollContainer.new()
	scroll.position = Vector2(1188.0, 154.0)
	scroll.size = Vector2(1738.0, 1214.0)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(scroll)

	var content := VBoxContainer.new()
	content.custom_minimum_size = Vector2(1660.0, 1214.0)
	content.add_theme_constant_override("separation", 14)
	scroll.add_child(content)

	content.add_child(_build_detail_section("Overview", [
		"Livery: %s" % str(listing.get("livery_name", listing.get("card_title", ""))),
		"Platform: %s" % str(listing.get("car_platform_id", "Unknown")),
		"Manufacturer: %s" % str(listing.get("manufacturer_name", listing.get("car_filter", "Unknown"))),
		"Target Series Fit: %s" % str(listing.get("series_filter_label", "Open Market")),
		"Compatible Series: %s" % ", ".join(PackedStringArray(_stringify_array(listing.get("eligible_series_labels", [])))),
	]))

	var wear: Dictionary = listing.get("part_wear", {})
	content.add_child(_build_detail_section("Condition", [
		"Engine Wear: %s%%" % str(wear.get("engine", 0)),
		"Chassis Wear: %s%%" % str(wear.get("chassis", 0)),
		"Gearbox Wear: %s%%" % str(wear.get("gearbox", 0)),
		"Brakes Wear: %s%%" % str(wear.get("brakes", 0)),
		"Suspension Wear: %s%%" % str(wear.get("suspension", 0)),
	]))

	var pricing: Dictionary = listing.get("price_breakdown", {})
	var pricing_lines: Array[String] = [
		"Ask Price: %s" % str(listing.get("price_label", "$0")),
	]
	if not pricing.is_empty():
		pricing_lines.append("Base: $%s" % str(pricing.get("base", 0)))
		pricing_lines.append("Wear Adjustment: $%s" % str(pricing.get("wearDiscount", 0)))
		pricing_lines.append("Mileage Adjustment: $%s" % str(pricing.get("mileageDiscount", 0)))
		pricing_lines.append("Service Bonus: $%s" % str(pricing.get("serviceBonus", 0)))
		pricing_lines.append("Upgrade Value: $%s" % str(pricing.get("upgradeValue", 0)))
		pricing_lines.append("Market Demand: $%s" % str(pricing.get("marketDemand", 0)))
	if str(listing.get("market_type", "")) == "auction":
		pricing_lines.append("Current Bid: $%s" % str(int(round(float(listing.get("current_bid", 0.0))))))
		pricing_lines.append("Minimum Bid: $%s" % str(int(round(float(listing.get("minimum_bid", 0.0))))))
		pricing_lines.append("Bid Count: %s" % str(listing.get("bid_count", 0)))
	content.add_child(_build_detail_section("Pricing", pricing_lines))

	var upgrades_lines: Array[String] = []
	for upgrade_variant in listing.get("installed_upgrades", []):
		if typeof(upgrade_variant) != TYPE_DICTIONARY:
			continue
		var upgrade: Dictionary = upgrade_variant
		upgrades_lines.append("%s (%s) +%s" % [
			str(upgrade.get("name", "Upgrade")),
			str(upgrade.get("type", "general")),
			str(upgrade.get("effect", 0))
		])
	if upgrades_lines.is_empty():
		upgrades_lines.append("No installed upgrades listed.")
	content.add_child(_build_detail_section("Installed Upgrades", upgrades_lines))

	var provenance: Dictionary = listing.get("provenance", {})
	var provenance_lines: Array[String] = []
	if not provenance.is_empty():
		provenance_lines.append("Previous Owners: %s" % str(provenance.get("previousOwners", 0)))
		provenance_lines.append("Original Purchase Year: %s" % str(provenance.get("originalPurchaseYear", "Unknown")))
		provenance_lines.append("Accident History: %s" % str(provenance.get("accidentHistory", 0)))
		var notable: Array[String] = _stringify_array(provenance.get("notableResults", []))
		if not notable.is_empty():
			provenance_lines.append("Notable Results: %s" % ", ".join(PackedStringArray(notable)))
	else:
		provenance_lines.append("No provenance data available.")
	content.add_child(_build_detail_section("History", provenance_lines))

	var service_lines: Array[String] = []
	for service_variant in listing.get("service_history", []):
		if typeof(service_variant) != TYPE_DICTIONARY:
			continue
		var service: Dictionary = service_variant
		service_lines.append(
			"%s %s - %s ($%s)" % [
				str(service.get("year", "")),
				str(service.get("week", "")),
				str(service.get("type", "service")).capitalize(),
				str(service.get("cost", 0))
			]
		)
		if service_lines.size() >= 6:
			break
	if service_lines.is_empty():
		service_lines.append("No service history available.")
	content.add_child(_build_detail_section("Service History", service_lines))

	return overlay


func _build_detail_section(title_text: String, lines: Array[String]) -> Control:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(1640.0, 0.0)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.10, 0.13, 1.0)
	style.border_color = Color(0.968627, 0.921569, 0.32549, 0.18)
	style.set_border_width_all(1)
	style.set_corner_radius_all(MENU_RADIUS)
	panel.add_theme_stylebox_override("panel", style)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 6)
	box.offset_left = 20
	box.offset_top = 16
	box.offset_right = 20
	box.offset_bottom = 16
	panel.add_child(box)

	var title := _txt(title_text, "title", 22, Y)
	title.custom_minimum_size = Vector2(1540.0, 28.0)
	box.add_child(title)

	for line in lines:
		var label := _txt(line, "body", 17, Color.WHITE)
		label.custom_minimum_size = Vector2(1540.0, 24.0)
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		box.add_child(label)

	return panel


func _hero_display_title(listing: Dictionary) -> String:
	var title := str(listing.get("card_title", listing.get("hero_title", "MARKET LISTING"))).replace("\n", " ").strip_edges()
	if title.length() <= 28:
		return title
	var words := title.split(" ", false)
	if words.size() < 3:
		return title
	var line_a := ""
	var line_b := ""
	for index in range(words.size()):
		var word := str(words[index])
		var next_a := word if line_a.is_empty() else "%s %s" % [line_a, word]
		var remaining := " ".join(words.slice(index + 1))
		if next_a.length() <= 24 or line_a.is_empty():
			line_a = next_a
			line_b = remaining
			continue
		line_b = "%s %s" % [word, remaining] if not remaining.is_empty() else word
		break
	if line_b.is_empty():
		return line_a
	return "%s\n%s" % [line_a, line_b]


func _hero_title_font_size(hero_title_text: String) -> int:
	var longest_line := 0
	for line_variant in hero_title_text.split("\n", false):
		var line_text := str(line_variant)
		longest_line = max(longest_line, line_text.length())
	if longest_line >= 28:
		return 24
	if longest_line >= 22:
		return 30
	if longest_line >= 18:
		return 34
	return 40


func _hero_title_height(hero_title_text: String, hero_font_size: int) -> float:
	var line_count := hero_title_text.split("\n", false).size()
	if line_count <= 1:
		return maxf(56.0, float(hero_font_size) + 14.0)
	return maxf(86.0, float(line_count) * float(hero_font_size + 10))


func _card_display_title(listing: Dictionary) -> String:
	var raw_title := str(listing.get("card_title", "")).replace("\n", " ").strip_edges()
	if raw_title.is_empty():
		return ""
	var words := raw_title.split(" ", false)
	if words.size() <= 2:
		return raw_title
	var lines: Array[String] = []
	var current_line := ""
	var max_chars_per_line: int = 18
	for word_variant in words:
		var word: String = str(word_variant)
		var candidate := word if current_line.is_empty() else "%s %s" % [current_line, word]
		if candidate.length() <= max_chars_per_line or current_line.is_empty():
			current_line = candidate
			continue
		lines.append(current_line)
		current_line = word
		if lines.size() == 2:
			break
	var consumed_words: int = 0
	for line in lines:
		consumed_words += line.split(" ", false).size()
	if not current_line.is_empty():
		lines.append(current_line)
		consumed_words += current_line.split(" ", false).size()
	if consumed_words < words.size():
		var remainder := " ".join(words.slice(consumed_words))
		if lines.size() >= 3:
			lines[2] = "%s %s" % [lines[2], remainder]
		else:
			lines.append(remainder)
	if lines.size() > 3:
		lines = lines.slice(0, 3)
	return "\n".join(lines)


func _card_title_font_size(card_title_text: String) -> int:
	var longest_line: int = 0
	for line_variant in card_title_text.split("\n", false):
		var line_text: String = str(line_variant)
		longest_line = max(longest_line, line_text.length())
	if longest_line >= 21:
		return 18
	if longest_line >= 18:
		return 20
	return 22


func _stringify_array(value: Variant) -> Array[String]:
	var out: Array[String] = []
	if not value is Array:
		return out
	for item in value as Array:
		out.append(str(item))
	return out


func _panel(rect: Rect2) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

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
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = BORDER
	border_style.set_border_width_all(2)
	border_style.set_corner_radius_all(MENU_RADIUS)
	border.add_theme_stylebox_override("panel", border_style)
	wrap.add_child(border)

	return wrap


func _panel_with_colors(rect: Rect2, bg_color: Color, border_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = rect.position
	wrap.size = rect.size

	var bg := PanelContainer.new()
	bg.size = rect.size
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = bg_color
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	wrap.add_child(bg)

	var border := PanelContainer.new()
	border.size = rect.size
	border.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var border_style := StyleBoxFlat.new()
	border_style.bg_color = Color(0, 0, 0, 0)
	border_style.border_color = border_color
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
