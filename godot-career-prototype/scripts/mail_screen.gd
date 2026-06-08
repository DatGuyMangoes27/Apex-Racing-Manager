extends Control

const PrototypeTheme = preload("res://scripts/prototype_theme.gd")
const PrototypeBottomNav = preload("res://scripts/prototype_bottom_nav.gd")
const PrototypeTopBar = preload("res://scripts/prototype_top_bar.gd")

const DW := 3840.0
const DH := 2160.0
const MAIL_LAYOUT_WIDTH := 2560.0
const MAIL_LAYOUT_SCALE := DW / MAIL_LAYOUT_WIDTH
const BG_TEXTURE = preload("res://assets/images/figma-hq/hq-background-highres.jpg")
const PARTNER_PORTRAIT_DIR := "res://../public/images/generated/partners"
const ICON_DIR := "res://assets/images/material-icons"
const CHECK_ICON_PATH := ICON_DIR + "/check.svg"
const DELETE_ICON_PATH := ICON_DIR + "/delete.svg"
const STAR_ICON_PATH := ICON_DIR + "/star.png"
const STAR_OUTLINE_ICON_PATH := ICON_DIR + "/star_outline.png"

const Y := Color("F7EB53")
const PANEL_BG := Color(0, 0, 0, 0.38)
const BORDER := Color(0.968627, 0.921569, 0.32549, 0.7)
const COPY := Color("C0BEBF")
const MUTED := Color("8C8E91")
const CYAN := Color("1D93C1")
const MAGENTA := Color("C85388")
const PURPLE := Color("AA7CDE")
const ORANGE := Color("E38A2E")
const RED := Color("E43E3F")
const LIGHT_ROW := Color("B4B4B4")
const MENU_RADIUS := 4

const LEFT_RECT := Rect2(Vector2(95.0, 144.0), Vector2(331.0, 1152.0))
const LIST_RECT := Rect2(Vector2(472.0, 144.0), Vector2(865.0, 1152.0))
const DETAIL_RECT := Rect2(Vector2(1370.0, 144.0), Vector2(1071.0, 1152.0))
const LIST_SCROLL_POS := Vector2(16.0, 150.0)
const LIST_SCROLL_SIZE := Vector2(824.0, 982.0)
const LIST_ROW_WIDTH := 802.0
const LIST_ROW_HEIGHT := 128.0
const LIST_ROW_GAP := 21.0
const DETAIL_HEADER_HEIGHT := 164.0
const DETAIL_BODY_SCROLL_POS := Vector2(34.0, 360.0)
const DETAIL_BODY_SCROLL_SIZE := Vector2(988.0, 520.0)
const DETAIL_BODY_SCROLL_SIZE_NO_RESPONSE := Vector2(988.0, 520.0)
const DETAIL_BODY_TEXT := Color.WHITE
const DETAIL_HEADING_TEXT := Color.WHITE

var selected_category_id := ""
var selected_mail_id := ""
var active_mail_lane := "all"
var list_scroll_value := 0.0
var portrait_texture_cache: Dictionary = {}
var icon_texture_cache: Dictionary = {}
var svg_texture_cache: Dictionary = {}
var driver_avatar_mask_material: ShaderMaterial
var icon_tint_shader: Shader

const SENDER_PORTRAITS := {
	"Natalie Pinkham": "partner-partner-0000",
	"Will Joseph": "partner-partner-0001",
	"Commercial Lead": "partner-partner-0002",
	"Supplier Relations": "partner-partner-0003",
	"Chief Scout": "partner-partner-0004",
	"Board Office": "partner-partner-0005",
	"Team Manager": "partner-partner-0006",
	"Series Office": "partner-partner-0007",
	"Operations Desk": "partner-partner-0008",
}


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

	var frame := Control.new()
	frame.position = off
	frame.size = Vector2(DW, DH)
	frame.scale = Vector2(sc, sc)
	add_child(frame)

	var mail_shell := Control.new()
	mail_shell.scale = Vector2(MAIL_LAYOUT_SCALE, MAIL_LAYOUT_SCALE)
	frame.add_child(mail_shell)

	var left_tint := ColorRect.new()
	left_tint.position = Vector2(0.0, 90.0)
	left_tint.size = Vector2(1450.0, 1380.0)
	left_tint.color = Color(0.04, 0.07, 0.13, 0.24)
	mail_shell.add_child(left_tint)

	var top_bar := PrototypeTopBar.new()
	top_bar.active_section_id = "mail"
	top_bar.position = Vector2.ZERO
	top_bar.size = Vector2(DW, 127.0)
	frame.add_child(top_bar)

	_sync_selected_mail()
	var category_panel := _build_category_panel()
	mail_shell.add_child(category_panel)
	var list_panel := _build_mail_list_panel()
	mail_shell.add_child(list_panel)
	var detail_panel := _build_detail_panel()
	mail_shell.add_child(detail_panel)

	frame.add_child(_build_bottom_nav())
	_register_tutorial(category_panel, list_panel, detail_panel)


func _register_tutorial(category_panel: Control, list_panel: Control, detail_panel: Control) -> void:
	var director := get_node_or_null("/root/TutorialDirector")
	if director == null or not director.has_method("report_screen_ready"):
		return
	var steps: Array = [
		{
			"target": category_panel,
			"title": "Inbox Folders",
			"body": "Filter your mail by category here - team operations, commercial, series office and more. Use it to find a specific message quickly.",
			"affects": "Just organises your inbox.",
		},
		{
			"target": list_panel,
			"title": "Your Inbox",
			"body": "Every message lands here. Most of your guidance, deadlines and required decisions arrive as mail, so check it often. Unread and priority items are marked.",
			"affects": "Some messages block progress until you act on them.",
		},
		{
			"target": detail_panel,
			"title": "Message & Actions",
			"body": "The selected message opens here in full. The action button at the bottom does the real work - it either takes you straight to the relevant screen or acknowledges the message.",
			"affects": "Acting on a message can unlock the next step of your season.",
		},
	]
	director.report_screen_ready("mail", steps, self)


func _build_category_panel() -> Control:
	var card := _panel(LEFT_RECT)

	var categories := _mail_categories()
	var y := 34.0
	for entry in categories:
		var category := entry as Dictionary
		if bool(category.get("is_header", false)):
			var header := _txt(str(category.get("label", "")), "bold", 25, Color("93969A"))
			header.position = Vector2(28.0, y)
			header.size = Vector2(180.0, 28.0)
			card.add_child(header)
			y += 46.0
			continue

		var category_id := str(category.get("id", ""))
		var is_all := category_id == "all"
		var is_active := category_id == selected_category_id or (is_all and selected_category_id.is_empty())
		if is_active:
			var active_fill := ColorRect.new()
			active_fill.position = Vector2(18.0, y - 4.0)
			active_fill.size = Vector2(274.0, 56.0)
			active_fill.color = Color(1, 1, 1, 0.035)
			card.add_child(active_fill)

		var accent := ColorRect.new()
		accent.position = Vector2(24.0, y + 4.0)
		accent.size = Vector2(10.0, 44.0)
		accent.color = category.get("color", CYAN)
		card.add_child(accent)

		var label_color := Color("8F9195")
		var role := "body"
		if is_active:
			label_color = Color.WHITE
			role = "bold"

		var label := _txt(str(category.get("label", "")), role, 26, label_color)
		label.position = Vector2(56.0, y)
		label.size = Vector2(154.0, 44.0)
		_apply_single_line_ellipsis(label)
		card.add_child(label)

		var count_badge := _build_count_badge(
			Vector2(220.0, y + 11.0),
			Vector2(56.0, 22.0),
			str(_category_count(category_id)),
			Y if is_active else Color(1, 1, 1, 0.10),
			Color.BLACK if is_active else Color.WHITE
		)
		card.add_child(count_badge)

		var button := Button.new()
		button.flat = true
		button.text = ""
		button.position = Vector2(18.0, y - 4.0)
		button.size = Vector2(274.0, 56.0)
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.pressed.connect(func() -> void:
			if is_all:
				selected_category_id = ""
			else:
				selected_category_id = "" if selected_category_id == category_id else category_id
			_sync_selected_mail()
			_build_ui()
		)
		card.add_child(button)

		y += 71.0

	return card


func _build_mail_list_panel() -> Control:
	var card := _panel(LIST_RECT)
	var items := _filtered_mail_items()
	card.add_child(_build_mail_list_header())

	if items.is_empty():
		var empty_state := _txt("No messages match this filter yet.", "body", 24, COPY)
		empty_state.position = Vector2(20.0, 182.0)
		empty_state.size = Vector2(420.0, 32.0)
		card.add_child(empty_state)
		return card

	var scroll := ScrollContainer.new()
	scroll.position = LIST_SCROLL_POS
	scroll.size = LIST_SCROLL_SIZE
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.clip_contents = true
	card.add_child(scroll)

	var content := Control.new()
	var content_height: float = max(
		LIST_SCROLL_SIZE.y,
		float(items.size()) * LIST_ROW_HEIGHT + float(max(items.size() - 1, 0)) * LIST_ROW_GAP
	)
	content.custom_minimum_size = Vector2(LIST_ROW_WIDTH, content_height)
	content.size = content.custom_minimum_size
	scroll.add_child(content)

	var scroll_bar := scroll.get_v_scroll_bar()
	_style_mail_list_scrollbar(scroll_bar)
	if scroll_bar != null:
		scroll_bar.value_changed.connect(_on_list_scroll_changed)
	scroll.set_deferred("scroll_vertical", int(list_scroll_value))

	var y := 0.0
	for item in items:
		var mail := item as Dictionary
		var is_selected := str(mail.get("id", "")) == selected_mail_id
		content.add_child(_build_mail_row(mail, Vector2.ZERO, is_selected, y))
		y += LIST_ROW_HEIGHT + LIST_ROW_GAP

	return card


func _build_mail_row(mail: Dictionary, pos: Vector2, is_selected: bool, y_offset: float = 0.0) -> Control:
	var row := Control.new()
	row.position = pos + Vector2(0.0, y_offset)
	row.size = Vector2(LIST_ROW_WIDTH, LIST_ROW_HEIGHT)
	row.clip_contents = true

	var is_unread := bool(mail.get("unread", false))
	var requires_response := _mail_requires_response(mail)
	var bg := PanelContainer.new()
	bg.size = row.size
	var bg_style := StyleBoxFlat.new()
	if is_selected:
		bg_style.bg_color = Color(0.40, 0.41, 0.45, 0.92)
		bg_style.border_color = Y
		bg_style.set_border_width_all(2)
	elif is_unread:
		bg_style.bg_color = Color(0.22, 0.24, 0.30, 0.92)
		bg_style.border_color = Color(1, 1, 1, 0.10)
		bg_style.set_border_width_all(1)
	else:
		bg_style.bg_color = Color(0.14, 0.16, 0.20, 0.82)
	bg_style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", bg_style)
	row.add_child(bg)

	if is_selected:
		var selected_edge := ColorRect.new()
		selected_edge.position = Vector2(0.0, 0.0)
		selected_edge.size = Vector2(6.0, row.size.y)
		selected_edge.color = Y
		row.add_child(selected_edge)

	row.add_child(_build_sender_avatar(Vector2(12.0, 14.0), Vector2(96.0, 96.0), mail))

	var sender_color := Color.WHITE
	var subject_color := Color.WHITE
	var preview_color := Color(1, 1, 1, 0.86)
	var time_color := Color(1, 1, 1, 0.82)
	if not is_selected and not is_unread and not requires_response:
		sender_color = Color(1, 1, 1, 0.52)
		subject_color = Color(1, 1, 1, 0.62)
		preview_color = Color(1, 1, 1, 0.48)
		time_color = Color(1, 1, 1, 0.56)
	elif is_unread and not is_selected:
		preview_color = Color(1, 1, 1, 0.92)

	if is_unread:
		var unread_dot := PanelContainer.new()
		unread_dot.position = Vector2(12.0, 12.0)
		unread_dot.size = Vector2(10.0, 10.0)
		var unread_style := StyleBoxFlat.new()
		unread_style.bg_color = Y
		unread_style.set_corner_radius_all(99)
		unread_dot.add_theme_stylebox_override("panel", unread_style)
		row.add_child(unread_dot)

	var badge_right := row.size.x - 12.0
	var badge_top := 12.0
	var badge_gap := 8.0
	var badge_left_limit := badge_right

	if bool(mail.get("starred", false)):
		var pin_width := 60.0
		badge_left_limit -= pin_width
		var pinned_badge := _build_badge(Vector2(badge_left_limit, badge_top), Vector2(pin_width, 28.0), "PIN", Color(1, 1, 1, 0.10), Color.WHITE)
		row.add_child(pinned_badge)
		badge_left_limit -= badge_gap

	var status_text := _mail_status_label(mail)
	var status_width: float = clampf(84.0 + float(status_text.length()) * 8.0, 120.0, 170.0)
	var status_color := _mail_status_color(mail)
	var status_badge := _build_badge(
		Vector2(badge_left_limit - status_width, badge_top),
		Vector2(status_width, 28.0),
		status_text,
		status_color,
		Color.BLACK if status_color.get_luminance() > 0.45 else Color.WHITE
	)
	if status_badge != null:
		badge_left_limit -= status_width
		row.add_child(status_badge)
		badge_left_limit -= badge_gap

	if requires_response and is_selected:
		var response_text := str(mail.get("response_tag", "Requires Response"))
		var response_width: float = clampf(74.0 + float(response_text.length()) * 6.5, 110.0, 156.0)
		var response_tag := _build_badge(
			Vector2(badge_left_limit - response_width, badge_top),
			Vector2(response_width, 28.0),
			response_text,
			Color(0.968627, 0.921569, 0.32549, 0.70),
			Color.BLACK
		)
		if response_tag != null:
			badge_left_limit -= response_width
			row.add_child(response_tag)
			badge_left_limit -= badge_gap

	var time_width := 122.0
	var time_gap := 14.0
	var time_left := row.size.x - 16.0 - time_width
	var text_left := 128.0
	var text_right_limit: float = minf(badge_left_limit - 18.0, time_left - time_gap)
	var text_width: float = maxf(220.0, text_right_limit - text_left)
	var text_lane := Control.new()
	text_lane.position = Vector2(text_left, 10.0)
	text_lane.size = Vector2(text_width, 100.0)
	text_lane.clip_contents = true
	row.add_child(text_lane)

	var sender := _txt(str(mail.get("sender", "")), "bold", 24, sender_color)
	sender.position = Vector2.ZERO
	sender.size = Vector2(text_width, 30.0)
	_apply_single_line_ellipsis(sender)
	text_lane.add_child(sender)

	var subject := _txt(str(mail.get("subject", "")), "body", 20, subject_color)
	subject.position = Vector2(0.0, 32.0)
	subject.size = Vector2(text_width, 30.0)
	_apply_single_line_ellipsis(subject)
	text_lane.add_child(subject)

	var preview := _txt(str(mail.get("preview", "")), "bold", 16, preview_color)
	preview.position = Vector2(0.0, 68.0)
	preview.size = Vector2(text_width, 28.0)
	_apply_single_line_ellipsis(preview)
	text_lane.add_child(preview)

	var time := _txt(str(mail.get("time", "Yesterday")), "body", 16, time_color)
	time.position = Vector2(time_left, 79.0)
	time.size = Vector2(time_width, 24.0)
	time.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(time)

	var stripe := ColorRect.new()
	stripe.position = Vector2(116.0, 18.0)
	stripe.size = Vector2(4.0, 94.0)
	stripe.color = mail.get("stripe_color", MAGENTA)
	row.add_child(stripe)

	var button := Button.new()
	button.flat = true
	button.text = ""
	button.size = row.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(func() -> void:
		_select_mail(str(mail.get("id", "")))
	)
	row.add_child(button)

	return row


func _style_mail_list_scrollbar(scrollbar: VScrollBar) -> void:
	if scrollbar == null:
		return

	scrollbar.custom_minimum_size = Vector2(10.0, 0.0)
	scrollbar.add_theme_constant_override("scroll_size", 10)
	scrollbar.add_theme_constant_override("grabber_min_size", 120)

	var track := StyleBoxFlat.new()
	track.bg_color = Color(0, 0, 0, 0)
	track.border_color = BORDER
	track.set_border_width_all(1)
	track.set_corner_radius_all(MENU_RADIUS)

	var thumb := StyleBoxFlat.new()
	thumb.bg_color = Y
	thumb.set_corner_radius_all(MENU_RADIUS)

	scrollbar.add_theme_stylebox_override("scroll", track)
	scrollbar.add_theme_stylebox_override("scroll_focus", track)
	scrollbar.add_theme_stylebox_override("grabber", thumb)
	scrollbar.add_theme_stylebox_override("grabber_highlight", thumb)
	scrollbar.add_theme_stylebox_override("grabber_pressed", thumb)


func _build_detail_header(mail: Dictionary) -> Control:
	var header := Control.new()
	header.position = Vector2(2.0, 2.0)
	header.size = Vector2(DETAIL_RECT.size.x - 4.0, DETAIL_HEADER_HEIGHT)

	var bg := PanelContainer.new()
	bg.size = header.size
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Y
	bg_style.corner_radius_top_left = MENU_RADIUS
	bg_style.corner_radius_top_right = MENU_RADIUS
	bg_style.corner_radius_bottom_left = 0
	bg_style.corner_radius_bottom_right = 0
	bg.add_theme_stylebox_override("panel", bg_style)
	header.add_child(bg)

	var sheen := ColorRect.new()
	sheen.position = Vector2(0.0, 0.0)
	sheen.size = Vector2(header.size.x, 14.0)
	sheen.color = Color(1.0, 1.0, 1.0, 0.22)
	header.add_child(sheen)

	var brand_name := _mail_brand_name(mail)
	var parts := _brand_parts(brand_name)
	var primary := str(parts.get("primary", "TEAM"))

	var kicker := _txt("TEAM COMMUNICATION", "bold", 15, Color(0.12, 0.11, 0.08, 0.70))
	kicker.position = Vector2(42.0, 28.0)
	kicker.size = Vector2(320.0, 24.0)
	header.add_child(kicker)

	var primary_label := _txt(primary, "bold", 62, Color("111111"))
	primary_label.position = Vector2(40.0, 54.0)
	primary_label.size = Vector2(header.size.x - 80.0, 64.0)
	_apply_single_line_ellipsis(primary_label)
	header.add_child(primary_label)

	var divider := ColorRect.new()
	divider.position = Vector2(40.0, 134.0)
	divider.size = Vector2(header.size.x - 80.0, 2.0)
	divider.color = Color(0.12, 0.11, 0.08, 0.18)
	header.add_child(divider)

	return header


func _build_detail_body_scroll(mail: Dictionary) -> Control:
	var scroll := ScrollContainer.new()
	var detail_rect := _detail_body_scroll_rect(mail)
	scroll.position = detail_rect.position
	scroll.size = detail_rect.size
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.clip_contents = true

	var margin := MarginContainer.new()
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_theme_constant_override("margin_right", 32)
	scroll.add_child(margin)

	var content := VBoxContainer.new()
	content.custom_minimum_size = Vector2(930.0, 0.0)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 26)
	margin.add_child(content)

	for block in _mail_detail_blocks(mail):
		content.add_child(_build_detail_block(block as Dictionary))

	_style_detail_scrollbar(scroll.get_v_scroll_bar())
	return scroll


func _detail_body_scroll_rect(mail: Dictionary) -> Rect2:
	var pos := DETAIL_BODY_SCROLL_POS
	var size := DETAIL_BODY_SCROLL_SIZE if _mail_requires_response(mail) else DETAIL_BODY_SCROLL_SIZE_NO_RESPONSE
	return Rect2(pos, size)


func _build_detail_block(block: Dictionary) -> Control:
	var kind := str(block.get("type", "paragraph"))
	var label := Label.new()
	label.text = str(block.get("text", ""))
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.vertical_alignment = VERTICAL_ALIGNMENT_TOP

	if kind == "heading":
		label.add_theme_font_override("font", PrototypeTheme.font("bold"))
		label.add_theme_font_size_override("font_size", 20)
		label.add_theme_color_override("font_color", DETAIL_HEADING_TEXT)
	else:
		label.add_theme_font_override("font", PrototypeTheme.font("body"))
		label.add_theme_font_size_override("font_size", 20)
		label.add_theme_color_override("font_color", DETAIL_BODY_TEXT)

	return label


func _style_detail_scrollbar(scrollbar: VScrollBar) -> void:
	if scrollbar == null:
		return

	scrollbar.custom_minimum_size = Vector2(8.0, 0.0)
	scrollbar.add_theme_constant_override("scroll_size", 8)
	scrollbar.add_theme_constant_override("grabber_min_size", 120)

	var track := StyleBoxFlat.new()
	track.bg_color = Color(0, 0, 0, 0)
	track.border_color = BORDER
	track.set_border_width_all(1)
	track.set_corner_radius_all(MENU_RADIUS)

	var thumb := StyleBoxFlat.new()
	thumb.bg_color = Y
	thumb.set_corner_radius_all(MENU_RADIUS)

	scrollbar.add_theme_stylebox_override("scroll", track)
	scrollbar.add_theme_stylebox_override("scroll_focus", track)
	scrollbar.add_theme_stylebox_override("grabber", thumb)
	scrollbar.add_theme_stylebox_override("grabber_highlight", thumb)
	scrollbar.add_theme_stylebox_override("grabber_pressed", thumb)


func _build_mail_list_header() -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(18.0, 18.0)
	wrap.size = Vector2(804.0, 116.0)

	var title := _txt("Inbox", "bold", 28, Color.WHITE)
	title.position = Vector2(4.0, 2.0)
	title.size = Vector2(160.0, 34.0)
	wrap.add_child(title)

	var summary := _txt(_mail_lane_summary(), "body", 18, COPY)
	summary.position = Vector2(4.0, 40.0)
	summary.size = Vector2(540.0, 26.0)
	wrap.add_child(summary)

	var x: float = 0.0
	for option in _lane_options():
		var lane_id: String = str(option.get("id", "all"))
		var is_active: bool = lane_id == active_mail_lane
		var width: float = float(option.get("width", 150.0))
		var pill := _build_pill_button(
			Vector2(x, 78.0),
			Vector2(width, 32.0),
			str(option.get("label", "All")),
			_lane_count(lane_id),
			Y if is_active else Color(1, 1, 1, 0.08),
			Color.BLACK if is_active else Color.WHITE,
			func() -> void:
				active_mail_lane = lane_id
				_sync_selected_mail()
				_build_ui()
		)
		wrap.add_child(pill)
		x += width + 12.0

	return wrap


func _build_detail_action_bar(mail: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = Vector2(30.0, 930.0)
	wrap.size = Vector2(1010.0, 180.0)

	wrap.add_child(_build_icon_button(
		Vector2(0.0, 76.0),
		CHECK_ICON_PATH,
		"Mark Unread" if not bool(mail.get("unread", false)) else "Mark Read",
		Color(1, 1, 1, 0.08),
		Color.WHITE,
		func() -> void:
			PrototypeState.mark_mail_read(str(mail.get("id", "")), not bool(mail.get("unread", false)))
			_build_ui()
	))

	wrap.add_child(_build_icon_button(
		Vector2(58.0, 76.0),
		STAR_ICON_PATH if bool(mail.get("starred", false)) else STAR_OUTLINE_ICON_PATH,
		"Unpin" if bool(mail.get("starred", false)) else "Pin",
		Color(1, 1, 1, 0.14) if bool(mail.get("starred", false)) else Color(1, 1, 1, 0.08),
		Color.WHITE,
		func() -> void:
			PrototypeState.toggle_mail_starred(str(mail.get("id", "")))
			_build_ui()
	))

	wrap.add_child(_build_icon_button(
		Vector2(116.0, 76.0),
		DELETE_ICON_PATH,
		"Archive" if not bool(mail.get("archived", false)) else "Restore",
		Color(1, 1, 1, 0.08),
		Color.WHITE,
		func() -> void:
			PrototypeState.toggle_mail_archived(str(mail.get("id", "")))
			_sync_selected_mail()
			_build_ui()
	))

	var primary_label: String = _mail_primary_action_label(mail)
	if not primary_label.is_empty():
		wrap.add_child(_build_header_button(
			Vector2(754.0, 76.0),
			Vector2(256.0, 44.0),
			primary_label,
			_mail_action_color(mail),
			Color.BLACK if _mail_action_color(mail).get_luminance() > 0.45 else Color.WHITE,
			func() -> void:
				_on_primary_action_selected_mail()
		))

	var meta := _txt(_mail_action_hint(mail), "body", 18, COPY)
	meta.position = Vector2(4.0, 12.0)
	meta.size = Vector2(920.0, 42.0)
	meta.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	wrap.add_child(meta)
	return wrap


func _on_primary_action_selected_mail() -> void:
	var selected := _selected_mail()
	var mail_id := str(selected.get("id", ""))
	if mail_id.is_empty():
		return
	var result: Dictionary = PrototypeState.perform_mail_action(mail_id)
	if bool(result.get("navigate", false)):
		var scene_path: String = str(result.get("scene_path", ""))
		if not scene_path.is_empty():
			ScreenTransition.fade_to_scene(scene_path)
			return
	_build_ui()


func _mail_brand_name(mail: Dictionary) -> String:
	if bool(mail.get("is_internal", false)):
		var team_name := str(PrototypeState.team_name).strip_edges()
		return team_name if not team_name.is_empty() else "Oranje GT"

	var brand_name := str(mail.get("brand_name", "")).strip_edges()
	if not brand_name.is_empty():
		return brand_name
	return str(mail.get("detail_from", "Series Office")).strip_edges()


func _mail_requires_response(mail: Dictionary) -> bool:
	return bool(mail.get("requires_response", false))


func _brand_parts(brand_name: String) -> Dictionary:
	var cleaned := brand_name.strip_edges().to_upper()
	if cleaned.is_empty():
		return {"primary": "TEAM", "secondary": ""}

	var words := cleaned.split(" ", false)
	if words.size() <= 1:
		return {"primary": cleaned, "secondary": ""}

	var primary_words: Array[String] = []
	for index in range(words.size() - 1):
		primary_words.append(words[index])
	return {
		"primary": " ".join(primary_words),
		"secondary": words[words.size() - 1],
	}


func _mail_detail_blocks(mail: Dictionary) -> Array:
	var explicit_blocks: Variant = mail.get("detail_blocks", [])
	if explicit_blocks is Array and not (explicit_blocks as Array).is_empty():
		return explicit_blocks as Array
	var mail_id := str(mail.get("id", ""))
	if mail_id == "mail_car_repair":
		return [
			{"type": "paragraph", "text": "Hi\nboss,"},
			{"type": "paragraph", "text": "I've been handling the management of the Pit Crew up until now, but I understand that you might want to take charge of them. There are three main things to know:"},
			{"type": "heading", "text": "Job-Specific Stats"},
			{"type": "paragraph", "text": "Every pit crew member has 5 core stats: Tyres, Front Jack, Rear Jack, Refuelling and Fixing. These define how quickly they do that job."},
			{"type": "heading", "text": "Stamina"},
			{"type": "paragraph", "text": "Going away to a race can be quite exhausting. It's a mental job, as well as a physical one, so when a pit crew member makes a mistake, their Stamina can take a dive."},
			{"type": "paragraph", "text": "If a crew member becomes too tired, you can take them out of the firing line by putting them in Recovery."},
		]

	var body_text: String = str(mail.get("detail_body", "")).replace("\r\n", "\n")
	var paragraphs: Array[String] = []
	for block_text in body_text.split("\n\n", false):
		var cleaned: String = str(block_text).strip_edges()
		if not cleaned.is_empty():
			paragraphs.append(cleaned)
	if paragraphs.is_empty():
		paragraphs.append(body_text)
	var blocks: Array = []
	for paragraph in paragraphs:
		blocks.append({"type": "paragraph", "text": paragraph})
	return blocks


func _build_detail_panel() -> Control:
	var card := _panel(DETAIL_RECT)
	var selected := _selected_mail()

	var body_fill := ColorRect.new()
	body_fill.position = Vector2(2.0, DETAIL_HEADER_HEIGHT)
	body_fill.size = Vector2(DETAIL_RECT.size.x - 4.0, DETAIL_RECT.size.y - DETAIL_HEADER_HEIGHT - 2.0)
	body_fill.color = Color(0.01, 0.02, 0.05, 0.92)
	card.add_child(body_fill)

	card.add_child(_build_detail_header(selected))

	card.add_child(_build_sender_avatar(Vector2(22.0, 185.0), Vector2(156.0, 156.0), selected))

	var accent := ColorRect.new()
	accent.position = Vector2(210.0, 197.0)
	accent.size = Vector2(3.0, 123.0)
	accent.color = Color(0.93, 0.93, 0.93, 0.85)
	card.add_child(accent)

	var title := _txt(str(selected.get("detail_title", "")), "bold", 31, Color.WHITE)
	title.position = Vector2(258.0, 196.0)
	title.size = Vector2(520.0, 42.0)
	card.add_child(title)

	var sender := _txt("From: %s" % str(selected.get("detail_from", "")), "bold", 26, Color.WHITE)
	sender.position = Vector2(258.0, 236.0)
	sender.size = Vector2(520.0, 34.0)
	card.add_child(sender)

	var role := _txt(str(selected.get("detail_role", "")), "bold", 26, Color.WHITE)
	role.position = Vector2(258.0, 276.0)
	role.size = Vector2(280.0, 34.0)
	card.add_child(role)

	if bool(selected.get("resolved", false)) or bool(selected.get("archived", false)):
		var status := _build_badge(
			Vector2(560.0, 278.0),
			Vector2(220.0, 32.0),
			_mail_status_label(selected),
			_mail_status_color(selected),
			Color.BLACK if _mail_status_color(selected).get_luminance() > 0.45 else Color.WHITE
		)
		if status != null:
			card.add_child(status)

	card.add_child(_build_detail_body_scroll(selected))
	card.add_child(_build_detail_action_bar(selected))

	return card


func _build_bottom_nav() -> Control:
	var nav := PrototypeBottomNav.new()
	nav.active_section_id = "mail"
	nav.show_continue_button = true
	nav.position = Vector2(0, 2032)
	nav.size = Vector2(DW, 128)
	nav.z_index = 50
	return nav


func _selected_mail() -> Dictionary:
	var filtered := _filtered_mail_items()
	for item in filtered:
		var mail := item as Dictionary
		if str(mail.get("id", "")) == selected_mail_id:
			return mail
	if not filtered.is_empty():
		return filtered[0]
	return _mail_items()[0]


func _build_sender_avatar(pos: Vector2, avatar_size: Vector2, mail: Dictionary) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = avatar_size

	var avatar := PanelContainer.new()
	avatar.size = avatar_size
	var avatar_style := StyleBoxFlat.new()
	avatar_style.bg_color = Color(0.18, 0.20, 0.25, 0.98)
	avatar_style.set_corner_radius_all(int(round(avatar_size.x * 0.5)))
	avatar.add_theme_stylebox_override("panel", avatar_style)
	wrap.add_child(avatar)

	var texture: Texture2D = _load_mail_portrait_texture(mail)
	if texture != null:
		var portrait := TextureRect.new()
		portrait.texture = texture
		portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		portrait.stretch_mode = TextureRect.STRETCH_SCALE
		portrait.position = Vector2(6.0, 6.0)
		portrait.size = avatar_size - Vector2(12.0, 12.0)
		portrait.material = _driver_avatar_mask_material()
		wrap.add_child(portrait)
	else:
		var initials := _txt(str(mail.get("initials", "NP")), "bold", int(round(avatar_size.y * 0.30)), Color.WHITE)
		initials.position = Vector2.ZERO
		initials.size = avatar_size
		initials.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		wrap.add_child(initials)

	return wrap


func _mail_portrait_id(mail: Dictionary) -> String:
	var portrait_id: String = str(mail.get("portrait_id", "")).strip_edges()
	if not portrait_id.is_empty():
		return portrait_id
	var sender: String = str(mail.get("sender", "")).strip_edges()
	if SENDER_PORTRAITS.has(sender):
		return str(SENDER_PORTRAITS[sender])
	return "partner-partner-0000"


func _mail_portrait_path(mail: Dictionary) -> String:
	return str(mail.get("portrait_path", "")).strip_edges()


func _load_mail_portrait_texture(mail: Dictionary) -> Texture2D:
	var portrait_path := _mail_portrait_path(mail)
	if not portrait_path.is_empty():
		var external_texture := _load_external_portrait_texture(portrait_path)
		if external_texture != null:
			return external_texture
	return _load_partner_portrait_texture(_mail_portrait_id(mail))


func _load_partner_portrait_texture(portrait_id: String) -> Texture2D:
	if portrait_id.is_empty():
		return null
	if portrait_texture_cache.has(portrait_id):
		return portrait_texture_cache[portrait_id]

	var path: String = _resolve_partner_portrait_path(portrait_id)
	if path.is_empty():
		return null

	var image := Image.new()
	if image.load(path) != OK:
		return null

	var texture := ImageTexture.create_from_image(image)
	portrait_texture_cache[portrait_id] = texture
	return texture


func _resolve_partner_portrait_path(portrait_id: String) -> String:
	var base_path: String = ProjectSettings.globalize_path(PARTNER_PORTRAIT_DIR)
	var candidates: Array = [
		base_path.path_join(portrait_id + ".png.jpg"),
		base_path.path_join(portrait_id + ".png"),
		base_path.path_join(portrait_id + ".jpg"),
	]
	for candidate_variant in candidates:
		var candidate: String = str(candidate_variant)
		if FileAccess.file_exists(candidate):
			return candidate
	return ""


func _load_external_portrait_texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if portrait_texture_cache.has(path):
		return portrait_texture_cache[path]
	var file_path := ProjectSettings.globalize_path(path)
	if not FileAccess.file_exists(file_path):
		return null
	var image := Image.new()
	if image.load(file_path) != OK:
		return null
	var texture := ImageTexture.create_from_image(image)
	portrait_texture_cache[path] = texture
	return texture


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


func _build_badge(pos: Vector2, badge_size: Vector2, text: String, bg_color: Color, text_color: Color) -> Control:
	if text.strip_edges().is_empty():
		return null
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = badge_size
	var bg := PanelContainer.new()
	bg.size = badge_size
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(text, "bold", 15, text_color)
	label.size = badge_size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	return wrap


func _build_header_button(pos: Vector2, button_size: Vector2, text: String, bg_color: Color, text_color: Color, callback: Callable) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = button_size
	var bg := PanelContainer.new()
	bg.size = button_size
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(text, "bold", 18, text_color)
	label.size = button_size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	var button := Button.new()
	button.flat = true
	button.size = button_size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(callback)
	wrap.add_child(button)
	wrap.tooltip_text = text
	return wrap


func _build_pill_button(pos: Vector2, button_size: Vector2, text: String, count: int, bg_color: Color, text_color: Color, callback: Callable) -> Control:
	var wrap := _build_header_button(pos, button_size, text, bg_color, text_color, callback)
	var count_badge := _build_count_badge(
		Vector2(button_size.x - 34.0, 5.0),
		Vector2(28.0, 22.0),
		str(count),
		Color(0, 0, 0, 0.16) if text_color == Color.BLACK else Color(1, 1, 1, 0.12),
		text_color
	)
	wrap.add_child(count_badge)
	return wrap


func _build_count_badge(pos: Vector2, badge_size: Vector2, text: String, bg_color: Color, text_color: Color) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = badge_size
	var bg := PanelContainer.new()
	bg.size = badge_size
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var label := _txt(text, "bold", 14, text_color)
	label.size = badge_size
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wrap.add_child(label)
	return wrap


func _build_icon_button(pos: Vector2, icon_path: String, tooltip: String, bg_color: Color, text_color: Color, callback: Callable) -> Control:
	var wrap := Control.new()
	wrap.position = pos
	wrap.size = Vector2(44.0, 44.0)
	var bg := PanelContainer.new()
	bg.size = wrap.size
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.set_corner_radius_all(MENU_RADIUS)
	bg.add_theme_stylebox_override("panel", style)
	wrap.add_child(bg)
	var icon := _build_material_icon(icon_path, Vector2(11.0, 11.0), Vector2(22.0, 22.0), text_color)
	if icon != null:
		wrap.add_child(icon)
	var button := Button.new()
	button.flat = true
	button.size = wrap.size
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(callback)
	wrap.add_child(button)
	wrap.tooltip_text = tooltip
	return wrap


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
	if path.ends_with(".svg"):
		return _load_svg_texture(path, 1.0)
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


func _on_list_scroll_changed(value: float) -> void:
	list_scroll_value = value


func _apply_single_line_ellipsis(label: Label) -> void:
	label.autowrap_mode = TextServer.AUTOWRAP_OFF
	label.clip_text = true
	label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS


func _visible_mail_items() -> Array:
	var visible: Array = []
	for item in _mail_items():
		var mail := item as Dictionary
		if bool(mail.get("archived", false)):
			continue
		visible.append(mail)
	return _sort_mail_items(visible)


func _archived_mail_items() -> Array:
	var archived: Array = []
	for item in _mail_items():
		var mail := item as Dictionary
		if not bool(mail.get("archived", false)):
			continue
		archived.append(mail)
	return _sort_mail_items(archived)


func _filtered_mail_items() -> Array:
	var filtered: Array = []
	var source_items := _archived_mail_items() if selected_category_id == "archived" else _visible_mail_items()
	for item in source_items:
		var mail := item as Dictionary
		if not selected_category_id.is_empty() and selected_category_id != "archived" and str(mail.get("category_id", "")) != selected_category_id:
			continue
		if active_mail_lane != "all":
			var priority: String = _mail_priority(mail)
			if active_mail_lane == "action" and priority != "must_do":
				continue
			if active_mail_lane == "review" and priority != "review_soon":
				continue
			if active_mail_lane == "updates" and priority != "background":
				continue
		filtered.append(mail)
	return filtered


func _sort_mail_items(items: Array) -> Array:
	var sorted: Array = items.duplicate()
	sorted.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if bool(a.get("starred", false)) != bool(b.get("starred", false)):
			return bool(a.get("starred", false))
		var a_priority: int = _mail_priority_rank(_mail_priority(a))
		var b_priority: int = _mail_priority_rank(_mail_priority(b))
		if a_priority != b_priority:
			return a_priority < b_priority
		if bool(a.get("resolved", false)) != bool(b.get("resolved", false)):
			return not bool(a.get("resolved", false))
		if bool(a.get("unread", false)) != bool(b.get("unread", false)):
			return bool(a.get("unread", false))
		return str(a.get("id", "")) < str(b.get("id", ""))
	)
	return sorted


func _select_mail(mail_id: String) -> void:
	selected_mail_id = mail_id
	var selected := _selected_mail()
	if bool(selected.get("unread", false)):
		PrototypeState.mark_mail_read(mail_id, false)
	_build_ui()


func _lane_options() -> Array:
	return [
		{"id": "action", "label": "Action Required", "width": 214.0},
		{"id": "review", "label": "Review Soon", "width": 188.0},
		{"id": "updates", "label": "Updates", "width": 146.0},
		{"id": "all", "label": "All", "width": 110.0},
	]


func _mail_lane_summary() -> String:
	var counts := {"must_do": 0, "review_soon": 0, "background": 0}
	for item in _visible_mail_items():
		var mail := item as Dictionary
		var priority: String = _mail_priority(mail)
		if counts.has(priority):
			counts[priority] += 1
	return "%d action required  •  %d review soon  •  %d updates" % [counts["must_do"], counts["review_soon"], counts["background"]]


func _mail_priority(mail: Dictionary) -> String:
	return str(mail.get("priority", "background"))


func _mail_priority_rank(priority: String) -> int:
	match priority:
		"must_do":
			return 0
		"review_soon":
			return 1
		_:
			return 2


func _mail_status_label(mail: Dictionary) -> String:
	var explicit: String = str(mail.get("status_label", "")).strip_edges()
	if not explicit.is_empty():
		return explicit
	if bool(mail.get("resolved", false)):
		return "Resolved"
	match _mail_priority(mail):
		"must_do":
			return "Action Required"
		"review_soon":
			return "Review Soon"
		_:
			return "Update"


func _mail_status_color(mail: Dictionary) -> Color:
	if bool(mail.get("resolved", false)):
		return Color(0.22, 0.63, 0.35, 0.95)
	match _mail_priority(mail):
		"must_do":
			return Color(1.0, 0.95, 0.30, 0.95)
		"review_soon":
			return Color(0.38, 0.67, 0.96, 0.95)
		_:
			return Color(0.42, 0.46, 0.52, 0.95)


func _mail_primary_action_label(mail: Dictionary) -> String:
	var label: String = str(mail.get("action_label", "")).strip_edges()
	if not label.is_empty():
		return label
	if _mail_requires_response(mail):
		return "Acknowledge"
	return ""


func _mail_action_color(mail: Dictionary) -> Color:
	if _mail_requires_response(mail) or _mail_priority(mail) == "must_do":
		return Y
	if _mail_priority(mail) == "review_soon":
		return Color(0.38, 0.67, 0.96, 0.95)
	return Color(1, 1, 1, 0.18)


func _mail_action_hint(mail: Dictionary) -> String:
	if bool(mail.get("resolved", false)):
		return "This message has been resolved, but you can still pin, archive, or reopen it in the list."
	var primary: String = _mail_primary_action_label(mail)
	if primary.is_empty():
		return "This is an informational message. Use the utility controls below to pin it, mark it unread, or archive it."
	return "%s is the primary action for this message. The controls below let you manage it without losing the thread." % primary


func _sync_selected_mail() -> void:
	var filtered := _filtered_mail_items()
	if filtered.is_empty():
		selected_mail_id = str((_mail_items()[0] as Dictionary).get("id", ""))
		return

	for item in filtered:
		var mail := item as Dictionary
		if str(mail.get("id", "")) == selected_mail_id:
			return

	selected_mail_id = str((filtered[0] as Dictionary).get("id", ""))


func _mail_categories() -> Array:
	var all_categories := [
		{"label": "URGENT", "is_header": true},
		{"id": "all", "label": "All", "color": Y},
		{"id": "media", "label": "Press", "color": RED},
		{"id": "gossip", "label": "Rumours", "color": PURPLE},
		{"id": "gma", "label": "GMA", "color": ORANGE},
		{"id": "assistant", "label": "Ops", "color": CYAN},
		{"id": "chief-scout", "label": "Scouting", "color": CYAN},
		{"id": "drivers", "label": "Drivers", "color": CYAN},
		{"id": "race-mechanics", "label": "Mechanics", "color": CYAN, "emphasis": true},
		{"id": "lead-designer", "label": "Design", "color": CYAN},
		{"id": "chairman", "label": "Board", "color": CYAN},
		{"id": "staff", "label": "Staff", "color": CYAN},
		{"id": "team", "label": "Team", "color": CYAN},
		{"id": "championship", "label": "Series", "color": PURPLE},
		{"id": "contracts", "label": "Contracts", "color": MAGENTA},
		{"id": "other", "label": "Misc", "color": LIGHT_ROW},
	]
	var archived_count: int = _archived_mail_items().size()
	var present_category_ids: Dictionary = {}
	for item in _visible_mail_items():
		var mail := item as Dictionary
		var category_id := str(mail.get("category_id", "")).strip_edges()
		if not category_id.is_empty():
			present_category_ids[category_id] = true

	var filtered: Array = []
	for entry_variant in all_categories:
		var entry: Dictionary = entry_variant as Dictionary
		if bool(entry.get("is_header", false)):
			filtered.append(entry)
			continue
		var category_id := str(entry.get("id", ""))
		if category_id == "all" or present_category_ids.has(category_id):
			filtered.append(entry)
	if archived_count > 0:
		filtered.append({"label": "ARCHIVED", "is_header": true})
		filtered.append({"id": "archived", "label": "Archived", "color": LIGHT_ROW})
	return filtered


func _category_count(category_id: String) -> int:
	if category_id == "all":
		return _unread_count_for_items(_visible_mail_items())
	if category_id == "archived":
		return _unread_count_for_items(_archived_mail_items())
	var count := 0
	for item in _visible_mail_items():
		var mail := item as Dictionary
		if str(mail.get("category_id", "")) == category_id and bool(mail.get("unread", false)):
			count += 1
	return count


func _lane_count(lane_id: String) -> int:
	var count := 0
	var items := _archived_mail_items() if selected_category_id == "archived" else _visible_mail_items()
	for item in items:
		var mail := item as Dictionary
		if not bool(mail.get("unread", false)):
			continue
		var priority: String = _mail_priority(mail)
		if lane_id == "all":
			count += 1
		elif lane_id == "action" and priority == "must_do":
			count += 1
		elif lane_id == "review" and priority == "review_soon":
			count += 1
		elif lane_id == "updates" and priority == "background":
			count += 1
	return count


func _unread_count_for_items(items: Array) -> int:
	var count := 0
	for item in items:
		var mail := item as Dictionary
		if bool(mail.get("unread", false)):
			count += 1
	return count


func _mail_items() -> Array:
	var runtime_mail: Array = PrototypeState.get_mail_items()
	if not runtime_mail.is_empty():
		return runtime_mail
	return [
		{
			"id": "mail_media_gossip",
			"category_id": "gossip",
			"is_internal": false,
			"brand_name": "Sky Sports F1",
			"requires_response": false,
			"response_tag": "Requires Response",
			"sender": "Natalie Pinkham",
			"subject": "Gossip: Schumacher In Bust Up With Stewards At...",
			"preview": "Tempers can often explode in the fast-paced...",
			"time": "Yesterday",
			"initials": "NP",
			"stripe_color": MAGENTA,
			"unread": false,
			"detail_title": "Gossip Roundup",
			"detail_from": "Natalie Pinkham",
			"detail_role": "Media",
			"detail_body": "The paddock is buzzing after another run-in with the stewards. Keep an eye on the headlines before race week gets louder.",
		},
		{
			"id": "mail_car_repair",
			"category_id": "race-mechanics",
			"is_internal": true,
			"requires_response": true,
			"response_tag": "Requires Response",
			"sender": "Will Joseph",
			"subject": "Car Repair Finished",
			"preview": "We've finished repairing both cars. The mechanics can...",
			"time": "Yesterday",
			"initials": "WJ",
			"stripe_color": CYAN,
			"unread": true,
			"detail_title": "Car Repair Finished",
			"detail_from": "Will Joseph",
			"detail_role": "Race Mechanic",
			"detail_body": "We've finished repairing both cars. The mechanics can get back to making performance and reliability improvements!",
		},
		{
			"id": "mail_race_mech_2",
			"category_id": "race-mechanics",
			"is_internal": true,
			"requires_response": false,
			"sender": "Will Joseph",
			"subject": "Garage Update",
			"preview": "The repair bay is clear and the crew can focus on...",
			"time": "Yesterday",
			"initials": "WJ",
			"stripe_color": CYAN,
			"unread": false,
			"detail_title": "Garage Update",
			"detail_from": "Will Joseph",
			"detail_role": "Race Mechanic",
			"detail_body": "Repair work is complete and the race mechanics are back on planned improvement items. No blockers on the current prep list.",
		},
		{
			"id": "mail_race_mech_3",
			"category_id": "race-mechanics",
			"is_internal": true,
			"requires_response": false,
			"sender": "Will Joseph",
			"subject": "Pit Equipment Checked",
			"preview": "All pit hardware has been checked and signed off...",
			"time": "Yesterday",
			"initials": "WJ",
			"stripe_color": CYAN,
			"unread": false,
			"detail_title": "Pit Equipment Checked",
			"detail_from": "Will Joseph",
			"detail_role": "Race Mechanic",
			"detail_body": "All pit equipment has been checked and signed off for the next event. The workshop is clear to continue with preparation work.",
		},
		{
			"id": "mail_media_2",
			"category_id": "media",
			"is_internal": false,
			"brand_name": "Sky Sports F1",
			"requires_response": false,
			"sender": "Natalie Pinkham",
			"subject": "Team Gossip: More movement around the paddock...",
			"preview": "Rumours suggest several staff may be open to fresh...",
			"time": "Yesterday",
			"initials": "NP",
			"stripe_color": MAGENTA,
			"unread": false,
			"detail_title": "Staff Movement",
			"detail_from": "Natalie Pinkham",
			"detail_role": "Media",
			"detail_body": "Several names are being linked with off-season movement. It may be worth reviewing your own staffing depth before rivals make a move.",
		},
		{
			"id": "mail_chairman",
			"category_id": "chairman",
			"is_internal": true,
			"requires_response": false,
			"sender": "Board Office",
			"subject": "Chairman note: keep the launch momentum visible...",
			"preview": "The project needs visible progress in the next few...",
			"time": "Yesterday",
			"initials": "BO",
			"stripe_color": CYAN,
			"unread": false,
			"detail_title": "Chairman Note",
			"detail_from": "Board Office",
			"detail_role": "Chairman",
			"detail_body": "Momentum matters right now. Make sure the operation looks active, credible, and under control as you move into the next week.",
		},
		{
			"id": "mail_scouting",
			"category_id": "chief-scout",
			"is_internal": true,
			"requires_response": false,
			"sender": "Chief Scout",
			"subject": "Driver market chatter has started to pick up...",
			"preview": "There may be a shortlist worth reviewing sooner rather...",
			"time": "Yesterday",
			"initials": "CS",
			"stripe_color": CYAN,
			"unread": false,
			"detail_title": "Driver Market Note",
			"detail_from": "Chief Scout",
			"detail_role": "Chief Scout",
			"detail_body": "The driver market is beginning to move. If you want leverage, review options before the louder teams lock the board down.",
		},
		{
			"id": "mail_gma",
			"category_id": "gma",
			"is_internal": false,
			"brand_name": "GMA",
			"requires_response": false,
			"sender": "Series Office",
			"subject": "GMA bulletin: procedural notes for next round...",
			"preview": "Administrative guidance has been issued for all teams...",
			"time": "Yesterday",
			"initials": "SO",
			"stripe_color": ORANGE,
			"unread": false,
			"detail_title": "GMA Bulletin",
			"detail_from": "Series Office",
			"detail_role": "GMA",
			"detail_body": "A new bulletin has been issued with procedural notes and reporting requirements ahead of the next event weekend.",
		},
	]


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
