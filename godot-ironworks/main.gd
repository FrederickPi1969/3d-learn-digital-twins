extends Node2D

const TILE := 32
const COLS := 29
const ROWS := 17
const ORIGIN := Vector2(48, 128)
const WORLD_SIZE := Vector2(COLS * TILE, ROWS * TILE)
const PLAYER_SPEED := 250.0
const PANEL_RECT := Rect2(676, 142, 326, 442)

const RESOURCE_COLORS := {
	"iron": Color("#8db6d8"),
	"copper": Color("#e4874f"),
	"coal": Color("#3b4650"),
	"stone": Color("#aeb7bd"),
}

const BUILDING_COLORS := {
	"drill": Color("#5ec5aa"),
	"furnace": Color("#f3a14d"),
	"belt": Color("#65798a"),
	"lab": Color("#b08ce4"),
}

var player := Vector2(5.5, 8.5)
var resources: Dictionary = {}
var buildings: Dictionary = {}
var building_storage: Dictionary = {}
var inventory := {
	"iron_ore": 0,
	"copper_ore": 0,
	"coal": 0,
	"stone": 8,
	"iron_plate": 7,
	"copper_plate": 0,
	"gear": 2,
}

var selected := "drill"
var drill_timer := 0.0
var furnace_timer := 0.0
var belt_phase := 0.0
var message := "任务：采集矿石，扩建第一条自动化生产线。"
var message_timer := 4.5
var won := false
var ui_font: Font
var opened_building := Vector2i(-1, -1)

func _ready() -> void:
	# Bundle a CJK-capable font: ThemeDB's fallback only covers Latin glyphs on Web.
	ui_font = load("res://assets/fonts/NotoSansCJKsc-Regular.otf")
	seed(240727)
	_build_world()
	queue_redraw()

func _build_world() -> void:
	# Fixed deposits make every Web build and every test run deterministic.
	_add_patch(Vector2i(5, 4), "iron", 5, 16)
	_add_patch(Vector2i(10, 12), "iron", 4, 18)
	_add_patch(Vector2i(18, 4), "copper", 5, 15)
	_add_patch(Vector2i(23, 12), "copper", 4, 18)
	_add_patch(Vector2i(4, 14), "coal", 4, 20)
	_add_patch(Vector2i(24, 5), "coal", 4, 20)
	_add_patch(Vector2i(14, 9), "stone", 4, 16)

func _add_patch(center: Vector2i, kind: String, radius: int, amount: int) -> void:
	for x in range(center.x - radius / 2, center.x + radius / 2 + 1):
		for y in range(center.y - radius / 2, center.y + radius / 2 + 1):
			var cell := Vector2i(x, y)
			if cell.x < 0 or cell.x >= COLS or cell.y < 0 or cell.y >= ROWS:
				continue
			if Vector2(cell).distance_to(Vector2(center)) <= radius * 0.57 + randf_range(-0.25, 0.35):
				resources[cell] = {"kind": kind, "amount": amount}

func _process(delta: float) -> void:
	if not won:
		_move_player(delta)
		_run_automation(delta)
	belt_phase = fmod(belt_phase + delta * 2.7, 1.0)
	message_timer = maxf(0.0, message_timer - delta)
	queue_redraw()

func _move_player(delta: float) -> void:
	var direction := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		direction.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		direction.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		direction.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		direction.y += 1.0
	if direction.length_squared() > 0.0:
		player += direction.normalized() * PLAYER_SPEED * delta / TILE
		player.x = clampf(player.x, 0.5, COLS - 0.5)
		player.y = clampf(player.y, 0.5, ROWS - 0.5)

func _run_automation(delta: float) -> void:
	drill_timer += delta
	furnace_timer += delta
	if drill_timer >= 1.25:
		drill_timer = 0.0
		for cell in buildings:
			if buildings[cell] == "drill" and resources.has(cell) and building_storage[cell].output < 20:
				_take_resource(cell, 1, true)
	if furnace_timer >= 1.15:
		furnace_timer = 0.0
		for cell in buildings:
			if buildings[cell] != "furnace":
				continue
			var store: Dictionary = building_storage[cell]
			if store.coal > 0 and store.iron_ore > 0:
				store.coal -= 1
				store.iron_ore -= 1
				store.iron_plate += 1
			elif store.coal > 0 and store.copper_ore > 0:
				store.coal -= 1
				store.copper_ore -= 1
				store.copper_plate += 1
			building_storage[cell] = store
	_check_win()

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		# Physical keys keep WASD/E/G reliable in Web builds and with IMEs enabled.
		var pressed_key: int = int(event.physical_keycode) if event.physical_keycode != KEY_NONE else int(event.keycode)
		match pressed_key:
			KEY_E:
				_manual_mine()
			KEY_G:
				_craft_gear()
			KEY_1:
				_select("drill")
			KEY_2:
				_select("furnace")
			KEY_3:
				_select("belt")
			KEY_4:
				_select("lab")
			KEY_ESCAPE:
				if _panel_is_open():
					_close_panel()
				else:
					_select("drill")
	if event is InputEventMouseButton and event.pressed and not won:
		var mouse := get_global_mouse_position()
		if event.button_index == MOUSE_BUTTON_RIGHT:
			if PANEL_RECT.has_point(mouse):
				return
			_dismantle(_mouse_cell())
			return
		if event.button_index != MOUSE_BUTTON_LEFT:
			return
		if _panel_is_open() and PANEL_RECT.has_point(mouse):
			_handle_panel_click(mouse)
			return
		var cell := _mouse_cell()
		if buildings.has(cell):
			_open_panel(cell)
		else:
			_place_selected(cell)

func _manual_mine() -> void:
	var nearest := Vector2i(-99, -99)
	var best := 1.65
	for cell in resources:
		var distance := player.distance_to(Vector2(cell) + Vector2(0.5, 0.5))
		if distance < best:
			best = distance
			nearest = cell
	if nearest.x == -99:
		_note("靠近矿脉后按 E 挖矿。", 2.0)
		return
	_take_resource(nearest, 1, false)

func _take_resource(cell: Vector2i, count: int, automated: bool) -> void:
	if not resources.has(cell):
		return
	var deposit: Dictionary = resources[cell]
	var gained := _resource_item(deposit.kind)
	if automated:
		var drill_store: Dictionary = building_storage[cell]
		drill_store.output += count
		building_storage[cell] = drill_store
	else:
		inventory[gained] += count
	deposit.amount -= count
	if deposit.amount <= 0:
		resources.erase(cell)
		if not automated:
			_note("矿脉耗尽。", 1.5)
	else:
		resources[cell] = deposit
	if not automated:
		_note("+%d %s" % [count, _display_name(gained)], 1.2)

func _craft_gear() -> void:
	if inventory.iron_plate < 2:
		_note("齿轮需要 2 块铁板。", 1.8)
		return
	inventory.iron_plate -= 2
	inventory.gear += 1
	_note("已手工合成 1 个齿轮。", 1.8)

func _select(kind: String) -> void:
	selected = kind
	_note("已选择：%s。点击格子建造。" % _building_name(kind), 1.8)

func _place_selected(cell: Vector2i) -> void:
	if cell.x < 0 or cell.x >= COLS or cell.y < 0 or cell.y >= ROWS:
		return
	if buildings.has(cell):
		_note("这里已经有设施。", 1.5)
		return
	if selected == "drill":
		if not resources.has(cell):
			_note("采矿机必须覆盖矿脉。", 1.8)
			return
		if inventory.iron_plate < 2 or inventory.gear < 1:
			_note("采矿机需要 2 铁板 + 1 齿轮。", 1.8)
			return
		inventory.iron_plate -= 2
		inventory.gear -= 1
	elif selected == "furnace":
		if resources.has(cell):
			_note("熔炉请放在空地。", 1.5)
			return
		if inventory.stone < 6:
			_note("熔炉需要 6 石头。", 1.8)
			return
		inventory.stone -= 6
	elif selected == "belt":
		if resources.has(cell):
			_note("传送带请放在空地。", 1.5)
			return
		if inventory.iron_plate < 1:
			_note("传送带需要 1 铁板。", 1.8)
			return
		inventory.iron_plate -= 1
	elif selected == "lab":
		if resources.has(cell):
			_note("研究站请放在空地。", 1.5)
			return
		if inventory.iron_plate < 8 or inventory.copper_plate < 5:
			_note("研究站需要 8 铁板 + 5 铜板。", 2.2)
			return
		inventory.iron_plate -= 8
		inventory.copper_plate -= 5
	buildings[cell] = selected
	building_storage[cell] = _new_storage(selected, cell)
	_note("已建造：%s。" % _building_name(selected), 1.8)
	_check_win()

func _new_storage(kind: String, cell: Vector2i) -> Dictionary:
	match kind:
		"drill":
			var deposit: Dictionary = resources[cell]
			return {"resource": _resource_item(deposit.kind), "output": 0}
		"furnace":
			return {"iron_ore": 0, "copper_ore": 0, "coal": 0, "iron_plate": 0, "copper_plate": 0}
		"belt":
			return {"iron_ore": 0, "copper_ore": 0, "coal": 0}
	return {}

func _resource_item(resource_kind: String) -> String:
	match resource_kind:
		"iron": return "iron_ore"
		"copper": return "copper_ore"
		"coal": return "coal"
		"stone": return "stone"
	return resource_kind

func _dismantle(cell: Vector2i) -> void:
	if not buildings.has(cell):
		_note("右键点已有设施可拆除。", 1.4)
		return
	var kind: String = buildings[cell]
	var store: Dictionary = building_storage.get(cell, {})
	match kind:
		"drill":
			inventory.iron_plate += 2
			inventory.gear += 1
			if not store.is_empty():
				inventory[store.resource] += store.output
		"furnace":
			inventory.stone += 6
			for item in ["iron_ore", "copper_ore", "coal", "iron_plate", "copper_plate"]:
				inventory[item] += store[item]
		"belt":
			inventory.iron_plate += 1
			for item in ["iron_ore", "copper_ore", "coal"]:
				inventory[item] += store[item]
		"lab":
			inventory.iron_plate += 8
			inventory.copper_plate += 5
	buildings.erase(cell)
	building_storage.erase(cell)
	if opened_building == cell:
		opened_building = Vector2i(-1, -1)
	_note("已拆除%s，材料与内部库存已返还。" % _building_name(kind), 2.0)

func _check_win() -> void:
	if _count_buildings("lab") > 0 and not won:
		won = true
		_note("生产线已接通！你完成了第一座自动化前哨。", 99.0)

func _mouse_cell() -> Vector2i:
	return Vector2i(floor((get_global_mouse_position().x - ORIGIN.x) / TILE), floor((get_global_mouse_position().y - ORIGIN.y) / TILE))

func _count_buildings(kind: String) -> int:
	var total := 0
	for cell in buildings:
		if buildings[cell] == kind:
			total += 1
	return total

func _panel_is_open() -> bool:
	return opened_building.x >= 0 and buildings.has(opened_building)

func _open_panel(cell: Vector2i) -> void:
	opened_building = cell
	_note("已打开 %s 面板。" % _building_name(buildings[cell]), 1.4)

func _close_panel() -> void:
	opened_building = Vector2i(-1, -1)
	_note("已关闭设施面板。", 1.2)

func _panel_button_rect(index: int) -> Rect2:
	return Rect2(696, 302 + index * 48, 286, 36)

func _handle_panel_click(mouse: Vector2) -> void:
	if Rect2(966, 156, 24, 24).has_point(mouse):
		_close_panel()
		return
	var kind: String = buildings[opened_building]
	for index in range(5):
		if _panel_button_rect(index).has_point(mouse):
			_handle_panel_action(kind, index)
			return

func _handle_panel_action(kind: String, index: int) -> void:
	if index == 4:
		_close_panel()
		return
	var store: Dictionary = building_storage[opened_building]
	match kind:
		"drill":
			if index == 0:
				var item: String = store.resource
				if store.output <= 0:
					_note("采矿机缓存为空，等待它继续开采。", 1.8)
					return
				inventory[item] += store.output
				_note("从采矿机取出 %d %s。" % [store.output, _display_name(item)], 1.8)
				store.output = 0
		"furnace":
			if index == 0:
				_move_inventory_to_store(store, "iron_ore")
			elif index == 1:
				_move_inventory_to_store(store, "copper_ore")
			elif index == 2:
				_move_inventory_to_store(store, "coal")
			elif index == 3:
				_collect_furnace_output(store)
		"belt":
			if index == 0:
				_move_inventory_to_store(store, "iron_ore")
			elif index == 1:
				_move_inventory_to_store(store, "copper_ore")
			elif index == 2:
				_move_inventory_to_store(store, "coal")
			elif index == 3:
				_collect_belt_output(store)
	building_storage[opened_building] = store

func _move_inventory_to_store(store: Dictionary, item: String) -> void:
	if inventory[item] <= 0:
		_note("背包里没有%s。" % _display_name(item), 1.5)
		return
	inventory[item] -= 1
	store[item] += 1
	_note("已放入 1 %s。" % _display_name(item), 1.2)

func _collect_furnace_output(store: Dictionary) -> void:
	var total: int = int(store.iron_plate) + int(store.copper_plate)
	if total <= 0:
		_note("石炉还没有可取出的金属板。", 1.5)
		return
	inventory.iron_plate += store.iron_plate
	inventory.copper_plate += store.copper_plate
	store.iron_plate = 0
	store.copper_plate = 0
	_note("已取出 %d 块冶炼成品。" % total, 1.5)

func _collect_belt_output(store: Dictionary) -> void:
	var total: int = int(store.iron_ore) + int(store.copper_ore) + int(store.coal)
	if total <= 0:
		_note("传送带上没有货物。", 1.5)
		return
	for item in ["iron_ore", "copper_ore", "coal"]:
		inventory[item] += store[item]
		store[item] = 0
	_note("已从传送带取回 %d 件货物。" % total, 1.5)

func _note(text: String, duration: float) -> void:
	message = text
	message_timer = duration

func _building_name(kind: String) -> String:
	match kind:
		"drill": return "自动采矿机"
		"furnace": return "石炉"
		"belt": return "传送带"
		"lab": return "研究站"
	return kind

func _display_name(kind: String) -> String:
	match kind:
		"iron_ore": return "铁矿"
		"copper_ore": return "铜矿"
		"coal": return "煤炭"
		"stone": return "石头"
		"iron_plate": return "铁板"
		"copper_plate": return "铜板"
		"gear": return "齿轮"
	return kind

func _draw() -> void:
	var font := ui_font if ui_font != null else ThemeDB.fallback_font
	draw_rect(Rect2(Vector2.ZERO, Vector2(1024, 720)), Color("#07101a"), true)
	_draw_header(font)
	_draw_world(font)
	_draw_footer(font)
	_draw_building_panel(font)
	if won:
		draw_rect(Rect2(160, 270, 704, 142), Color(0.03, 0.07, 0.10, 0.94), true)
		draw_rect(Rect2(160, 270, 704, 142), Color("#78ddb4"), false, 2.0)
		draw_string(font, Vector2(252, 326), "AUTOMATION ONLINE", HORIZONTAL_ALIGNMENT_LEFT, -1, 28, Color("#b8ffe3"))
		draw_string(font, Vector2(238, 366), "第一座研究站完成，Web 导出生产链验证成功。", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color("#dce9f0"))

func _draw_header(font: Font) -> void:
	draw_rect(Rect2(0, 0, 1024, 104), Color("#0d1b29"), true)
	draw_rect(Rect2(0, 102, 1024, 2), Color("#284258"), true)
	draw_string(font, Vector2(28, 34), "IRONWORKS OUTPOST", HORIZONTAL_ALIGNMENT_LEFT, -1, 24, Color("#d8f1ff"))
	draw_string(font, Vector2(30, 59), "Godot 4 · WebAssembly production-chain vertical slice", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#79a2ba"))
	var lines := [
		"铁矿 %d   铜矿 %d   煤炭 %d   石头 %d" % [inventory.iron_ore, inventory.copper_ore, inventory.coal, inventory.stone],
		"铁板 %d   铜板 %d   齿轮 %d" % [inventory.iron_plate, inventory.copper_plate, inventory.gear]
	]
	draw_string(font, Vector2(568, 34), lines[0], HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#cae0ee"))
	draw_string(font, Vector2(568, 60), lines[1], HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#f2d5a6"))
	draw_string(font, Vector2(568, 84), "自动采矿机 %d  ·  石炉 %d  ·  传送带 %d" % [_count_buildings("drill"), _count_buildings("furnace"), _count_buildings("belt")], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("#7ca0b7"))

func _draw_world(font: Font) -> void:
	draw_rect(Rect2(ORIGIN, WORLD_SIZE), Color("#152936"), true)
	for x in range(COLS):
		for y in range(ROWS):
			var cell := Vector2i(x, y)
			var rect := Rect2(ORIGIN + Vector2(cell) * TILE, Vector2(TILE, TILE))
			var checker := (x + y) % 2 == 0
			draw_rect(rect.grow(-1), Color("#1c3540") if checker else Color("#19313d"), true)
			if resources.has(cell):
				_draw_resource(rect, resources[cell])
			if buildings.has(cell):
				_draw_building(rect, buildings[cell])
	var hover := _mouse_cell()
	if hover.x >= 0 and hover.x < COLS and hover.y >= 0 and hover.y < ROWS:
		draw_rect(Rect2(ORIGIN + Vector2(hover) * TILE, Vector2(TILE, TILE)).grow(-1), Color("#f6dc92"), false, 2.0)
	var player_screen := ORIGIN + player * TILE
	draw_circle(player_screen, 12, Color("#eff6d7"))
	draw_circle(player_screen, 8, Color("#4aa7b9"))
	draw_circle(player_screen + Vector2(4, -3), 2, Color("#132631"))
	draw_string(font, player_screen + Vector2(-18, 25), "YOU", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color("#d7f5ff"))

func _draw_resource(rect: Rect2, deposit: Dictionary) -> void:
	var color: Color = RESOURCE_COLORS[deposit.kind]
	draw_circle(rect.get_center(), 10, color.darkened(0.2))
	draw_circle(rect.get_center() + Vector2(-4, -3), 5, color)
	draw_circle(rect.get_center() + Vector2(5, 3), 4, color.lightened(0.08))

func _draw_building(rect: Rect2, kind: String) -> void:
	var color: Color = BUILDING_COLORS[kind]
	match kind:
		"drill":
			draw_rect(rect.grow(-4), color.darkened(0.45), true)
			draw_circle(rect.get_center(), 9, color)
			draw_line(rect.get_center(), rect.get_center() + Vector2(10, -9), Color("#e6fff6"), 3)
		"furnace":
			draw_rect(rect.grow(-5), color.darkened(0.45), true)
			draw_rect(Rect2(rect.position + Vector2(10, 12), Vector2(12, 14)), color, true)
			draw_circle(rect.position + Vector2(16, 17), 4, Color("#fff0b5"))
		"belt":
			draw_rect(rect.grow(-2), color.darkened(0.4), true)
			for i in range(3):
				var offset := fmod(belt_phase * 20 + i * 10, 30.0)
				draw_line(rect.position + Vector2(2 + offset, 16), rect.position + Vector2(7 + offset, 16), color.lightened(0.35), 3)
		"lab":
			draw_rect(rect.grow(-4), color.darkened(0.45), true)
			draw_circle(rect.get_center(), 9, color)
			draw_circle(rect.get_center(), 4, Color("#f4e8ff"))
	if opened_building == Vector2i(roundi((rect.position.x - ORIGIN.x) / TILE), roundi((rect.position.y - ORIGIN.y) / TILE)):
		draw_rect(rect.grow(-2), Color("#fff1a8"), false, 2.0)

func _draw_building_panel(font: Font) -> void:
	if not _panel_is_open():
		return
	var kind: String = buildings[opened_building]
	var store: Dictionary = building_storage[opened_building]
	draw_rect(PANEL_RECT, Color(0.025, 0.065, 0.10, 0.97), true)
	draw_rect(PANEL_RECT, BUILDING_COLORS[kind].lightened(0.18), false, 2.0)
	draw_string(font, Vector2(696, 178), _building_name(kind), HORIZONTAL_ALIGNMENT_LEFT, -1, 23, Color("#e9f7ff"))
	draw_string(font, Vector2(970, 177), "×", HORIZONTAL_ALIGNMENT_CENTER, 18, 23, Color("#d9eef8"))
	draw_string(font, Vector2(696, 210), "点击其他已建设施可切换面板", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("#85a7ba"))
	match kind:
		"drill":
			draw_string(font, Vector2(696, 242), "采集目标：%s" % _display_name(store.resource), HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#c8e7f2"))
			draw_string(font, Vector2(696, 268), "内部缓存：%d / 20" % store.output, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#f2d49a"))
			_draw_panel_button(font, 0, "取出全部到背包")
			draw_string(font, Vector2(696, 382), "采矿机每 1.25 秒开采 1 份矿石。", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#a9c6d6"))
			_draw_panel_button(font, 4, "关闭面板", Color("#3d5363"))
		"furnace":
			draw_string(font, Vector2(696, 242), "输入：铁矿 %d  ·  铜矿 %d  ·  煤炭 %d" % [store.iron_ore, store.copper_ore, store.coal], HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("#c8e7f2"))
			draw_string(font, Vector2(696, 268), "输出：铁板 %d  ·  铜板 %d" % [store.iron_plate, store.copper_plate], HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("#f2d49a"))
			_draw_panel_button(font, 0, "放入 1 铁矿")
			_draw_panel_button(font, 1, "放入 1 铜矿")
			_draw_panel_button(font, 2, "放入 1 煤炭")
			_draw_panel_button(font, 3, "取出全部金属板", Color("#765d35"))
			_draw_panel_button(font, 4, "关闭面板", Color("#3d5363"))
		"belt":
			draw_string(font, Vector2(696, 242), "货物缓存：铁矿 %d  ·  铜矿 %d  ·  煤炭 %d" % [store.iron_ore, store.copper_ore, store.coal], HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#c8e7f2"))
			draw_string(font, Vector2(696, 268), "传送带演示物流缓存与移动特效。", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#a9c6d6"))
			_draw_panel_button(font, 0, "放入 1 铁矿")
			_draw_panel_button(font, 1, "放入 1 铜矿")
			_draw_panel_button(font, 2, "放入 1 煤炭")
			_draw_panel_button(font, 3, "取出全部货物", Color("#765d35"))
			_draw_panel_button(font, 4, "关闭面板", Color("#3d5363"))
		"lab":
			draw_string(font, Vector2(696, 242), "研究站已经完成首个自动化里程碑。", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#c8e7f2"))
			draw_string(font, Vector2(696, 272), "下一步可以扩展配方、传送带连接与电网。", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("#a9c6d6"))
			_draw_panel_button(font, 4, "关闭面板", Color("#3d5363"))

func _draw_panel_button(font: Font, index: int, label: String, tint := Color("#355d70")) -> void:
	var rect := _panel_button_rect(index)
	draw_rect(rect, tint, true)
	draw_rect(rect, tint.lightened(0.3), false, 1.0)
	draw_string(font, Vector2(rect.position.x + 12, rect.position.y + 24), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("#f1fbff"))

func _draw_footer(font: Font) -> void:
	draw_rect(Rect2(0, 680, 1024, 40), Color("#0d1b29"), true)
	var selector := "[1]采矿机  [2]石炉  [3]传送带  [4]研究站"
	draw_string(font, Vector2(24, 705), selector, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("#c8dce8"))
	draw_string(font, Vector2(506, 705), "左键建造/开面板  ·  右键拆除  ·  E 挖矿  ·  G 合成齿轮", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("#f4d68e"))
	if message_timer > 0.0:
		draw_rect(Rect2(220, 638, 584, 30), Color(0.03, 0.08, 0.12, 0.94), true)
		draw_string(font, Vector2(238, 660), message, HORIZONTAL_ALIGNMENT_CENTER, 548, 15, Color("#d5f4ff"))
