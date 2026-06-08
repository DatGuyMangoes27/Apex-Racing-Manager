extends Node

signal telemetry_result_applied(result: Dictionary)
signal telemetry_ingest_error(message: String)
signal telemetry_status_updated(status: Dictionary)

const WorldStateScr := preload("res://scripts/world/state/world_state.gd")
const TeamStateScr := preload("res://scripts/world/state/team_state.gd")
const CarStateScr := preload("res://scripts/world/state/car_state.gd")
const PartStateScr := preload("res://scripts/world/state/part_state.gd")
const DriverStateScr := preload("res://scripts/world/state/driver_state.gd")
const BudgetStateScr := preload("res://scripts/world/state/budget_state.gd")
const ChampionshipEntryStateScr := preload("res://scripts/world/state/championship_entry_state.gd")
const ContentRepositoryScr := preload("res://scripts/world/content/content_repository.gd")
const WorldGeneratorScr := preload("res://scripts/world/generation/world_generator.gd")
const TeamGeneratorScr := preload("res://scripts/world/generation/team_generator.gd")
const IdFactoryScr := preload("res://scripts/world/generation/id_factory.gd")
const CareerCreationAdapterScr := preload("res://scripts/adapters/career_creation_adapter.gd")
const PrototypeStateAdapterScr := preload("res://scripts/adapters/prototype_state_adapter.gd")
const RaceResultProcessorScr := preload("res://scripts/simulation/race_result_processor.gd")
const ManifestScr := preload("res://scripts/world/content/content_manifest.gd")

const SAVE_FORMAT_LEGACY := 1
const SAVE_FORMAT_WORLD_V2 := 2
const DEFAULT_SAVE_FILE_PATH := "user://savegame.json"
const DEFAULT_CAR_IMAGE_PATH := "res://assets/images/figma-hq/race-car.png"
const MARKETPLACE_LIVERY_MANIFEST_PATH := "res://data/generated/marketplace_livery_manifest.json"
# Ongoing marketplace inventory tuning.
const MARKET_TARGET_TOTAL := 16
const MARKET_TARGET_AUCTIONS := 6
const MARKET_MAX_TOTAL := 24
const MARKET_LISTING_TTL_WEEKS := 6
# Auction lot tuning.
const AUCTION_MIN_DURATION_WEEKS := 1
const AUCTION_MAX_DURATION_WEEKS := 4
const AUCTION_ANTI_SNIPE_DAYS := 2
const AUCTION_TARGET_RIVALS := 3
const SERIES_CATALOG_PATH := "res://data/series/championship_catalog.json"
const SCRUTINEERING_STANDARDS_PATH := "res://data/series/scrutineering_standards.json"
const MAIL_SCENE_PATH := "res://scenes/mail_screen.tscn"
const MARKETPLACE_SCENE_PATH := "res://scenes/marketplace_screen.tscn"
const SERIES_SCENE_PATH := "res://scenes/series_entry_screen.tscn"
const CALENDAR_SCENE_PATH := "res://scenes/calendar_screen.tscn"
const RACE_DAY_SCENE_PATH := "res://scenes/race_day_screen.tscn"
const GARAGE_SCENE_PATH := "res://scenes/garage_screen.tscn"
const PLACEHOLDER_SCENE_PATH := "res://scenes/section_placeholder.tscn"
## How many days before a race weekend the setup-brief email is delivered.
const PRE_RACE_MAIL_LEAD_DAYS := 5
const STAFF_PROFILES_PATH := "res://data/generated/staff_profiles.json"
const PORTRAIT_PROFILES_PATH := "res://data/generated/portrait_profiles.json"
const GENERATED_PORTRAIT_ROOT := "res://../public/images/generated"
const LATEST_TELEMETRY_RESULT_FILE := "user://telemetry/latest-race-complete.json"
const CALENDAR_DAY_NAMES := ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
const CALENDAR_MONTH_NAMES := ["", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]
const MAIL_SENDER_SLOTS := {
	"Team Manager": {
		"id": "team_manager",
		"staff_role_id": "staff_role.operations_logistics_lead",
		"fallback_name": "Team Manager",
		"fallback_role": "Team Operations",
		"fallback_initials": "TM",
		"fallback_portrait_id": "partner-partner-0006",
		"fallback_bio": "Keeps the programme moving between departments and turns broad team priorities into actionable day plans.",
		"fallback_story": "The operations lead is usually the first person who notices when the whole project is drifting off schedule."
	},
	"Will Joseph": {
		"id": "launch_engineer",
		"staff_role_id": "staff_role.race_engineer",
		"fallback_name": "Will Joseph",
		"fallback_role": "Race Mechanic",
		"fallback_initials": "WJ",
		"fallback_portrait_id": "partner-partner-0001",
		"fallback_bio": "Reads car choices through workload, setup direction, and how quickly the garage can become race-ready.",
		"fallback_story": "Usually appears when a technical decision is about to turn into a programme-defining commitment."
	},
	"Commercial Lead": {
		"id": "commercial_lead",
		"staff_role_id": "staff_role.commercial_lead",
		"fallback_name": "Commercial Lead",
		"fallback_role": "Commercial",
		"fallback_initials": "CL",
		"fallback_portrait_id": "partner-partner-0002",
		"fallback_bio": "Translates sporting credibility into sponsor leverage and watches whether the team looks investable from the outside.",
		"fallback_story": "Commercial messages tend to arrive when the paddock image of the team is moving faster than the balance sheet."
	},
	"Supplier Relations": {
		"id": "supplier_relations",
		"staff_role_id": "staff_role.operations_logistics_lead",
		"fallback_name": "Supplier Relations",
		"fallback_role": "Operations",
		"fallback_initials": "SR",
		"fallback_portrait_id": "partner-partner-0003",
		"fallback_bio": "Keeps vendors, freight, tooling, and workshop timing aligned so the race team can actually execute its plan.",
		"fallback_story": "This desk becomes most visible when a single unclear decision starts cascading into three supply problems."
	},
	"Chief Scout": {
		"id": "chief_scout",
		"staff_role_id": "staff_role.team_principal",
		"fallback_name": "Chief Scout",
		"fallback_role": "Chief Scout",
		"fallback_initials": "CS",
		"fallback_portrait_id": "partner-partner-0004",
		"fallback_bio": "Tracks the staff market, paddock reputations, and which personalities actually fit the shape of the project.",
		"fallback_story": "Recruitment notes read best when they come from someone who already understands the mood of the market."
	},
	"Board Office": {
		"id": "board_office",
		"fallback_name": "Clara Voss",
		"fallback_role": "Board Liaison",
		"fallback_initials": "CV",
		"fallback_portrait_id": "partner-partner-0005",
		"fallback_bio": "Acts as the bridge between owners, financial expectations, and the visible story the board wants the team to tell.",
		"fallback_story": "Board mail usually arrives when momentum matters more than perfection."
	},
	"Series Office": {
		"id": "series_office",
		"fallback_name": "Mia Ortega",
		"fallback_role": "Series Registrar",
		"fallback_initials": "MO",
		"fallback_portrait_id": "partner-partner-0007",
		"fallback_bio": "Handles entry packets, compliance timing, and the administrative line between interest and an active championship programme.",
		"fallback_story": "When the paddock says a team is finally in, it usually means the series office has already signed off."
	},
	"Operations Desk": {
		"id": "operations_desk",
		"staff_role_id": "staff_role.operations_logistics_lead",
		"fallback_name": "Operations Desk",
		"fallback_role": "Team",
		"fallback_initials": "OD",
		"fallback_portrait_id": "partner-partner-0008",
		"fallback_bio": "Connects contracts, workshop readiness, and day-to-day team movement once a big decision has been made.",
		"fallback_story": "Operations notes are the ones that make a headline decision feel real inside the building."
	},
	"Race Engineering": {
		"id": "race_engineering",
		"staff_role_id": "staff_role.race_engineer",
		"fallback_name": "Race Engineering",
		"fallback_role": "Race Engineer",
		"fallback_initials": "RE",
		"fallback_portrait_id": "partner-partner-0001",
		"fallback_bio": "Owns the technical read on pace, setup direction, and what the car was actually doing on track.",
		"fallback_story": "These are the voices that turn a result sheet into something the player can learn from."
	},
}
const PART_FAMILY_BY_SLOT := {
	"engine": "part_family.slot_engine",
	"chassis": "part_family.slot_chassis",
	"gearbox": "part_family.slot_gearbox",
	"brakes": "part_family.slot_brakes",
	"suspension": "part_family.slot_suspension",
}

var career_created := false
var founder_first_name := "Alex"
var founder_last_name := "Mercer"
var founder_age := 32
var founder_nationality := "British"
var founder_portrait_id := "partner-partner-0000"
var founder_leadership_style := "Hands-on team boss"
var founder_public_persona := "Reserved professional"
var founder_operational_bias := "Engineering-first"
var founder_driver_focus := "Race craft"
var founder_decision_tempo := "Balanced caller"
var founder_recruitment_focus := "Balanced meritocracy"
var founder_risk_appetite := "Calculated pressure"
var creation_flow_step: int = 0
## Canonical runtime world for the active career (null in legacy-only saves).
var _runtime_world: Variant = null
var persisted_world_seed: String = ""
var persisted_content_build_id: String = ""
var team_name := "Mercer Racing"
var team_abbreviation := "MER"
var team_primary_color := "#E10600"
var team_secondary_color := "#FFFFFF"
var background_name := "Former Racing Driver"
var background_summary := "You bring paddock credibility, sponsor trust, and enough personal profile to race while leading the project."
var background_opening_advantage := "Strong early credibility with drivers and paddock contacts."
var background_opening_risk := "The team still has to prove it can operate cleanly under pressure."
var startup_bias_name := "Sporting credibility"
var startup_scale_name := "Credible launch"
var startup_scale_summary := "Balanced commitments, believable supplier confidence, and enough structure to move without burning the save immediately."
var team_size_name := "Small core team"
var first_car_path_name := "Balanced used package"
var staffing_depth_name := "Lean specialists"
var runway_label := "10 WKS"
var weekly_burn_label := "$48K"
var monthly_burn_label := "$192K"
var launch_readiness_name := "Workable"
var supplier_confidence_name := "Open"
var staff_strain_name := "Manageable"
var immediate_blocker := "Close the first-car purchase before the project loses momentum."
var car_count := 0
var second_driver_state := "Not needed at launch"
var location_name := "Silverstone, UK"
var launch_budget_label := "$1.8M"
var founder_briefing := "You are entering the paddock as a founder-driver with a credible operation and a few obvious gaps to solve."
var first_week_pressure := "Secure the first car without wasting the launch momentum behind the project."
var career_effects: Dictionary = {}
var current_series_eyebrow := "PORSCHE 911 CARRERA CUP 3.8"
var current_series_name := "PORSCHE MOBIL 1\nSUPERCUP"
var next_race_in_label := "6 DAYS"
var next_race_track_name := "IMOLA"
var next_race_track_image_path := ""
var championship_position_label := "22nd"
var current_car_image_path := "res://assets/images/figma-hq/race-car.png"
var player_car_class_name := ""
var player_car_manufacturer := ""
var garage_scene_path := "res://scenes/garage_screen.tscn"
var championship_entered := false
var championship_name := ""
var current_year := 2026
# current_week is an ABSOLUTE week counter from CALENDAR_ORIGIN_YEAR (never reset):
# week 1 = first week of 2026, week 53 = first week of 2027, and so on. The displayed
# year/month are derived from it, so cross-year series flow seamlessly.
var current_week := 1
var current_day := 1
var current_month := 1
var current_day_of_month := 5
# Legacy global season counter. Kept only for save-file compatibility — the
# continuous timeline now tracks each championship's progress independently via
# championship_editions, so this is no longer used to offset the calendar.
var season_index := 0
# Per-series season counter on the continuous timeline, keyed by championship_id.
# Edition 0 is the career's first running of that series; each completed-and-
# re-entered edition adds WEEKS_PER_SEASON to its catalog week-slots so the series
# recurs in the matching part of the next year, fully independent of other series.
var championship_editions: Dictionary = {}
const CALENDAR_ORIGIN_YEAR := 2026
const WEEKS_PER_SEASON := 52
const MAX_ABSOLUTE_WEEK := 52 * 200
# Future standings contract for the Godot HQ screen.
# Each row should look like:
# {"flag": "UK", "driver": "A. Wood", "team": "Lockhart Motorsport", "pts": "0"}
var championship_standings: Array = []
var series_directory: Array = []
var active_series_detail: Dictionary = {}
var race_package: Dictionary = {}
var career_calendar_events: Array = []
var pending_race_context: Dictionary = {}
var race_conflict_decisions: Dictionary = {}
# Tracks championships whose end-of-season finale payout has already been paid,
# keyed by championship_id, so the title prize is never paid twice.
var championship_finales_paid: Dictionary = {}
# Live racing record for the player when they compete as team owner with no
# separate signed driver. Mirrors the per-driver stat shape.
var owner_driver_stats: Dictionary = {}
# Tutorial progress: which screens have already offered their first-visit
# walkthrough, plus a master enable flag. Shape:
# { "seen_screen_intros": { section_id: true }, "tutorials_enabled": true }
var tutorial_state: Dictionary = {}
# Archived end-of-season summaries (one per completed championship) for the
# season-review screen: champion, final standings, prize breakdown, player bests.
var season_summaries: Array = []
# Board/sponsor season target per entered championship, keyed by championship_id.
# Shape: {"target_position": int, "field_size": int, "label": String}
var season_expectations: Dictionary = {}
# Raw numeric Overview metrics for the player team.
# These are placeholders until the full team simulation populates them directly.
var overview_player_metrics: Dictionary = {
	"drivers": {
		"lead_driver_rating": 0.0,
		"support_driver_rating": 0.0,
		"wins": 0.0,
		"starts": 0.0,
		"podiums": 0.0,
		"points": 0.0,
		"top10_finishes": 0.0
	},
	"car": {
		"pace_rating": 0.0,
		"wins": 0.0,
		"podiums": 0.0,
		"points": 0.0,
		"top10_finishes": 0.0,
		"development_rating": 0.0
	},
	"facilities": {
		"quality": 18.0,
		"capacity": 18.0,
		"capability": 18.0
	},
	"staff": {
		"headcount": 8.0,
		"target_headcount": 24.0,
		"average_rating": 28.0,
		"leadership_rating": 30.0
	},
	"sponsors": {
		"weekly_income": 0.0,
		"portfolio_level": 0.0,
		"portfolio_quality": 18.0
	},
	"finances": {
		"cash_reserve": 1800000.0,
		"weekly_burn": 48000.0,
		"runway_weeks": 10.0,
		"debt": 0.0
	}
}
# Placeholder benchmark field for Overview outfit-vs-grid comparisons.
# Each team row should look like:
# {"team": "Lockhart Motorsport", "metrics": {"drivers": {...}, "car": {...}, "facilities": {...}, "staff": {...}, "sponsors": {...}, "finances": {...}}}
var overview_benchmark_grid: Array = [
	{"team": "Lockhart Motorsport", "metrics": {"drivers": {"lead_driver_rating": 82.0, "support_driver_rating": 76.0, "wins": 5.0, "starts": 12.0, "podiums": 9.0, "points": 188.0, "top10_finishes": 20.0}, "car": {"pace_rating": 84.0, "wins": 5.0, "podiums": 10.0, "points": 188.0, "top10_finishes": 20.0, "development_rating": 78.0}, "facilities": {"quality": 78.0, "capacity": 76.0, "capability": 74.0}, "staff": {"headcount": 25.0, "target_headcount": 26.0, "average_rating": 79.0, "leadership_rating": 82.0}, "sponsors": {"weekly_income": 132000.0, "portfolio_level": 5.0, "portfolio_quality": 82.0}, "finances": {"cash_reserve": 3400000.0, "weekly_burn": 88000.0, "runway_weeks": 20.0, "debt": 120000.0}}},
	{"team": "Hammer AMR", "metrics": {"drivers": {"lead_driver_rating": 78.0, "support_driver_rating": 73.0, "wins": 3.0, "starts": 12.0, "podiums": 7.0, "points": 154.0, "top10_finishes": 19.0}, "car": {"pace_rating": 78.0, "wins": 3.0, "podiums": 7.0, "points": 154.0, "top10_finishes": 19.0, "development_rating": 70.0}, "facilities": {"quality": 70.0, "capacity": 68.0, "capability": 66.0}, "staff": {"headcount": 22.0, "target_headcount": 24.0, "average_rating": 73.0, "leadership_rating": 75.0}, "sponsors": {"weekly_income": 109000.0, "portfolio_level": 4.0, "portfolio_quality": 74.0}, "finances": {"cash_reserve": 2600000.0, "weekly_burn": 76000.0, "runway_weeks": 18.0, "debt": 90000.0}}},
	{"team": "Otsuno Racing", "metrics": {"drivers": {"lead_driver_rating": 72.0, "support_driver_rating": 68.0, "wins": 2.0, "starts": 12.0, "podiums": 4.0, "points": 118.0, "top10_finishes": 16.0}, "car": {"pace_rating": 72.0, "wins": 2.0, "podiums": 4.0, "points": 118.0, "top10_finishes": 16.0, "development_rating": 64.0}, "facilities": {"quality": 66.0, "capacity": 64.0, "capability": 62.0}, "staff": {"headcount": 19.0, "target_headcount": 23.0, "average_rating": 67.0, "leadership_rating": 68.0}, "sponsors": {"weekly_income": 76000.0, "portfolio_level": 3.0, "portfolio_quality": 62.0}, "finances": {"cash_reserve": 1800000.0, "weekly_burn": 61000.0, "runway_weeks": 16.0, "debt": 80000.0}}},
	{"team": "Vittorio Corsa", "metrics": {"drivers": {"lead_driver_rating": 79.0, "support_driver_rating": 74.0, "wins": 4.0, "starts": 12.0, "podiums": 8.0, "points": 166.0, "top10_finishes": 19.0}, "car": {"pace_rating": 80.0, "wins": 4.0, "podiums": 8.0, "points": 166.0, "top10_finishes": 19.0, "development_rating": 74.0}, "facilities": {"quality": 74.0, "capacity": 72.0, "capability": 71.0}, "staff": {"headcount": 23.0, "target_headcount": 25.0, "average_rating": 75.0, "leadership_rating": 77.0}, "sponsors": {"weekly_income": 98000.0, "portfolio_level": 4.0, "portfolio_quality": 70.0}, "finances": {"cash_reserve": 2200000.0, "weekly_burn": 70000.0, "runway_weeks": 17.0, "debt": 110000.0}}},
	{"team": "Oberhof Racing Team", "metrics": {"drivers": {"lead_driver_rating": 69.0, "support_driver_rating": 66.0, "wins": 1.0, "starts": 12.0, "podiums": 3.0, "points": 92.0, "top10_finishes": 14.0}, "car": {"pace_rating": 67.0, "wins": 1.0, "podiums": 3.0, "points": 92.0, "top10_finishes": 14.0, "development_rating": 60.0}, "facilities": {"quality": 62.0, "capacity": 60.0, "capability": 59.0}, "staff": {"headcount": 18.0, "target_headcount": 23.0, "average_rating": 64.0, "leadership_rating": 63.0}, "sponsors": {"weekly_income": 64000.0, "portfolio_level": 3.0, "portfolio_quality": 58.0}, "finances": {"cash_reserve": 1500000.0, "weekly_burn": 56000.0, "runway_weeks": 15.0, "debt": 70000.0}}},
	{"team": "Dogtooth Lake Motor Group", "metrics": {"drivers": {"lead_driver_rating": 67.0, "support_driver_rating": 65.0, "wins": 1.0, "starts": 12.0, "podiums": 2.0, "points": 88.0, "top10_finishes": 13.0}, "car": {"pace_rating": 65.0, "wins": 1.0, "podiums": 2.0, "points": 88.0, "top10_finishes": 13.0, "development_rating": 58.0}, "facilities": {"quality": 60.0, "capacity": 59.0, "capability": 58.0}, "staff": {"headcount": 17.0, "target_headcount": 22.0, "average_rating": 62.0, "leadership_rating": 61.0}, "sponsors": {"weekly_income": 69000.0, "portfolio_level": 3.0, "portfolio_quality": 60.0}, "finances": {"cash_reserve": 1650000.0, "weekly_burn": 54000.0, "runway_weeks": 16.0, "debt": 50000.0}}},
	{"team": "Oranje GT", "metrics": {"drivers": {"lead_driver_rating": 66.0, "support_driver_rating": 63.0, "wins": 0.0, "starts": 12.0, "podiums": 1.0, "points": 74.0, "top10_finishes": 12.0}, "car": {"pace_rating": 66.0, "wins": 0.0, "podiums": 1.0, "points": 74.0, "top10_finishes": 12.0, "development_rating": 57.0}, "facilities": {"quality": 63.0, "capacity": 61.0, "capability": 60.0}, "staff": {"headcount": 16.0, "target_headcount": 22.0, "average_rating": 61.0, "leadership_rating": 60.0}, "sponsors": {"weekly_income": 60000.0, "portfolio_level": 2.0, "portfolio_quality": 57.0}, "finances": {"cash_reserve": 1420000.0, "weekly_burn": 52000.0, "runway_weeks": 14.0, "debt": 40000.0}}},
	{"team": "Northstar Racing", "metrics": {"drivers": {"lead_driver_rating": 74.0, "support_driver_rating": 70.0, "wins": 2.0, "starts": 12.0, "podiums": 5.0, "points": 132.0, "top10_finishes": 17.0}, "car": {"pace_rating": 74.0, "wins": 2.0, "podiums": 5.0, "points": 132.0, "top10_finishes": 17.0, "development_rating": 68.0}, "facilities": {"quality": 69.0, "capacity": 68.0, "capability": 67.0}, "staff": {"headcount": 20.0, "target_headcount": 24.0, "average_rating": 69.0, "leadership_rating": 71.0}, "sponsors": {"weekly_income": 86000.0, "portfolio_level": 3.0, "portfolio_quality": 66.0}, "finances": {"cash_reserve": 2100000.0, "weekly_burn": 63000.0, "runway_weeks": 18.0, "debt": 60000.0}}},
	{"team": "Atlas Autosport", "metrics": {"drivers": {"lead_driver_rating": 71.0, "support_driver_rating": 68.0, "wins": 1.0, "starts": 12.0, "podiums": 4.0, "points": 110.0, "top10_finishes": 15.0}, "car": {"pace_rating": 70.0, "wins": 1.0, "podiums": 4.0, "points": 110.0, "top10_finishes": 15.0, "development_rating": 64.0}, "facilities": {"quality": 66.0, "capacity": 65.0, "capability": 64.0}, "staff": {"headcount": 19.0, "target_headcount": 23.0, "average_rating": 67.0, "leadership_rating": 68.0}, "sponsors": {"weekly_income": 78000.0, "portfolio_level": 3.0, "portfolio_quality": 63.0}, "finances": {"cash_reserve": 1720000.0, "weekly_burn": 59000.0, "runway_weeks": 16.0, "debt": 55000.0}}},
	{"team": "Blue Peak Racing", "metrics": {"drivers": {"lead_driver_rating": 64.0, "support_driver_rating": 61.0, "wins": 0.0, "starts": 12.0, "podiums": 1.0, "points": 62.0, "top10_finishes": 10.0}, "car": {"pace_rating": 62.0, "wins": 0.0, "podiums": 1.0, "points": 62.0, "top10_finishes": 10.0, "development_rating": 55.0}, "facilities": {"quality": 59.0, "capacity": 58.0, "capability": 57.0}, "staff": {"headcount": 15.0, "target_headcount": 22.0, "average_rating": 59.0, "leadership_rating": 58.0}, "sponsors": {"weekly_income": 52000.0, "portfolio_level": 2.0, "portfolio_quality": 54.0}, "finances": {"cash_reserve": 1300000.0, "weekly_burn": 50000.0, "runway_weeks": 13.0, "debt": 30000.0}}}
]
# Future work-in-progress contracts for the Godot HQ screen.
# Project rows should look like:
# {"name": "Building Test Track", "progress": 0.61, "time_label": "18 Weeks", "target_label": "Headquarters", "target_scene": "", "target_context": "facilities/test-track"}
var facility_projects: Array = []
var rd_projects: Array = []
var pending_navigation_label := ""
var pending_navigation_context := ""
var pending_navigation_scene := ""
var pending_driver_browser_id := ""
var inbox_messages: Array = []
var _mail_staff_profiles_by_role: Dictionary = {}
var _mail_portrait_path_by_profile_id: Dictionary = {}
var marketplace_listings: Array = []
var startup_car_purchased := false
var startup_last_purchase_listing_id := ""
var _last_market_refresh_week := 0
var _eligible_market_class_cache: Array = []
# Auction lots the player is involved with (lot_id -> true) so the continue flow
# can surface closings to attend live.
var auction_watchlist: Dictionary = {}
var save_file_path := DEFAULT_SAVE_FILE_PATH
var _marketplace_livery_manifest_cache: Dictionary = {}
var _scrutineering_standards_cache: Dictionary = {}
var _series_catalog_rows_cache: Array = []
var _series_catalog_by_key_cache: Dictionary = {}
var _content_repository_cache: RefCounted = null
var _content_repository_load_count := 0
var _derived_world_cache: Dictionary = {}
var _derived_world_cache_dirty := true
var _derived_refresh_count := 0
var telemetry_live_status: Dictionary = {
	"connected": false,
	"ingestion_active": false,
	"message": "AMS2 live telemetry standby.",
	"session_type": "Unknown",
	"race_state": "Unavailable",
	"session_phase": "Unavailable",
	"track_name": "",
	"layout_name": "",
	"car_name": "",
	"car_class": "",
	"player_name": "",
	"player_position": 0,
	"laps_completed": 0,
	"participant_count": 0,
	"rain_density": 0.0
}
var _native_telemetry_connected := false
var _native_telemetry_retry_count := 0
const MAX_NATIVE_TELEMETRY_RETRIES := 30


func _ready() -> void:
	load_game()
	_connect_native_telemetry()
	_sync_native_telemetry_ingestion()


func set_save_file_path(path: String) -> void:
	save_file_path = path.strip_edges()
	if save_file_path.is_empty():
		save_file_path = DEFAULT_SAVE_FILE_PATH

func reset_to_defaults() -> void:
	career_created = false
	founder_first_name = "Alex"
	founder_last_name = "Mercer"
	founder_age = 32
	founder_nationality = "British"
	founder_portrait_id = "partner-partner-0000"
	founder_leadership_style = "Hands-on team boss"
	founder_public_persona = "Reserved professional"
	founder_operational_bias = "Engineering-first"
	founder_driver_focus = "Race craft"
	founder_decision_tempo = "Balanced caller"
	founder_recruitment_focus = "Balanced meritocracy"
	founder_risk_appetite = "Calculated pressure"
	creation_flow_step = 0
	_runtime_world = null
	persisted_world_seed = ""
	persisted_content_build_id = ""
	team_name = "Mercer Racing"
	team_abbreviation = "MER"
	team_primary_color = "#E10600"
	team_secondary_color = "#FFFFFF"
	background_name = "Former Racing Driver"
	background_summary = "You bring paddock credibility, sponsor trust, and enough personal profile to race while leading the project."
	background_opening_advantage = "Strong early credibility with drivers and paddock contacts."
	background_opening_risk = "The team still has to prove it can operate cleanly under pressure."
	startup_bias_name = "Sporting credibility"
	startup_scale_name = "Credible launch"
	startup_scale_summary = "Balanced commitments, believable supplier confidence, and enough structure to move without burning the save immediately."
	team_size_name = "Small core team"
	first_car_path_name = "Balanced used package"
	staffing_depth_name = "Lean specialists"
	runway_label = "10 WKS"
	weekly_burn_label = "$48K"
	monthly_burn_label = "$192K"
	launch_readiness_name = "Workable"
	supplier_confidence_name = "Open"
	staff_strain_name = "Manageable"
	immediate_blocker = "Close the first-car purchase before the project loses momentum."
	car_count = 0
	second_driver_state = "Not needed at launch"
	location_name = "Silverstone, UK"
	launch_budget_label = "$1.8M"
	founder_briefing = "You are entering the paddock as a founder-driver with a credible operation and a few obvious gaps to solve."
	first_week_pressure = "Secure the first car without wasting the launch momentum behind the project."
	career_effects = {}
	current_series_eyebrow = "PORSCHE 911 CARRERA CUP 3.8"
	current_series_name = "PORSCHE MOBIL 1\nSUPERCUP"
	next_race_in_label = "6 DAYS"
	next_race_track_name = "IMOLA"
	next_race_track_image_path = ""
	championship_position_label = "22nd"
	current_car_image_path = "res://assets/images/figma-hq/race-car.png"
	player_car_class_name = ""
	player_car_manufacturer = ""
	garage_scene_path = "res://scenes/garage_screen.tscn"
	championship_entered = false
	championship_name = ""
	current_year = 2026
	current_week = 1
	current_day = 1
	season_index = 0
	championship_editions = {}
	current_month = 1
	current_day_of_month = 5
	championship_standings = []
	series_directory = []
	active_series_detail = {}
	race_package = {}
	career_calendar_events = []
	pending_race_context = {}
	race_conflict_decisions = {}
	championship_finales_paid = {}
	owner_driver_stats = {}
	tutorial_state = _default_tutorial_state()
	season_summaries = []
	season_expectations = {}
	_marketplace_livery_manifest_cache = {}
	overview_player_metrics = {
		"drivers": {
			"lead_driver_rating": 0.0,
			"support_driver_rating": 0.0,
			"wins": 0.0,
			"starts": 0.0,
			"podiums": 0.0,
			"points": 0.0,
			"top10_finishes": 0.0
		},
		"car": {
			"pace_rating": 0.0,
			"wins": 0.0,
			"podiums": 0.0,
			"points": 0.0,
			"top10_finishes": 0.0,
			"development_rating": 0.0
		},
		"facilities": {
			"quality": 18.0,
			"capacity": 18.0,
			"capability": 18.0
		},
		"staff": {
			"headcount": 8.0,
			"target_headcount": 24.0,
			"average_rating": 28.0,
			"leadership_rating": 30.0
		},
		"sponsors": {
			"weekly_income": 0.0,
			"portfolio_level": 0.0,
			"portfolio_quality": 18.0
		},
		"finances": {
			"cash_reserve": 1800000.0,
			"weekly_burn": 48000.0,
			"runway_weeks": 10.0,
			"debt": 0.0
		}
	}
	overview_benchmark_grid = [
		{"team": "Lockhart Motorsport", "ratings": {"Car": 82.0, "Drivers": 78.0, "Facilities": 74.0, "Staff": 76.0, "Sponsors": 72.0, "Finances": 70.0}},
		{"team": "Hammer AMR", "ratings": {"Car": 76.0, "Drivers": 74.0, "Facilities": 68.0, "Staff": 71.0, "Sponsors": 69.0, "Finances": 66.0}},
		{"team": "Otsuno Racing", "ratings": {"Car": 71.0, "Drivers": 69.0, "Facilities": 66.0, "Staff": 64.0, "Sponsors": 58.0, "Finances": 60.0}},
		{"team": "Vittorio Corsa", "ratings": {"Car": 79.0, "Drivers": 75.0, "Facilities": 72.0, "Staff": 74.0, "Sponsors": 67.0, "Finances": 63.0}},
		{"team": "Oberhof Racing Team", "ratings": {"Car": 67.0, "Drivers": 68.0, "Facilities": 61.0, "Staff": 63.0, "Sponsors": 56.0, "Finances": 58.0}},
		{"team": "Dogtooth Lake Motor Group", "ratings": {"Car": 64.0, "Drivers": 66.0, "Facilities": 60.0, "Staff": 61.0, "Sponsors": 59.0, "Finances": 61.0}},
		{"team": "Oranje GT", "ratings": {"Car": 66.0, "Drivers": 64.0, "Facilities": 62.0, "Staff": 60.0, "Sponsors": 55.0, "Finances": 57.0}},
		{"team": "Northstar Racing", "ratings": {"Car": 73.0, "Drivers": 71.0, "Facilities": 69.0, "Staff": 68.0, "Sponsors": 63.0, "Finances": 64.0}},
		{"team": "Atlas Autosport", "ratings": {"Car": 69.0, "Drivers": 67.0, "Facilities": 65.0, "Staff": 66.0, "Sponsors": 61.0, "Finances": 59.0}},
		{"team": "Blue Peak Racing", "ratings": {"Car": 62.0, "Drivers": 63.0, "Facilities": 58.0, "Staff": 59.0, "Sponsors": 54.0, "Finances": 56.0}}
	]
	facility_projects = []
	rd_projects = []
	pending_navigation_label = ""
	pending_navigation_context = ""
	pending_navigation_scene = ""
	inbox_messages = []
	marketplace_listings = []
	startup_car_purchased = false
	startup_last_purchase_listing_id = ""
	_clear_runtime_performance_caches(true)
	telemetry_live_status = _default_live_telemetry_status()

func apply_creation_setup(data: Dictionary) -> void:
	career_created = true
	founder_first_name = data.get("founder_first_name", founder_first_name)
	founder_last_name = data.get("founder_last_name", founder_last_name)
	founder_age = data.get("founder_age", founder_age)
	founder_nationality = data.get("founder_nationality", founder_nationality)
	founder_portrait_id = data.get("founder_portrait_id", founder_portrait_id)
	founder_leadership_style = data.get("founder_leadership_style", founder_leadership_style)
	founder_public_persona = data.get("founder_public_persona", founder_public_persona)
	founder_operational_bias = data.get("founder_operational_bias", data.get("founder_driver_focus", founder_operational_bias))
	founder_driver_focus = founder_operational_bias
	founder_decision_tempo = str(data.get("founder_decision_tempo", founder_decision_tempo))
	founder_recruitment_focus = str(data.get("founder_recruitment_focus", founder_recruitment_focus))
	founder_risk_appetite = str(data.get("founder_risk_appetite", founder_risk_appetite))
	creation_flow_step = int(data.get("creation_flow_step", creation_flow_step))
	team_name = data.get("team_name", team_name)
	team_abbreviation = data.get("team_abbreviation", team_abbreviation)
	team_primary_color = data.get("team_primary_color", team_primary_color)
	team_secondary_color = data.get("team_secondary_color", team_secondary_color)
	background_name = data.get("background_name", background_name)
	background_summary = data.get("background_summary", background_summary)
	background_opening_advantage = data.get("background_opening_advantage", background_opening_advantage)
	background_opening_risk = data.get("background_opening_risk", background_opening_risk)
	startup_bias_name = data.get("startup_bias_name", startup_bias_name)
	startup_scale_name = data.get("startup_scale_name", startup_scale_name)
	startup_scale_summary = data.get("startup_scale_summary", startup_scale_summary)
	team_size_name = data.get("team_size_name", team_size_name)
	first_car_path_name = data.get("first_car_path_name", first_car_path_name)
	staffing_depth_name = data.get("staffing_depth_name", staffing_depth_name)
	runway_label = data.get("runway_label", runway_label)
	weekly_burn_label = data.get("weekly_burn_label", weekly_burn_label)
	monthly_burn_label = data.get("monthly_burn_label", monthly_burn_label)
	launch_readiness_name = data.get("launch_readiness_name", launch_readiness_name)
	supplier_confidence_name = data.get("supplier_confidence_name", supplier_confidence_name)
	staff_strain_name = data.get("staff_strain_name", staff_strain_name)
	immediate_blocker = data.get("immediate_blocker", immediate_blocker)
	car_count = data.get("car_count", car_count)
	second_driver_state = data.get("second_driver_state", second_driver_state)
	location_name = data.get("location_name", location_name)
	launch_budget_label = data.get("launch_budget_label", launch_budget_label)
	founder_briefing = data.get("founder_briefing", founder_briefing)
	first_week_pressure = data.get("first_week_pressure", first_week_pressure)
	var raw_effects: Variant = data.get("career_effects", career_effects)
	career_effects = raw_effects.duplicate(true) if raw_effects is Dictionary else {}
	current_series_eyebrow = str(data.get("current_series_eyebrow", current_series_eyebrow))
	current_series_name = str(data.get("current_series_name", current_series_name))
	next_race_in_label = str(data.get("next_race_in_label", next_race_in_label))
	next_race_track_name = str(data.get("next_race_track_name", next_race_track_name))
	next_race_track_image_path = str(data.get("next_race_track_image_path", next_race_track_image_path))
	championship_position_label = str(data.get("championship_position_label", championship_position_label))
	current_car_image_path = str(data.get("current_car_image_path", current_car_image_path))
	player_car_class_name = str(data.get("player_car_class_name", player_car_class_name))
	player_car_manufacturer = str(data.get("player_car_manufacturer", player_car_manufacturer))
	garage_scene_path = str(data.get("garage_scene_path", garage_scene_path))
	championship_entered = bool(data.get("championship_entered", championship_entered))
	championship_name = str(data.get("championship_name", championship_name))
	var has_calendar_state := data.has("current_year") or data.has("current_week") or data.has("current_day")
	var has_actual_date := data.has("current_month") or data.has("current_day_of_month")
	current_year = int(data.get("current_year", current_year))
	season_index = maxi(int(data.get("season_index", season_index)), 0)
	var editions_data: Variant = data.get("championship_editions", championship_editions)
	championship_editions = editions_data if typeof(editions_data) == TYPE_DICTIONARY else {}
	current_week = clampi(int(data.get("current_week", current_week)), 1, MAX_ABSOLUTE_WEEK)
	current_day = clampi(int(data.get("current_day", current_day)), 1, 7)
	current_month = clampi(int(data.get("current_month", current_month)), 1, 12)
	current_day_of_month = clampi(int(data.get("current_day_of_month", current_day_of_month)), 1, 31)
	var standings_data: Variant = data.get("championship_standings", championship_standings)
	championship_standings = standings_data if typeof(standings_data) == TYPE_ARRAY else []
	var series_directory_data: Variant = data.get("series_directory", series_directory)
	series_directory = series_directory_data if typeof(series_directory_data) == TYPE_ARRAY else []
	var active_series_detail_data: Variant = data.get("active_series_detail", active_series_detail)
	active_series_detail = active_series_detail_data if typeof(active_series_detail_data) == TYPE_DICTIONARY else {}
	var calendar_events_data: Variant = data.get("career_calendar_events", career_calendar_events)
	career_calendar_events = calendar_events_data if typeof(calendar_events_data) == TYPE_ARRAY else []
	var pending_context_data: Variant = data.get("pending_race_context", pending_race_context)
	pending_race_context = pending_context_data if typeof(pending_context_data) == TYPE_DICTIONARY else {}
	var conflict_decisions_data: Variant = data.get("race_conflict_decisions", race_conflict_decisions)
	race_conflict_decisions = conflict_decisions_data if typeof(conflict_decisions_data) == TYPE_DICTIONARY else {}
	var finales_paid_data: Variant = data.get("championship_finales_paid", championship_finales_paid)
	championship_finales_paid = finales_paid_data if typeof(finales_paid_data) == TYPE_DICTIONARY else {}
	var owner_stats_data: Variant = data.get("owner_driver_stats", owner_driver_stats)
	owner_driver_stats = owner_stats_data if typeof(owner_stats_data) == TYPE_DICTIONARY else {}
	var tutorial_data: Variant = data.get("tutorial_state", tutorial_state)
	tutorial_state = tutorial_data if typeof(tutorial_data) == TYPE_DICTIONARY else _default_tutorial_state()
	if not tutorial_state.has("seen_screen_intros") or typeof(tutorial_state.get("seen_screen_intros")) != TYPE_DICTIONARY:
		tutorial_state["seen_screen_intros"] = {}
	if not tutorial_state.has("tutorials_enabled"):
		tutorial_state["tutorials_enabled"] = true
	var season_summaries_data: Variant = data.get("season_summaries", season_summaries)
	season_summaries = season_summaries_data if typeof(season_summaries_data) == TYPE_ARRAY else []
	var season_expectations_data: Variant = data.get("season_expectations", season_expectations)
	season_expectations = season_expectations_data if typeof(season_expectations_data) == TYPE_DICTIONARY else {}
	var player_metrics_data: Variant = data.get("overview_player_metrics", overview_player_metrics)
	overview_player_metrics = _sanitize_overview_player_metrics(player_metrics_data if typeof(player_metrics_data) == TYPE_DICTIONARY else overview_player_metrics)
	var benchmark_grid_data: Variant = data.get("overview_benchmark_grid", overview_benchmark_grid)
	overview_benchmark_grid = _sanitize_benchmark_grid(benchmark_grid_data if typeof(benchmark_grid_data) == TYPE_ARRAY else overview_benchmark_grid)
	var facility_data: Variant = data.get("facility_projects", facility_projects)
	facility_projects = _sanitize_project_array(facility_data if typeof(facility_data) == TYPE_ARRAY else facility_projects)
	var rd_data: Variant = data.get("rd_projects", rd_projects)
	rd_projects = _sanitize_project_array(rd_data if typeof(rd_data) == TYPE_ARRAY else rd_projects)
	pending_navigation_label = str(data.get("pending_navigation_label", pending_navigation_label))
	pending_navigation_context = str(data.get("pending_navigation_context", pending_navigation_context))
	pending_navigation_scene = str(data.get("pending_navigation_scene", pending_navigation_scene))
	var inbox_data: Variant = data.get("inbox_messages", inbox_messages)
	inbox_messages = _sanitize_mail_array(inbox_data if typeof(inbox_data) == TYPE_ARRAY else inbox_messages)
	var marketplace_data: Variant = data.get("marketplace_listings", marketplace_listings)
	marketplace_listings = _sanitize_marketplace_listings(marketplace_data if typeof(marketplace_data) == TYPE_ARRAY else marketplace_listings)
	startup_car_purchased = bool(data.get("startup_car_purchased", startup_car_purchased))
	startup_last_purchase_listing_id = str(data.get("startup_last_purchase_listing_id", startup_last_purchase_listing_id))
	_last_market_refresh_week = int(data.get("last_market_refresh_week", _last_market_refresh_week))
	var watchlist_data: Variant = data.get("auction_watchlist", auction_watchlist)
	auction_watchlist = (watchlist_data as Dictionary).duplicate(true) if watchlist_data is Dictionary else {}
	if not has_calendar_state and championship_entered:
		_anchor_calendar_to_next_race()
	elif has_actual_date:
		_sync_progress_from_calendar_date()
	else:
		_sync_calendar_date_from_progress()
	_sync_native_telemetry_ingestion()


func apply_founder_identity_setup(data: Dictionary) -> void:
	var normalized: Dictionary = CareerCreationAdapterScr.normalize_founder_identity(data)
	founder_first_name = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_FIRST_NAME])
	founder_last_name = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_LAST_NAME])
	founder_age = int(normalized[CareerCreationAdapterScr.KEY_FOUNDER_AGE])
	founder_nationality = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_NATIONALITY])
	founder_portrait_id = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_PORTRAIT_ID])
	founder_leadership_style = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_LEADERSHIP_STYLE])
	founder_public_persona = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_PUBLIC_PERSONA])
	founder_operational_bias = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_OPERATIONAL_BIAS])
	founder_driver_focus = founder_operational_bias
	founder_decision_tempo = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_DECISION_TEMPO])
	founder_recruitment_focus = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_RECRUITMENT_FOCUS])
	founder_risk_appetite = str(normalized[CareerCreationAdapterScr.KEY_FOUNDER_RISK_APPETITE])
	creation_flow_step = int(normalized[CareerCreationAdapterScr.KEY_CREATION_FLOW_STEP])
	save_game()


func apply_world_derived_summaries(derived: Dictionary) -> void:
	if derived.is_empty():
		return
	if derived.has("team_name"):
		team_name = str(derived["team_name"])
	championship_entered = bool(derived.get("championship_entered", championship_entered))
	championship_name = str(derived.get("championship_name", championship_name))
	current_series_eyebrow = str(derived.get("current_series_eyebrow", current_series_eyebrow))
	current_series_name = str(derived.get("current_series_name", current_series_name))
	next_race_in_label = str(derived.get("next_race_in_label", next_race_in_label))
	next_race_track_name = str(derived.get("next_race_track_name", next_race_track_name))
	next_race_track_image_path = str(derived.get("next_race_track_image_path", next_race_track_image_path))
	championship_position_label = str(derived.get("championship_position_label", championship_position_label))
	var series_dir: Variant = derived.get("series_directory", series_directory)
	series_directory = series_dir if typeof(series_dir) == TYPE_ARRAY else []
	var active_series: Variant = derived.get("active_series_detail", active_series_detail)
	active_series_detail = active_series if typeof(active_series) == TYPE_DICTIONARY else {}
	_substitute_owner_in_driver_standings()
	var race_package_data: Variant = derived.get("race_package", race_package)
	race_package = race_package_data if typeof(race_package_data) == TYPE_DICTIONARY else {}
	var calendar_events_data: Variant = derived.get("career_calendar_events", career_calendar_events)
	career_calendar_events = calendar_events_data if typeof(calendar_events_data) == TYPE_ARRAY else []
	launch_budget_label = str(derived.get("launch_budget_label", launch_budget_label))
	weekly_burn_label = str(derived.get("weekly_burn_label", weekly_burn_label))
	monthly_burn_label = str(derived.get("monthly_burn_label", monthly_burn_label))
	runway_label = str(derived.get("runway_label", runway_label))
	car_count = int(derived.get("car_count", car_count))
	var opm: Variant = derived.get("overview_player_metrics", overview_player_metrics)
	overview_player_metrics = _sanitize_overview_player_metrics(opm if typeof(opm) == TYPE_DICTIONARY else overview_player_metrics)
	var obg: Variant = derived.get("overview_benchmark_grid", overview_benchmark_grid)
	overview_benchmark_grid = _sanitize_benchmark_grid(obg if typeof(obg) == TYPE_ARRAY else overview_benchmark_grid)
	var st: Variant = derived.get("championship_standings", championship_standings)
	championship_standings = st if typeof(st) == TYPE_ARRAY else []
	_sync_native_telemetry_ingestion()


func finalize_new_career_after_review(repo: RefCounted, narrative_overlay: Dictionary, start_ctx: Dictionary) -> bool:
	if repo.load_all() != OK:
		push_error("PrototypeState: content repository load failed during career finalize")
		return false
	_cache_content_repository(repo)
	var effects: Dictionary = CareerCreationAdapterScr.build_career_choice_effects(narrative_overlay, start_ctx)
	var world_ctx: Dictionary = start_ctx.duplicate(true)
	world_ctx["career_effects"] = effects
	var start_cfg: Dictionary = CareerCreationAdapterScr.build_world_start_config(repo, world_ctx)
	var seed := str(start_ctx.get("world_seed", "career_seed"))
	var world: Variant = WorldGeneratorScr.generate(repo, seed, start_cfg)
	if not world is WorldStateScr:
		push_error("PrototypeState: world generation did not return WorldState")
		return false
	if not world.validate_basic():
		push_error("PrototypeState: generated world failed validation")
		return false
	persisted_world_seed = seed
	var mf: Variant = repo.get_manifest()
	persisted_content_build_id = str((mf as Dictionary).get(ManifestScr.KEY_CONTENT_BUILD_ID, "")) if mf is Dictionary else ""
	_runtime_world = world
	apply_creation_setup(narrative_overlay)
	career_effects = effects.duplicate(true)
	career_created = true
	_seed_startup_operations(repo, world)
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	save_game()
	return true


func get_runtime_world() -> Variant:
	return _runtime_world


func get_runtime_performance_stats() -> Dictionary:
	return {
		"content_repository_loaded": _content_repository_cache != null,
		"content_repository_load_count": _content_repository_load_count,
		"derived_refresh_count": _derived_refresh_count,
		"derived_cache_dirty": _derived_world_cache_dirty,
		"derived_cache_keys": _derived_world_cache.keys().size(),
	}


func _cache_content_repository(repo: RefCounted) -> void:
	if repo == null:
		return
	_content_repository_cache = repo


func _content_repository() -> RefCounted:
	if _content_repository_cache != null:
		return _content_repository_cache
	var repo: RefCounted = ContentRepositoryScr.new()
	_content_repository_load_count += 1
	if repo.load_all() != OK:
		return null
	_cache_content_repository(repo)
	return _content_repository_cache


func _clear_runtime_performance_caches(reset_counters: bool = false) -> void:
	_content_repository_cache = null
	_derived_world_cache = {}
	_derived_world_cache_dirty = true
	if reset_counters:
		_content_repository_load_count = 0
		_derived_refresh_count = 0


func _mark_world_derived_dirty() -> void:
	_derived_world_cache_dirty = true


func _ensure_world_derived_summaries(force_refresh: bool = false) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {}
	if not force_refresh and not _derived_world_cache_dirty and not _derived_world_cache.is_empty():
		return _derived_world_cache.duplicate(true)
	var repo: RefCounted = _content_repository()
	if repo == null:
		return {}
	var derived: Dictionary = PrototypeStateAdapterScr.derive_prototype_fields(repo, _runtime_world, championship_editions)
	if derived.is_empty():
		return {}
	_derived_refresh_count += 1
	_derived_world_cache = derived.duplicate(true)
	_derived_world_cache_dirty = false
	apply_world_derived_summaries(_derived_world_cache)
	return _derived_world_cache.duplicate(true)


func save_game() -> void:
	var file = FileAccess.open(save_file_path, FileAccess.WRITE)
	if not file:
		return
	var save_data: Dictionary
	if _runtime_world != null and _runtime_world.has_method("to_dict"):
		save_data = {
			"save_format": SAVE_FORMAT_WORLD_V2,
			"world_seed": persisted_world_seed,
			"content_build_id": persisted_content_build_id,
			"world": _runtime_world.call("to_dict"),
			"narrative": _legacy_save_payload(),
		}
	else:
		save_data = _legacy_save_payload()
	file.store_string(JSON.stringify(save_data, "\t"))
	file.close()


func _legacy_save_payload() -> Dictionary:
	return {
		"career_created": career_created,
		"founder_first_name": founder_first_name,
		"founder_last_name": founder_last_name,
		"founder_age": founder_age,
		"founder_nationality": founder_nationality,
		"founder_portrait_id": founder_portrait_id,
		"founder_leadership_style": founder_leadership_style,
		"founder_public_persona": founder_public_persona,
		"founder_operational_bias": founder_operational_bias,
		"founder_driver_focus": founder_driver_focus,
		"founder_decision_tempo": founder_decision_tempo,
		"founder_recruitment_focus": founder_recruitment_focus,
		"founder_risk_appetite": founder_risk_appetite,
		"creation_flow_step": creation_flow_step,
		"team_name": team_name,
		"team_abbreviation": team_abbreviation,
		"team_primary_color": team_primary_color,
		"team_secondary_color": team_secondary_color,
		"background_name": background_name,
		"background_summary": background_summary,
		"background_opening_advantage": background_opening_advantage,
		"background_opening_risk": background_opening_risk,
		"startup_bias_name": startup_bias_name,
		"startup_scale_name": startup_scale_name,
		"startup_scale_summary": startup_scale_summary,
		"team_size_name": team_size_name,
		"first_car_path_name": first_car_path_name,
		"staffing_depth_name": staffing_depth_name,
		"runway_label": runway_label,
		"weekly_burn_label": weekly_burn_label,
		"monthly_burn_label": monthly_burn_label,
		"launch_readiness_name": launch_readiness_name,
		"supplier_confidence_name": supplier_confidence_name,
		"staff_strain_name": staff_strain_name,
		"immediate_blocker": immediate_blocker,
		"car_count": car_count,
		"second_driver_state": second_driver_state,
		"location_name": location_name,
		"launch_budget_label": launch_budget_label,
		"founder_briefing": founder_briefing,
		"first_week_pressure": first_week_pressure,
		"career_effects": career_effects,
		"current_series_eyebrow": current_series_eyebrow,
		"current_series_name": current_series_name,
		"next_race_in_label": next_race_in_label,
		"next_race_track_name": next_race_track_name,
		"next_race_track_image_path": next_race_track_image_path,
		"championship_position_label": championship_position_label,
		"current_car_image_path": current_car_image_path,
		"player_car_class_name": player_car_class_name,
		"player_car_manufacturer": player_car_manufacturer,
		"garage_scene_path": garage_scene_path,
		"championship_entered": championship_entered,
		"championship_name": championship_name,
		"current_year": current_year,
		"season_index": season_index,
		"championship_editions": championship_editions,
		"current_week": current_week,
		"current_day": current_day,
		"current_month": current_month,
		"current_day_of_month": current_day_of_month,
		"championship_standings": championship_standings,
		"series_directory": series_directory,
		"active_series_detail": active_series_detail,
		"career_calendar_events": career_calendar_events,
		"pending_race_context": pending_race_context,
		"race_conflict_decisions": race_conflict_decisions,
		"championship_finales_paid": championship_finales_paid,
		"owner_driver_stats": owner_driver_stats,
		"tutorial_state": tutorial_state,
		"season_summaries": season_summaries,
		"season_expectations": season_expectations,
		"overview_player_metrics": overview_player_metrics,
		"overview_benchmark_grid": overview_benchmark_grid,
		"facility_projects": facility_projects,
		"rd_projects": rd_projects,
		"pending_navigation_label": pending_navigation_label,
		"pending_navigation_context": pending_navigation_context,
		"pending_navigation_scene": pending_navigation_scene,
		"inbox_messages": inbox_messages,
		"marketplace_listings": marketplace_listings,
		"startup_car_purchased": startup_car_purchased,
		"startup_last_purchase_listing_id": startup_last_purchase_listing_id,
		"last_market_refresh_week": _last_market_refresh_week,
		"auction_watchlist": auction_watchlist
	}


func load_game() -> bool:
	if not has_save_file():
		return false
	var file = FileAccess.open(save_file_path, FileAccess.READ)
	if not file:
		return false
	var json_string := file.get_as_text()
	file.close()
	var json := JSON.new()
	if json.parse(json_string) != OK:
		return false
	var data: Variant = json.get_data()
	if typeof(data) != TYPE_DICTIONARY:
		return false
	var d: Dictionary = data
	var fmt: int = int(d.get("save_format", SAVE_FORMAT_LEGACY))
	if fmt == SAVE_FORMAT_WORLD_V2:
		return _load_game_v2(d)
	_legacy_load_from_flat_dict(d)
	return true


func _legacy_load_from_flat_dict(d: Dictionary) -> void:
	_runtime_world = null
	persisted_world_seed = ""
	persisted_content_build_id = ""
	apply_creation_setup(d)
	career_created = bool(d.get("career_created", true))


func _load_game_v2(d: Dictionary) -> bool:
	var nar: Variant = d.get("narrative", {})
	if nar is Dictionary:
		apply_creation_setup(nar as Dictionary)
	persisted_world_seed = str(d.get("world_seed", ""))
	persisted_content_build_id = str(d.get("content_build_id", ""))
	_runtime_world = null
	var wd: Variant = d.get("world", {})
	if wd is Dictionary and not (wd as Dictionary).is_empty():
		_runtime_world = WorldStateScr.from_dict(wd as Dictionary)
	if nar is Dictionary:
		career_created = bool((nar as Dictionary).get("career_created", career_created))
	_mark_world_derived_dirty()
	backfill_entered_championship_fields()
	_ensure_world_derived_summaries(true)
	return true


## Repairs saves where an entered championship has no AI field (e.g. Carrera Cup
## Asia, which shipped with no generated entrants). Seeds the missing fields from
## sibling championships sharing the same car class. Safe to call repeatedly.
func backfill_entered_championship_fields() -> bool:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return false
	var repo: RefCounted = _content_repository()
	if repo == null:
		return false
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var team := _player_team_from_world(world)
	if team == null:
		return false
	var seen: Dictionary = {}
	var changed := false
	for entry_id: String in team.championship_entry_instance_ids:
		var entry = world.championship_entries.get(entry_id)
		if entry == null:
			continue
		var championship_id := String(entry.championship_id)
		if championship_id.is_empty() or seen.has(championship_id):
			continue
		seen[championship_id] = true
		if _championship_entry_count(world, championship_id) > 1:
			continue
		_ensure_championship_field_entries(world, repo, championship_id, team.instance_id)
		if _championship_entry_count(world, championship_id) > 1:
			changed = true
	if changed:
		_mark_world_derived_dirty()
		save_game()
	return changed


func has_save_file() -> bool:
	return FileAccess.file_exists(save_file_path)


func has_creation_setup() -> bool:
	return career_created


func dashboard_title() -> String:
	return team_name if has_creation_setup() else "Home"


func dashboard_summary() -> String:
	if not has_creation_setup():
		return "Next race at Interlagos. Use this screen as the main career dashboard for race prep, inbox triage, and team monitoring."
	return "%s %s leads %s from %s. %s Launch posture: %s. Immediate blocker: %s. Opening pressure: %s" % [
		founder_first_name,
		founder_last_name,
		team_name,
		location_name,
		founder_briefing,
		startup_scale_name,
		immediate_blocker,
		first_week_pressure
	]


func cash_label() -> String:
	return launch_budget_label


func current_cash_balance() -> float:
	if _runtime_world != null and _runtime_world is WorldStateScr:
		var budget := _player_budget_from_world(_runtime_world as WorldStateScr)
		if budget != null:
			return budget.cash
	var finances: Dictionary = get_overview_player_metrics().get("finances", {})
	return float(finances.get("cash_reserve", 0.0))


func top_bar_balance_label() -> String:
	return "BALANCE %s" % _fmt_money_whole(current_cash_balance(), "£")


func fleet_status_label() -> String:
	if car_count <= 0:
		return "No car owned"
	if car_count == 1:
		return "1-car fleet"
	return "%d-car fleet" % car_count


func get_owned_fleet() -> Array:
	var out: Array = []
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return out
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var team: TeamStateScr = _player_team_from_world(world)
	if team == null:
		return out
	var repo: RefCounted = _content_repository()
	for idx in range(team.car_instance_ids.size()):
		var cid := str(team.car_instance_ids[idx])
		if not world.cars.has(cid):
			continue
		var car: CarStateScr = world.cars[cid] as CarStateScr
		if car == null:
			continue
		var class_label := ""
		var manufacturer_label := ""
		if repo != null:
			var platform: Variant = repo.get_car_platform(car.car_platform_id)
			if platform is Dictionary:
				var ccid := str((platform as Dictionary).get("car_class_id", ""))
				if not ccid.is_empty():
					class_label = _car_class_display_name(repo, ccid)
				var mid := str((platform as Dictionary).get("manufacturer_id", ""))
				if not mid.is_empty():
					manufacturer_label = _manufacturer_display_name(repo, mid)
		var condition := _car_average_condition(world, car)
		out.append({
			"instance_id": cid,
			"name": str(car.display_name),
			"class_label": class_label,
			"manufacturer_label": manufacturer_label,
			"is_primary": idx == 0,
			"condition": condition,
			"condition_label": _condition_label_from_ratio(condition),
		})
	return out


# Per-system wear multipliers (engine/gearbox stress hardest, chassis least).
const SYSTEM_WEAR_RATE := {
	"engine": 1.45,
	"gearbox": 1.2,
	"brakes": 1.1,
	"suspension": 1.0,
	"chassis": 0.6,
}
const SYSTEM_DISPLAY_ORDER := ["engine", "gearbox", "brakes", "suspension", "chassis"]
const SYSTEM_LABELS := {
	"engine": "Engine",
	"gearbox": "Gearbox",
	"brakes": "Brakes",
	"suspension": "Suspension",
	"chassis": "Chassis",
}
const SCRUTINEERING_DEFAULT_MIN := 0.40


func _load_scrutineering_standards() -> Dictionary:
	if not _scrutineering_standards_cache.is_empty():
		return _scrutineering_standards_cache
	var fallback := {"default_min_condition": SCRUTINEERING_DEFAULT_MIN, "by_tier": {}, "by_ruleset": {}, "by_championship": {}}
	if not FileAccess.file_exists(SCRUTINEERING_STANDARDS_PATH):
		_scrutineering_standards_cache = fallback
		return _scrutineering_standards_cache
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(SCRUTINEERING_STANDARDS_PATH))
	if typeof(parsed) != TYPE_DICTIONARY:
		_scrutineering_standards_cache = fallback
		return _scrutineering_standards_cache
	var data: Dictionary = parsed as Dictionary
	if not data.has("default_min_condition"):
		data["default_min_condition"] = SCRUTINEERING_DEFAULT_MIN
	for key in ["by_tier", "by_ruleset", "by_championship"]:
		if not (data.get(key, {}) is Dictionary):
			data[key] = {}
	_scrutineering_standards_cache = data
	return _scrutineering_standards_cache


## Scrutineering check for the car fielded in a championship: does its condition
## meet the series minimum, plus the cost to bring it up to standard.
func _scrutineering_status_for_championship(world: WorldStateScr, championship_id: String) -> Dictionary:
	var min_condition := get_series_min_condition(championship_id)
	var status := {
		"min_condition": min_condition,
		"min_condition_pct": int(round(min_condition * 100.0)),
		"car_condition": 1.0,
		"car_condition_pct": 100,
		"passes": true,
		"car_instance_id": "",
		"service_cost": 0.0,
		"systems": [],
	}
	if world == null:
		return status
	var team := _player_team_from_world(world)
	if team == null:
		return status
	var car := _raced_player_car(world, team, championship_id)
	if car == null:
		return status
	var condition := _car_average_condition(world, car)
	status["car_instance_id"] = car.instance_id
	status["car_condition"] = condition
	status["car_condition_pct"] = int(round(condition * 100.0))
	status["passes"] = condition >= min_condition
	status["systems"] = get_car_condition_systems(car.instance_id)
	status["service_cost"] = float(get_service_quote(car.instance_id).get("full_cost", 0.0))
	return status


## Authored minimum condition (0-1) to enter a series and start each weekend.
## Resolves by_championship -> by_ruleset -> by_tier -> default.
func get_series_min_condition(series_id: String) -> float:
	var standards := _load_scrutineering_standards()
	var by_championship: Dictionary = standards.get("by_championship", {})
	if by_championship.has(series_id):
		return clampf(float(by_championship[series_id]), 0.0, 1.0)
	var repo: RefCounted = _content_repository()
	var ruleset_id := ""
	var tier := ""
	if repo != null:
		var championship: Variant = repo.get_championship(series_id)
		if championship is Dictionary:
			var champ: Dictionary = championship as Dictionary
			ruleset_id = str(champ.get("ruleset_id", ""))
			var source: Variant = champ.get("source", {})
			if source is Dictionary:
				tier = str((source as Dictionary).get("ams2_tier", ""))
	var by_ruleset: Dictionary = standards.get("by_ruleset", {})
	if not ruleset_id.is_empty() and by_ruleset.has(ruleset_id):
		return clampf(float(by_ruleset[ruleset_id]), 0.0, 1.0)
	var by_tier: Dictionary = standards.get("by_tier", {})
	if not tier.is_empty() and by_tier.has(tier):
		return clampf(float(by_tier[tier]), 0.0, 1.0)
	return clampf(float(standards.get("default_min_condition", SCRUTINEERING_DEFAULT_MIN)), 0.0, 1.0)


func _car_average_condition(world: WorldStateScr, car: CarStateScr) -> float:
	if world == null or car == null:
		return 1.0
	var total := 0.0
	var count := 0
	for slot_variant in car.installed_part_instance_ids.keys():
		var part_id := str(car.installed_part_instance_ids[slot_variant])
		if not world.parts.has(part_id):
			continue
		var part: PartStateScr = world.parts[part_id] as PartStateScr
		if part == null:
			continue
		total += clampf(part.condition, 0.0, 1.0)
		count += 1
	if count <= 0:
		return 1.0
	return total / float(count)


func _condition_label_from_ratio(ratio: float) -> String:
	if ratio >= 0.92:
		return "Showroom"
	if ratio >= 0.78:
		return "Excellent"
	if ratio >= 0.6:
		return "Good"
	if ratio >= 0.42:
		return "Worn"
	return "Tired"


## Per-system condition breakdown for an owned car.
func get_car_condition_systems(car_instance_id: String) -> Array:
	var out: Array = []
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return out
	var world: WorldStateScr = _runtime_world as WorldStateScr
	if not world.cars.has(car_instance_id):
		return out
	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	if car == null:
		return out
	for system_variant: Variant in SYSTEM_DISPLAY_ORDER:
		var system := str(system_variant)
		if not car.installed_part_instance_ids.has(system):
			continue
		var part_id := str(car.installed_part_instance_ids[system])
		if not world.parts.has(part_id):
			continue
		var part: PartStateScr = world.parts[part_id] as PartStateScr
		if part == null:
			continue
		var condition := clampf(part.condition, 0.0, 1.0)
		out.append({
			"system": system,
			"label": str(SYSTEM_LABELS.get(system, system.capitalize())),
			"condition": condition,
			"condition_label": _condition_label_from_ratio(condition),
			"mileage": int(round(part.mileage)),
		})
	return out


## Cost to restore one system from its current condition to showroom, scaled by
## the car's class value and the system's complexity.
func _service_cost_for_part(world: WorldStateScr, repo: RefCounted, car: CarStateScr, system: String, part: PartStateScr) -> float:
	if part == null:
		return 0.0
	var deficit := clampf(1.0 - clampf(part.condition, 0.0, 1.0), 0.0, 1.0)
	if deficit <= 0.001:
		return 0.0
	var car_value := _estimate_owned_car_value(world, repo, car)
	var system_weight := float(SYSTEM_WEAR_RATE.get(system, 1.0))
	# Rebuilding a system costs a fraction of car value, weighted by complexity and
	# how far it has fallen; a small minimum keeps top-ups from being free.
	return maxf(1500.0, roundf(car_value * 0.06 * system_weight * deficit + 1200.0))


## Quote per-system and full-service costs for an owned car.
func get_service_quote(car_instance_id: String) -> Dictionary:
	var result := {"systems": [], "full_cost": 0.0, "car_instance_id": car_instance_id}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return result
	var world: WorldStateScr = _runtime_world as WorldStateScr
	if not world.cars.has(car_instance_id):
		return result
	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	if car == null:
		return result
	var repo: RefCounted = _content_repository()
	var systems: Array = []
	var full := 0.0
	for system_variant: Variant in SYSTEM_DISPLAY_ORDER:
		var system := str(system_variant)
		if not car.installed_part_instance_ids.has(system):
			continue
		var part_id := str(car.installed_part_instance_ids[system])
		if not world.parts.has(part_id):
			continue
		var part: PartStateScr = world.parts[part_id] as PartStateScr
		if part == null:
			continue
		var cost := _service_cost_for_part(world, repo, car, system, part)
		full += cost
		systems.append({
			"system": system,
			"label": str(SYSTEM_LABELS.get(system, system.capitalize())),
			"condition": clampf(part.condition, 0.0, 1.0),
			"cost": cost,
		})
	result["systems"] = systems
	result["full_cost"] = full
	return result


## Restore one system to showroom condition, charging the team.
func service_car_system(car_instance_id: String, system: String) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active career world is loaded."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	if not world.cars.has(car_instance_id):
		return {"ok": false, "message": "That car is not in your garage."}
	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	if car == null or not car.installed_part_instance_ids.has(system):
		return {"ok": false, "message": "That system could not be serviced."}
	var part_id := str(car.installed_part_instance_ids[system])
	if not world.parts.has(part_id):
		return {"ok": false, "message": "That system could not be serviced."}
	var part: PartStateScr = world.parts[part_id] as PartStateScr
	if part == null:
		return {"ok": false, "message": "That system could not be serviced."}
	var repo: RefCounted = _content_repository()
	var cost := _service_cost_for_part(world, repo, car, system, part)
	if cost <= 0.0:
		return {"ok": false, "message": "%s is already in showroom condition." % str(SYSTEM_LABELS.get(system, system))}
	var budget: BudgetStateScr = _player_budget_from_world(world)
	if budget == null:
		return {"ok": false, "message": "Player finances are unavailable."}
	if budget.cash < cost:
		return {"ok": false, "message": "Not enough cash to service the %s (%s)." % [str(SYSTEM_LABELS.get(system, system)), _fmt_money_compact(cost)]}
	budget.cash = maxf(0.0, budget.cash - cost)
	part.condition = 1.0
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	save_game()
	return {"ok": true, "cost": cost, "message": "%s rebuilt for %s." % [str(SYSTEM_LABELS.get(system, system)), _fmt_money_compact(cost)]}


## Restore every system on a car to showroom condition in one transaction.
func service_car_full(car_instance_id: String) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active career world is loaded."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	if not world.cars.has(car_instance_id):
		return {"ok": false, "message": "That car is not in your garage."}
	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	if car == null:
		return {"ok": false, "message": "That car could not be serviced."}
	var quote := get_service_quote(car_instance_id)
	var full_cost := float(quote.get("full_cost", 0.0))
	if full_cost <= 0.0:
		return {"ok": false, "message": "This car is already in showroom condition."}
	var budget: BudgetStateScr = _player_budget_from_world(world)
	if budget == null:
		return {"ok": false, "message": "Player finances are unavailable."}
	if budget.cash < full_cost:
		return {"ok": false, "message": "Not enough cash for a full service (%s)." % _fmt_money_compact(full_cost)}
	budget.cash = maxf(0.0, budget.cash - full_cost)
	for system_variant: Variant in SYSTEM_DISPLAY_ORDER:
		var system := str(system_variant)
		if not car.installed_part_instance_ids.has(system):
			continue
		var part_id := str(car.installed_part_instance_ids[system])
		if world.parts.has(part_id):
			var part: PartStateScr = world.parts[part_id] as PartStateScr
			if part != null:
				part.condition = 1.0
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	save_game()
	return {"ok": true, "cost": full_cost, "message": "Full service complete for %s." % _fmt_money_compact(full_cost)}


func championship_status_label() -> String:
	return "%s • %s" % [team_size_name, fleet_status_label()]


func has_championship_entry() -> bool:
	return championship_entered


func get_current_day_state() -> Dictionary:
	return {
		"year": current_year,
		"week": current_week,
		"day": current_day,
		"day_name": _calendar_day_name(current_day),
		"label": "%s  %d %s %d" % [_calendar_day_name(current_day), current_day_of_month, _calendar_month_name(current_month), current_year],
	}


func get_current_calendar_date() -> Dictionary:
	return {
		"year": current_year,
		"month": current_month,
		"month_name": _calendar_month_name(current_month),
		"day_of_month": current_day_of_month,
		"week": current_week,
		"day": current_day,
		"day_name": _calendar_day_name(current_day),
		"label": "%s %02d %s %d" % [_calendar_day_name(current_day), current_day_of_month, _calendar_month_name(current_month), current_year],
	}


func get_visible_calendar_window(day_count: int = 7) -> Array:
	var count := maxi(day_count, 1)
	var output: Array = []
	var base_unix := _current_unix_day()
	for index in range(count):
		var cursor := _date_from_unix_day(base_unix + index * 86400)
		output.append(_calendar_entry_from_datetime(cursor, index == 0))
	return output


func set_calendar_progress(week_number: int, day_number: int) -> Dictionary:
	# Absolute week on the continuous timeline (weeks > 52 resolve to later years).
	current_week = clampi(week_number, 1, MAX_ABSOLUTE_WEEK)
	current_day = clampi(day_number, 1, 7)
	_sync_calendar_date_from_progress()
	save_game()
	return get_current_day_state()


func advance_calendar_day(days: int = 1) -> Dictionary:
	var step_count := maxi(days, 0)
	for _i in range(step_count):
		_advance_one_calendar_day()
	if step_count > 0:
		save_game()
	return get_current_day_state()


func get_continue_call_to_action() -> Dictionary:
	return _evaluate_continue_target()


func advance_continue_flow_day() -> Dictionary:
	var current_target := _evaluate_continue_target()
	if str(current_target.get("target_kind", "")) != "advance_day":
		current_target["days_advanced"] = 0
		return current_target
	_advance_one_calendar_day()
	save_game()
	current_target = _evaluate_continue_target()
	current_target["days_advanced"] = 1
	return current_target


func start_continue_flow(max_days: int = 45) -> Dictionary:
	var current_target := _evaluate_continue_target()
	if str(current_target.get("target_kind", "")) != "advance_day":
		current_target["days_advanced"] = 0
		current_target["timeline"] = [_build_continue_timeline_entry(current_target, true)]
		return current_target
	var timeline: Array = []
	var safety_limit := maxi(max_days, 1)
	for _i in range(safety_limit):
		current_target = advance_continue_flow_day()
		var is_stop := str(current_target.get("target_kind", "")) != "advance_day"
		timeline.append(_build_continue_timeline_entry(current_target, is_stop))
		if is_stop:
			current_target["days_advanced"] = timeline.size()
			current_target["timeline"] = timeline
			return current_target
	current_target["days_advanced"] = timeline.size()
	current_target["timeline"] = timeline
	return current_target


func get_championship_standings() -> Array:
	_ensure_world_derived_summaries()
	return championship_standings.duplicate(true)


func get_series_directory() -> Array:
	return series_directory.duplicate(true)


func get_active_series_detail() -> Dictionary:
	return active_series_detail.duplicate(true)


func get_active_race_package() -> Dictionary:
	_ensure_world_derived_summaries()
	if not pending_race_context.is_empty():
		var series_id := str(pending_race_context.get("series_id", ""))
		var row := _series_row_for_id(series_id)
		if not row.is_empty():
			var package: Dictionary = row.get("race_package", {}) if row.get("race_package", {}) is Dictionary else {}
			if not package.is_empty():
				return package.duplicate(true)
	return race_package.duplicate(true)


func get_career_calendar_events() -> Array:
	_ensure_world_derived_summaries()
	var events: Array = []
	for event_variant: Variant in career_calendar_events:
		if event_variant is Dictionary:
			events.append((event_variant as Dictionary).duplicate(true))
	for event_variant: Variant in _operational_calendar_events():
		if event_variant is Dictionary:
			events.append((event_variant as Dictionary).duplicate(true))
	_apply_calendar_decisions(events)
	events.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_key := str(a.get("start_day_key", "9999-99-99"))
		var b_key := str(b.get("start_day_key", "9999-99-99"))
		if a_key != b_key:
			return a_key < b_key
		var a_priority := _calendar_priority_rank(str(a.get("priority", "")))
		var b_priority := _calendar_priority_rank(str(b.get("priority", "")))
		if a_priority != b_priority:
			return a_priority < b_priority
		return str(a.get("title", "")) < str(b.get("title", ""))
	)
	return events


func get_pending_race_context() -> Dictionary:
	return pending_race_context.duplicate(true)


func clear_pending_race_context() -> void:
	pending_race_context = {}
	save_game()


func set_pending_race_context_from_calendar_event(calendar_event_id: String) -> Dictionary:
	var event := _calendar_event_by_id(calendar_event_id)
	if event.is_empty() or str(event.get("kind", "")) != "race_weekend":
		return {}
	pending_race_context = {
		"series_id": str(event.get("series_id", "")),
		"race_event_id": str(event.get("race_event_id", "")),
		"championship_entry_id": str(event.get("championship_entry_id", "")),
		"calendar_event_id": str(event.get("id", "")),
	}
	var conflict_group_id := str(event.get("conflict_group_id", ""))
	var event_id := str(event.get("id", ""))
	if not conflict_group_id.is_empty() and not race_conflict_decisions.has(event_id):
		race_conflict_decisions[event_id] = {
			"calendar_event_id": event_id,
			"race_event_id": str(event.get("race_event_id", "")),
			"series_id": str(event.get("series_id", "")),
			"conflict_group_id": conflict_group_id,
			"outcome": "attend",
			"resolved_week": current_week,
			"resolved_day": current_day,
		}
	var series_id := str(pending_race_context.get("series_id", ""))
	if not series_id.is_empty():
		set_active_series_by_id(series_id)
	save_game()
	return pending_race_context.duplicate(true)


func resolve_calendar_conflict(calendar_event_id: String, outcome: String) -> Dictionary:
	var normalized := outcome.strip_edges().to_lower()
	if not ["attend", "delegate", "withdraw"].has(normalized):
		return {}
	var event := _calendar_event_by_id(calendar_event_id)
	if event.is_empty():
		return {}
	var decision := {
		"calendar_event_id": calendar_event_id,
		"race_event_id": str(event.get("race_event_id", "")),
		"series_id": str(event.get("series_id", "")),
		"conflict_group_id": str(event.get("conflict_group_id", "")),
		"outcome": normalized,
		"resolved_week": current_week,
		"resolved_day": current_day,
	}
	race_conflict_decisions[calendar_event_id] = decision
	if normalized == "attend":
		set_pending_race_context_from_calendar_event(calendar_event_id)
		decision = race_conflict_decisions.get(calendar_event_id, decision)
	elif normalized == "delegate":
		_apply_delegated_conflict_result(event)
	elif normalized == "withdraw":
		_apply_withdrawn_conflict_result(event)
	save_game()
	return decision.duplicate(true)


func _apply_delegated_conflict_result(calendar_event: Dictionary) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active world is loaded."}
	var repo: RefCounted = _content_repository()
	if repo == null:
		return {"ok": false, "message": "Content repository failed to load."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var race_event_id := str(calendar_event.get("race_event_id", ""))
	if race_event_id.is_empty() or not world.race_events.has(race_event_id):
		return {"ok": false, "message": "Race event unavailable."}
	var race_event = world.race_events.get(race_event_id)
	if race_event != null and str(race_event.status) == "completed":
		return {"ok": true, "event_instance_id": race_event_id, "message": "Race event already complete."}
	# Scrutineering applies to delegated entries too - an under-spec car cannot run.
	var delegated_scrutineering := _scrutineering_status_for_championship(world, str(calendar_event.get("series_id", "")))
	if not bool(delegated_scrutineering.get("passes", true)):
		return {
			"ok": false,
			"reason": "scrutineering",
			"scrutineering": delegated_scrutineering,
			"message": "The crew cannot field a car that fails scrutineering (%d%% < %d%% required). Service it before the weekend." % [int(delegated_scrutineering.get("car_condition_pct", 0)), int(delegated_scrutineering.get("min_condition_pct", 0))],
		}
	# Worn cars carry real DNF risk even when the weekend is delegated.
	var player_team := _player_team_from_world(world)
	var delegated_car := _raced_player_car(world, player_team, str(calendar_event.get("series_id", ""))) if player_team != null else null
	var delegated_condition := _car_average_condition(world, delegated_car) if delegated_car != null else 1.0
	var dnf_rng := RandomNumberGenerator.new()
	dnf_rng.seed = hash("%s|delegated_dnf" % race_event_id)
	# Wet and night rounds raise incident/DNF risk for a delegated weekend (the
	# player's own races already reflect conditions via live AMS2 telemetry).
	var round_row := _series_round_row_for_event(str(calendar_event.get("series_id", "")), int(race_event.round_index)) if race_event != null else {}
	var round_weather := str(round_row.get("weather", ""))
	var weather_dnf := 0.0
	if round_weather.find("Heavy Rain") >= 0:
		weather_dnf += 0.08
	elif round_weather.find("Rain") >= 0:
		weather_dnf += 0.04
	if bool(round_row.get("is_night", false)):
		weather_dnf += 0.02
	var dnf_chance := clampf(0.04 + (1.0 - delegated_condition) * 0.32 + weather_dnf, 0.0, 0.7)
	var delegated_dnf := dnf_rng.randf() < dnf_chance
	var player_entry := {"name": "Delegated Crew", "position": 9, "lapsCompleted": 8, "bestLapTime": 94.2, "isPlayer": true, "dnf": delegated_dnf}
	if delegated_dnf:
		player_entry["position"] = 12
		player_entry["lapsCompleted"] = dnf_rng.randi_range(2, 6)
	var delegated_payload := {
		"championshipId": str(calendar_event.get("series_id", "")),
		"raceEventId": race_event_id,
		"sessionType": "Race",
		"trackName": str(calendar_event.get("track_name", calendar_event.get("subtitle", ""))),
		"playerPosition": int(player_entry["position"]),
		"playerName": "Delegated Crew",
		"lapsCompleted": int(player_entry["lapsCompleted"]),
		"bestLapTime": 94.2,
		"lastLapTime": 95.1,
		"dnf": delegated_dnf,
		"carName": str(calendar_event.get("player_car_label", "Delegated car")),
		"carClass": str(calendar_event.get("player_class_label", "")),
		"allParticipants": [
			{"name": "AI Winner", "position": 1, "lapsCompleted": 8, "bestLapTime": 90.8, "isPlayer": false},
			{"name": "AI Runner", "position": 2, "lapsCompleted": 8, "bestLapTime": 91.0, "isPlayer": false},
			player_entry,
		],
	}
	var result: Dictionary = RaceResultProcessorScr.apply_session_result(repo, world, delegated_payload)
	if not bool(result.get("ok", false)):
		return result
	if not bool(result.get("duplicate", false)):
		_update_owner_driver_stats(result)
		_apply_post_race_car_wear(world, result)
	if race_event != null and race_event.race_result is Dictionary:
		race_event.race_result["delegated"] = true
		race_event.race_result["decision_outcome"] = "delegate"
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	_append_mail_once(_race_result_debrief_mail(repo, world, result))
	return result


func _apply_withdrawn_conflict_result(calendar_event: Dictionary) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active world is loaded."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var race_event_id := str(calendar_event.get("race_event_id", ""))
	if race_event_id.is_empty() or not world.race_events.has(race_event_id):
		return {"ok": false, "message": "Race event unavailable."}
	var race_event = world.race_events.get(race_event_id)
	if race_event == null:
		return {"ok": false, "message": "Race event unavailable."}
	if str(race_event.status) == "completed" and bool(race_event.race_result.get("withdrawn", false)):
		return {"ok": true, "event_instance_id": race_event_id, "message": "Race event already withdrawn."}
	race_event.status = "completed"
	if not race_event.completed_session_types.has("race"):
		race_event.completed_session_types.append("race")
	race_event.race_result = {
		"session_type": "race",
		"player_position": 0,
		"player_name": "Withdrawn",
		"laps_completed": 0,
		"best_lap_time": 0.0,
		"last_lap_time": 0.0,
		"track_name": str(calendar_event.get("track_name", calendar_event.get("subtitle", ""))),
		"car_name": str(calendar_event.get("player_car_label", "")),
		"car_class": str(calendar_event.get("player_class_label", "")),
		"dnf": true,
		"processed_at": Time.get_datetime_string_from_system(),
		"points_awarded": 0,
		"prize_money": 0.0,
		"withdrawn": true,
		"decision_outcome": "withdraw",
	}
	race_event.classification = []
	if str(pending_race_context.get("race_event_id", "")) == race_event_id:
		pending_race_context = {}
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	return {"ok": true, "event_instance_id": race_event_id, "message": "Race weekend withdrawn."}


func get_series_entry_car_options(series_id: String) -> Array:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return []
	var repo: RefCounted = _content_repository()
	if repo == null:
		return []
	var world: WorldStateScr = _runtime_world as WorldStateScr
	_ensure_player_car_display_names(world)
	var team: TeamStateScr = _player_team_from_world(world)
	if team == null:
		return []
	var series_row: Dictionary = _series_row_for_id(series_id)
	var eligible_ids: Array = series_row.get("eligible_car_class_ids", []) if series_row.get("eligible_car_class_ids", []) is Array else []
	var selected_entry: ChampionshipEntryStateScr = _entry_for_team_and_championship(world, team.instance_id, series_id)
	var rows: Array = []
	for car_instance_id: String in team.car_instance_ids:
		if not world.cars.has(car_instance_id):
			continue
		var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
		if car == null:
			continue
		var platform: Variant = repo.get_car_platform(car.car_platform_id)
		var car_label := str(car.display_name).strip_edges()
		if car_label.is_empty():
			car_label = car.car_platform_id
		var manufacturer_label := ""
		var car_class_id := ""
		var car_class_label := ""
		if platform is Dictionary:
			var platform_dict: Dictionary = platform as Dictionary
			if car_label.is_empty() or car_label == car.car_platform_id:
				car_label = str(platform_dict.get("display_name", car_label))
			car_class_id = str(platform_dict.get("car_class_id", ""))
			var manufacturer_id: String = str(platform_dict.get("manufacturer_id", ""))
			if not manufacturer_id.is_empty():
				var manufacturer: Variant = repo.get_manufacturer(manufacturer_id)
				if manufacturer is Dictionary:
					manufacturer_label = str((manufacturer as Dictionary).get("display_name", manufacturer_id))
		if not car_class_id.is_empty():
			var class_row: Variant = repo.get_car_class(car_class_id)
			if class_row is Dictionary:
				car_class_label = str((class_row as Dictionary).get("display_name", car_class_id))
		var class_eligible := eligible_ids.has(car_class_id)
		var condition := _car_average_condition(world, car)
		var min_condition := get_series_min_condition(series_id)
		var meets_condition := condition >= min_condition
		var eligible := class_eligible and meets_condition
		var status_reason := ""
		if not class_eligible:
			status_reason = "Wrong car class for this series."
		elif not meets_condition:
			status_reason = "Below scrutineering standard (%d%% < %d%% required) - service the car." % [int(round(condition * 100.0)), int(round(min_condition * 100.0))]
		rows.append({
			"car_instance_id": car_instance_id,
			"car_label": car_label,
			"manufacturer_label": manufacturer_label,
			"car_class_id": car_class_id,
			"car_class_label": car_class_label,
			"eligible": eligible,
			"class_eligible": class_eligible,
			"condition": condition,
			"condition_label": _condition_label_from_ratio(condition),
			"min_condition": min_condition,
			"meets_condition": meets_condition,
			"status_reason": status_reason,
			"selected": selected_entry != null and selected_entry.car_instance_id == car_instance_id,
		})
	return rows


func _calendar_event_by_id(calendar_event_id: String) -> Dictionary:
	if calendar_event_id.strip_edges().is_empty():
		return {}
	for event_variant: Variant in get_career_calendar_events():
		if not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant
		if str(event.get("id", "")) == calendar_event_id:
			return event.duplicate(true)
	return {}


func _apply_calendar_decisions(events: Array) -> void:
	for index in range(events.size()):
		if not events[index] is Dictionary:
			continue
		var event: Dictionary = events[index]
		var event_id := str(event.get("id", ""))
		var decision: Dictionary = race_conflict_decisions.get(event_id, {}) if race_conflict_decisions.get(event_id, {}) is Dictionary else {}
		if not decision.is_empty():
			event["decision"] = decision.duplicate(true)
			event["decision_outcome"] = str(decision.get("outcome", ""))
			event["resolved"] = true
		else:
			event["resolved"] = str(event.get("conflict_group_id", "")).is_empty()
		events[index] = event


func _operational_calendar_events() -> Array:
	var events: Array = []
	var today_key := _calendar_day_key_for_current()
	if startup_car_purchased and not championship_entered:
		events.append({
			"id": "calendar_event.reminder.enter_first_series",
			"kind": "team_reminder",
			"category": "prep",
			"title": "Enter a first series",
			"subtitle": "The launch car is signed; choose where the programme starts.",
			"start_day_key": today_key,
			"end_day_key": today_key,
			"week_number": current_week,
			"weekend_key": "",
			"status": "pending",
			"priority": "major",
			"conflict_group_id": "",
			"action": {
				"type": "open_series",
				"scene_path": SERIES_SCENE_PATH,
			},
		})
	for week_offset in range(0, 13):
		var week_number := current_week + week_offset
		if week_number > 104:
			break
		events.append({
			"id": "calendar_event.finance.weekly_burn.week_%02d" % week_number,
			"kind": "finance_review",
			"category": "finance",
			"title": "Weekly burn review",
			"subtitle": "%s runway, %s weekly burn" % [runway_label, weekly_burn_label],
			"start_day_key": _calendar_day_key_for_week_day(week_number, 1),
			"end_day_key": _calendar_day_key_for_week_day(week_number, 1),
			"week_number": week_number,
			"weekend_key": "",
			"status": "scheduled",
			"priority": "normal",
			"conflict_group_id": "",
			"action": {
				"type": "open_finance",
				"scene_path": PLACEHOLDER_SCENE_PATH,
			},
		})
		events.append({
			"id": "calendar_event.staff.market_scan.week_%02d" % week_number,
			"kind": "staff_reminder",
			"category": "staff",
			"title": "Staff market scan",
			"subtitle": "Review recruitment pressure before the next race block.",
			"start_day_key": _calendar_day_key_for_week_day(week_number, 2),
			"end_day_key": _calendar_day_key_for_week_day(week_number, 2),
			"week_number": week_number,
			"weekend_key": "",
			"status": "scheduled",
			"priority": "normal",
			"conflict_group_id": "",
			"action": {
				"type": "open_staff",
				"scene_path": PLACEHOLDER_SCENE_PATH,
			},
		})
	return events


func _calendar_priority_rank(priority: String) -> int:
	match priority:
		"critical":
			return 0
		"major":
			return 1
		"normal":
			return 2
		_:
			return 3


func _calendar_day_key_for_current() -> String:
	return "%04d-%02d-%02d" % [current_year, current_month, current_day_of_month]


func _calendar_day_key_for_week_day(week_number: int, day_number: int) -> String:
	var offset_days := (maxi(week_number, 1) - 1) * 7 + (clampi(day_number, 1, 7) - 1)
	var start_unix := _unix_day_from_datetime(_calendar_start_datetime())
	var resolved := _date_from_unix_day(start_unix + offset_days * 86400)
	return "%04d-%02d-%02d" % [int(resolved.get("year", 2026)), int(resolved.get("month", 1)), int(resolved.get("day", 1))]


func series_browser_state_needs_refresh() -> bool:
	if series_directory.is_empty():
		return false
	for row_variant in series_directory:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		if str(row.get("logo_path", "")).strip_edges().is_empty():
			return true
		var rounds_variant: Variant = row.get("rounds_data", [])
		if not rounds_variant is Array or (rounds_variant as Array).is_empty():
			return true
		var eligible_labels: Variant = row.get("eligible_car_class_labels", [])
		if not eligible_labels is Array:
			return true
	return false


func refresh_series_browser_state(persist_after_refresh: bool = false, force_refresh: bool = false) -> void:
	if series_directory.is_empty():
		return
	if not force_refresh and not series_browser_state_needs_refresh():
		return
	if _runtime_world != null and _runtime_world is WorldStateScr:
		_ensure_player_car_display_names(_runtime_world as WorldStateScr)
	var merged_rows: Array = []
	for row_variant in series_directory:
		if not row_variant is Dictionary:
			continue
		merged_rows.append(_merge_series_row_with_catalog(row_variant as Dictionary))
	series_directory = merged_rows
	if not active_series_detail.is_empty():
		active_series_detail = _merge_series_row_with_catalog(active_series_detail)
	elif not series_directory.is_empty():
		active_series_detail = (series_directory[0] as Dictionary).duplicate(true)
	if persist_after_refresh:
		save_game()


func set_active_series_by_id(series_id: String, persist_after_select: bool = false) -> void:
	var locked_series_id := str(pending_race_context.get("series_id", ""))
	if not persist_after_select and not locked_series_id.is_empty() and series_id != locked_series_id:
		return
	for row_variant in series_directory:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		if str(row.get("id", "")) != series_id:
			continue
		active_series_detail = row.duplicate(true)
		if persist_after_select:
			save_game()
		return


func repair_series_schedule(series_id: String) -> Array:
	refresh_series_browser_state(false, true)
	if not series_id.is_empty():
		set_active_series_by_id(series_id)
	for row_variant in series_directory:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		if str(row.get("id", "")) != series_id:
			continue
		var rounds_variant: Variant = row.get("rounds_data", row.get("schedule_rounds", row.get("rounds", [])))
		return rounds_variant if typeof(rounds_variant) == TYPE_ARRAY else []
	return []


func _merge_series_row_with_catalog(row: Dictionary) -> Dictionary:
	var merged: Dictionary = row.duplicate(true)
	var series_id: String = str(merged.get("id", ""))
	if series_id.is_empty():
		return merged
	var catalog: Dictionary = _series_catalog_row_by_id(series_id)
	if catalog.is_empty():
		return merged
	var car_class_ids: Array = []
	var catalog_class_ids: Variant = catalog.get("car_class_ids", [])
	if catalog_class_ids is Array:
		car_class_ids = (catalog_class_ids as Array).duplicate(true)
	var existing_rounds: Array = merged.get("rounds_data", []) if merged.get("rounds_data", []) is Array else []
	merged["name"] = str(catalog.get("name", merged.get("name", series_id)))
	merged["short_name"] = str(catalog.get("short_name", merged.get("short_name", merged.get("name", series_id))))
	merged["region"] = str(catalog.get("region", merged.get("region", "Unknown")))
	merged["tier"] = str(catalog.get("tier", merged.get("tier", "unknown")))
	merged["format"] = str(catalog.get("format", merged.get("format", "unknown")))
	merged["type"] = str(catalog.get("type", merged.get("type", "")))
	merged["description"] = str(catalog.get("description", merged.get("description", "")))
	merged["series_category"] = str(catalog.get("series_category", merged.get("series_category", "")))
	merged["calendar_profile_id"] = str(catalog.get("calendar_profile_id", merged.get("calendar_profile_id", "")))
	merged["calendar_profile_label"] = str(catalog.get("calendar_profile_label", merged.get("calendar_profile_label", "")))
	merged["calendar_profile_badge"] = str(catalog.get("calendar_profile_badge", merged.get("calendar_profile_badge", "")))
	merged["calendar_profile_summary"] = str(catalog.get("calendar_profile_summary", merged.get("calendar_profile_summary", "")))
	merged["calendar_cadence"] = str(catalog.get("calendar_cadence", merged.get("calendar_cadence", "")))
	merged["calendar_repeat_strategy"] = str(catalog.get("calendar_repeat_strategy", merged.get("calendar_repeat_strategy", "")))
	merged["calendar_builder"] = str(catalog.get("calendar_builder", merged.get("calendar_builder", "")))
	merged["calendar_showcase"] = bool(catalog.get("calendar_showcase", merged.get("calendar_showcase", false)))
	var calendar_tags_variant: Variant = catalog.get("calendar_tags", merged.get("calendar_tags", []))
	if calendar_tags_variant is Array:
		merged["calendar_tags"] = (calendar_tags_variant as Array).duplicate(true)
	merged["rounds"] = int(catalog.get("rounds", merged.get("rounds", 0)))
	merged["requested_rounds"] = int(catalog.get("requested_rounds", merged.get("requested_rounds", merged.get("rounds", 0))))
	merged["prestige"] = int(catalog.get("prestige", merged.get("prestige", 0)))
	merged["prize_pool"] = _fmt_money_whole(float(catalog.get("prize_pool", 0.0))).replace(",", " ")
	merged["fee"] = _fmt_money_whole(float(catalog.get("fee", 0.0))).replace(",", " ")
	merged["logo_path"] = str(catalog.get("logo_path", merged.get("logo_path", "")))
	merged["car_class_ids"] = car_class_ids
	if not merged.has("eligible_car_class_ids") or not (merged.get("eligible_car_class_ids", []) is Array) or (merged.get("eligible_car_class_ids", []) as Array).is_empty():
		merged["eligible_car_class_ids"] = car_class_ids.duplicate(true)
	if not merged.has("rounds_data") or existing_rounds.is_empty() or existing_rounds.size() != int(catalog.get("schedule_tracks", []).size()):
		merged["rounds_data"] = _series_rounds_from_catalog(catalog, existing_rounds)
	return merged


func _series_catalog_rows() -> Array:
	if not _series_catalog_rows_cache.is_empty():
		return _series_catalog_rows_cache
	if not FileAccess.file_exists(SERIES_CATALOG_PATH):
		return []
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(SERIES_CATALOG_PATH))
	_series_catalog_rows_cache = parsed if parsed is Array else []
	return _series_catalog_rows_cache


func _series_catalog_row_by_id(series_id: String) -> Dictionary:
	var normalized_id := _series_lookup_key(series_id)
	if _series_catalog_by_key_cache.has(normalized_id):
		return (_series_catalog_by_key_cache[normalized_id] as Dictionary).duplicate(true)
	for row_variant in _series_catalog_rows():
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		var row_id: String = str(row.get("id", ""))
		if row_id == series_id or _series_lookup_key(row_id) == normalized_id:
			_series_catalog_by_key_cache[normalized_id] = row
			return row.duplicate(true)
		if _series_lookup_key(str(row.get("name", ""))) == normalized_id:
			_series_catalog_by_key_cache[normalized_id] = row
			return row.duplicate(true)
		if _series_lookup_key(str(row.get("short_name", ""))) == normalized_id:
			_series_catalog_by_key_cache[normalized_id] = row
			return row.duplicate(true)
	return {}


func _series_rounds_from_catalog(catalog: Dictionary, existing_rounds: Array = []) -> Array:
	var schedule_variant: Variant = catalog.get("schedule_tracks", [])
	if not schedule_variant is Array:
		return []
	var series_offset: int = _championship_week_offset(str(catalog.get("id", "")))
	var output: Array = []
	for index in range((schedule_variant as Array).size()):
		var round_variant: Variant = (schedule_variant as Array)[index]
		if not round_variant is Dictionary:
			continue
		var round_row: Dictionary = round_variant as Dictionary
		var existing_row: Dictionary = existing_rounds[index] if index < existing_rounds.size() and existing_rounds[index] is Dictionary else {}
		var catalog_week: int = int(round_row.get("week", 0))
		# Project the catalog (within-year) week onto the continuous timeline for this
		# series' current edition so dates/scheduling land in the right year.
		var week_number: int = (catalog_week + series_offset) if catalog_week > 0 else int(existing_row.get("week_number", 0))
		var round_classes: Array = []
		var class_variant: Variant = round_row.get("class_ids", [])
		if class_variant is Array:
			for c: Variant in class_variant as Array:
				round_classes.append(str(c))
		output.append({
			"track": str(round_row.get("track", existing_row.get("track", "TBD"))),
			"layout": str(round_row.get("layout", existing_row.get("layout", ""))),
			"week": "Week %d" % maxi(catalog_week, 1),
			"week_number": week_number,
			"weekday_label": _series_round_weekday_label(week_number),
			"date_label": _series_round_date_label(week_number),
			"status": str(existing_row.get("status", "")),
			"track_id": str(round_row.get("track_id", existing_row.get("track_id", ""))),
			"layout_id": str(round_row.get("layout_id", existing_row.get("layout_id", ""))),
			"country": str(round_row.get("country", existing_row.get("country", ""))),
			"length_km": float(round_row.get("length_km", existing_row.get("length_km", 0.0))),
			"round_number": int(round_row.get("round_number", index + 1)),
			"is_finale": bool(round_row.get("is_finale", false)),
			"is_feature": bool(round_row.get("is_feature", false)),
			"points_multiplier": float(round_row.get("points_multiplier", 1.0)),
			"races_in_round": int(round_row.get("races_in_round", 1)),
			"weather": str(round_row.get("weather", "")),
			"time_of_day": str(round_row.get("time_of_day", "")),
			"is_night": bool(round_row.get("is_night", false)),
			"race_length_label": str(round_row.get("race_length_label", "")),
			"race_length_hours": int(round_row.get("race_length_hours", 0)),
			"recommended_race_minutes": int(round_row.get("recommended_race_minutes", 0)),
			"class_ids": round_classes,
		})
	return output


func _series_lookup_key(value: String) -> String:
	var key := value.to_lower().strip_edges()
	var prefixes := ["championship.", "series.", "championship_", "series_"]
	for prefix in prefixes:
		if key.begins_with(prefix):
			key = key.substr(prefix.length())
	var replacements := {
		"ü": "u",
		"ö": "o",
		"ä": "a",
		"é": "e",
		"è": "e",
		"ê": "e",
		"á": "a",
		"à": "a",
		"â": "a",
		"í": "i",
		"ì": "i",
		"î": "i",
		"ó": "o",
		"ò": "o",
		"ô": "o",
		"ú": "u",
		"ù": "u",
		"û": "u",
		"ç": "c",
	}
	for source in replacements.keys():
		key = key.replace(source, replacements[source])
	var filtered := ""
	for idx in range(key.length()):
		var ch := key.substr(idx, 1)
		var code := key.unicode_at(idx)
		var is_ascii_letter := code >= 97 and code <= 122
		var is_digit := code >= 48 and code <= 57
		if is_ascii_letter or is_digit:
			filtered += ch
	return filtered


## Advance a single championship onto its next edition on the continuous timeline.
## Bumps its per-series week offset (so its rounds land a year later), clears the
## finale-paid flag, drops last season's expectation, and resets that series' race
## events and standings buckets — all without touching any other series.
func _roll_series_to_next_edition(world: WorldStateScr, series_id: String) -> void:
	if series_id.is_empty():
		return
	championship_editions[series_id] = int(championship_editions.get(series_id, 0)) + 1
	championship_finales_paid.erase(series_id)
	season_expectations.erase(series_id)

	# Re-arm this series' race weekends to an unraced edition.
	for event_variant: Variant in world.race_events.values():
		if event_variant == null:
			continue
		if String(event_variant.championship_id) != series_id:
			continue
		event_variant.status = "scheduled"
		event_variant.classification = []
		event_variant.practice_result = {}
		event_variant.qualifying_result = {}
		event_variant.race_result = {}
		event_variant.completed_session_types = []
		event_variant.race_index = 0
		event_variant.race_history = []

	# Reset only this series' standings bucket on every team budget; career-long
	# driver stats and other series' standings are left untouched.
	for budget_variant: Variant in world.budgets.values():
		if budget_variant == null:
			continue
		var results_variant: Variant = budget_variant.championship_results
		if results_variant is Dictionary:
			(results_variant as Dictionary).erase(series_id)

	# Force the merged browser rows + active detail to rebuild rounds_data with the
	# new edition offset (the merge keeps existing rounds when the size is unchanged).
	for index in range(series_directory.size()):
		var row_variant: Variant = series_directory[index]
		if row_variant is Dictionary and str((row_variant as Dictionary).get("id", "")) == series_id:
			(row_variant as Dictionary).erase("rounds_data")
	if str(active_series_detail.get("id", "")) == series_id:
		active_series_detail.erase("rounds_data")


func commit_series_entry(series_id: String, car_instance_id: String = "") -> Dictionary:
	set_active_series_by_id(series_id)
	if active_series_detail.is_empty():
		return {"ok": false, "message": "That series could not be opened."}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active career world is loaded."}

	var repo: RefCounted = _content_repository()
	if repo == null:
		return {"ok": false, "message": "Content data failed to load."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	_ensure_player_car_display_names(world)
	var team: TeamStateScr = _player_team_from_world(world)
	if team == null:
		return {"ok": false, "message": "Player team data is incomplete."}

	var car_options := get_series_entry_car_options(series_id)
	if car_options.is_empty():
		return {"ok": false, "message": "No team cars are available for this entry."}
	var selected_car_id := car_instance_id
	if selected_car_id.is_empty():
		for option_variant: Variant in car_options:
			if not option_variant is Dictionary:
				continue
			var option: Dictionary = option_variant
			if bool(option.get("eligible", false)):
				selected_car_id = str(option.get("car_instance_id", ""))
				break
	if selected_car_id.is_empty():
		return {"ok": false, "message": "Choose a car before confirming entry."}

	var selected_option := {}
	for option_variant: Variant in car_options:
		if not option_variant is Dictionary:
			continue
		var option: Dictionary = option_variant
		if str(option.get("car_instance_id", "")) == selected_car_id:
			selected_option = option
			break
	if selected_option.is_empty():
		return {"ok": false, "message": "That car is no longer available to enter."}
	if not bool(selected_option.get("eligible", false)):
		# Class-eligible but below the scrutineering standard -> tell them to service.
		if bool(selected_option.get("class_eligible", false)) and not bool(selected_option.get("meets_condition", true)):
			return {
				"ok": false,
				"reason": "condition",
				"car_instance_id": selected_car_id,
				"message": "That car fails scrutineering for this series. %s" % str(selected_option.get("status_reason", "Service it to meet the minimum condition."))
			}
		return {"ok": false, "message": "That car is not eligible for this series."}

	# If this series already crowned a champion (a prior edition has been paid out),
	# roll it onto its next edition before re-entering: shift its week-slots a year
	# forward on the continuous timeline and wipe the last edition's standings.
	var is_reentry := championship_finales_paid.has(series_id)
	if is_reentry:
		_roll_series_to_next_edition(world, series_id)

	var entry := _entry_for_team_and_championship(world, team.instance_id, series_id)
	if entry == null:
		entry = ChampionshipEntryStateScr.new()
		entry.instance_id = _next_world_entity_id(world.championship_entries, "championship_entry_state")
		entry.team_instance_id = team.instance_id
		entry.championship_id = series_id
		entry.ruleset_id = str(active_series_detail.get("ruleset_id", ""))
		entry.racing_number = 0
		world.championship_entries[entry.instance_id] = entry
		var entry_ids: Array = Array(team.championship_entry_instance_ids)
		entry_ids.append(entry.instance_id)
		team.championship_entry_instance_ids = PackedStringArray(entry_ids)
	entry.car_instance_id = selected_car_id
	_ensure_championship_field_entries(world, repo, series_id, team.instance_id)

	championship_entered = true
	championship_name = str(active_series_detail.get("name", active_series_detail.get("title", championship_name)))
	immediate_blocker = "Fast forward to race weekend and convert the new series entry into a proper first result."
	first_week_pressure = "Get the car to the grid and see how the programme stacks up."

	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	refresh_series_browser_state(false, true)
	set_active_series_by_id(series_id)
	# On a fresh entry, snap the clock to the new series' opening weekend. On re-entry
	# the next edition lives a year ahead, so leave the clock where it is and let the
	# continue/fast-forward flow advance across any other series still racing this year.
	if not is_reentry:
		_anchor_calendar_to_next_race()
	_sync_native_telemetry_ingestion()
	var entry_car_label := str(selected_option.get("car_label", "the new car package"))
	var expectation := _set_season_expectation(series_id)
	_append_mail_once(_series_entry_confirmed_mail(active_series_detail, entry_car_label))
	_append_mail_once(_series_commercial_reaction_mail(active_series_detail))
	_append_mail_once(_board_expectation_mail(series_id, expectation))
	_deliver_scheduled_mail()
	save_game()
	return {
		"ok": true,
		"message": "%s entered with %s." % [
			str(active_series_detail.get("short_name", active_series_detail.get("name", "Series"))),
			str(selected_option.get("car_label", "selected car"))
		],
	}


func get_live_telemetry_status() -> Dictionary:
	return telemetry_live_status.duplicate(true)


## Live, results-driven driver stats keyed by driver_profile_id. Only drivers who
## have started at least one race are included; everyone else falls back to their
## canonical profile rating in the UI.
func get_live_driver_stats() -> Dictionary:
	var out: Dictionary = {}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return out
	var world: WorldStateScr = _runtime_world as WorldStateScr
	for driver_variant: Variant in world.drivers.values():
		if driver_variant == null:
			continue
		var profile_id := String(driver_variant.driver_profile_id)
		var stats_variant: Variant = driver_variant.stats
		if profile_id.is_empty() or not stats_variant is Dictionary:
			continue
		var stats: Dictionary = stats_variant
		if int(stats.get("starts", 0)) <= 0:
			continue
		out[profile_id] = stats.duplicate(true)
	return out


func _advance_one_calendar_day() -> void:
	var next_datetime := _date_from_unix_day(_current_unix_day() + 86400)
	current_year = int(next_datetime.get("year", current_year))
	current_month = int(next_datetime.get("month", current_month))
	current_day_of_month = int(next_datetime.get("day", current_day_of_month))
	_sync_progress_from_calendar_date()
	_deliver_scheduled_mail()
	_tick_auctions()
	_refresh_marketplace_inventory()


func _calendar_day_name(day_number: int) -> String:
	var idx := clampi(day_number, 1, 7) - 1
	return CALENDAR_DAY_NAMES[idx]


func _calendar_month_name(month_number: int) -> String:
	return CALENDAR_MONTH_NAMES[clampi(month_number, 1, 12)]


func _ordinal_suffix(n: int) -> String:
	var v := n % 100
	if v >= 11 and v <= 13:
		return "th"
	match n % 10:
		1:
			return "st"
		2:
			return "nd"
		3:
			return "rd"
		_:
			return "th"


func _series_round_date_label(week_number: int, day_number: int = 5) -> String:
	if week_number <= 0:
		return ""
	var offset_days := (week_number - 1) * 7 + (clampi(day_number, 1, 7) - 1)
	var start_unix := _unix_day_from_datetime(_calendar_start_datetime())
	var resolved := _date_from_unix_day(start_unix + offset_days * 86400)
	var month_name := _calendar_month_name(int(resolved.get("month", 1))).to_lower().capitalize()
	var day_of_month := int(resolved.get("day", 1))
	return "%s %d%s %d" % [month_name, day_of_month, _ordinal_suffix(day_of_month), int(resolved.get("year", current_year))]


func _mail_sent_date_label(year_number: int = current_year, month_number: int = current_month, day_number: int = current_day_of_month) -> String:
	var month_name := _calendar_month_name(month_number).substr(0, 3)
	return "%d %s %d" % [clampi(day_number, 1, 31), month_name, year_number]


func _series_round_weekday_label(week_number: int, day_number: int = 5) -> String:
	if week_number <= 0:
		return ""
	var resolved_day := clampi(day_number, 1, 7)
	return _calendar_day_name(resolved_day).to_lower().capitalize()


func _anchor_calendar_to_next_race() -> void:
	var next_week := _next_active_series_week()
	if next_week <= 0:
		current_week = max(current_week, 1)
		current_day = clampi(current_day, 1, 7)
		_sync_calendar_date_from_progress()
		return
	set_calendar_progress(maxi(1, next_week - 1), 1)


func _next_active_series_week() -> int:
	if car_count <= 0 or not championship_entered or active_series_detail.is_empty():
		return -1
	var rounds_variant: Variant = active_series_detail.get("rounds_data", [])
	if not rounds_variant is Array:
		return -1
	var fallback_week := -1
	for row_variant in rounds_variant:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		# Prefer the absolute week_number (continuous timeline); fall back to parsing.
		var week_number := int(row.get("week_number", 0))
		if week_number <= 0:
			week_number = _parse_series_week(str(row.get("week", "")))
		if week_number <= 0:
			continue
		var status := str(row.get("status", "")).to_lower()
		if status == "done":
			continue
		if fallback_week == -1:
			fallback_week = week_number
		if status == "next":
			return week_number
		if week_number >= current_week and (fallback_week == -1 or week_number < fallback_week):
			fallback_week = week_number
	return fallback_week


func _entered_race_event_progress() -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"total": 0, "completed": 0}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var team := _player_team_from_world(world)
	if team == null:
		return {"total": 0, "completed": 0}
	var entered_series := {}
	for entry_id: String in team.championship_entry_instance_ids:
		var entry = world.championship_entries.get(entry_id)
		if entry != null:
			entered_series[String(entry.championship_id)] = {
				"event_total": 0,
				"completed": 0,
			}
	for event_variant in world.race_events.values():
		if not event_variant is Object:
			continue
		var event = event_variant
		var championship_id := String(event.championship_id)
		if not entered_series.has(championship_id):
			continue
		var series_progress: Dictionary = entered_series[championship_id]
		series_progress["event_total"] = int(series_progress.get("event_total", 0)) + 1
		if str(event.status) == "completed":
			series_progress["completed"] = int(series_progress.get("completed", 0)) + 1
		entered_series[championship_id] = series_progress
	var total := 0
	var completed := 0
	for championship_id_variant: Variant in entered_series.keys():
		var championship_id := String(championship_id_variant)
		var series_progress: Dictionary = entered_series[championship_id] if entered_series[championship_id] is Dictionary else {}
		var event_total := int(series_progress.get("event_total", 0))
		var expected_rounds := maxi(event_total, _expected_rounds_for_entered_series(championship_id))
		total += expected_rounds
		completed += mini(int(series_progress.get("completed", 0)), expected_rounds)
	return {"total": total, "completed": completed}


func _expected_rounds_for_entered_series(championship_id: String) -> int:
	if championship_id.is_empty():
		return 0
	var detail_rounds := _round_count_from_series_row(active_series_detail, championship_id)
	if detail_rounds > 0:
		return detail_rounds
	for row_variant: Variant in series_directory:
		if not row_variant is Dictionary:
			continue
		var rounds := _round_count_from_series_row(row_variant as Dictionary, championship_id)
		if rounds > 0:
			return rounds
	return 0


func _round_count_from_series_row(row: Dictionary, championship_id: String) -> int:
	if row.is_empty() or str(row.get("id", "")) != championship_id:
		return 0
	var rounds_variant: Variant = row.get("rounds_data", [])
	if rounds_variant is Array:
		return (rounds_variant as Array).size()
	return int(row.get("rounds", 0))


func _entered_season_complete() -> bool:
	var progress := _entered_race_event_progress()
	var total := int(progress.get("total", 0))
	return total > 0 and int(progress.get("completed", 0)) >= total


func _new_season_mail() -> Dictionary:
	var year_label := str(current_year)
	var blocks: Array = [
		{"type": "paragraph", "text": "Team Principal,\n\nThe %s season is open. Last year's books are closed and the championship slate has reset." % year_label},
		{"type": "heading", "text": "What's Next"},
		{"type": "paragraph", "text": "Entries have lapsed over the off-season. Head to the Series office to sign up for the championships you want to contest this year — the entry fees apply fresh for the new season."},
	]
	return _mail_dict(
		"mail_new_season_%d" % current_year,
		"team",
		"Series Office",
		"Championship Administration",
		_fill_mail_template("{year} season is open", {"year": year_label}),
		_fill_mail_template("The {year} season is open — time to confirm our entries...", {"year": year_label}),
		"New Season",
		"Sign up for the championships you want to contest in %s." % year_label,
		false,
		"",
		"SO",
		"",
		"partner-partner-0008",
		true,
		false,
		"",
		blocks,
		"review_soon",
		"Season Open",
		"navigate",
		"Open Series",
		"Series",
		"series",
		SERIES_SCENE_PATH,
		false,
		false,
		false,
		false,
		"series"
	)


func _parse_series_week(label: String) -> int:
	var normalized := label.strip_edges().to_lower().replace("week", "").replace("w", "").strip_edges()
	return int(normalized) if not normalized.is_empty() else -1


# Fixed origin for the whole career. The timeline is continuous: weeks count up
# from this origin forever (week 53 = first week of 2027, etc.), so the year is
# always derived from the absolute week rather than reset each season.
func _calendar_start_datetime() -> Dictionary:
	return {
		"year": CALENDAR_ORIGIN_YEAR,
		"month": 1,
		"day": 5,
		"hour": 12,
		"minute": 0,
		"second": 0,
	}


# Weeks added to a championship's catalog week-slots for its current edition on the
# continuous timeline. Each completed-and-re-entered edition shifts the series forward
# one year (WEEKS_PER_SEASON), independent of every other series.
func _championship_week_offset(championship_id: String) -> int:
	if championship_id.is_empty():
		return 0
	return maxi(int(championship_editions.get(championship_id, 0)), 0) * WEEKS_PER_SEASON


# Calendar year that a given absolute week-number lands in (derived from the fixed
# 2026 origin), used for season/edition labelling.
func _year_for_week(week_number: int) -> int:
	if week_number <= 0:
		return current_year
	var start_unix := _unix_day_from_datetime(_calendar_start_datetime())
	var resolved := _date_from_unix_day(start_unix + (week_number - 1) * 7 * 86400)
	return int(resolved.get("year", current_year))


func _current_unix_day() -> int:
	return _unix_day_from_datetime(_calendar_datetime_from_current())


func _calendar_datetime_from_current() -> Dictionary:
	return {
		"year": current_year,
		"month": current_month,
		"day": current_day_of_month,
		"hour": 12,
		"minute": 0,
		"second": 0,
	}


func _unix_day_from_datetime(datetime: Dictionary) -> int:
	return int(Time.get_unix_time_from_datetime_dict(datetime))


func _date_from_unix_day(unix_day: int) -> Dictionary:
	var dt: Dictionary = Time.get_datetime_dict_from_unix_time(unix_day)
	return {
		"year": int(dt.get("year", 2026)),
		"month": int(dt.get("month", 1)),
		"day": int(dt.get("day", 1)),
		"weekday": int(dt.get("weekday", Time.WEEKDAY_MONDAY)),
	}


func _sync_calendar_date_from_progress() -> void:
	var offset_days := (current_week - 1) * 7 + (current_day - 1)
	var start_unix := _unix_day_from_datetime(_calendar_start_datetime())
	var resolved := _date_from_unix_day(start_unix + offset_days * 86400)
	current_year = int(resolved.get("year", current_year))
	current_month = int(resolved.get("month", current_month))
	current_day_of_month = int(resolved.get("day", current_day_of_month))


func _sync_progress_from_calendar_date() -> void:
	var start_unix := _unix_day_from_datetime(_calendar_start_datetime())
	var current_unix := _current_unix_day()
	var elapsed_days := maxi(int((current_unix - start_unix) / 86400), 0)
	current_week = int(elapsed_days / 7) + 1
	current_day = int(elapsed_days % 7) + 1


func _calendar_entry_from_datetime(datetime: Dictionary, is_current: bool) -> Dictionary:
	var weekday_index := int(datetime.get("weekday", Time.WEEKDAY_MONDAY))
	var day_name := _calendar_day_name(((weekday_index + 6) % 7) + 1)
	return {
		"year": int(datetime.get("year", 2026)),
		"month": int(datetime.get("month", 1)),
		"month_name": _calendar_month_name(int(datetime.get("month", 1))),
		"day_of_month": int(datetime.get("day", 1)),
		"day_name": day_name,
		"is_current": is_current,
	}


func _find_continue_blocking_mail() -> Dictionary:
	for mail_variant in inbox_messages:
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant as Dictionary
		if bool(mail.get("resolved", false)):
			continue
		if not bool(mail.get("requires_response", false)):
			continue
		if bool(mail.get("clears_immediate_blocker", false)) or str(mail.get("action_type", "")) == "acknowledge":
			return mail
	return {}


func _evaluate_continue_target() -> Dictionary:
	var state := get_current_day_state()
	var blocking_mail := _find_continue_blocking_mail()
	if not blocking_mail.is_empty() and not immediate_blocker.is_empty():
		return {
			"target_kind": "mail_blocker",
			"button_label": "Needs Attention",
			"eyebrow": "Blocking",
			"title": str(blocking_mail.get("subject", "Inbox action required")),
			"description": str(blocking_mail.get("summary", "A required message needs to be acknowledged before the day can move on.")),
			"target_label": "Mail",
			"target_context": "mail",
			"scene_path": MAIL_SCENE_PATH,
			"state": state,
		}
	if _entered_season_complete():
		var progress := _entered_race_event_progress()
		return {
			"target_kind": "season_complete",
			"button_label": "Season Complete",
			"eyebrow": "Season Wrapped",
			"title": "All entered race weekends are complete",
			"description": "%d race weekend%s completed. Review standings, finances, and the inbox before preparing the next campaign." % [
				int(progress.get("completed", 0)),
				"" if int(progress.get("completed", 0)) == 1 else "s"
			],
			"target_label": "Series",
			"target_context": "series",
			"scene_path": SERIES_SCENE_PATH,
			"state": state,
		}
	var conflict_events := _current_unresolved_race_conflicts()
	if not conflict_events.is_empty():
		return {
			"target_kind": "race_conflict",
			"button_label": "Needs Attention",
			"eyebrow": "Calendar Conflict",
			"title": "Race weekends overlap",
			"description": "%d entered race weekends share this Friday-Sunday window. Choose which event to attend, delegate, or withdraw from." % conflict_events.size(),
			"target_label": "Calendar",
			"target_context": "calendar",
			"scene_path": CALENDAR_SCENE_PATH,
			"state": state,
			"events": conflict_events,
		}
	var next_race_week := _next_active_series_week()
	if next_race_week > 0:
		var weekend_summary := get_active_race_weekend_summary()
		var session_statuses: Dictionary = weekend_summary.get("session_statuses", {}) if weekend_summary.get("session_statuses", {}) is Dictionary else {}
		var race_complete := str(session_statuses.get("race", "Pending")) == "Complete"
		if not race_complete and current_week == next_race_week and current_day >= 7:
			return {
				"target_kind": "race_day",
				"button_label": "Needs Attention",
				"eyebrow": "Weekend Live",
				"title": "Race day is here",
				"description": "The final session is live and the team should be on the race screen.",
				"target_label": "Race Day",
				"target_context": "race-day",
				"scene_path": RACE_DAY_SCENE_PATH,
				"state": state,
			}
		if not race_complete and current_week == next_race_week and current_day >= 5:
			return {
				"target_kind": "race_weekend",
				"button_label": "Needs Attention",
				"eyebrow": "Weekend Live",
				"title": "Race weekend has started",
				"description": "Practice and qualifying should now be handled from the race day screen.",
				"target_label": "Race Day",
				"target_context": "race-day",
				"scene_path": RACE_DAY_SCENE_PATH,
				"state": state,
			}
		var closing_lot := _closing_auction_to_attend()
		if not closing_lot.is_empty():
			return _auction_closing_cta(closing_lot, state)
		var days_until_weekend: int = maxi((next_race_week - current_week) * 7 + (5 - current_day), 0)
		return {
			"target_kind": "advance_day",
			"button_label": "Continue",
			"eyebrow": "Advance Day",
			"title": "Move the calendar forward",
			"description": "%d quiet day%s until race weekend at %s." % [
				days_until_weekend,
				"" if days_until_weekend == 1 else "s",
				next_race_track_name
			],
			"target_label": "",
			"target_context": "",
			"scene_path": "",
			"state": state,
		}
	var closing_lot_final := _closing_auction_to_attend()
	if not closing_lot_final.is_empty():
		return _auction_closing_cta(closing_lot_final, state)
	return {
		"target_kind": "advance_day",
		"button_label": "Continue",
		"eyebrow": "Advance Day",
		"title": "Advance the save",
		"description": "No hard blocker is active. Use Continue to move one day closer to the next meaningful event.",
		"target_label": "",
		"target_context": "",
		"scene_path": "",
		"state": state,
	}


func _closing_auction_to_attend() -> Dictionary:
	for listing_variant in marketplace_listings:
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("market_type", "")) != "auction":
			continue
		var block: Variant = listing.get("auction", {})
		if not block is Dictionary or (block as Dictionary).is_empty():
			continue
		var auction: Dictionary = block as Dictionary
		if str(auction.get("status", "open")) != "closing":
			continue
		if not _listing_is_player_involved(listing):
			continue
		return _sanitize_marketplace_listings([listing])[0]
	return {}


func _auction_closing_cta(listing: Dictionary, state: Variant) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	var block: Dictionary = listing.get("auction", {}) if listing.get("auction", {}) is Dictionary else {}
	var current_bid := _fmt_money_compact(float(block.get("current_bid", 0.0)))
	var leading := str(block.get("high_bidder_id", "")) == _player_bidder_id()
	var lead_text := "You lead" if leading else "You're behind"
	return {
		"target_kind": "auction_closing",
		"button_label": "Attend Auction",
		"eyebrow": "Auction Closing",
		"title": "%s is closing" % descriptor,
		"description": "%s at %s. Attend the live finish or let your maximum bid ride." % [lead_text, current_bid],
		"target_label": "Marketplace",
		"target_context": "marketplace",
		"scene_path": MARKETPLACE_SCENE_PATH,
		"state": state,
		"auction_lot_id": str(listing.get("id", "")),
	}


func _current_unresolved_race_conflicts() -> Array:
	var events: Array = get_career_calendar_events()
	var current_weekend_key := "2026-W%02d-weekend" % current_week
	var unresolved: Array = []
	for event_variant: Variant in events:
		if not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant
		if str(event.get("kind", "")) != "race_weekend":
			continue
		if str(event.get("weekend_key", "")) != current_weekend_key:
			continue
		if str(event.get("conflict_group_id", "")).is_empty():
			continue
		if bool(event.get("resolved", false)):
			continue
		if current_day < 5 or current_day > 7:
			continue
		unresolved.append(event.duplicate(true))
	return unresolved


func _build_continue_timeline_entry(target: Dictionary, is_stop: bool) -> Dictionary:
	var state := get_current_day_state()
	return {
		"year": int(state.get("year", current_year)),
		"week": int(state.get("week", current_week)),
		"day": int(state.get("day", current_day)),
		"day_name": str(state.get("day_name", _calendar_day_name(current_day))),
		"label": str(state.get("label", "")),
		"target_kind": str(target.get("target_kind", "advance_day")),
		"title": str(target.get("title", "")),
		"description": str(target.get("description", "")),
		"is_stop": is_stop,
	}


func telemetry_runtime_directory() -> String:
	var absolute := ProjectSettings.globalize_path("user://telemetry")
	DirAccess.make_dir_recursive_absolute(absolute)
	return absolute


func _default_live_telemetry_status() -> Dictionary:
	return {
		"connected": false,
		"ingestion_active": false,
		"message": "Telemetry backend unavailable. Launch this project from the Godot .NET build and make sure the C# project compiles.",
		"session_type": "Unknown",
		"race_state": "Unavailable",
		"session_phase": "Unavailable",
		"track_name": "",
		"layout_name": "",
		"car_name": "",
		"car_class": "",
		"player_name": "",
		"player_position": 0,
		"laps_completed": 0,
		"participant_count": 0,
		"rain_density": 0.0
	}


func _native_telemetry_node() -> Node:
	if not is_inside_tree():
		return null
	return get_node_or_null("/root/Ams2Telemetry")


func _connect_native_telemetry() -> void:
	if _native_telemetry_connected:
		return
	var telemetry := _native_telemetry_node()
	if telemetry == null:
		telemetry_live_status = _default_live_telemetry_status()
		telemetry_status_updated.emit(telemetry_live_status)
		if _native_telemetry_retry_count < MAX_NATIVE_TELEMETRY_RETRIES:
			_native_telemetry_retry_count += 1
			call_deferred("_connect_native_telemetry")
		return
	_connect_native_signal(telemetry, ["TelemetryResultReady", "telemetry_result_ready"], Callable(self, "_on_native_telemetry_result_ready"))
	_connect_native_signal(telemetry, ["TelemetryStatusChanged", "telemetry_status_changed"], Callable(self, "_on_native_telemetry_status_changed"))
	_connect_native_signal(telemetry, ["TelemetryError", "telemetry_error"], Callable(self, "_on_native_telemetry_error"))
	if telemetry.has_method("GetStatus"):
		var status_variant: Variant = telemetry.call("GetStatus")
		if status_variant is Dictionary:
			telemetry_live_status = (status_variant as Dictionary).duplicate(true)
			telemetry_status_updated.emit(telemetry_live_status)
	_native_telemetry_connected = true
	_native_telemetry_retry_count = 0


func _connect_native_signal(telemetry: Node, candidate_names: Array, target: Callable) -> void:
	for name_variant in candidate_names:
		var signal_name: String = str(name_variant)
		if telemetry.has_signal(signal_name) and not telemetry.is_connected(signal_name, target):
			telemetry.connect(signal_name, target)
			return


func _sync_native_telemetry_ingestion() -> void:
	var telemetry := _native_telemetry_node()
	if telemetry == null:
		return
	if telemetry.has_method("SetIngestionActive"):
		telemetry.call("SetIngestionActive", championship_entered)


func _on_native_telemetry_status_changed(status: Dictionary) -> void:
	telemetry_live_status = status.duplicate(true)
	telemetry_status_updated.emit(telemetry_live_status)


func _on_native_telemetry_result_ready(payload: Dictionary) -> void:
	var result: Dictionary = apply_telemetry_session_result(payload)
	if not bool(result.get("ok", false)):
		telemetry_ingest_error.emit(str(result.get("message", "Telemetry import failed.")))


func _on_native_telemetry_error(message: String) -> void:
	telemetry_ingest_error.emit(message)


func get_active_race_weekend_summary() -> Dictionary:
	_ensure_world_derived_summaries()
	var summary := {
		"ready": false,
		"series_name": championship_name,
		"championship_name": championship_name,
		"track_name": next_race_track_name,
		"round_label": next_race_in_label,
		"session_statuses": {
			"practice": "Pending",
			"qualifying": "Pending",
			"race": "Pending",
		},
		"player_position": 0,
		"points_awarded": 0,
		"prize_money_label": "$0",
		"race_package": race_package.duplicate(true),
	}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return summary
	var repo: RefCounted = _content_repository()
	if repo == null:
		return summary
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var event: Variant = _active_race_event_from_world(repo, world)
	if event == null:
		return summary
	summary["ready"] = true
	summary["series_id"] = String(event.championship_id)
	summary["race_event_id"] = String(event.instance_id)
	summary["scrutineering"] = _scrutineering_status_for_championship(world, String(event.championship_id))
	summary["championship_name"] = _championship_display_name(repo, event.championship_id)
	summary["series_name"] = str(summary["championship_name"])
	var scheduled_round := _series_round_row_for_event(String(event.championship_id), int(event.round_index))
	if not scheduled_round.is_empty():
		var scheduled_track := str(scheduled_round.get("track", "")).strip_edges()
		if not scheduled_track.is_empty():
			summary["track_name"] = scheduled_track
		summary["layout_name"] = str(scheduled_round.get("layout", "")).strip_edges()
	else:
		var track_row: Variant = repo.get_track_layout(event.track_layout_id)
		if track_row is Dictionary:
			summary["track_name"] = str((track_row as Dictionary).get("display_name", summary["track_name"]))
			summary["layout_name"] = str((track_row as Dictionary).get("display_name", ""))
	summary["round_label"] = "Round %d" % int(event.round_index + 1)
	var races_in_round: int = maxi(1, int(event.races_in_round))
	summary["races_in_round"] = races_in_round
	summary["race_index"] = int(event.race_index)
	summary["race_label"] = ("Race %d of %d" % [int(event.race_index) + 1, races_in_round]) if races_in_round > 1 else ""
	var statuses: Dictionary = summary["session_statuses"]
	statuses["practice"] = "Complete" if not event.practice_result.is_empty() else "Pending"
	statuses["qualifying"] = "Complete" if not event.qualifying_result.is_empty() else "Pending"
	statuses["race"] = "Complete" if not event.race_result.is_empty() else "Pending"
	summary["session_statuses"] = statuses
	# Per-race breakdown for double-header weekends: each archived race carries the
	# player's finish + points so the debrief can show Race 1 / Race 2 separately.
	var race_breakdown: Array = []
	var round_points_total := 0
	for history_variant: Variant in event.race_history:
		if not history_variant is Dictionary:
			continue
		var hist: Dictionary = history_variant
		var hist_race: Dictionary = hist.get("race_result", {}) if hist.get("race_result", {}) is Dictionary else {}
		var hist_points := int(hist.get("points_awarded", hist_race.get("points_awarded", 0)))
		round_points_total += hist_points
		race_breakdown.append({
			"race_number": int(hist.get("race_index", 0)) + 1,
			"player_position": int(hist_race.get("player_class_position", hist_race.get("player_position", 0))),
			"points_awarded": hist_points,
			"prize_money_label": _fmt_money_compact(float(hist.get("prize_money", hist_race.get("prize_money", 0.0)))),
			"dnf": bool(hist_race.get("dnf", false)),
		})
	if not event.race_result.is_empty():
		round_points_total += int(event.race_result.get("points_awarded", 0))
	summary["race_results"] = race_breakdown
	summary["round_points_total"] = round_points_total
	# Between the races of a double-header the current race_result is cleared so the
	# next race runs its own qualifying; fall back to the last finished race so the
	# debrief keeps showing a real result instead of zeros.
	var effective_race_result: Dictionary = event.race_result if not event.race_result.is_empty() else _last_history_race_result(event)
	var latest_result := _latest_session_result_for_event(event)
	if latest_result.is_empty() and not effective_race_result.is_empty():
		latest_result = effective_race_result
	if latest_result.is_empty():
		latest_result = _latest_completed_session_result_for_championship(world, event.championship_id)
	summary["latest_result"] = latest_result
	summary["player_position"] = int(latest_result.get("player_position", effective_race_result.get("player_position", 0)))
	summary["points_awarded"] = int(effective_race_result.get("points_awarded", 0))
	summary["prize_money_label"] = _fmt_money_compact(float(effective_race_result.get("prize_money", 0.0)))
	var grid_slot := int(event.qualifying_result.get("player_position", 0)) if event.qualifying_result is Dictionary else 0
	summary["qualifying_position"] = grid_slot
	summary["grid_position"] = int(effective_race_result.get("grid_position", grid_slot)) if effective_race_result is Dictionary else grid_slot
	var series_row := _series_row_for_id(String(event.championship_id))
	var package: Dictionary = series_row.get("race_package", {}) if series_row.get("race_package", {}) is Dictionary else race_package
	summary["race_package"] = package.duplicate(true)
	return summary


## Finishing-order view of the active race event for the Race Day results table.
## Returns {ready, rows, is_multiclass, player_class_label, track_name}, where each
## row carries class position, points, DNF and fastest-lap flags resolved for display.
## The most recently archived race's race_result for a multi-race weekend, used to
## keep the debrief populated between races. Empty when no race has finished yet.
func _last_history_race_result(event: Variant) -> Dictionary:
	if event == null or not (event.race_history is Array) or (event.race_history as Array).is_empty():
		return {}
	var last_variant: Variant = (event.race_history as Array).back()
	if not last_variant is Dictionary:
		return {}
	var last_race: Variant = (last_variant as Dictionary).get("race_result", {})
	return (last_race as Dictionary).duplicate(true) if last_race is Dictionary else {}


func get_active_race_classification() -> Dictionary:
	var view := {"ready": false, "rows": [], "is_multiclass": false, "player_class_label": "", "track_name": next_race_track_name}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return view
	var repo: RefCounted = _content_repository()
	if repo == null:
		return view
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var event: Variant = _active_race_event_from_world(repo, world)
	if not _event_has_race_classification(event):
		# After a race the active event advances to the next round, so fall back
		# to the most recently completed race in the championship.
		event = _latest_completed_race_event_with_classification(world)
	if event == null:
		return view
	return _build_race_classification_view(repo, world, event)


func _event_has_race_classification(event: Variant) -> bool:
	if event == null:
		return false
	if not (event.classification is Array) or (event.classification as Array).is_empty():
		return false
	return event.race_result is Dictionary and not (event.race_result as Dictionary).is_empty()


func _latest_completed_race_event_with_classification(world: WorldStateScr) -> Variant:
	var best: Variant = null
	for event_variant in world.race_events.values():
		if not _event_has_race_classification(event_variant):
			continue
		if best == null or int(event_variant.round_index) > int(best.round_index):
			best = event_variant
	return best


static func _build_race_classification_view(repo: RefCounted, world: WorldStateScr, event: Variant) -> Dictionary:
	var view := {"ready": false, "rows": [], "is_multiclass": false, "player_class_label": "", "track_name": ""}
	if event == null:
		return view
	var classification: Variant = event.classification
	if not classification is Array or (classification as Array).is_empty():
		return view

	var track_row: Variant = repo.get_track_layout(event.track_layout_id) if repo != null else null
	if track_row is Dictionary:
		view["track_name"] = str((track_row as Dictionary).get("display_name", ""))

	var distinct_classes: Dictionary = {}
	for row_variant in classification as Array:
		if row_variant is Dictionary:
			var class_label := str((row_variant as Dictionary).get("car_class", "")).strip_edges()
			if not class_label.is_empty():
				distinct_classes[class_label] = true
	var is_multiclass := distinct_classes.size() > 1
	view["is_multiclass"] = is_multiclass

	var rows: Array = []
	for row_variant in classification as Array:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant
		var team_id := str(row.get("team_instance_id", ""))
		var team_name := ""
		if not team_id.is_empty() and world.teams.has(team_id):
			var team = world.teams[team_id]
			if team != null:
				team_name = str(team.display_name)
		var overall_pos := int(row.get("position", 0))
		var class_pos := int(row.get("class_position", overall_pos))
		var is_player := bool(row.get("is_player", false))
		if is_player:
			view["player_class_label"] = str(row.get("car_class", ""))
		rows.append({
			"pos": class_pos if is_multiclass else overall_pos,
			"overall_pos": overall_pos,
			"class_pos": class_pos,
			"driver": str(row.get("name", "")),
			"team": team_name,
			"car_class": str(row.get("car_class", "")),
			"points": int(row.get("points_awarded", 0)),
			"dnf": bool(row.get("dnf", false)),
			"fastest_lap": bool(row.get("fastest_lap_bonus", false)),
			"is_player": is_player,
		})
	rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_dnf := 1 if bool(a.get("dnf", false)) else 0
		var b_dnf := 1 if bool(b.get("dnf", false)) else 0
		if a_dnf != b_dnf:
			return a_dnf < b_dnf
		return int(a.get("overall_pos", 999)) < int(b.get("overall_pos", 999))
	)
	view["rows"] = rows
	view["ready"] = not rows.is_empty()
	return view


func _latest_session_result_for_event(event: Variant) -> Dictionary:
	if event == null:
		return {}
	if event.race_result is Dictionary and not event.race_result.is_empty():
		return event.race_result.duplicate(true)
	if event.qualifying_result is Dictionary and not event.qualifying_result.is_empty():
		return event.qualifying_result.duplicate(true)
	if event.practice_result is Dictionary and not event.practice_result.is_empty():
		return event.practice_result.duplicate(true)
	return {}


func _latest_completed_session_result_for_championship(world: WorldStateScr, championship_id: String) -> Dictionary:
	var completed: Array = []
	for event_variant in world.race_events.values():
		if not event_variant is Object:
			continue
		var event = event_variant
		if String(event.championship_id) != championship_id:
			continue
		var latest := _latest_session_result_for_event(event)
		if latest.is_empty():
			continue
		completed.append({"round_index": int(event.round_index), "result": latest})
	completed.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a.get("round_index", -1)) > int(b.get("round_index", -1)))
	if completed.is_empty():
		return {}
	var row: Dictionary = completed[0] as Dictionary
	var result: Variant = row.get("result", {})
	return result.duplicate(true) if result is Dictionary else {}


func _active_series_next_round_row() -> Dictionary:
	var rounds_variant: Variant = active_series_detail.get("rounds_data", [])
	if not rounds_variant is Array:
		return {}
	var fallback: Dictionary = {}
	for row_variant in rounds_variant:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		if fallback.is_empty():
			fallback = row
		var status: String = str(row.get("status", "")).to_lower()
		if status == "next":
			return row
		if status != "done":
			fallback = row
			break
	return fallback


func _series_round_row_for_event(series_id: String, round_index: int) -> Dictionary:
	var row := _series_row_for_id(series_id)
	var rounds_variant: Variant = row.get("rounds_data", [])
	if not rounds_variant is Array:
		return _active_series_next_round_row()
	var rounds: Array = rounds_variant
	if round_index >= 0 and round_index < rounds.size() and rounds[round_index] is Dictionary:
		return (rounds[round_index] as Dictionary).duplicate(true)
	return _active_series_next_round_row()


func get_latest_telemetry_payload() -> Dictionary:
	telemetry_runtime_directory()
	if not FileAccess.file_exists(LATEST_TELEMETRY_RESULT_FILE):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(LATEST_TELEMETRY_RESULT_FILE))
	return parsed as Dictionary if parsed is Dictionary else {}


func apply_latest_telemetry_result() -> Dictionary:
	var payload: Dictionary = get_latest_telemetry_payload()
	if payload.is_empty():
		var failure := {"ok": false, "message": "No telemetry result file has been written yet."}
		telemetry_ingest_error.emit(str(failure["message"]))
		return failure
	return apply_telemetry_session_result(payload)


func apply_telemetry_session_result(payload: Dictionary) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active world is loaded."}
	var repo: RefCounted = _content_repository()
	if repo == null:
		return {"ok": false, "message": "Content repository failed to load."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var telemetry_payload := payload.duplicate(true)
	if not pending_race_context.is_empty():
		telemetry_payload["championshipId"] = str(pending_race_context.get("series_id", ""))
		telemetry_payload["raceEventId"] = str(pending_race_context.get("race_event_id", ""))
	# Hard scrutineering gate: a car below the series' minimum condition cannot take
	# the race start. Practice/qualifying are allowed so the player can still run.
	if str(payload.get("sessionType", "")).strip_edges().to_lower() == "race":
		var champ_id := str(telemetry_payload.get("championshipId", ""))
		if champ_id.is_empty():
			champ_id = _primary_championship_id_from_world(world)
		var scrutineering := _scrutineering_status_for_championship(world, champ_id)
		if not bool(scrutineering.get("passes", true)):
			var fail := {
				"ok": false,
				"reason": "scrutineering",
				"scrutineering": scrutineering,
				"message": "Car fails scrutineering: %d%% condition is below the %d%% minimum for this series. Service the car before the race." % [int(scrutineering.get("car_condition_pct", 0)), int(scrutineering.get("min_condition_pct", 0))],
			}
			telemetry_ingest_error.emit(str(fail["message"]))
			return fail
	var result: Dictionary = RaceResultProcessorScr.apply_session_result(repo, world, telemetry_payload)
	if not bool(result.get("ok", false)):
		return result
	if str(result.get("session_type", "")) == "race":
		var round_done := bool(result.get("round_completed", true))
		first_week_pressure = "Review the debrief, react to the result, and prepare the next race weekend." if round_done else "Run the next race of this weekend."
		if not bool(result.get("duplicate", false)):
			_update_owner_driver_stats(result)
			_apply_post_race_car_wear(world, result)
			_append_mail_once(_race_result_debrief_mail(repo, world, result))
			if round_done:
				_maybe_pay_championship_finale(repo, world, str(result.get("championship_id", "")))
		# Keep the player in the weekend until every race of the round is done.
		if round_done and str(result.get("event_instance_id", "")) == str(pending_race_context.get("race_event_id", "")):
			pending_race_context = {}
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	save_game()
	telemetry_result_applied.emit(result)
	return result


func get_overview_player_metrics() -> Dictionary:
	return _sanitize_overview_player_metrics(overview_player_metrics).duplicate(true)


func get_overview_benchmark_grid() -> Array:
	return _sanitize_benchmark_grid(overview_benchmark_grid).duplicate(true)


func get_facility_projects() -> Array:
	return _sanitize_project_array(facility_projects).duplicate(true)


func get_rd_projects() -> Array:
	return _sanitize_project_array(rd_projects).duplicate(true)


func set_pending_navigation(target_label: String, target_context: String, scene_path: String = "") -> void:
	pending_navigation_label = target_label
	pending_navigation_context = target_context
	pending_navigation_scene = scene_path
	save_game()


func clear_pending_navigation() -> void:
	pending_navigation_label = ""
	pending_navigation_context = ""
	pending_navigation_scene = ""
	save_game()


func set_pending_driver_browser_id(driver_profile_id: String) -> void:
	pending_driver_browser_id = driver_profile_id.strip_edges()


func consume_pending_driver_browser_id() -> String:
	var out := pending_driver_browser_id
	pending_driver_browser_id = ""
	return out


func _series_card_days_label() -> String:
	if car_count <= 0 or not has_championship_entry():
		return "--"
	var next_race_week: int = _next_active_series_week()
	if next_race_week <= 0:
		return next_race_in_label if not next_race_in_label.is_empty() else "--"
	var days_until_race: int = maxi((next_race_week - current_week) * 7 + (7 - current_day), 0)
	if days_until_race <= 0:
		return "TODAY"
	if days_until_race == 1:
		return "1 DAY"
	return "%d DAYS" % days_until_race


func get_series_card_data() -> Dictionary:
	var resolved_garage_scene_path := garage_scene_path
	if resolved_garage_scene_path.is_empty() or resolved_garage_scene_path == "res://scenes/garage_placeholder.tscn":
		resolved_garage_scene_path = "res://scenes/garage_screen.tscn"
	if _runtime_world != null and _runtime_world is WorldStateScr:
		_ensure_player_car_display_names(_runtime_world as WorldStateScr)
	var has_car: bool = car_count > 0
	var has_championship: bool = has_championship_entry()
	var eyebrow: String = current_series_eyebrow
	var title: String = current_series_name
	var days_label: String = _series_card_days_label()
	var track_label: String = next_race_track_name
	var track_image_path: String = next_race_track_image_path
	var standings_label: String = championship_position_label
	if not has_car:
		eyebrow = "CURRENT RACE PROGRAMME"
		title = "SERIES UNAVAILABLE"
		days_label = "--"
		track_label = "--"
		track_image_path = ""
		standings_label = "--"
	elif not has_championship:
		eyebrow = player_car_class_name.to_upper() if not player_car_class_name.is_empty() else "CURRENT RACE PROGRAMME"
		title = "NO SERIES ENTERED"
		days_label = "--"
		track_label = "SELECT SERIES"
		track_image_path = ""
		standings_label = "--"
	return {
		"eyebrow": eyebrow,
		"title": title,
		"days_label": days_label,
		"track_label": track_label,
		"track_image_path": track_image_path,
		"standings_label": standings_label,
		"car_image_path": current_car_image_path,
		"garage_scene_path": resolved_garage_scene_path
	}


func get_mail_items() -> Array:
	return _sanitize_mail_array(inbox_messages).duplicate(true)


func get_marketplace_listings() -> Array:
	return _sanitize_marketplace_listings(marketplace_listings).duplicate(true)


func mark_mail_read(mail_id: String, unread: bool = false) -> void:
	var updated: bool = false
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) != mail_id:
			continue
		mail["unread"] = unread
		inbox_messages[index] = mail
		updated = true
		break
	if updated:
		save_game()


func toggle_mail_starred(mail_id: String) -> void:
	var updated: bool = false
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) != mail_id:
			continue
		mail["starred"] = not bool(mail.get("starred", false))
		inbox_messages[index] = mail
		updated = true
		break
	if updated:
		save_game()


func toggle_mail_archived(mail_id: String) -> void:
	var updated: bool = false
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) != mail_id:
			continue
		mail["archived"] = not bool(mail.get("archived", false))
		mail["unread"] = false
		inbox_messages[index] = mail
		updated = true
		break
	if updated:
		save_game()


func perform_mail_action(mail_id: String) -> Dictionary:
	var result: Dictionary = {
		"ok": false,
		"navigate": false,
		"scene_path": "",
		"context": "",
		"label": "",
	}
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) != mail_id:
			continue

		mail["unread"] = false
		var action_type: String = str(mail.get("action_type", ""))
		var resolve_now: bool = bool(mail.get("resolve_on_action", false))
		var followup_mail: Dictionary = {}
		result["ok"] = true

		if action_type == "acknowledge":
			resolve_now = true
			if bool(mail.get("clears_immediate_blocker", false)):
				immediate_blocker = str(mail.get("next_blocker_after_resolve", "")).strip_edges()
				var next_prompt: String = str(mail.get("next_pressure_after_acknowledge", "")).strip_edges()
				if not next_prompt.is_empty():
					first_week_pressure = next_prompt
				followup_mail = _launch_followup_mail()
		elif action_type == "navigate":
			var target_label: String = str(mail.get("action_target_label", "")).strip_edges()
			var target_context: String = str(mail.get("action_target_context", "")).strip_edges()
			var target_scene: String = str(mail.get("action_scene_path", "")).strip_edges()
			if not target_context.is_empty():
				set_pending_navigation(target_label, target_context, target_scene)
				result["navigate"] = not target_scene.is_empty()
				result["scene_path"] = target_scene
				result["context"] = target_context
				result["label"] = target_label
		elif action_type == "mark_resolved":
			resolve_now = true

		if resolve_now:
			mail["resolved"] = true
			mail["requires_response"] = false
			mail["status_label"] = "Resolved"

		inbox_messages[index] = mail
		if not followup_mail.is_empty():
			_append_mail_once(followup_mail)
		save_game()
		return result
	return result


func acknowledge_mail(mail_id: String) -> void:
	perform_mail_action(mail_id)


func acquire_marketplace_listing(listing_id: String, transaction_kind: String = "buy") -> Dictionary:
	var listing := _find_marketplace_listing(listing_id)
	if listing.is_empty():
		return {"ok": false, "message": "That offer is no longer available."}
	if str(listing.get("market_type", "")) == "auction":
		return {"ok": false, "message": "Auction lots are won by bidding, not direct purchase."}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active career world is loaded."}

	var repo: RefCounted = _content_repository()
	if repo == null:
		return {"ok": false, "message": "Content data failed to load."}

	var world: WorldStateScr = _runtime_world as WorldStateScr
	var team: TeamStateScr = _player_team_from_world(world)
	var budget: BudgetStateScr = _player_budget_from_world(world)
	if team == null or budget == null:
		return {"ok": false, "message": "Player team data is incomplete."}

	# The first acquisition is the launch milestone (it unlocks series entry and
	# replaces the empty garage); every later buy simply appends to the fleet.
	var is_launch_purchase := not startup_car_purchased

	var upfront_cost: float = _listing_checkout_price(listing)
	var debt_delta := 0.0
	if transaction_kind == "lease":
		upfront_cost = maxf(upfront_cost * 0.35, 15000.0)
		debt_delta = _listing_checkout_price(listing) * 0.45
	if budget.cash < upfront_cost:
		return {"ok": false, "message": "You do not have enough cash for that deal."}

	if is_launch_purchase:
		_replace_player_launch_car(world, team, listing)
	else:
		_add_purchased_car(world, team, listing)
	budget.cash = maxf(0.0, budget.cash - upfront_cost)
	budget.debt += debt_delta
	if is_launch_purchase:
		startup_car_purchased = true
		startup_last_purchase_listing_id = listing_id
		current_car_image_path = str(listing.get("image_path", DEFAULT_CAR_IMAGE_PATH))
		player_car_class_name = str(listing.get("class_name", player_car_class_name))
		player_car_manufacturer = str(listing.get("car_filter", player_car_manufacturer))
		immediate_blocker = "Series entry is the next step once the launch car is signed."
		first_week_pressure = "Open Series and enter a championship for the new car package."
	_ensure_player_car_display_names(world)
	_remove_marketplace_listing(listing_id)

	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	if is_launch_purchase:
		_append_market_mail(_purchase_confirmation_mail(listing, transaction_kind))
		_mark_launch_market_mail_resolved()
		_activate_series_entry_mail()
		_append_mail_once(_post_purchase_followup_mail(listing))
	else:
		_append_market_mail(_fleet_purchase_mail(listing, transaction_kind))
	save_game()
	return {
		"ok": true,
		"message": "%s secured for %s." % [
			str(listing.get("card_title", listing.get("hero_title", "Car"))).replace("\n", " "),
			_fmt_money_compact(upfront_cost)
		],
	}


func _add_purchased_car(world: WorldStateScr, team: TeamStateScr, listing: Dictionary) -> void:
	if world == null or team == null:
		return
	var car := CarStateScr.new()
	car.instance_id = _next_world_entity_id(world.cars, "car_state")
	car.team_instance_id = team.instance_id
	car.car_platform_id = str(listing.get("car_platform_id", ""))
	car.display_name = str(listing.get("livery_name", listing.get("card_title", ""))).strip_edges()
	car.installed_part_instance_ids = {}
	_install_listing_parts(world, team, car, listing)
	world.cars[car.instance_id] = car
	var ids: Array = []
	for existing_id: String in team.car_instance_ids:
		ids.append(existing_id)
	ids.append(car.instance_id)
	team.car_instance_ids = PackedStringArray(ids)


func _remove_marketplace_listing(listing_id: String) -> void:
	for index in range(marketplace_listings.size() - 1, -1, -1):
		var listing_variant: Variant = marketplace_listings[index]
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("id", "")) != listing_id:
			continue
		marketplace_listings.remove_at(index)
		return


func _seed_startup_operations(repo: RefCounted, world: WorldStateScr) -> void:
	startup_car_purchased = false
	startup_last_purchase_listing_id = ""
	current_car_image_path = DEFAULT_CAR_IMAGE_PATH
	player_car_class_name = ""
	player_car_manufacturer = ""
	marketplace_listings = _build_startup_marketplace_listings(repo, world)
	for i in range(marketplace_listings.size()):
		if typeof(marketplace_listings[i]) != TYPE_DICTIONARY:
			continue
		var startup_listing: Dictionary = marketplace_listings[i] as Dictionary
		startup_listing["listing_week"] = current_week
		if str(startup_listing.get("market_type", "")) == "auction":
			startup_listing = _initialize_auction_lot(repo, world, startup_listing, abs(hash(str(startup_listing.get("id", "")))))
		marketplace_listings[i] = startup_listing
	inbox_messages = _build_startup_mail(repo, world, marketplace_listings)
	immediate_blocker = "Acknowledge the launch briefing in your inbox before continuing the day."
	first_week_pressure = "Once the briefing is acknowledged, you can work through the launch in any order, but buying the first car is still the big step."


func _build_startup_marketplace_listings(repo: RefCounted, world: WorldStateScr) -> Array:
	var championship_id := _primary_championship_id_from_world(world)
	var preferred_series_label: String = _championship_display_name(repo, championship_id)
	var preferred_manufacturers: Array = []
	if career_effects.has("worldgen") and career_effects["worldgen"] is Dictionary:
		preferred_manufacturers = (career_effects["worldgen"] as Dictionary).get("preferred_manufacturer_ids", [])

	var raw_rows: Array = _generated_car_class_rows()
	var listings: Array = []
	for row_v: Variant in raw_rows:
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v
		var car_class_id := str(row.get("car_class_id", ""))
		if car_class_id.is_empty():
			car_class_id = str(row.get("id", ""))
		if car_class_id.is_empty():
			continue
		var car_class: Variant = repo.get_car_class(car_class_id)
		if not car_class is Dictionary:
			continue
		var car_class_dict: Dictionary = car_class as Dictionary
		if not bool(car_class_dict.get("is_modern", false)):
			continue
		var series_labels: Array = _series_labels_for_car_class(repo, car_class_id)
		if series_labels.is_empty():
			continue
		if _marketplace_livery_candidates_for_class(car_class_id).is_empty():
			continue
		var target_series_eligible: bool = preferred_series_label == "Open Market" or series_labels.has(preferred_series_label)
		var class_seed: int = abs(hash("%s|%s" % [persisted_world_seed, car_class_id]))
		var new_count: int = 2 if int(class_seed % 10) < 3 else 1
		var used_count: int = int(class_seed % 4)
		var auction_count: int = 1 if int(class_seed % 4) == 0 else 0
		for listing_index in range(new_count):
			var listing: Dictionary = _build_marketplace_listing(
				repo,
				car_class_id,
				series_labels,
				preferred_series_label,
				target_series_eligible,
				"new",
				listing_index
			)
			if not listing.is_empty():
				listings.append(listing)
		for listing_index in range(used_count):
			var listing: Dictionary = _build_marketplace_listing(
				repo,
				car_class_id,
				series_labels,
				preferred_series_label,
				target_series_eligible,
				"used",
				listing_index
			)
			if not listing.is_empty():
				listings.append(listing)
		for listing_index in range(auction_count):
			var listing: Dictionary = _build_marketplace_listing(
				repo,
				car_class_id,
				series_labels,
				preferred_series_label,
				target_series_eligible,
				"auction",
				listing_index
			)
			if not listing.is_empty():
				listings.append(listing)
	if listings.is_empty():
		return listings
	listings.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_target := bool(a.get("target_series_eligible", false))
		var b_target := bool(b.get("target_series_eligible", false))
		if a_target != b_target:
			return a_target
		var a_pref := preferred_manufacturers.has(str(a.get("manufacturer_id", "")))
		var b_pref := preferred_manufacturers.has(str(b.get("manufacturer_id", "")))
		if a_pref != b_pref:
			return a_pref
		return float(a.get("price", 0.0)) < float(b.get("price", 0.0))
	)
	return listings


# --- Ongoing marketplace inventory -------------------------------------------

func _refresh_marketplace_inventory() -> void:
	# Only churn the market once the launch car is secured; before that the curated
	# startup pool stays stable so the opening flow is predictable.
	if not startup_car_purchased:
		return
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return
	if current_week == _last_market_refresh_week:
		return
	_last_market_refresh_week = current_week
	var repo: RefCounted = _content_repository()
	if repo == null:
		return
	var world: WorldStateScr = _runtime_world as WorldStateScr
	_prune_marketplace_inventory()
	_top_up_marketplace_inventory(repo, world)


func _prune_marketplace_inventory() -> void:
	# Drop stale, untouched fixed listings (TTL) and resolved auction lots.
	for index in range(marketplace_listings.size() - 1, -1, -1):
		var listing_variant: Variant = marketplace_listings[index]
		if typeof(listing_variant) != TYPE_DICTIONARY:
			marketplace_listings.remove_at(index)
			continue
		var listing: Dictionary = listing_variant as Dictionary
		var market_type := str(listing.get("market_type", ""))
		if market_type == "auction":
			var status := str(listing.get("auction", {}).get("status", "open")) if listing.get("auction", {}) is Dictionary else "open"
			if status in ["sold", "unsold", "won"]:
				_auction_release_listing(listing)
				marketplace_listings.remove_at(index)
			continue
		if _listing_is_player_involved(listing):
			continue
		var listing_week := int(listing.get("listing_week", 0))
		if listing_week > 0 and (current_week - listing_week) > MARKET_LISTING_TTL_WEEKS:
			marketplace_listings.remove_at(index)
	# Hard cap on total fixed listings (oldest untouched first).
	var fixed_indices: Array = []
	for index in range(marketplace_listings.size()):
		var listing_variant: Variant = marketplace_listings[index]
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("market_type", "")) == "auction":
			continue
		if _listing_is_player_involved(listing):
			continue
		if int(listing.get("listing_week", 0)) <= 0:
			continue
		fixed_indices.append(index)
	if marketplace_listings.size() <= MARKET_MAX_TOTAL:
		return
	fixed_indices.sort_custom(func(a: int, b: int) -> bool:
		return int((marketplace_listings[a] as Dictionary).get("listing_week", 0)) < int((marketplace_listings[b] as Dictionary).get("listing_week", 0))
	)
	var to_remove: int = marketplace_listings.size() - MARKET_MAX_TOTAL
	var remove_positions: Array = fixed_indices.slice(0, min(to_remove, fixed_indices.size()))
	remove_positions.sort()
	remove_positions.reverse()
	for pos_variant in remove_positions:
		marketplace_listings.remove_at(int(pos_variant))


func _top_up_marketplace_inventory(repo: RefCounted, world: WorldStateScr) -> void:
	var total := marketplace_listings.size()
	var auctions := _count_listings_by_type("auction")
	var serial := 0
	while auctions < MARKET_TARGET_AUCTIONS and total < MARKET_MAX_TOTAL:
		var lot := _spawn_market_listing(repo, world, "auction", serial)
		serial += 1
		if lot.is_empty():
			break
		marketplace_listings.append(lot)
		auctions += 1
		total += 1
	while total < MARKET_TARGET_TOTAL:
		var market_type := "used" if (serial % 3 == 0) else "new"
		var listing := _spawn_market_listing(repo, world, market_type, serial)
		serial += 1
		if listing.is_empty():
			break
		marketplace_listings.append(listing)
		total += 1


func _count_listings_by_type(market_type: String) -> int:
	var count := 0
	for listing_variant in marketplace_listings:
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		if str((listing_variant as Dictionary).get("market_type", "")) == market_type:
			count += 1
	return count


func _spawn_market_listing(repo: RefCounted, world: WorldStateScr, market_type: String, serial: int) -> Dictionary:
	var class_ids := _eligible_market_car_class_ids(repo)
	if class_ids.is_empty():
		return {}
	var pick_seed: int = abs(hash("%s|mkt|%d|%d|%s" % [persisted_world_seed, current_week, serial, market_type]))
	var car_class_id := str(class_ids[pick_seed % class_ids.size()])
	var series_labels: Array = _series_labels_for_car_class(repo, car_class_id)
	if series_labels.is_empty():
		return {}
	var preferred_series_label := _championship_display_name(repo, _primary_championship_id_from_world(world))
	var target_series_eligible: bool = preferred_series_label == "Open Market" or series_labels.has(preferred_series_label)
	var variation_index: int = current_week * 13 + serial
	var listing := _build_marketplace_listing(
		repo,
		car_class_id,
		series_labels,
		preferred_series_label,
		target_series_eligible,
		market_type,
		variation_index
	)
	if listing.is_empty():
		return {}
	listing["id"] = "listing_mkt_w%d_%d" % [current_week, serial]
	listing["listing_week"] = current_week
	if market_type == "auction":
		listing = _initialize_auction_lot(repo, world, listing, pick_seed)
	return listing


func _eligible_market_car_class_ids(repo: RefCounted) -> Array:
	if not _eligible_market_class_cache.is_empty():
		return _eligible_market_class_cache
	if repo == null:
		return []
	var ids: Array = []
	for row_v: Variant in _generated_car_class_rows():
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v
		var car_class_id := str(row.get("car_class_id", row.get("id", "")))
		if car_class_id.is_empty():
			continue
		var car_class: Variant = repo.get_car_class(car_class_id)
		if not car_class is Dictionary:
			continue
		if not bool((car_class as Dictionary).get("is_modern", false)):
			continue
		if _series_labels_for_car_class(repo, car_class_id).is_empty():
			continue
		if _marketplace_livery_candidates_for_class(car_class_id).is_empty():
			continue
		ids.append(car_class_id)
	_eligible_market_class_cache = ids
	return ids


func _listing_is_player_involved(listing: Dictionary) -> bool:
	var auction: Variant = listing.get("auction", {})
	if auction is Dictionary:
		if float((auction as Dictionary).get("player_escrow_held", 0.0)) > 0.0:
			return true
		if float((auction as Dictionary).get("player_proxy_max", 0.0)) > 0.0:
			return true
	return auction_watchlist.has(str(listing.get("id", "")))


# --- Auction lifecycle -------------------------------------------------------

func _initialize_auction_lot(repo: RefCounted, world: WorldStateScr, listing: Dictionary, seed: int) -> Dictionary:
	var base_value: float = maxf(1000.0, float(listing.get("price", 0.0)))
	var open_abs_day := _current_unix_day()
	var duration_weeks: int = AUCTION_MIN_DURATION_WEEKS + int(seed % (AUCTION_MAX_DURATION_WEEKS - AUCTION_MIN_DURATION_WEEKS + 1))
	var close_abs_day := open_abs_day + duration_weeks * 7
	var min_increment := _auction_min_increment(base_value)
	var opening_bid := _round_to_increment(base_value * (0.45 + float(seed % 16) / 100.0), min_increment)
	var reserve_price := _round_to_increment(base_value * (0.86 + float((seed / 7) % 12) / 100.0), min_increment)
	var rivals := _auction_rivals_from_field(repo, world, listing, base_value, seed)
	listing["auction"] = {
		"status": "open",
		"open_week": current_week,
		"close_week": current_week + duration_weeks,
		"close_day": 1,
		"open_abs_day": open_abs_day,
		"close_abs_day": close_abs_day,
		"reserve_price": reserve_price,
		"reserve_met": false,
		"current_bid": opening_bid,
		"min_increment": min_increment,
		"high_bidder_id": "",
		"high_bidder_name": "",
		"bid_count": 0,
		"bid_history": [],
		"player_proxy_max": 0.0,
		"player_escrow_held": 0.0,
		"rival_bidders": rivals,
		"buyer_premium_pct": _auction_buyer_premium_pct(base_value),
		"anti_snipe_days": AUCTION_ANTI_SNIPE_DAYS,
	}
	# Keep top-level bid mirrors in sync for legacy UI fields.
	listing["current_bid"] = opening_bid
	listing["minimum_bid"] = opening_bid
	listing["bid_count"] = 0
	return listing


func _auction_min_increment(base_value: float) -> float:
	return maxf(500.0, _round_to_increment(base_value * 0.02, 500.0))


func _round_to_increment(value: float, increment: float) -> float:
	if increment <= 0.0:
		return round(value)
	return round(value / increment) * increment


func _auction_buyer_premium_pct(value: float) -> float:
	# Scaled premium: heavier on cheap lots, lighter on expensive ones.
	if value <= 150000.0:
		return 0.10
	if value <= 400000.0:
		return 0.08
	if value <= 1000000.0:
		return 0.06
	return 0.04


func _auction_rivals_from_field(repo: RefCounted, world: WorldStateScr, listing: Dictionary, base_value: float, seed: int) -> Array:
	var rivals: Array = []
	if world == null:
		return rivals
	var candidate_teams: Array = []
	for team_variant in world.teams.values():
		if not team_variant is TeamStateScr:
			continue
		var team: TeamStateScr = team_variant as TeamStateScr
		if team.instance_id == world.player_team_instance_id:
			continue
		candidate_teams.append(team)
	if candidate_teams.is_empty():
		return rivals
	candidate_teams.sort_custom(func(a: TeamStateScr, b: TeamStateScr) -> bool:
		return a.instance_id < b.instance_id
	)
	var rival_count: int = min(AUCTION_TARGET_RIVALS, candidate_teams.size())
	# Deterministic rotating start offset so different lots draw different teams.
	var start_offset: int = seed % candidate_teams.size()
	for i in range(rival_count):
		var team: TeamStateScr = candidate_teams[(start_offset + i) % candidate_teams.size()]
		var rival_seed: int = abs(hash("%s|rival|%s|%d" % [persisted_world_seed, team.instance_id, seed]))
		var budget_factor := 1.0
		if world.budgets.has(team.budget_instance_id):
			var rival_budget: BudgetStateScr = world.budgets[team.budget_instance_id] as BudgetStateScr
			if rival_budget != null:
				budget_factor = clampf(rival_budget.cash / maxf(base_value * 2.0, 1.0), 0.55, 1.25)
		var valuation_factor := 0.82 + float(rival_seed % 30) / 100.0
		var valuation := base_value * valuation_factor * budget_factor
		var aggression := clampf(0.32 + float((rival_seed / 11) % 55) / 100.0, 0.3, 0.92)
		var rival_name := str(team.display_name).strip_edges()
		if rival_name.is_empty():
			rival_name = "Rival Team %d" % (i + 1)
		rivals.append({
			"id": team.instance_id,
			"name": rival_name,
			"valuation": valuation,
			"aggression": aggression,
		})
	return rivals


func get_active_auction_lots() -> Array:
	var lots: Array = []
	for listing_variant in marketplace_listings:
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("market_type", "")) != "auction":
			continue
		var block: Variant = listing.get("auction", {})
		if not block is Dictionary or (block as Dictionary).is_empty():
			continue
		if str((block as Dictionary).get("status", "open")) in ["open", "closing"]:
			lots.append(_sanitize_marketplace_listings([listing])[0])
	return lots


func _auction_min_next_bid(block: Dictionary) -> float:
	var current_bid := float(block.get("current_bid", 0.0))
	var increment := float(block.get("min_increment", 1000.0))
	if int(block.get("bid_count", 0)) <= 0 and str(block.get("high_bidder_id", "")).is_empty():
		return current_bid
	return current_bid + increment


func place_auction_bid(listing_id: String, amount: float, proxy_max: float = 0.0) -> Dictionary:
	var listing := _find_marketplace_listing(listing_id)
	if listing.is_empty():
		return {"ok": false, "message": "That lot is no longer available."}
	if str(listing.get("market_type", "")) != "auction":
		return {"ok": false, "message": "That listing is not an auction."}
	if str(listing.get("seller", "")) == "player":
		return {"ok": false, "message": "You cannot bid on your own consigned lot."}
	var block: Variant = listing.get("auction", {})
	if not block is Dictionary or (block as Dictionary).is_empty():
		return {"ok": false, "message": "Auction data is unavailable for that lot."}
	var auction: Dictionary = block as Dictionary
	if str(auction.get("status", "open")) not in ["open", "closing"]:
		return {"ok": false, "message": "Bidding on that lot has closed."}
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active career world is loaded."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var budget: BudgetStateScr = _player_budget_from_world(world)
	if budget == null:
		return {"ok": false, "message": "Player finances are unavailable."}

	var min_next := _auction_min_next_bid(auction)
	var bid_amount := maxf(amount, min_next)
	var effective_max := maxf(proxy_max, bid_amount)
	var already_held := float(auction.get("player_escrow_held", 0.0))
	# Hold escrow up to the most the player has committed (proxy max). Only the
	# delta beyond what is already held is taken from cash now.
	var hold_target := effective_max
	var additional_hold := maxf(0.0, hold_target - already_held)
	if budget.cash < additional_hold:
		return {"ok": false, "message": "Not enough cash to cover that maximum bid."}

	budget.cash = maxf(0.0, budget.cash - additional_hold)
	budget.auction_escrow += additional_hold
	auction["player_escrow_held"] = hold_target
	auction["player_proxy_max"] = effective_max
	auction_watchlist[listing_id] = true

	_auction_register_bid(auction, _player_bidder_id(), _player_bidder_name(), bid_amount)
	# Let rivals respond immediately to the new standing bid.
	_auction_run_rival_round(auction, true)
	# Anti-snipe: a bid placed inside the protection window pushes the close out.
	var today := _current_unix_day()
	var close_abs_day := int(auction.get("close_abs_day", 0))
	var anti := int(auction.get("anti_snipe_days", AUCTION_ANTI_SNIPE_DAYS))
	if close_abs_day - today <= anti:
		auction["close_abs_day"] = today + anti + 1
		auction["close_week"] = current_week + 1
		auction["status"] = "open"
	_auction_sync_listing_mirror(listing, auction)
	listing["auction"] = auction
	_mark_world_derived_dirty()
	save_game()

	var leading := str(auction.get("high_bidder_id", "")) == _player_bidder_id()
	var msg := "Bid placed — you lead at %s." % _fmt_money_compact(float(auction.get("current_bid", 0.0)))
	if not leading:
		msg = "You were outbid — current bid is %s." % _fmt_money_compact(float(auction.get("current_bid", 0.0)))
	return {
		"ok": true,
		"message": msg,
		"leading": leading,
		"current_bid": float(auction.get("current_bid", 0.0)),
		"player_proxy_max": effective_max,
	}


func _player_bidder_id() -> String:
	return "player"


func _player_bidder_name() -> String:
	var name := ("%s %s" % [str(founder_first_name), str(founder_last_name)]).strip_edges()
	return name if not name.is_empty() else "Your Team"


func _auction_register_bid(auction: Dictionary, bidder_id: String, bidder_name: String, amount: float) -> void:
	auction["current_bid"] = amount
	auction["high_bidder_id"] = bidder_id
	auction["high_bidder_name"] = bidder_name
	auction["bid_count"] = int(auction.get("bid_count", 0)) + 1
	auction["reserve_met"] = amount >= float(auction.get("reserve_price", 0.0))
	var history: Array = auction.get("bid_history", [])
	history.append({
		"bidder_id": bidder_id,
		"bidder_name": bidder_name,
		"amount": amount,
		"week": current_week,
		"day": current_day_of_month,
	})
	if history.size() > 24:
		history = history.slice(history.size() - 24, history.size())
	auction["bid_history"] = history


func _auction_run_rival_round(auction: Dictionary, aggressive: bool) -> bool:
	# One escalation pass: rivals that still value the lot above the standing bid
	# will raise (and auto-outbid the player up to their valuation). Returns true
	# if any rival took the lead.
	var rivals: Array = auction.get("rival_bidders", [])
	if rivals.is_empty():
		return false
	var increment := float(auction.get("min_increment", 1000.0))
	var rival_took_lead := false
	var safety := 0
	while safety < 32:
		safety += 1
		var leader_id := str(auction.get("high_bidder_id", ""))
		var current_bid := float(auction.get("current_bid", 0.0))
		var best_rival: Dictionary = {}
		var best_valuation := 0.0
		for rival_variant in rivals:
			if not rival_variant is Dictionary:
				continue
			var rival: Dictionary = rival_variant as Dictionary
			if str(rival.get("id", "")) == leader_id:
				continue
			var valuation := float(rival.get("valuation", 0.0))
			if valuation < current_bid + increment:
				continue
			if valuation > best_valuation:
				best_valuation = valuation
				best_rival = rival
		if best_rival.is_empty():
			break
		# Aggression gates whether the rival bothers to respond this pass.
		var aggression := float(best_rival.get("aggression", 0.5))
		var response_chance := aggression if aggressive else aggression * 0.6
		var roll_seed: int = abs(hash("%s|round|%s|%d|%d" % [persisted_world_seed, str(best_rival.get("id", "")), current_week, int(auction.get("bid_count", 0))]))
		var roll := float(roll_seed % 100) / 100.0
		if roll > response_chance:
			break
		var next_bid := minf(best_valuation, current_bid + increment)
		next_bid = _round_to_increment(next_bid, increment)
		if next_bid <= current_bid:
			break
		_auction_register_bid(auction, str(best_rival.get("id", "")), str(best_rival.get("name", "Rival")), next_bid)
		rival_took_lead = true
		# Player proxy auto-raises to defend the lead, up to the proxy max.
		var proxy_max := float(auction.get("player_proxy_max", 0.0))
		if proxy_max > 0.0 and str(auction.get("high_bidder_id", "")) != _player_bidder_id():
			var defend := float(auction.get("current_bid", 0.0)) + increment
			if defend <= proxy_max:
				defend = _round_to_increment(defend, increment)
				_auction_register_bid(auction, _player_bidder_id(), _player_bidder_name(), defend)
				rival_took_lead = false
	return rival_took_lead


func _auction_sync_listing_mirror(listing: Dictionary, auction: Dictionary) -> void:
	listing["current_bid"] = float(auction.get("current_bid", 0.0))
	listing["minimum_bid"] = _auction_min_next_bid(auction)
	listing["bid_count"] = int(auction.get("bid_count", 0))
	listing["price_label"] = _fmt_money_compact(float(auction.get("current_bid", 0.0)))


func _tick_auctions() -> void:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return
	var repo: RefCounted = _content_repository()
	if repo == null:
		return
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var today := _current_unix_day()
	for index in range(marketplace_listings.size()):
		var listing_variant: Variant = marketplace_listings[index]
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant as Dictionary
		if str(listing.get("market_type", "")) != "auction":
			continue
		var block: Variant = listing.get("auction", {})
		if not block is Dictionary or (block as Dictionary).is_empty():
			continue
		var auction: Dictionary = block as Dictionary
		var status := str(auction.get("status", "open"))
		if status not in ["open", "closing"]:
			continue
		var player_was_leading := str(auction.get("high_bidder_id", "")) == _player_bidder_id()
		# Daily rival escalation pass.
		_auction_run_rival_round(auction, false)
		var player_now_leading := str(auction.get("high_bidder_id", "")) == _player_bidder_id()
		if player_was_leading and not player_now_leading and float(auction.get("player_escrow_held", 0.0)) > 0.0:
			_append_mail_once(_auction_outbid_mail(listing, auction))
		var close_abs_day := int(auction.get("close_abs_day", 0))
		var anti_snipe_days := int(auction.get("anti_snipe_days", AUCTION_ANTI_SNIPE_DAYS))
		if today >= close_abs_day - anti_snipe_days and today < close_abs_day:
			auction["status"] = "closing"
		_auction_sync_listing_mirror(listing, auction)
		if today >= close_abs_day:
			_resolve_auction(repo, world, listing, auction)
		listing["auction"] = auction
		marketplace_listings[index] = listing


func _resolve_auction(repo: RefCounted, world: WorldStateScr, listing: Dictionary, auction: Dictionary) -> void:
	if str(listing.get("seller", "")) == "player":
		_resolve_seller_auction(world, listing, auction)
		return
	var high_bidder := str(auction.get("high_bidder_id", ""))
	var winning_bid := float(auction.get("current_bid", 0.0))
	var reserve_met := winning_bid >= float(auction.get("reserve_price", 0.0))
	var budget: BudgetStateScr = _player_budget_from_world(world)
	var player_escrow := float(auction.get("player_escrow_held", 0.0))

	if not reserve_met or high_bidder.is_empty():
		# Unsold: release any player escrow.
		if player_escrow > 0.0 and budget != null:
			budget.auction_escrow = maxf(0.0, budget.auction_escrow - player_escrow)
			budget.cash += player_escrow
			_append_mail_once(_auction_unsold_mail(listing, auction))
		auction["status"] = "unsold"
		auction["player_escrow_held"] = 0.0
		auction["player_proxy_max"] = 0.0
		auction_watchlist.erase(str(listing.get("id", "")))
		return

	if high_bidder == _player_bidder_id():
		# Player wins: charge winning bid + scaled buyer's premium from escrow/cash.
		var premium: float = round(winning_bid * float(auction.get("buyer_premium_pct", 0.05)))
		var total_cost: float = winning_bid + premium
		if budget != null:
			# Release held escrow back to cash, then charge the real total.
			budget.auction_escrow = maxf(0.0, budget.auction_escrow - player_escrow)
			budget.cash += player_escrow
			budget.cash = maxf(0.0, budget.cash - total_cost)
		var team: TeamStateScr = _player_team_from_world(world)
		if team != null:
			if not startup_car_purchased:
				_replace_player_launch_car(world, team, listing)
				startup_car_purchased = true
				startup_last_purchase_listing_id = str(listing.get("id", ""))
				current_car_image_path = str(listing.get("image_path", DEFAULT_CAR_IMAGE_PATH))
				player_car_class_name = str(listing.get("class_name", player_car_class_name))
				player_car_manufacturer = str(listing.get("car_filter", player_car_manufacturer))
				_mark_launch_market_mail_resolved()
				_activate_series_entry_mail()
			else:
				_add_purchased_car(world, team, listing)
			_ensure_player_car_display_names(world)
		auction["status"] = "won"
		auction["player_escrow_held"] = 0.0
		auction["player_proxy_max"] = 0.0
		auction_watchlist.erase(str(listing.get("id", "")))
		_append_mail_once(_auction_won_mail(listing, auction, winning_bid, premium))
		_mark_world_derived_dirty()
		_ensure_world_derived_summaries(true)
	else:
		# Sold to a rival: release player escrow.
		if player_escrow > 0.0 and budget != null:
			budget.auction_escrow = maxf(0.0, budget.auction_escrow - player_escrow)
			budget.cash += player_escrow
			_append_mail_once(_auction_lost_mail(listing, auction, winning_bid))
		auction["status"] = "sold"
		auction["player_escrow_held"] = 0.0
		auction["player_proxy_max"] = 0.0
		auction_watchlist.erase(str(listing.get("id", "")))


func _auction_release_listing(listing: Dictionary) -> void:
	# Safety: if a player-involved lot is pruned, release its escrow.
	var block: Variant = listing.get("auction", {})
	if not block is Dictionary:
		return
	var auction: Dictionary = block as Dictionary
	var player_escrow := float(auction.get("player_escrow_held", 0.0))
	if player_escrow <= 0.0:
		return
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return
	var budget: BudgetStateScr = _player_budget_from_world(_runtime_world as WorldStateScr)
	if budget != null:
		budget.auction_escrow = maxf(0.0, budget.auction_escrow - player_escrow)
		budget.cash += player_escrow
	auction["player_escrow_held"] = 0.0
	auction_watchlist.erase(str(listing.get("id", "")))


# --- Seller side (player consigns a car to auction) --------------------------

const SELLER_AUCTION_COMMISSION_PCT := 0.05


## Whether a car is currently entered in a championship (and so cannot be sold).
func _car_assigned_to_entry(world: WorldStateScr, car_instance_id: String) -> bool:
	if world == null:
		return false
	for entry_variant: Variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var entry: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if entry != null and entry.car_instance_id == car_instance_id:
			return true
	return false


## Rough resale value for an owned car, anchored on its class base price and
## scaled down by wear/condition.
func _estimate_owned_car_value(world: WorldStateScr, repo: RefCounted, car: CarStateScr) -> float:
	var value := 250000.0
	if repo != null and car != null:
		var platform: Variant = repo.get_car_platform(car.car_platform_id)
		if platform is Dictionary:
			var ccid := str((platform as Dictionary).get("car_class_id", ""))
			var cc: Variant = repo.get_car_class(ccid)
			if cc is Dictionary:
				value = _marketplace_base_price(_marketplace_class_profile(cc as Dictionary))
	var condition := _car_average_condition(world, car)
	return maxf(20000.0, value * (0.55 + 0.45 * condition))


## Consign an owned car to the auction house. Creates a seller-flagged auction
## lot that rivals bid on through the normal per-day tick.
func list_owned_car_for_auction(car_instance_id: String, reserve_price: float = -1.0) -> Dictionary:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return {"ok": false, "message": "No active world is loaded."}
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var repo: RefCounted = _content_repository()
	if repo == null:
		return {"ok": false, "message": "Content repository failed to load."}
	var team: TeamStateScr = _player_team_from_world(world)
	if team == null:
		return {"ok": false, "message": "No player team is available."}
	if not world.cars.has(car_instance_id):
		return {"ok": false, "message": "That car is not in your garage."}
	var owns := false
	for owned_id: String in team.car_instance_ids:
		if str(owned_id) == car_instance_id:
			owns = true
			break
	if not owns:
		return {"ok": false, "message": "That car is not in your garage."}
	if team.car_instance_ids.size() <= 1:
		return {"ok": false, "message": "You must keep at least one car. Buy another before selling this one."}
	if _car_assigned_to_entry(world, car_instance_id):
		return {"ok": false, "message": "This car is entered in a championship. Withdraw the entry before selling it."}
	for listing_variant: Variant in marketplace_listings:
		if not listing_variant is Dictionary:
			continue
		var existing: Dictionary = listing_variant as Dictionary
		if str(existing.get("seller_car_instance_id", "")) == car_instance_id:
			var blk: Variant = existing.get("auction", {})
			if blk is Dictionary and str((blk as Dictionary).get("status", "")) in ["open", "closing"]:
				return {"ok": false, "message": "This car is already listed at auction."}

	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	var est_value := _estimate_owned_car_value(world, repo, car)
	var condition := _car_average_condition(world, car)
	var class_label := ""
	var manufacturer_label := ""
	var manufacturer_id := ""
	var car_class_id := ""
	var platform: Variant = repo.get_car_platform(car.car_platform_id)
	if platform is Dictionary:
		car_class_id = str((platform as Dictionary).get("car_class_id", ""))
		manufacturer_id = str((platform as Dictionary).get("manufacturer_id", ""))
		if not car_class_id.is_empty():
			class_label = _car_class_display_name(repo, car_class_id)
		if not manufacturer_id.is_empty():
			manufacturer_label = _manufacturer_display_name(repo, manufacturer_id)
	var livery_name := str(car.display_name).strip_edges()
	if livery_name.is_empty():
		livery_name = class_label if not class_label.is_empty() else "Owned Car"
	var image_path := _owned_car_image_path(car_class_id, livery_name)
	var hero_lines: Array = livery_name.to_upper().split(" ")
	var listing: Dictionary = {
		"id": "listing_sell_%s_w%d" % [car_instance_id, current_week],
		"market_type": "auction",
		"seller": "player",
		"seller_car_instance_id": car_instance_id,
		"class_name": class_label,
		"car_filter": manufacturer_label,
		"manufacturer_name": manufacturer_label,
		"manufacturer_id": manufacturer_id,
		"car_class_id": car_class_id,
		"car_platform_id": car.car_platform_id,
		"hero_title": "\n".join(hero_lines.slice(0, min(hero_lines.size(), 3))),
		"card_title": livery_name.to_upper(),
		"livery_name": livery_name,
		"condition": _condition_label_from_ratio(condition),
		"price": est_value,
		"image_path": image_path,
		"eligible_series_labels": _series_labels_for_car_class(repo, car_class_id),
		"listing_week": current_week,
	}
	var seed: int = abs(hash("%s|sell|%d" % [car_instance_id, current_week]))
	listing = _initialize_auction_lot(repo, world, listing, seed)
	listing["seller"] = "player"
	listing["seller_car_instance_id"] = car_instance_id
	var auction: Dictionary = listing.get("auction", {})
	if reserve_price > 0.0:
		var min_increment := float(auction.get("min_increment", _auction_min_increment(est_value)))
		auction["reserve_price"] = _round_to_increment(reserve_price, min_increment)
		listing["auction"] = auction
	marketplace_listings.append(listing)
	auction_watchlist[str(listing.get("id", ""))] = true
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)
	save_game()
	return {
		"ok": true,
		"listing_id": str(listing.get("id", "")),
		"reserve_price": float(auction.get("reserve_price", 0.0)),
		"message": "Your %s is now live at auction." % livery_name,
	}


## Best-effort livery art for an owned car, matched by class + livery name.
func _owned_car_image_path(car_class_id: String, livery_name: String) -> String:
	if car_class_id.is_empty():
		return DEFAULT_CAR_IMAGE_PATH
	var candidates: Array = _marketplace_livery_candidates_for_class(car_class_id)
	var lname := livery_name.to_lower().strip_edges()
	for candidate_variant: Variant in candidates:
		if not candidate_variant is Dictionary:
			continue
		var candidate: Dictionary = candidate_variant as Dictionary
		if str(candidate.get("name", "")).to_lower().strip_edges() == lname:
			var path := str(candidate.get("path", "")).strip_edges()
			if not path.is_empty():
				return path
	if candidates.size() > 0 and candidates[0] is Dictionary:
		var first_path := str((candidates[0] as Dictionary).get("path", "")).strip_edges()
		if not first_path.is_empty():
			return first_path
	return DEFAULT_CAR_IMAGE_PATH


## Resolve a player-consigned lot at close: pay out (minus commission) on a sale
## and remove the car, or leave it in the garage if reserve was not met.
func _resolve_seller_auction(world: WorldStateScr, listing: Dictionary, auction: Dictionary) -> void:
	var listing_id := str(listing.get("id", ""))
	var high_bidder := str(auction.get("high_bidder_id", ""))
	var winning_bid := float(auction.get("current_bid", 0.0))
	var reserve_met := winning_bid >= float(auction.get("reserve_price", 0.0))
	var car_id := str(listing.get("seller_car_instance_id", ""))
	if not reserve_met or high_bidder.is_empty():
		auction["status"] = "unsold"
		auction_watchlist.erase(listing_id)
		_append_mail_once(_seller_auction_unsold_mail(listing, auction))
		return
	var commission: float = roundf(winning_bid * SELLER_AUCTION_COMMISSION_PCT)
	var net: float = maxf(0.0, winning_bid - commission)
	var budget: BudgetStateScr = _player_budget_from_world(world)
	if budget != null:
		budget.cash += net
	_remove_player_car(world, car_id)
	auction["status"] = "sold"
	auction_watchlist.erase(listing_id)
	_append_mail_once(_seller_auction_sold_mail(listing, auction, winning_bid, commission, net))
	_mark_world_derived_dirty()
	_ensure_world_derived_summaries(true)


## Remove an owned car (and its installed parts) from the world.
func _remove_player_car(world: WorldStateScr, car_id: String) -> void:
	if world == null or car_id.is_empty():
		return
	var team: TeamStateScr = _player_team_from_world(world)
	if team != null:
		var ids: Array = []
		for existing_id: String in team.car_instance_ids:
			if str(existing_id) != car_id:
				ids.append(str(existing_id))
		team.car_instance_ids = PackedStringArray(ids)
	if world.cars.has(car_id):
		var car: CarStateScr = world.cars[car_id] as CarStateScr
		if car != null:
			for slot_variant: Variant in car.installed_part_instance_ids.keys():
				var pid := str(car.installed_part_instance_ids[slot_variant])
				if world.parts.has(pid):
					world.parts.erase(pid)
		world.cars.erase(car_id)


func _build_marketplace_listing(
	repo: RefCounted,
	car_class_id: String,
	series_labels: Array,
	preferred_series_label: String,
	target_series_eligible: bool,
	market_type: String,
	listing_index: int
) -> Dictionary:
	var car_class: Variant = repo.get_car_class(car_class_id)
	if not car_class is Dictionary:
		return {}
	var car_class_dict: Dictionary = car_class as Dictionary
	var car_class_name: String = str(car_class_dict.get("display_name", _car_class_display_name(repo, car_class_id)))
	var platform_dict: Dictionary = _pick_marketplace_platform(repo, car_class_id, market_type, listing_index)
	var platform_id: String = str(platform_dict.get("id", ""))
	var display_name: String = str(platform_dict.get("display_name", car_class_name))
	var manufacturer_id: String = str(platform_dict.get("manufacturer_id", ""))
	var manufacturer_name: String = _manufacturer_display_name(repo, manufacturer_id)
	var profile: Dictionary = _marketplace_class_profile(car_class_dict)
	var seed_basis := "%s|%s|%s|%d" % [persisted_world_seed, car_class_id, market_type, listing_index]
	var score_seed: int = abs(hash(seed_basis))
	var preferred_bonus: float = 0.04 if bool(target_series_eligible) else 0.0
	var part_wear: Dictionary = _marketplace_part_wear(score_seed, market_type)
	var condition: String = _marketplace_condition_from_wear(part_wear)
	var mileage: int = _marketplace_mileage(score_seed, market_type, condition)
	var service_history: Array = _marketplace_service_history(score_seed, mileage, market_type)
	var installed_upgrades: Array = _marketplace_upgrades(score_seed, car_class_name, market_type)
	var provenance: Dictionary = _marketplace_provenance(score_seed, car_class_name, market_type)
	var base_price: float = _marketplace_base_price(profile)
	var pricing: Dictionary = _marketplace_pricing(base_price, market_type, part_wear, mileage, service_history, provenance, installed_upgrades, score_seed)
	var current_price: float = float(pricing.get("final_price", base_price))
	var performance: int = _marketplace_performance(score_seed, part_wear, installed_upgrades, market_type)
	var reliability: int = _marketplace_reliability(part_wear)
	var display_metrics: Dictionary = _marketplace_display_metrics(
		car_class_dict,
		profile,
		part_wear,
		installed_upgrades,
		performance,
		reliability,
		current_price,
		market_type,
		score_seed,
		target_series_eligible
	)
	var livery: Dictionary = _pick_marketplace_livery(car_class_id, display_name, score_seed)
	var livery_name: String = str(livery.get("name", display_name))
	var image_path: String = str(livery.get("path", DEFAULT_CAR_IMAGE_PATH))
	platform_dict = _resolve_marketplace_platform_for_livery(repo, car_class_id, livery_name, platform_dict)
	platform_id = str(platform_dict.get("id", platform_id))
	display_name = str(platform_dict.get("display_name", display_name))
	manufacturer_id = str(platform_dict.get("manufacturer_id", manufacturer_id))
	manufacturer_name = _manufacturer_display_name(repo, manufacturer_id)
	var hero_lines: Array = livery_name.to_upper().split(" ")
	var hero_title: String = "\n".join(hero_lines.slice(0, min(hero_lines.size(), 3)))
	var min_bid: float = maxf(1000.0, round(current_price * 0.7))
	var current_bid: float = min_bid + float((score_seed % 5) * 2500)
	if market_type != "auction":
		min_bid = current_price
		current_bid = current_price
	var series_fit_label: String = _marketplace_series_fit_label(preferred_series_label, series_labels, target_series_eligible)
	return {
		"id": "listing_%s_%s_%d" % [car_class_id.replace(".", "_"), market_type, listing_index],
		"market_type": market_type,
		"class_name": car_class_name,
		"car_filter": manufacturer_name,
		"manufacturer_name": manufacturer_name,
		"series_filter_label": series_fit_label,
		"eligible_series_labels": series_labels,
		"hero_title": hero_title,
		"card_title": livery_name.to_upper(),
		"livery_name": livery_name,
		"price_label": _fmt_money_compact(current_bid if market_type == "auction" else current_price),
		"price": current_price,
		"pace": float(display_metrics.get("pace", 0.75)),
		"driveability": float(display_metrics.get("driveability", 0.75)),
		"reliability_rating": float(display_metrics.get("reliability_rating", clampf(float(reliability) / 100.0, 0.4, 0.95))),
		"operating_cost": float(display_metrics.get("operating_cost", 0.5)),
		"acc": float(display_metrics.get("pace", 0.75)),
		"top_speed": float(display_metrics.get("pace", 0.75)),
		"braking": float(display_metrics.get("reliability_rating", clampf(float(reliability) / 100.0, 0.4, 0.95))),
		"handling": float(display_metrics.get("driveability", 0.75)),
		"condition": condition,
		"performance": performance,
		"reliability": reliability,
		"mileage": mileage,
		"part_wear": part_wear,
		"service_history": service_history,
		"installed_upgrades": installed_upgrades,
		"price_breakdown": {
			"base": int(round(base_price)),
			"wearDiscount": int(round(float(pricing.get("wear_discount", 0.0)))),
			"mileageDiscount": int(round(float(pricing.get("mileage_discount", 0.0)))),
			"serviceBonus": int(round(float(pricing.get("service_bonus", 0.0)))),
			"provenanceBonus": int(round(float(pricing.get("provenance_bonus", 0.0)))),
			"upgradeValue": int(round(float(pricing.get("upgrade_value", 0.0)))),
			"marketDemand": int(round(float(pricing.get("market_demand", 0.0)))),
		},
		"provenance": provenance,
		"current_bid": current_bid,
		"minimum_bid": min_bid,
		"bid_count": int(score_seed % 6) if market_type == "auction" else 0,
		"image_path": image_path,
		"car_platform_id": platform_id,
		"team_archetype_id": _team_archetype_id_for_platform(platform_id) if not platform_id.is_empty() else "",
		"manufacturer_id": manufacturer_id,
		"car_class_id": car_class_id,
		"target_series_eligible": target_series_eligible,
	}


func _pick_marketplace_livery(car_class_id: String, fallback_name: String, score_seed: int) -> Dictionary:
	var candidates: Array = _marketplace_livery_candidates_for_class(car_class_id)
	if candidates.is_empty():
		return {
			"name": fallback_name,
			"path": DEFAULT_CAR_IMAGE_PATH,
		}
	var index: int = posmod(score_seed, candidates.size())
	var selected_variant: Variant = candidates[index]
	if typeof(selected_variant) != TYPE_DICTIONARY:
		return {
			"name": fallback_name,
			"path": DEFAULT_CAR_IMAGE_PATH,
		}
	var selected: Dictionary = selected_variant as Dictionary
	var livery_name: String = str(selected.get("name", fallback_name))
	var image_path: String = str(selected.get("path", DEFAULT_CAR_IMAGE_PATH))
	if image_path.strip_edges() == "":
		image_path = DEFAULT_CAR_IMAGE_PATH
	return {
		"name": livery_name,
		"path": image_path,
	}


func _marketplace_livery_candidates_for_class(car_class_id: String) -> Array:
	var manifest: Dictionary = _load_marketplace_livery_manifest()
	var records_variant: Variant = manifest.get("records", {})
	if typeof(records_variant) != TYPE_DICTIONARY:
		return []
	var records: Dictionary = records_variant as Dictionary
	var class_variant: Variant = records.get(car_class_id, [])
	if typeof(class_variant) != TYPE_ARRAY:
		return []
	var candidates: Array = []
	for item_variant in class_variant as Array:
		if typeof(item_variant) != TYPE_DICTIONARY:
			continue
		var item: Dictionary = item_variant as Dictionary
		var image_path: String = str(item.get("path", "")).strip_edges()
		if image_path == "":
			continue
		candidates.append(
			{
				"name": str(item.get("name", "")),
				"path": image_path,
			}
		)
	return candidates


func _marketplace_livery_name_for_image_path(car_class_id: String, image_path: String) -> String:
	var normalized_path: String = image_path.strip_edges()
	if normalized_path.is_empty():
		return ""
	var target_file := normalized_path.get_file().to_lower()
	if target_file.is_empty():
		return ""
	var manifest: Dictionary = _load_marketplace_livery_manifest()
	var records_variant: Variant = manifest.get("records", {})
	if typeof(records_variant) != TYPE_DICTIONARY:
		return ""
	var records: Dictionary = records_variant as Dictionary
	var search_keys: Array = []
	if not car_class_id.is_empty():
		search_keys.append(car_class_id)
	for key_variant in records.keys():
		if search_keys.has(key_variant):
			continue
		search_keys.append(key_variant)
	for key_variant in search_keys:
		var class_variant: Variant = records.get(key_variant, [])
		if typeof(class_variant) != TYPE_ARRAY:
			continue
		for item_variant in class_variant as Array:
			if typeof(item_variant) != TYPE_DICTIONARY:
				continue
			var item: Dictionary = item_variant as Dictionary
			var candidate_path := str(item.get("path", "")).strip_edges()
			if candidate_path.is_empty():
				continue
			var candidate_file := candidate_path.get_file().to_lower()
			if candidate_file != target_file:
				continue
			return str(item.get("name", "")).strip_edges()
	return ""


func _ensure_player_car_display_names(world: WorldStateScr) -> void:
	var team := _player_team_from_world(world)
	if team == null:
		return
	var repo: RefCounted = _content_repository()
	var repo_ready: bool = repo != null
	var primary_car: CarStateScr = null
	for car_instance_id: String in team.car_instance_ids:
		if not world.cars.has(car_instance_id):
			continue
		var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
		if car == null:
			continue
		if primary_car == null:
			primary_car = car
		var car_label := str(car.display_name).strip_edges()
		var car_class_id := ""
		var platform_dict: Dictionary = {}
		if repo_ready:
			var platform: Variant = repo.get_car_platform(car.car_platform_id)
			if platform is Dictionary:
				platform_dict = platform as Dictionary
				car_class_id = str(platform_dict.get("car_class_id", ""))
		if car_label.is_empty():
			car_label = _marketplace_livery_name_for_image_path(car_class_id, current_car_image_path)
			if not car_label.is_empty():
				car.display_name = car_label
		if repo_ready and not car_label.is_empty():
			var resolved_platform := _resolve_marketplace_platform_for_livery(repo, car_class_id, car_label, platform_dict)
			var resolved_platform_id := str(resolved_platform.get("id", ""))
			if not resolved_platform_id.is_empty():
				car.car_platform_id = resolved_platform_id
	if primary_car != null and repo_ready:
		_sync_player_car_summary_from_car(repo, primary_car)


func sync_player_car_display_state() -> void:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return
	_ensure_player_car_display_names(_runtime_world as WorldStateScr)


func player_car_platform_display_name() -> String:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return ""
	sync_player_car_display_state()
	var world: WorldStateScr = _runtime_world as WorldStateScr
	var team := _player_team_from_world(world)
	if team == null or team.car_instance_ids.is_empty():
		return ""
	var car_instance_id := str(team.car_instance_ids[0])
	if not world.cars.has(car_instance_id):
		return ""
	var car: CarStateScr = world.cars[car_instance_id] as CarStateScr
	if car == null:
		return ""
	var repo: RefCounted = _content_repository()
	if repo == null:
		return ""
	var platform: Variant = repo.get_car_platform(car.car_platform_id)
	if platform is Dictionary:
		return str((platform as Dictionary).get("display_name", "")).strip_edges()
	return ""


func _sync_player_car_summary_from_car(repo: RefCounted, car: CarStateScr) -> void:
	if car == null:
		return
	var platform: Variant = repo.get_car_platform(car.car_platform_id)
	if not platform is Dictionary:
		return
	var platform_dict: Dictionary = platform as Dictionary
	var manufacturer_id := str(platform_dict.get("manufacturer_id", ""))
	var manufacturer_name := _manufacturer_display_name(repo, manufacturer_id).strip_edges()
	if not manufacturer_name.is_empty():
		player_car_manufacturer = manufacturer_name
	var car_class_id := str(platform_dict.get("car_class_id", ""))
	if not car_class_id.is_empty():
		var class_row: Variant = repo.get_car_class(car_class_id)
		if class_row is Dictionary:
			player_car_class_name = str((class_row as Dictionary).get("display_name", car_class_id))


func _resolve_marketplace_platform_for_livery(
	repo: RefCounted,
	car_class_id: String,
	livery_name: String,
	fallback_platform: Dictionary
) -> Dictionary:
	var normalized_livery := _normalize_car_match_text(livery_name)
	if normalized_livery.is_empty() or car_class_id.is_empty():
		return fallback_platform
	var best_platform: Dictionary = fallback_platform
	var best_score := 0
	for row_v: Variant in _generated_car_platform_rows():
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v as Dictionary
		if str(row.get("car_class_id", "")) != car_class_id:
			continue
		var platform_id := str(row.get("id", ""))
		var platform: Variant = repo.get_car_platform(platform_id)
		if not platform is Dictionary:
			continue
		var platform_dict: Dictionary = platform as Dictionary
		var score := _car_livery_platform_match_score(repo, normalized_livery, platform_dict)
		if score > best_score:
			best_score = score
			best_platform = platform_dict
	return best_platform


func _car_livery_platform_match_score(repo: RefCounted, normalized_livery: String, platform: Dictionary) -> int:
	var score := 0
	var platform_name := _normalize_car_match_text(str(platform.get("display_name", "")))
	if not platform_name.is_empty() and normalized_livery.find(platform_name) >= 0:
		score += 10
	var manufacturer_name := _normalize_car_match_text(_manufacturer_display_name(repo, str(platform.get("manufacturer_id", ""))))
	if not manufacturer_name.is_empty() and normalized_livery.find(manufacturer_name) >= 0:
		score += 4
	var tokens := platform_name.split(" ", false)
	for token in tokens:
		var token_text := str(token)
		if token_text.length() < 3 or ["gt3", "gte", "evo", "gen", "cup", "race", "cars"].has(token_text):
			continue
		if normalized_livery.find(token_text) >= 0:
			score += 3
	return score


func _normalize_car_match_text(value: String) -> String:
	var lower := value.to_lower()
	var cleaned := ""
	for index in range(lower.length()):
		var character := lower.substr(index, 1)
		var code := character.unicode_at(0)
		if (code >= 97 and code <= 122) or (code >= 48 and code <= 57):
			cleaned += character
		else:
			cleaned += " "
	return " ".join(cleaned.split(" ", false))


func _load_marketplace_livery_manifest() -> Dictionary:
	if not _marketplace_livery_manifest_cache.is_empty():
		return _marketplace_livery_manifest_cache
	if not FileAccess.file_exists(MARKETPLACE_LIVERY_MANIFEST_PATH):
		_marketplace_livery_manifest_cache = {"records": {}}
		return _marketplace_livery_manifest_cache
	var file := FileAccess.open(MARKETPLACE_LIVERY_MANIFEST_PATH, FileAccess.READ)
	if file == null:
		_marketplace_livery_manifest_cache = {"records": {}}
		return _marketplace_livery_manifest_cache
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		_marketplace_livery_manifest_cache = {"records": {}}
		return _marketplace_livery_manifest_cache
	var manifest: Dictionary = parsed as Dictionary
	var records_variant: Variant = manifest.get("records", {})
	if typeof(records_variant) != TYPE_DICTIONARY:
		manifest["records"] = {}
	_marketplace_livery_manifest_cache = manifest
	return _marketplace_livery_manifest_cache


func _build_startup_mail(repo: RefCounted, world: WorldStateScr, listings: Array) -> Array:
	var market_focus: Dictionary = listings[0] as Dictionary if not listings.is_empty() else {}
	var offer_name: String = str(market_focus.get("card_title", "launch package")).replace("\n", " ")
	var championship_id: String = _primary_championship_id_from_world(world)
	var championship_label: String = _championship_display_name(repo, championship_id)
	var team: TeamStateScr = _player_team_from_world(world)
	var budget: BudgetStateScr = _player_budget_from_world(world)
	var supplier_confidence: String = str(team.startup_profile.get("supplier_confidence", supplier_confidence_name)) if team != null else supplier_confidence_name
	var sponsor_tier: String = budget.sponsor_tier if budget != null else "regional"
	var starting_cash: String = _fmt_money_compact(budget.cash) if budget != null else launch_budget_label
	var staff_headcount: int = team.staff_instance_ids.size() if team != null else 0
	var founder_signal: String = "%s founder profile" % background_name.to_lower()
	var recommended_series: String = str(market_focus.get("series_filter_label", championship_label))
	var launch_offer_price: String = str(market_focus.get("price_label", "market rate"))
	return [
		_mail_dict(
			"mail_launch_briefing",
			"assistant",
			"Team Manager",
			"Team Operations",
			"Welcome to %s" % team_name,
			"I've laid out what matters on day one, what can wait, and what actually blocks progress.",
			"Launch Briefing",
			"",
			true,
			"Blocking",
			"TM",
			"",
			"partner-partner-0006",
			false,
			true,
			"You can continue the day now. The rest of the inbox is guidance, and the first car is still the most important task.",
			[
				{"type": "paragraph", "text": "Team Principal,\n\nWelcome to %s. The save is now live, the project is visible, and the first impression you create over the next few days will shape how the paddock reads this operation." % team_name},
				{"type": "heading", "text": "What Actually Blocks Progress"},
				{"type": "paragraph", "text": "There is only one formal blocker right now: this launch briefing needs to be acknowledged so the team knows you have seen the opening state of the project."},
				{"type": "heading", "text": "What Matters Immediately After That"},
				{"type": "paragraph", "text": "1. Buy a car.\n2. Enter a championship.\n3. Decide how much staffing and sponsor work you want to do before advancing time."},
				{"type": "heading", "text": "Current Situation"},
				{"type": "paragraph", "text": "You are opening with %s in cash, a %s sponsor profile, %d core staff already committed, and a target programme centred on %s." % [starting_cash, sponsor_tier, staff_headcount, championship_label]},
				{"type": "heading", "text": "Finding Your Way Around"},
				{"type": "paragraph", "text": "The first time you open any screen I'll pop in to walk you through what everything on it does. If you ever want that tour again, hit the round \"?\" button in the top corner of the screen."},
				{"type": "paragraph", "text": "Read the rest of the inbox before you move. Each note below points to a real pressure point in the launch."},
			],
			"must_do",
			"Blocking",
			"acknowledge",
			"Acknowledge Briefing",
			"",
			"",
			"",
			true,
			false,
			true,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_launch_market",
			"race-mechanics",
			"Will Joseph",
			"Race Mechanic",
			"We need to lock the launch car package",
			"The workshop is ready, but we need a chassis decision before prep can begin...",
			"Launch Car Needed",
			"",
			false,
			"",
			"WJ",
			"",
			"partner-partner-0001",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Boss,\n\nThe garage is staged and the crew is ready to start prep work, but until you sign a chassis we are still in planning mode rather than race mode."},
				{"type": "heading", "text": "Best Immediate Fit"},
				{"type": "paragraph", "text": "%s is the strongest opening option for %s at %s." % [offer_name, recommended_series, launch_offer_price]},
				{"type": "heading", "text": "Why This Matters"},
				{"type": "paragraph", "text": "The car choice decides tooling, parts requests, setup direction, and how quickly we can turn the garage into a functioning programme. Delay it too long and the launch starts to look hesitant."},
			],
			"must_do",
			"Car Needed",
			"navigate",
			"Open Market",
			"Market",
			"marketplace",
			MARKETPLACE_SCENE_PATH,
			false,
			false,
			false,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_series_office_packet",
			"championship",
			"Series Office",
			"Championship",
			"Entry packet ready for %s" % championship_label,
			"The series office has issued the opening compliance packet for new entrants...",
			"Series Entry Packet",
			"",
			false,
			"",
			"SO",
			"GMA",
			"partner-partner-0007",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Team Principal,\n\nYour provisional entry paperwork for %s is open." % championship_label},
				{"type": "heading", "text": "What We Still Need"},
				{"type": "paragraph", "text": "The application is not considered active until you nominate a valid car platform. In practical terms, the marketplace choice needs to happen before the series office stops treating this as an expression of interest."},
				{"type": "paragraph", "text": "Once the car is locked in, standings entry is the next clean step."},
			],
			"review_soon",
			"Awaiting Chassis",
			"navigate",
			"Open Standings",
			"Standings",
			"standings",
			PLACEHOLDER_SCENE_PATH,
			false,
			false,
			false,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_sponsor_welcome",
			"contracts",
			"Commercial Lead",
			"Commercial",
			"%s sponsors are interested if the launch looks real" % sponsor_tier.capitalize(),
			"Commercial partners are watching for a credible first move...",
			"Sponsor Briefing",
			"",
			false,
			"",
			"CL",
			"",
			"partner-partner-0002",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Principal,\n\nThe commercial read on the project is positive, but still cautious."},
				{"type": "heading", "text": "Current Read"},
				{"type": "paragraph", "text": "Right now the market sees us as a %s-level sponsorship proposition with %s available to deploy." % [sponsor_tier, starting_cash]},
				{"type": "heading", "text": "What Changes That"},
				{"type": "paragraph", "text": "A real car in the garage changes the conversation from concept to operation. That first purchase is not only a technical decision, it is also the first serious commercial proof point."},
			],
			"review_soon",
			"Commercial",
			"navigate",
			"Open Sponsors",
			"Sponsors",
			"sponsors",
			PLACEHOLDER_SCENE_PATH,
			false,
			false,
			false,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_supplier_onboarding",
			"team",
			"Supplier Relations",
			"Operations",
			"Supplier confidence is %s right now" % supplier_confidence,
			"Vendors are open to onboarding, but they want clarity on the package...",
			"Supplier Readiness",
			"",
			false,
			"",
			"SR",
			"",
			"partner-partner-0003",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Operations note,\n\nSupplier confidence currently reads as %s." % supplier_confidence},
				{"type": "heading", "text": "Why Suppliers Are Waiting"},
				{"type": "paragraph", "text": "They want the chassis confirmed before they commit to support assumptions, because that choice determines spares, tooling, and the kind of early-week help we can realistically expect."},
				{"type": "paragraph", "text": "The faster the car decision is made, the cleaner the supplier onboarding becomes."},
			],
			"background",
			"Ops Update",
			"",
			"",
			"",
			"",
			"",
			false,
			false,
			false,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_staffing_note",
			"staff",
			"Chief Scout",
			"Chief Scout",
			"Launch staffing note: %d core staff already in place" % staff_headcount,
			"The backbone of the operation is there, but the next decision shapes who we recruit around...",
			"Staffing Snapshot",
			"",
			false,
			"",
			"CS",
			"",
			"partner-partner-0004",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Principal,\n\nWe have %d core staff already committed and your %s is doing a lot of the early recruiting work for us." % [staff_headcount, founder_signal]},
				{"type": "heading", "text": "What I Need From You"},
				{"type": "paragraph", "text": "Once you settle the first car, I can narrow the market around the exact kind of programme we are launching instead of guessing at it from the outside."},
				{"type": "paragraph", "text": "That means the car choice feeds directly into the quality of the next staffing shortlist."},
			],
			"review_soon",
			"Recruitment",
			"navigate",
			"Open Staff",
			"Staff",
			"staff",
			PLACEHOLDER_SCENE_PATH,
			false,
			false,
			false,
			false,
			"launch/day1"
		),
		_mail_dict(
			"mail_board_launch",
			"chairman",
			"Board Office",
			"Chairman",
			"Board note: visible progress starts with the first car",
			"The project needs something tangible on the garage floor before confidence starts to fade...",
			"Board Launch Note",
			"",
			false,
			"",
			"BO",
			"",
			"partner-partner-0005",
			false,
			false,
			"",
			[
				{"type": "paragraph", "text": "Board note,\n\nMomentum matters now more than polish."},
				{"type": "heading", "text": "What The Board Wants To See"},
				{"type": "paragraph", "text": "A visible first step the paddock can understand: buy the launch car, then convert that into a series entry. That makes the project look active, funded, and serious instead of still theoretical."},
				{"type": "paragraph", "text": "No one expects perfection on day one. They do expect movement."},
			],
			"background",
			"Board Note",
			"",
			"",
			"",
			"",
			"",
			false,
			false,
			false,
			false,
			"launch/day1"
		),
	]


func _replace_player_launch_car(world: WorldStateScr, team: TeamStateScr, listing: Dictionary) -> void:
	var car := CarStateScr.new()
	car.instance_id = _next_world_entity_id(world.cars, "car_state")
	car.team_instance_id = team.instance_id
	car.car_platform_id = str(listing.get("car_platform_id", ""))
	car.display_name = str(listing.get("livery_name", listing.get("card_title", ""))).strip_edges()
	car.installed_part_instance_ids = {}
	_install_listing_parts(world, team, car, listing)
	world.cars[car.instance_id] = car
	team.car_instance_ids = PackedStringArray([car.instance_id])
	var team_archetype_id: String = str(listing.get("team_archetype_id", ""))
	if not team_archetype_id.is_empty():
		team.team_archetype_id = team_archetype_id
	for driver_id: String in team.driver_instance_ids:
		if world.drivers.has(driver_id):
			var driver: DriverStateScr = world.drivers[driver_id] as DriverStateScr
			if driver != null:
				driver.car_class_id = str(listing.get("car_class_id", driver.car_class_id))


func _install_listing_parts(world: WorldStateScr, team: TeamStateScr, car: CarStateScr, listing: Dictionary) -> void:
	var wear: Dictionary = listing.get("part_wear", {})
	for slot_name_variant in PART_FAMILY_BY_SLOT.keys():
		var slot_name: String = str(slot_name_variant)
		var family_id: String = str(PART_FAMILY_BY_SLOT[slot_name_variant])
		var part := PartStateScr.new()
		part.instance_id = _next_world_entity_id(world.parts, "part_state")
		part.team_instance_id = team.instance_id
		part.part_family_id = family_id
		part.supplier_archetype_id = ""
		var wear_percent: float = float(wear.get(slot_name, 0))
		part.condition = clampf(1.0 - wear_percent / 100.0, 0.15, 1.0)
		world.parts[part.instance_id] = part
		car.installed_part_instance_ids[slot_name] = part.instance_id


func _find_marketplace_listing(listing_id: String) -> Dictionary:
	for listing_variant in marketplace_listings:
		if typeof(listing_variant) != TYPE_DICTIONARY:
			continue
		var listing: Dictionary = listing_variant
		if str(listing.get("id", "")) == listing_id:
			return listing
	return {}


func _player_team_from_world(world: WorldStateScr) -> TeamStateScr:
	if world == null or not world.teams.has(world.player_team_instance_id):
		return null
	return world.teams[world.player_team_instance_id] as TeamStateScr


func _player_budget_from_world(world: WorldStateScr) -> BudgetStateScr:
	var team := _player_team_from_world(world)
	if team == null or not world.budgets.has(team.budget_instance_id):
		return null
	return world.budgets[team.budget_instance_id] as BudgetStateScr


func _entry_for_team_and_championship(world: WorldStateScr, team_instance_id: String, championship_id: String) -> ChampionshipEntryStateScr:
	for entry_variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var entry: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if entry.team_instance_id == team_instance_id and entry.championship_id == championship_id:
			return entry
	return null


func _championship_entry_count(world: WorldStateScr, championship_id: String) -> int:
	var count := 0
	for entry_variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var entry: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if entry != null and entry.championship_id == championship_id:
			count += 1
	return count


func _ensure_championship_field_entries(world: WorldStateScr, repo: RefCounted, championship_id: String, player_team_id: String) -> void:
	if championship_id.is_empty() or _championship_entry_count(world, championship_id) > 1:
		return
	var championship: Variant = repo.get_championship(championship_id)
	var ruleset_id := ""
	if championship is Dictionary:
		ruleset_id = str((championship as Dictionary).get("ruleset_id", ""))
	var manifest: Dictionary = repo.get_manifest()
	var championship_row: Dictionary = championship as Dictionary if championship is Dictionary else {}
	var archetype_rows: Array = WorldGeneratorScr._archetype_dicts_for_championship(repo, manifest, championship_id)
	var roster_rows: Array = WorldGeneratorScr._roster_rows_with_class_fallback(repo, manifest, championship_id)
	var ids := _build_world_id_factory(world)
	var next_racing_number := 10 + _championship_entry_count(world, championship_id)
	if not roster_rows.is_empty():
		var roster_index := 0
		for roster_variant in roster_rows:
			if not roster_variant is Dictionary:
				continue
			var roster_row: Dictionary = roster_variant as Dictionary
			var roster_entry_id: String = str(roster_row.get("roster_entry_id", roster_row.get("id", "")))
			if roster_entry_id.is_empty() or _championship_has_roster_entry(world, championship_id, roster_entry_id):
				continue
			var archetype: Dictionary = WorldGeneratorScr._archetype_for_roster_entry(repo, manifest, championship_id, roster_row, true)
			if archetype.is_empty():
				if archetype_rows.is_empty():
					continue
				archetype = archetype_rows[roster_index % archetype_rows.size()] as Dictionary
			roster_index += 1
			var driver_profile_ids: Array = []
			var driver_profile_id: String = str(roster_row.get("driver_profile_id", ""))
			if not driver_profile_id.is_empty():
				driver_profile_ids.append(driver_profile_id)
			var roster_racing_number: int = int(roster_row.get("racing_number", next_racing_number))
			TeamGeneratorScr.build_full_team(
				world,
				repo,
				ids,
				manifest,
				archetype,
				str(roster_row.get("team_name", archetype.get("display_name", "Team"))),
				"pro",
				championship_row,
				roster_racing_number,
				{
					"team_display_name": str(roster_row.get("team_name", archetype.get("display_name", "Team"))),
					"driver_profile_ids": driver_profile_ids,
					"car_count": 1,
					"car_display_name": str(roster_row.get("livery_name", "")),
					"team_profile_id": str(roster_row.get("team_profile_id", "")),
					"source_team_name": str(roster_row.get("source_team_name", "")),
					"source_ams2_team_id": str(roster_row.get("source_ams2_team_id", "")),
					"roster_driver_name": str(roster_row.get("driver_name", "")),
					"canonical_driver_name": str(roster_row.get("canonical_driver_name", roster_row.get("driver_name", ""))),
					"roster_driver_country": str(roster_row.get("driver_country", "")),
					"entrant_ratings": roster_row.get("ratings", {}),
					"championship_entrant_id": str(roster_row.get("id", "")),
					"runtime_roster_entry_id": str(roster_row.get("runtime_roster_entry_id", "")),
					"roster_entry_id": roster_entry_id,
				}
			)
			next_racing_number += 1
		if _championship_entry_count(world, championship_id) > 1:
			return
	var eligible_classes: Array = _eligible_car_classes_for_championship(repo, championship_id)
	for team_variant in world.teams.values():
		if not team_variant is TeamStateScr:
			continue
		var team: TeamStateScr = team_variant as TeamStateScr
		if team == null or team.instance_id == player_team_id:
			continue
		if _entry_for_team_and_championship(world, team.instance_id, championship_id) != null:
			continue
		var car_instance_id := _team_entry_car_instance_id(world, repo, team, eligible_classes)
		if car_instance_id.is_empty():
			continue
		var entry := ChampionshipEntryStateScr.new()
		entry.instance_id = _next_world_entity_id(world.championship_entries, "championship_entry_state")
		entry.team_instance_id = team.instance_id
		entry.championship_id = championship_id
		entry.car_instance_id = car_instance_id
		entry.ruleset_id = ruleset_id
		entry.racing_number = 0
		world.championship_entries[entry.instance_id] = entry
		var entry_ids: Array = Array(team.championship_entry_instance_ids)
		entry_ids.append(entry.instance_id)
		team.championship_entry_instance_ids = PackedStringArray(entry_ids)
	if _championship_entry_count(world, championship_id) > 1:
		return
	for archetype_variant in archetype_rows:
		if not archetype_variant is Dictionary:
			continue
		var archetype: Dictionary = archetype_variant as Dictionary
		var archetype_id: String = str(archetype.get("id", ""))
		if archetype_id.is_empty() or _championship_has_archetype(world, championship_id, archetype_id):
			continue
		TeamGeneratorScr.build_full_team(
			world,
			repo,
			ids,
			manifest,
			archetype,
			str(archetype.get("display_name", "Team")),
			"pro",
			championship_row,
			next_racing_number
		)
		next_racing_number += 1


func _team_entry_car_instance_id(world: WorldStateScr, repo: RefCounted, team: TeamStateScr, eligible_classes: Array) -> String:
	for car_id_variant in team.car_instance_ids:
		var car_id: String = String(car_id_variant)
		if car_id.is_empty() or not world.cars.has(car_id):
			continue
		var car: CarStateScr = world.cars[car_id] as CarStateScr
		if car == null:
			continue
		var platform: Variant = repo.get_car_platform(car.car_platform_id)
		if not platform is Dictionary:
			continue
		var car_class_id: String = str((platform as Dictionary).get("car_class_id", ""))
		if eligible_classes.is_empty() or eligible_classes.has(car_class_id):
			return car_id
	return ""


func _championship_has_archetype(world: WorldStateScr, championship_id: String, archetype_id: String) -> bool:
	for entry_variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var championship_entry: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if championship_entry == null or championship_entry.championship_id != championship_id:
			continue
		if not world.teams.has(championship_entry.team_instance_id):
			continue
		var team: TeamStateScr = world.teams[championship_entry.team_instance_id] as TeamStateScr
		if team != null and team.team_archetype_id == archetype_id:
			return true
	return false


func _championship_has_roster_entry(world: WorldStateScr, championship_id: String, roster_entry_id: String) -> bool:
	for entry_variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var championship_entry: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if championship_entry == null or championship_entry.championship_id != championship_id:
			continue
		if not world.teams.has(championship_entry.team_instance_id):
			continue
		var team: TeamStateScr = world.teams[championship_entry.team_instance_id] as TeamStateScr
		if team == null:
			continue
		var startup_profile: Dictionary = team.startup_profile if team.startup_profile is Dictionary else {}
		if str(startup_profile.get("roster_entry_id", "")) == roster_entry_id:
			return true
	return false


func _build_world_id_factory(world: WorldStateScr) -> IdFactoryScr:
	var factory := IdFactoryScr.new()
	factory._next_index["team_state"] = _max_instance_suffix(world.teams.keys(), "team_state")
	factory._next_index["driver_state"] = _max_instance_suffix(world.drivers.keys(), "driver_state")
	factory._next_index["staff_state"] = _max_instance_suffix(world.staff.keys(), "staff_state")
	factory._next_index["car_state"] = _max_instance_suffix(world.cars.keys(), "car_state")
	factory._next_index["part_state"] = _max_instance_suffix(world.parts.keys(), "part_state")
	factory._next_index["facility_state"] = _max_instance_suffix(world.facilities.keys(), "facility_state")
	factory._next_index["budget_state"] = _max_instance_suffix(world.budgets.keys(), "budget_state")
	factory._next_index["contract_state"] = _max_instance_suffix(world.contracts.keys(), "contract_state")
	factory._next_index["championship_entry_state"] = _max_instance_suffix(world.championship_entries.keys(), "championship_entry_state")
	factory._next_index["race_event_state"] = _max_instance_suffix(world.race_events.keys(), "race_event_state")
	factory._next_index["dev_project_state"] = _max_instance_suffix(world.development_projects.keys(), "dev_project_state")
	return factory


func _max_instance_suffix(keys: Array, prefix: String) -> int:
	var max_value := 0
	var needle := prefix + "_"
	for key_variant in keys:
		var key: String = String(key_variant)
		if not key.begins_with(needle):
			continue
		var suffix: String = key.substr(needle.length())
		if suffix.is_valid_int():
			max_value = maxi(max_value, int(suffix))
	return max_value


func _latest_player_championship_entry(world: WorldStateScr) -> ChampionshipEntryStateScr:
	var team := _player_team_from_world(world)
	if team == null:
		return null
	for index in range(team.championship_entry_instance_ids.size() - 1, -1, -1):
		var entry_id: String = String(team.championship_entry_instance_ids[index])
		if not world.championship_entries.has(entry_id):
			continue
		var entry: ChampionshipEntryStateScr = world.championship_entries[entry_id] as ChampionshipEntryStateScr
		if entry != null and entry.team_instance_id == team.instance_id:
			return entry
	for entry_variant in world.championship_entries.values():
		if not entry_variant is ChampionshipEntryStateScr:
			continue
		var fallback: ChampionshipEntryStateScr = entry_variant as ChampionshipEntryStateScr
		if fallback != null and fallback.team_instance_id == team.instance_id:
			return fallback
	return null


func _series_row_for_id(series_id: String) -> Dictionary:
	for row_variant in series_directory:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant as Dictionary
		if str(row.get("id", "")) == series_id:
			return row
	return {}


func _primary_championship_id_from_world(world: WorldStateScr) -> String:
	var entry := _latest_player_championship_entry(world)
	return entry.championship_id if entry != null else ""


func _active_race_event_from_world(repo: RefCounted, world: WorldStateScr) -> Variant:
	var selected_race_event_id := str(pending_race_context.get("race_event_id", ""))
	if not selected_race_event_id.is_empty() and world.race_events.has(selected_race_event_id):
		return world.race_events[selected_race_event_id]
	var championship_id := _primary_championship_id_from_world(world)
	var scheduled: Array = []
	var completed: Array = []
	for event_variant in world.race_events.values():
		if not event_variant is Object:
			continue
		var event = event_variant
		if String(event.championship_id) != championship_id:
			continue
		if String(event.status) == "completed":
			completed.append(event)
		else:
			scheduled.append(event)
	if not scheduled.is_empty():
		scheduled.sort_custom(func(a, b) -> bool: return int(a.round_index) < int(b.round_index))
		return scheduled[0]
	if not completed.is_empty():
		completed.sort_custom(func(a, b) -> bool: return int(a.round_index) > int(b.round_index))
		return completed[0]
	return null


func _eligible_car_classes_for_championship(repo: RefCounted, championship_id: String) -> Array:
	var classes: Array = []
	var championship: Variant = repo.get_championship(championship_id)
	if championship is Dictionary:
		var eligible: Variant = (championship as Dictionary).get("eligible_car_class_ids", [])
		if eligible is Array:
			for item in eligible as Array:
				classes.append(String(item))
	return classes


func _generated_team_archetype_rows() -> Array:
	return _generated_records("res://data/generated/team_archetypes.json")


func _generated_car_class_rows() -> Array:
	return _generated_records("res://data/generated/car_classes.json")


func _generated_car_platform_rows() -> Array:
	return _generated_records("res://data/generated/car_platforms.json")


func _generated_championship_rows() -> Array:
	return _generated_records("res://data/generated/championships.json")


func _generated_records(path: String) -> Array:
	var text := FileAccess.get_file_as_string(path)
	var parsed: Variant = JSON.parse_string(text)
	if not parsed is Dictionary:
		return []
	var records: Variant = (parsed as Dictionary).get("records", [])
	return records if records is Array else []


func _championship_display_name(repo: RefCounted, championship_id: String) -> String:
	if championship_id.is_empty():
		return "Open Market"
	var championship: Variant = repo.get_championship(championship_id)
	if championship is Dictionary:
		return str((championship as Dictionary).get("display_name", championship_id))
	return championship_id.replace("championship.", "").replace("_", " ").capitalize()


func _series_labels_for_car_class(repo: RefCounted, car_class_id: String) -> Array:
	var labels: Array = []
	for row_v: Variant in _generated_championship_rows():
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v
		var eligible: Variant = row.get("eligible_car_class_ids", [])
		if not eligible is Array:
			continue
		var class_ids: Array = eligible as Array
		if not class_ids.has(car_class_id):
			continue
		labels.append(_championship_display_name(repo, str(row.get("id", ""))))
	if labels.is_empty():
		labels.append("Open Market")
	return labels


func _team_archetype_id_for_platform(platform_id: String) -> String:
	for row_v: Variant in _generated_team_archetype_rows():
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v
		if str(row.get("default_car_platform_id", "")) == platform_id:
			return str(row.get("id", ""))
	return ""


func _manufacturer_display_name(repo: RefCounted, manufacturer_id: String) -> String:
	var manufacturer: Variant = repo.get_manufacturer(manufacturer_id)
	if manufacturer is Dictionary:
		return str((manufacturer as Dictionary).get("display_name", manufacturer_id)).replace("-", " ").capitalize()
	return manufacturer_id.replace("manufacturer.", "").replace("_", " ").capitalize()


func _car_class_display_name(repo: RefCounted, car_class_id: String) -> String:
	var car_class: Variant = repo.get_car_class(car_class_id)
	if car_class is Dictionary:
		return str((car_class as Dictionary).get("display_name", car_class_id))
	return car_class_id.replace("car_class.", "").replace("_", " ").capitalize()


func _marketplace_class_profile(car_class: Dictionary) -> Dictionary:
	var base_price_by_tier := {
		"entry": 25000.0,
		"amateur": 80000.0,
		"semi-pro": 200000.0,
		"semi_pro": 200000.0,
		"professional": 450000.0,
		"pro": 800000.0,
		"elite": 2000000.0,
		"pinnacle": 8000000.0,
		"historic": 1500000.0,
	}
	var category_multiplier := {
		"kart": 0.2,
		"formula": 1.5,
		"gt": 1.0,
		"prototype": 2.0,
		"touring": 0.6,
		"stock": 0.5,
		"rallycross": 0.4,
		"road": 0.3,
		"vintage": 2.5,
	}
	var base_performance_by_category := {
		"kart": 62.0,
		"formula": 88.0,
		"gt": 84.0,
		"prototype": 91.0,
		"touring": 74.0,
		"stock": 76.0,
		"rallycross": 70.0,
		"road": 68.0,
		"vintage": 79.0,
	}
	var pace_by_category := {
		"kart": 0.24,
		"road": 0.40,
		"touring": 0.54,
		"rallycross": 0.58,
		"stock": 0.61,
		"vintage": 0.66,
		"gt": 0.74,
		"formula": 0.88,
		"prototype": 0.92,
	}
	var pace_tier_modifier := {
		"entry": -0.08,
		"amateur": -0.04,
		"semi-pro": -0.01,
		"semi_pro": -0.01,
		"professional": 0.02,
		"pro": 0.04,
		"elite": 0.06,
		"pinnacle": 0.08,
		"historic": 0.01,
	}
	var driveability_by_category := {
		"kart": 0.88,
		"formula": 0.64,
		"gt": 0.79,
		"prototype": 0.67,
		"touring": 0.84,
		"stock": 0.72,
		"rallycross": 0.69,
		"road": 0.86,
		"vintage": 0.58,
	}
	var reliability_by_category := {
		"kart": 0.82,
		"formula": 0.72,
		"gt": 0.84,
		"prototype": 0.80,
		"touring": 0.86,
		"stock": 0.78,
		"rallycross": 0.76,
		"road": 0.88,
		"vintage": 0.62,
	}
	var tier_operating_cost := {
		"entry": 0.24,
		"amateur": 0.34,
		"semi-pro": 0.48,
		"semi_pro": 0.48,
		"professional": 0.62,
		"pro": 0.72,
		"elite": 0.85,
		"pinnacle": 0.95,
		"historic": 0.78,
	}
	var category_operating_cost := {
		"kart": -0.10,
		"formula": 0.10,
		"gt": 0.04,
		"prototype": 0.16,
		"touring": -0.02,
		"stock": 0.00,
		"rallycross": 0.02,
		"road": -0.08,
		"vintage": 0.12,
	}
	var class_overrides := {
		"car_class.lmdh_gtp": {
			"pace_anchor": 0.95,
			"driveability_anchor": 0.66,
			"reliability_anchor": 0.81,
			"operating_cost_anchor": 0.97,
			"base_performance": 96.0,
			"category_multiplier": 2.1,
		},
		"car_class.p1_gen2": {
			"pace_anchor": 0.89,
			"driveability_anchor": 0.72,
			"reliability_anchor": 0.82,
			"operating_cost_anchor": 0.82,
			"base_performance": 90.0,
			"category_multiplier": 1.8,
		},
		"car_class.ligier_european": {
			"pace_anchor": 0.78,
			"driveability_anchor": 0.81,
			"reliability_anchor": 0.85,
			"operating_cost_anchor": 0.56,
			"base_performance": 79.0,
			"category_multiplier": 1.7,
		},
		"car_class.gt3": {
			"pace_anchor": 0.80,
			"driveability_anchor": 0.78,
			"reliability_anchor": 0.84,
			"operating_cost_anchor": 0.66,
			"base_performance": 85.0,
		},
		"car_class.gt3_gen2": {
			"pace_anchor": 0.84,
			"driveability_anchor": 0.76,
			"reliability_anchor": 0.85,
			"operating_cost_anchor": 0.70,
			"base_performance": 88.0,
			"category_multiplier": 1.08,
		},
		"car_class.gt4": {
			"pace_anchor": 0.71,
			"driveability_anchor": 0.83,
			"reliability_anchor": 0.87,
			"operating_cost_anchor": 0.44,
			"base_performance": 79.0,
		},
		"car_class.super_trofeo": {
			"pace_anchor": 0.77,
			"driveability_anchor": 0.74,
			"reliability_anchor": 0.83,
			"operating_cost_anchor": 0.58,
			"base_performance": 82.0,
			"category_multiplier": 1.03,
		},
	}
	var tier: String = str(car_class.get("tier", "amateur"))
	var category: String = str(car_class.get("category", "gt"))
	var car_class_id: String = str(car_class.get("id", ""))
	var profile := {
		"tier_price": float(base_price_by_tier.get(tier, 180000.0)),
		"category_multiplier": float(category_multiplier.get(category, 0.8)),
		"base_performance": float(base_performance_by_category.get(category, 75.0)),
		"pace_anchor": float(pace_by_category.get(category, 0.64)) + float(pace_tier_modifier.get(tier, 0.0)),
		"driveability_anchor": float(driveability_by_category.get(category, 0.74)),
		"reliability_anchor": float(reliability_by_category.get(category, 0.80)),
		"operating_cost_anchor": float(tier_operating_cost.get(tier, 0.44)) + float(category_operating_cost.get(category, 0.0)),
	}
	if class_overrides.has(car_class_id):
		var override_profile: Dictionary = class_overrides[car_class_id] as Dictionary
		for key_variant in override_profile.keys():
			profile[key_variant] = override_profile[key_variant]
	return profile


func _pick_marketplace_platform(repo: RefCounted, car_class_id: String, market_type: String, listing_index: int) -> Dictionary:
	var candidates: Array = []
	for row_v: Variant in _generated_car_platform_rows():
		if not row_v is Dictionary:
			continue
		var row: Dictionary = row_v as Dictionary
		if str(row.get("car_class_id", "")) != car_class_id:
			continue
		var platform_id: String = str(row.get("id", ""))
		var platform: Variant = repo.get_car_platform(platform_id)
		if platform is Dictionary:
			candidates.append(platform as Dictionary)
	if candidates.is_empty():
		return {}
	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return str(a.get("display_name", "")) < str(b.get("display_name", ""))
	)
	var seed_basis: String = "%s|%s|%s|%d|platform" % [persisted_world_seed, car_class_id, market_type, listing_index]
	var index: int = posmod(abs(hash(seed_basis)), candidates.size())
	return candidates[index] as Dictionary


func _marketplace_part_wear(score_seed: int, market_type: String) -> Dictionary:
	if market_type == "new":
		return {
			"engine": int(score_seed % 4),
			"chassis": int((score_seed / 3) % 3),
			"gearbox": int((score_seed / 5) % 3),
			"brakes": int((score_seed / 7) % 5),
			"suspension": int((score_seed / 11) % 4),
		}
	var condition_roll: int = score_seed % 4
	var target_condition: String = ["excellent", "good", "fair", "project"][condition_roll]
	var ranges: Dictionary = {
		"excellent": Vector2i(5, 15),
		"good": Vector2i(15, 35),
		"fair": Vector2i(35, 60),
		"project": Vector2i(60, 90),
	}
	var wear_range: Vector2i = ranges.get(target_condition, Vector2i(15, 35))
	var base_wear: int = wear_range.x + int(score_seed % max(1, wear_range.y - wear_range.x + 1))
	return {
		"engine": clampi(base_wear + int((score_seed / 13) % 11) - 5, 0, 100),
		"chassis": clampi(base_wear + int((score_seed / 17) % 9) - 4, 0, 100),
		"gearbox": clampi(base_wear + int((score_seed / 19) % 9) - 4, 0, 100),
		"brakes": clampi(base_wear + int((score_seed / 23) % 13), 0, 100),
		"suspension": clampi(base_wear + int((score_seed / 29) % 9) - 3, 0, 100),
	}


func _marketplace_average_wear(part_wear: Dictionary) -> float:
	var total: float = 0.0
	var count: float = 0.0
	for key_variant in part_wear.keys():
		total += float(part_wear[key_variant])
		count += 1.0
	return 0.0 if count <= 0.0 else total / count


func _marketplace_condition_from_wear(part_wear: Dictionary) -> String:
	var avg_wear: float = _marketplace_average_wear(part_wear)
	if avg_wear <= 15.0:
		return "excellent"
	if avg_wear <= 35.0:
		return "good"
	if avg_wear <= 60.0:
		return "fair"
	return "project"


func _marketplace_mileage(score_seed: int, market_type: String, condition: String) -> int:
	if market_type == "new":
		return 0
	match condition:
		"excellent":
			return 1000 + int(score_seed % 7001)
		"good":
			return 5000 + int(score_seed % 15001)
		"fair":
			return 15000 + int(score_seed % 25001)
		_:
			return 30000 + int(score_seed % 50001)


func _marketplace_service_history(score_seed: int, mileage: int, market_type: String) -> Array:
	if market_type == "new":
		return []
	var history: Array = []
	var service_count: int = clampi(int(mileage / 8000), 1, 5)
	for index in range(service_count):
		history.append({
			"week": max(1, 52 - index * 8),
			"year": 2026 - int((score_seed / (index + 3)) % 3),
			"type": "full" if index == 0 or index == service_count - 1 else ("repair" if (score_seed + index) % 3 == 0 else "partial"),
			"cost": 2500 + int((score_seed / max(1, index + 2)) % 9000),
		})
	return history


func _marketplace_upgrades(score_seed: int, car_class_name: String, market_type: String) -> Array:
	if market_type == "new":
		return []
	var upgrades: Array = []
	var upgrade_count: int = int(score_seed % 3)
	var catalog: Array = [
		{"name": "Engine Tune", "type": "performance", "effect": 4},
		{"name": "Cooling Upgrade", "type": "reliability", "effect": 5},
		{"name": "Damper Package", "type": "handling", "effect": 3},
	]
	for index in range(upgrade_count):
		var entry: Dictionary = catalog[index % catalog.size()]
		upgrades.append({
			"id": "%s_upgrade_%d" % [car_class_name.to_lower().replace(" ", "_"), index],
			"name": entry["name"],
			"type": entry["type"],
			"effect": int(entry["effect"]) + int((score_seed / (index + 5)) % 3),
			"cost": 4000 + int((score_seed / (index + 7)) % 12000),
		})
	return upgrades


func _marketplace_provenance(score_seed: int, car_class_name: String, market_type: String) -> Dictionary:
	if market_type == "new":
		return {}
	var notable_results: Array = []
	if score_seed % 3 == 0:
		notable_results.append("%s regional podium" % car_class_name)
	return {
		"previousOwners": 1 + int(score_seed % 3),
		"originalPurchaseYear": 2022 + int(score_seed % 4),
		"accidentHistory": int((score_seed / 5) % 3),
		"notableResults": notable_results,
	}


func _marketplace_base_price(profile: Dictionary) -> float:
	return float(profile.get("tier_price", 180000.0)) * float(profile.get("category_multiplier", 1.0))


func _marketplace_series_fit_label(preferred_series_label: String, series_labels: Array, target_series_eligible: bool) -> String:
	if target_series_eligible and not preferred_series_label.is_empty() and preferred_series_label != "Open Market":
		return preferred_series_label
	if series_labels.is_empty():
		return "Open Market"
	if series_labels.size() == 1:
		return str(series_labels[0])
	return "%s +%d more" % [str(series_labels[0]), series_labels.size() - 1]


func _marketplace_display_metrics(
	car_class: Dictionary,
	profile: Dictionary,
	part_wear: Dictionary,
	installed_upgrades: Array,
	performance: int,
	reliability: int,
	current_price: float,
	market_type: String,
	score_seed: int,
	target_series_eligible: bool
) -> Dictionary:
	var avg_wear: float = _marketplace_average_wear(part_wear)
	var base_performance: float = float(profile.get("base_performance", 75.0))
	var pace: float = float(profile.get("pace_anchor", 0.64))
	pace += (base_performance - 75.0) * 0.0012
	pace += float(_upgrade_effect_total(installed_upgrades, "performance")) * 0.004
	pace -= avg_wear * 0.0011
	pace += float((score_seed % 7) - 3) * 0.006
	if target_series_eligible:
		pace += 0.01
	if market_type == "new":
		pace += 0.01
	pace = clampf(pace, 0.22, 0.98)

	var driveability: float = float(profile.get("driveability_anchor", 0.74))
	driveability += float(_upgrade_effect_total(installed_upgrades, "handling")) * 0.006
	driveability -= float(part_wear.get("suspension", 0)) * 0.0018
	driveability -= float(part_wear.get("brakes", 0)) * 0.0012
	driveability = clampf(driveability, 0.42, 0.95)

	var reliability_rating: float = float(profile.get("reliability_anchor", 0.80))
	reliability_rating += (float(reliability) - 80.0) * 0.0035
	reliability_rating -= avg_wear * 0.0018
	reliability_rating += float(_upgrade_effect_total(installed_upgrades, "reliability")) * 0.004
	if market_type == "new":
		reliability_rating += 0.03
	reliability_rating = clampf(reliability_rating, 0.32, 0.96)

	var operating_cost: float = float(profile.get("operating_cost_anchor", 0.44))
	operating_cost += minf(0.12, current_price / 6000000.0)
	operating_cost += avg_wear * 0.001
	if market_type == "new":
		operating_cost -= 0.04
	operating_cost += float((score_seed % 7) - 3) * 0.006
	operating_cost = clampf(operating_cost, 0.18, 0.97)

	return {
		"pace": pace,
		"driveability": driveability,
		"reliability_rating": reliability_rating,
		"operating_cost": operating_cost,
	}


func _upgrade_effect_total(installed_upgrades: Array, upgrade_type: String) -> int:
	var total := 0
	for upgrade_variant in installed_upgrades:
		if typeof(upgrade_variant) != TYPE_DICTIONARY:
			continue
		var upgrade: Dictionary = upgrade_variant as Dictionary
		if str(upgrade.get("type", "")) != upgrade_type:
			continue
		total += int(upgrade.get("effect", 0))
	return total


func _marketplace_pricing(
	base_price: float,
	market_type: String,
	part_wear: Dictionary,
	mileage: int,
	service_history: Array,
	provenance: Dictionary,
	installed_upgrades: Array,
	score_seed: int
) -> Dictionary:
	var price: float = base_price
	var avg_wear: float = _marketplace_average_wear(part_wear)
	var wear_discount: float = 0.0
	var mileage_discount: float = 0.0
	var service_bonus: float = 0.0
	var provenance_bonus: float = 0.0
	var upgrade_value: float = 0.0
	var market_demand: float = 0.0
	if market_type != "new":
		wear_discount = -round(base_price * (avg_wear / 100.0) * 0.55)
		mileage_discount = -round(base_price * minf(float(mileage) / 120000.0, 0.28))
		service_bonus = round(minf(float(service_history.size()) * 0.04, 0.16) * base_price)
		provenance_bonus = round(minf(float(provenance.get("previousOwners", 1)) * -0.03 + float((provenance.get("notableResults", []) as Array).size()) * 0.05, 0.12) * base_price)
		for upgrade_variant in installed_upgrades:
			if typeof(upgrade_variant) != TYPE_DICTIONARY:
				continue
			upgrade_value += float((upgrade_variant as Dictionary).get("cost", 0.0)) * 0.6
	price += wear_discount + mileage_discount + service_bonus + provenance_bonus + upgrade_value
	market_demand = round((float((score_seed % 31) - 15) / 100.0) * price)
	price += market_demand
	if market_type == "auction":
		price *= 0.92
	return {
		"final_price": maxf(1000.0, round(price)),
		"wear_discount": wear_discount,
		"mileage_discount": mileage_discount,
		"service_bonus": service_bonus,
		"provenance_bonus": provenance_bonus,
		"upgrade_value": upgrade_value,
		"market_demand": market_demand,
	}


func _marketplace_reliability(part_wear: Dictionary) -> int:
	return int(maxf(40.0, round(100.0 - _marketplace_average_wear(part_wear) * 0.6)))


func _marketplace_performance(score_seed: int, part_wear: Dictionary, installed_upgrades: Array, market_type: String) -> int:
	var base: float = 92.0 if market_type == "new" else 85.0
	var upgrade_bonus: float = 0.0
	for upgrade_variant in installed_upgrades:
		if typeof(upgrade_variant) != TYPE_DICTIONARY:
			continue
		upgrade_bonus += float((upgrade_variant as Dictionary).get("effect", 0))
	var engine_penalty := float(part_wear.get("engine", 0)) * 0.18
	var chassis_penalty := float(part_wear.get("chassis", 0)) * 0.08
	return int(clampf(round(base + upgrade_bonus - engine_penalty - chassis_penalty + float(score_seed % 4)), 50.0, 100.0))


func _listing_checkout_price(listing: Dictionary) -> float:
	if str(listing.get("market_type", "")) == "auction":
		return float(listing.get("current_bid", listing.get("minimum_bid", listing.get("price", 0.0))))
	return float(listing.get("price", 0.0))


func _append_market_mail(mail: Dictionary) -> void:
	inbox_messages.insert(0, mail)


func _mark_launch_market_mail_resolved() -> void:
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) == "mail_launch_market":
			mail["unread"] = false
			mail["requires_response"] = false
			mail["resolved"] = true
			mail["status_label"] = "Car Signed"
			inbox_messages[index] = mail
			return


func _activate_series_entry_mail() -> void:
	for index in range(inbox_messages.size()):
		var mail_variant: Variant = inbox_messages[index]
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		var mail: Dictionary = mail_variant
		if str(mail.get("id", "")) != "mail_series_office_packet":
			continue
		mail["priority"] = "must_do"
		mail["status_label"] = "Ready To Enter"
		mail["unread"] = true
		mail["starred"] = true
		mail["preview"] = "The car is signed. The series office is waiting for your formal entry..."
		mail["detail_blocks"] = [
			{"type": "paragraph", "text": "Team Principal,\n\nYour nominated car package is now on file and the office can move this from provisional to active entry."},
			{"type": "heading", "text": "Next Step"},
			{"type": "paragraph", "text": "Open standings and complete the championship entry. Until that happens, the programme still reads as assembled but not committed."},
			{"type": "paragraph", "text": "Once entry is completed, your race-week admin can start to look normal instead of provisional."},
		]
		inbox_messages[index] = mail
		return


func _mail_exists(mail_id: String) -> bool:
	for mail_variant in inbox_messages:
		if typeof(mail_variant) != TYPE_DICTIONARY:
			continue
		if str((mail_variant as Dictionary).get("id", "")) == mail_id:
			return true
	return false


func _append_mail_once(mail: Dictionary) -> void:
	var mail_id: String = str(mail.get("id", ""))
	if mail_id.is_empty() or _mail_exists(mail_id):
		return
	inbox_messages.insert(0, mail)


func _launch_followup_mail() -> Dictionary:
	return {
		"id": "mail_launch_followup",
		"category_id": "assistant",
		"is_internal": true,
		"requires_response": false,
		"sender": "Team Manager",
		"subject": "Launch priorities confirmed",
		"preview": "Good. The briefing is cleared, so the launch now comes down to execution...",
		"time": _mail_sent_date_label(),
		"initials": "TM",
		"stripe_color": Color("1D93C1"),
		"portrait_id": "partner-partner-0006",
		"unread": true,
		"priority": "must_do",
		"status_label": "Open Action",
		"action_type": "navigate",
		"action_label": "Open Market",
		"action_target_label": "Market",
		"action_target_context": "marketplace",
		"action_scene_path": MARKETPLACE_SCENE_PATH,
		"resolve_on_action": false,
		"resolved": false,
		"starred": true,
		"archived": false,
		"thread_id": "launch/day1",
		"detail_title": "Launch Priorities Confirmed",
		"detail_from": "Team Manager",
		"detail_role": "Team Operations",
		"detail_body": "With the briefing cleared, the launch is now about execution. The car decision is first, then the series entry that turns this from a plan into a real race programme.",
		"detail_blocks": [
			{"type": "paragraph", "text": "Team Principal,\n\nGood. The opening brief is acknowledged and everyone knows you have the launch in hand."},
			{"type": "heading", "text": "What I Need Next"},
			{"type": "paragraph", "text": "Go straight to the market and commit to the first car. Once that is done, the series office packet becomes the key action item."},
		],
	}


func _post_purchase_followup_mail(listing: Dictionary) -> Dictionary:
	var car_name: String = str(listing.get("card_title", "Launch Car")).replace("\n", " ")
	var car_class_text := str(listing.get("class_name", "")).strip_edges()
	var manufacturer := _manufacturer_label_from_listing(listing)
	var car_descriptor := car_name
	if not manufacturer.is_empty():
		car_descriptor = "%s %s" % [manufacturer, car_name]
	var class_clause := " in %s" % car_class_text if not car_class_text.is_empty() else ""
	return {
		"id": "mail_post_purchase_transition",
		"category_id": "assistant",
		"is_internal": true,
		"requires_response": false,
		"sender": "Team Manager",
		"subject": "%s signed — now let's race it" % car_descriptor,
		"preview": "That was the first real commitment. Now convert it into a championship entry...",
		"time": _mail_sent_date_label(),
		"initials": "TM",
		"stripe_color": Color("1D93C1"),
		"portrait_id": "partner-partner-0006",
		"unread": true,
		"priority": "must_do",
		"status_label": "Next Step",
		"action_type": "navigate",
		"action_label": "Open Series",
		"action_target_label": "Series",
		"action_target_context": "series",
		"action_scene_path": SERIES_SCENE_PATH,
		"resolve_on_action": false,
		"resolved": false,
		"starred": true,
		"archived": false,
		"thread_id": "launch/day1",
		"detail_title": "Launch Transition",
		"detail_from": "Team Manager",
		"detail_role": "Team Operations",
		"detail_body": "The %s is locked, the garage can move, and the next clean management step is series entry." % car_descriptor,
		"detail_blocks": [
			{"type": "paragraph", "text": "Team Principal,\n\nThe %s is signed and the operation finally looks tangible from the outside." % car_descriptor},
			{"type": "heading", "text": "What Changes Immediately"},
			{"type": "paragraph", "text": "Mechanics can prep the %s properly%s, suppliers stop guessing, and commercial conversations become easier to hold." % [car_name, class_clause]},
			{"type": "heading", "text": "What Matters Now"},
			{"type": "paragraph", "text": "Open the series office and enter a championship this car is eligible for, so this stops reading like a launch project and starts reading like an active team."},
		],
	}


func _purchase_confirmation_mail(listing: Dictionary, transaction_kind: String) -> Dictionary:
	var is_lease := transaction_kind == "lease"
	var action_label: String = "Lease confirmed" if is_lease else "Purchase confirmed"
	var deal_word := "lease" if is_lease else "purchase"
	var car_name := str(listing.get("card_title", "Launch car")).replace("\n", " ")
	var car_class_text := str(listing.get("class_name", "")).strip_edges()
	var manufacturer := _manufacturer_label_from_listing(listing)
	var car_descriptor := car_name
	if not manufacturer.is_empty():
		car_descriptor = "%s %s" % [manufacturer, car_name]
	var class_clause := " It is homologated for %s." % car_class_text if not car_class_text.is_empty() else ""
	return {
		"id": "mail_purchase_%s" % str(listing.get("id", "launch")),
		"category_id": "team",
		"is_internal": true,
		"requires_response": false,
		"sender": "Race Engineering",
		"subject": "%s: %s" % [action_label, car_descriptor],
		"preview": _fill_mail_template("The {car} {deal} is signed — the garage can start prep...", {"car": car_name, "deal": deal_word}),
		"time": _mail_sent_date_label(),
		"initials": "RE",
		"stripe_color": Color("1D93C1"),
		"priority": "review_soon",
		"status_label": "Contract Signed",
		"action_type": "navigate",
		"action_label": "Open Series",
		"action_target_label": "Series",
		"action_target_context": "series",
		"action_scene_path": SERIES_SCENE_PATH,
		"resolve_on_action": false,
		"resolved": true,
		"starred": false,
		"archived": false,
		"thread_id": "launch/day1",
		"unread": true,
		"detail_title": action_label,
		"detail_from": "Race Engineering",
		"detail_role": "Race Engineer",
		"detail_body": "The %s %s is signed. The workshop can prepare the chassis and the next step is entering an eligible championship." % [deal_word, car_descriptor],
		"detail_blocks": [
			{"type": "paragraph", "text": "Team Principal,\n\nThe %s %s is done.%s" % [deal_word, car_descriptor, class_clause]},
			{"type": "heading", "text": "Garage Prep"},
			{"type": "paragraph", "text": "We can now set baseline geometry and a starting setup for the %s. Expect the first weekend to be a learning run while we calibrate to real pace." % car_name},
			{"type": "heading", "text": "Next Step"},
			{"type": "paragraph", "text": "Enter a series this car is eligible for. Once we're on a grid I'll send a setup brief before each round."},
		],
		"portrait_id": "partner-partner-0005",
	}


func _fleet_purchase_mail(listing: Dictionary, transaction_kind: String) -> Dictionary:
	var is_lease := transaction_kind == "lease"
	var action_label: String = "Lease added to fleet" if is_lease else "Car added to fleet"
	var deal_word := "lease" if is_lease else "purchase"
	var car_name := str(listing.get("card_title", "Car")).replace("\n", " ")
	var car_class_text := str(listing.get("class_name", "")).strip_edges()
	var manufacturer := _manufacturer_label_from_listing(listing)
	var car_descriptor := car_name
	if not manufacturer.is_empty():
		car_descriptor = "%s %s" % [manufacturer, car_name]
	var class_clause := " It is homologated for %s." % car_class_text if not car_class_text.is_empty() else ""
	return {
		"id": "mail_fleet_%s" % str(listing.get("id", "car")),
		"category_id": "team",
		"is_internal": true,
		"requires_response": false,
		"sender": "Race Engineering",
		"subject": "%s: %s" % [action_label, car_descriptor],
		"preview": _fill_mail_template("The {car} {deal} is signed and the chassis is on its way to the garage.", {"car": car_name, "deal": deal_word}),
		"time": _mail_sent_date_label(),
		"initials": "RE",
		"stripe_color": Color("1D93C1"),
		"priority": "fyi",
		"status_label": "Fleet Updated",
		"action_type": "navigate",
		"action_label": "Open Garage",
		"action_target_label": "Garage",
		"action_target_context": "car",
		"action_scene_path": GARAGE_SCENE_PATH,
		"resolve_on_action": false,
		"resolved": true,
		"starred": false,
		"archived": false,
		"thread_id": "fleet/%s" % str(listing.get("id", "car")),
		"unread": true,
		"detail_title": action_label,
		"detail_from": "Race Engineering",
		"detail_role": "Race Engineer",
		"detail_body": "The %s %s is signed and joins the fleet. You can run it in any series it is eligible for." % [deal_word, car_descriptor],
		"detail_blocks": [
			{"type": "paragraph", "text": "Team Principal,\n\nThe %s %s is done.%s It is now part of the active fleet." % [deal_word, car_descriptor, class_clause]},
			{"type": "heading", "text": "Garage"},
			{"type": "paragraph", "text": "We'll prep the chassis alongside the rest of the fleet. Pick it from the car options when entering an eligible series."},
		],
		"portrait_id": "partner-partner-0005",
	}


func _auction_lot_descriptor(listing: Dictionary) -> String:
	var car_name := str(listing.get("card_title", "Lot")).replace("\n", " ")
	var manufacturer := _manufacturer_label_from_listing(listing)
	if not manufacturer.is_empty():
		return "%s %s" % [manufacturer, car_name]
	return car_name


func _auction_mail_base(listing: Dictionary, mail_suffix: String, subject: String, preview: String, priority: String, status_label: String, blocks: Array, action_label: String = "Open Marketplace") -> Dictionary:
	return {
		"id": "mail_auction_%s_%s" % [mail_suffix, str(listing.get("id", "lot"))],
		"category_id": "team",
		"is_internal": true,
		"requires_response": false,
		"sender": "Auction Desk",
		"subject": subject,
		"preview": preview,
		"time": _mail_sent_date_label(),
		"initials": "AD",
		"stripe_color": Color("C9A227"),
		"priority": priority,
		"status_label": status_label,
		"action_type": "navigate",
		"action_label": action_label,
		"action_target_label": "Marketplace",
		"action_target_context": "marketplace",
		"action_scene_path": MARKETPLACE_SCENE_PATH,
		"resolve_on_action": false,
		"resolved": true,
		"starred": false,
		"archived": false,
		"thread_id": "auction/%s" % str(listing.get("id", "lot")),
		"unread": true,
		"detail_title": status_label,
		"detail_from": "Auction Desk",
		"detail_role": "Auction House",
		"detail_body": preview,
		"detail_blocks": blocks,
		"portrait_id": "partner-partner-0005",
	}


func _auction_outbid_mail(listing: Dictionary, auction: Dictionary) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	var current_bid := _fmt_money_compact(float(auction.get("current_bid", 0.0)))
	return _auction_mail_base(
		listing,
		"outbid",
		"Outbid: %s" % descriptor,
		"You have been outbid on %s — the standing bid is now %s." % [descriptor, current_bid],
		"action_now",
		"Outbid",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nA rival has topped your bid on the %s." % descriptor},
			{"type": "heading", "text": "Standing Bid"},
			{"type": "paragraph", "text": "The current high bid is %s. Raise your maximum from the marketplace if you still want the lot." % current_bid},
		],
		"Re-bid"
	)


func _auction_won_mail(listing: Dictionary, auction: Dictionary, winning_bid: float, premium: float) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	var total := _fmt_money_compact(winning_bid + premium)
	return _auction_mail_base(
		listing,
		"won",
		"Lot won: %s" % descriptor,
		"You won %s for a hammer total of %s (incl. buyer's premium)." % [descriptor, total],
		"review_soon",
		"Lot Won",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nCongratulations — the %s is yours." % descriptor},
			{"type": "heading", "text": "Settlement"},
			{"type": "paragraph", "text": "Winning bid %s plus buyer's premium %s, settled from escrow. The car is being delivered to the garage." % [_fmt_money_compact(winning_bid), _fmt_money_compact(premium)]},
		],
		"Open Garage"
	)


func _auction_lost_mail(listing: Dictionary, auction: Dictionary, winning_bid: float) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	return _auction_mail_base(
		listing,
		"lost",
		"Lot sold: %s" % descriptor,
		"The %s sold to a rival for %s. Your escrow has been released." % [descriptor, _fmt_money_compact(winning_bid)],
		"fyi",
		"Lot Sold",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nThe %s went to a rival bidder at %s." % [descriptor, _fmt_money_compact(winning_bid)]},
			{"type": "heading", "text": "Escrow"},
			{"type": "paragraph", "text": "Your held funds have been released back to the team balance."},
		]
	)


func _auction_unsold_mail(listing: Dictionary, auction: Dictionary) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	return _auction_mail_base(
		listing,
		"unsold",
		"Lot unsold: %s" % descriptor,
		"The %s failed to meet its reserve and went unsold. Your escrow has been released." % descriptor,
		"fyi",
		"Reserve Not Met",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nThe %s did not reach its reserve price and was withdrawn." % descriptor},
			{"type": "heading", "text": "Escrow"},
			{"type": "paragraph", "text": "Your held funds have been released back to the team balance."},
		]
	)


func _seller_auction_sold_mail(listing: Dictionary, auction: Dictionary, winning_bid: float, commission: float, net: float) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	return _auction_mail_base(
		listing,
		"sold_out",
		"Sold: %s" % descriptor,
		"Your %s sold for %s. Net %s after commission." % [descriptor, _fmt_money_compact(winning_bid), _fmt_money_compact(net)],
		"review_soon",
		"Car Sold",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nYour listing for the %s found a buyer at the hammer." % descriptor},
			{"type": "heading", "text": "Settlement"},
			{"type": "paragraph", "text": "Hammer price %s less auction-house commission %s. Net proceeds of %s have been credited to the team balance, and the car has left the garage." % [_fmt_money_compact(winning_bid), _fmt_money_compact(commission), _fmt_money_compact(net)]},
		],
		"Open Garage"
	)


func _seller_auction_unsold_mail(listing: Dictionary, auction: Dictionary) -> Dictionary:
	var descriptor := _auction_lot_descriptor(listing)
	return _auction_mail_base(
		listing,
		"seller_unsold",
		"Not sold: %s" % descriptor,
		"Your %s did not reach reserve and stays in the garage." % descriptor,
		"fyi",
		"Reserve Not Met",
		[
			{"type": "paragraph", "text": "Team Principal,\n\nBidding on your %s closed below the reserve you set." % descriptor},
			{"type": "heading", "text": "Outcome"},
			{"type": "paragraph", "text": "The car remains in your fleet. You can relist it at a lower reserve whenever you like."},
		],
		"Open Garage"
	)


func _race_result_debrief_mail(repo: RefCounted, world: WorldStateScr, result: Dictionary) -> Dictionary:
	var player_position: int = int(result.get("player_position", 0))
	var points_awarded: int = int(result.get("points_awarded", 0))
	var prize_money: float = float(result.get("prize_money", 0.0))
	var championship_label := _championship_display_name(repo, str(result.get("championship_id", _primary_championship_id_from_world(world))))
	var position_label := "DNF" if bool(result.get("dnf", false)) else ("P%d" % player_position if player_position > 0 else "Classified")
	var maintenance_cost := float(result.get("maintenance_cost", 0.0))
	var condition_label := str(result.get("car_condition_label_after", ""))
	var garage_blocks: Array = []
	if maintenance_cost > 0.0 or not condition_label.is_empty():
		var garage_text := "Weekend running costs: %s." % _fmt_money_compact(maintenance_cost)
		if not condition_label.is_empty():
			garage_text += "\nCar condition is now rated %s. Worn systems cost pace, can fail scrutineering, and raise the risk of a DNF - book a Service in the garage to rebuild them before the next round." % condition_label
		garage_blocks = [
			{"type": "heading", "text": "Garage & Maintenance"},
			{"type": "paragraph", "text": garage_text},
		]
	return _mail_dict(
		"mail_race_result_%s_%s" % [str(result.get("event_instance_id", "race")), str(result.get("session_type", "race"))],
		"team",
		"Race Engineering",
		"Operations",
		"%s debrief: %s" % [championship_label, position_label],
		"The garage has logged the result, points, and financial fallout from the weekend.",
		"Race Debrief",
		"",
		false,
		"",
		"RE",
		"",
		"partner-partner-0005",
		true,
		false,
		"",
		[
			{"type": "paragraph", "text": "Weekend complete. The telemetry result has now been committed into the career world rather than sitting as a one-off race screen outcome."},
			{"type": "heading", "text": "Outcome"},
			{"type": "paragraph", "text": "Result: %s\nPoints scored: %d\nPrize money: %s" % [position_label, points_awarded, _fmt_money_compact(prize_money)]},
			{"type": "heading", "text": "What Changed"},
			{"type": "paragraph", "text": "Championship standings, team momentum, cash position, season statistics, and race-week state have all been updated from this classification."},
		] + garage_blocks,
		"review_soon",
		position_label,
		"navigate",
		"Open Series",
		"Series",
		"series",
		SERIES_SCENE_PATH,
		false,
		false,
		true,
		false,
		"race/debrief"
	)


func _default_tutorial_state() -> Dictionary:
	return {
		"seen_screen_intros": {},
		"tutorials_enabled": true,
	}


func are_tutorials_enabled() -> bool:
	if tutorial_state.is_empty():
		return true
	return bool(tutorial_state.get("tutorials_enabled", true))


func set_tutorials_enabled(enabled: bool) -> void:
	if tutorial_state.is_empty():
		tutorial_state = _default_tutorial_state()
	tutorial_state["tutorials_enabled"] = enabled
	save_game()


func is_screen_intro_seen(section_id: String) -> bool:
	if tutorial_state.is_empty():
		return false
	var seen: Variant = tutorial_state.get("seen_screen_intros", {})
	if seen is Dictionary:
		return bool((seen as Dictionary).get(section_id, false))
	return false


func mark_screen_intro_seen(section_id: String) -> void:
	if tutorial_state.is_empty():
		tutorial_state = _default_tutorial_state()
	var seen_variant: Variant = tutorial_state.get("seen_screen_intros", {})
	var seen: Dictionary = seen_variant if seen_variant is Dictionary else {}
	if bool(seen.get(section_id, false)):
		return
	seen[section_id] = true
	tutorial_state["seen_screen_intros"] = seen
	save_game()


func reset_screen_intros() -> void:
	if tutorial_state.is_empty():
		tutorial_state = _default_tutorial_state()
	tutorial_state["seen_screen_intros"] = {}
	save_game()


## Persona used to voice the in-game tutorial assistant (the Team Manager who
## also sends the launch briefing thread).
func get_tutorial_persona() -> Dictionary:
	var slot: Dictionary = MAIL_SENDER_SLOTS.get("Team Manager", {}) as Dictionary
	var portrait_id := str(slot.get("fallback_portrait_id", "partner-partner-0006"))
	return {
		"name": str(slot.get("fallback_name", "Team Manager")),
		"role": str(slot.get("fallback_role", "Team Operations")),
		"initials": str(slot.get("fallback_initials", "TM")),
		"portrait_path": _mail_staff_portrait_path(portrait_id),
	}


func get_owner_driver_stats() -> Dictionary:
	return owner_driver_stats.duplicate(true)


## Replace the {OWNER} token in drivers'-championship rows with the founder's name.
func _substitute_owner_in_driver_standings() -> void:
	var owner_name := ("%s %s" % [str(founder_first_name), str(founder_last_name)]).strip_edges()
	if owner_name.is_empty():
		owner_name = "Owner"
	for row_variant: Variant in series_directory:
		if row_variant is Dictionary:
			_substitute_owner_in_rows((row_variant as Dictionary).get("driver_standings_rows", []), owner_name)
	if not active_series_detail.is_empty():
		_substitute_owner_in_rows(active_series_detail.get("driver_standings_rows", []), owner_name)


func _substitute_owner_in_rows(rows_variant: Variant, owner_name: String) -> void:
	if not rows_variant is Array:
		return
	for driver_row_variant: Variant in rows_variant as Array:
		if driver_row_variant is Dictionary and str((driver_row_variant as Dictionary).get("driver", "")) == "{OWNER}":
			(driver_row_variant as Dictionary)["driver"] = owner_name


func _default_owner_driver_stats() -> Dictionary:
	return {
		"starts": 0,
		"wins": 0,
		"podiums": 0,
		"points": 0.0,
		"top10": 0,
		"dnfs": 0,
		"fastest_laps": 0,
		"best_finish": 99,
		"rating": 0.0,
	}


## When the player races as owner (no signed driver on the entry), accumulate
## their personal racing record from the completed race classification.
## The car the player actually fielded for a championship (its entry car when
## available, otherwise the team's primary car).
func _raced_player_car(world: WorldStateScr, team: TeamStateScr, championship_id: String) -> CarStateScr:
	if world == null or team == null:
		return null
	var car_id := ""
	if not championship_id.strip_edges().is_empty():
		var entry := _entry_for_team_and_championship(world, world.player_team_instance_id, championship_id)
		if entry != null and not entry.car_instance_id.strip_edges().is_empty():
			car_id = entry.car_instance_id
	if car_id.is_empty() and team.car_instance_ids.size() > 0:
		car_id = str(team.car_instance_ids[0])
	if car_id.is_empty() or not world.cars.has(car_id):
		return null
	return world.cars[car_id] as CarStateScr


## Degrade the fielded car after a race weekend and charge maintenance. Wear and
## the rebuild bill scale with how hard the weekend was, so worn/used cars cost
## more to keep on track than fresh ones. Annotates `result` for the debrief mail.
func _apply_post_race_car_wear(world: WorldStateScr, result: Dictionary) -> void:
	if world == null:
		return
	var team := _player_team_from_world(world)
	if team == null:
		return
	var car := _raced_player_car(world, team, str(result.get("championship_id", "")))
	if car == null:
		return
	var session_type := str(result.get("session_type", "race"))
	var is_dnf := bool(result.get("dnf", false))
	var base_wear := 0.06 if session_type == "race" else 0.02
	var mileage_gain := 320.0 if session_type == "race" else 90.0
	var rng := RandomNumberGenerator.new()
	rng.seed = hash("%s|%s|%s|wear" % [car.instance_id, str(result.get("event_instance_id", "")), session_type])
	var condition_before := _car_average_condition(world, car)
	var slot_keys: Array = car.installed_part_instance_ids.keys()
	var failure_part_id := ""
	if is_dnf and slot_keys.size() > 0:
		failure_part_id = str(car.installed_part_instance_ids[slot_keys[rng.randi_range(0, slot_keys.size() - 1)]])
	for slot_variant: Variant in slot_keys:
		var part_id := str(car.installed_part_instance_ids[slot_variant])
		if not world.parts.has(part_id):
			continue
		var part: PartStateScr = world.parts[part_id] as PartStateScr
		if part == null:
			continue
		# Each system wears at its own rate (engine/gearbox hardest, chassis least).
		var system_rate := float(SYSTEM_WEAR_RATE.get(str(slot_variant), 1.0))
		var wear := base_wear * system_rate * rng.randf_range(0.8, 1.25)
		if part_id == failure_part_id:
			wear += rng.randf_range(0.12, 0.22)
		part.condition = clampf(part.condition - wear, 0.05, 1.0)
		part.mileage += mileage_gain
	var condition_after := _car_average_condition(world, car)
	var wear_delta := maxf(0.0, condition_before - condition_after)
	# Unavoidable running cost for the weekend (consumables, fluids, basic checks),
	# scaled by how hard the car was worked. Restoring lost condition is a separate
	# decision handled by the manual garage Service action.
	var maintenance_cost := roundf((wear_delta * 90000.0) + 8000.0 + (12000.0 if is_dnf else 0.0))
	var budget := _player_budget_from_world(world)
	if budget != null and maintenance_cost > 0.0:
		budget.cash = maxf(0.0, budget.cash - maintenance_cost)
	result["maintenance_cost"] = maintenance_cost
	result["car_condition_after"] = condition_after
	result["car_condition_label_after"] = _condition_label_from_ratio(condition_after)


func _update_owner_driver_stats(result: Dictionary) -> void:
	var classification: Variant = result.get("classification", [])
	if not classification is Array:
		return
	var player_row: Dictionary = {}
	for row_variant: Variant in classification as Array:
		if row_variant is Dictionary and bool((row_variant as Dictionary).get("is_player", false)):
			player_row = row_variant
			break
	if player_row.is_empty():
		return
	# Only attribute to the owner when no signed driver carried the entry.
	if not str(player_row.get("driver_instance_id", "")).strip_edges().is_empty():
		return

	var stats := owner_driver_stats if not owner_driver_stats.is_empty() else _default_owner_driver_stats()
	for key_variant: Variant in _default_owner_driver_stats().keys():
		if not stats.has(key_variant):
			stats[key_variant] = _default_owner_driver_stats()[key_variant]

	var class_position := int(result.get("player_class_position", player_row.get("class_position", 99)))
	if class_position <= 0:
		class_position = int(result.get("player_position", 99))
	var is_dnf := bool(result.get("dnf", player_row.get("dnf", false)))

	stats["starts"] = int(stats.get("starts", 0)) + 1
	stats["points"] = float(stats.get("points", 0.0)) + float(result.get("points_awarded", 0))
	if is_dnf:
		stats["dnfs"] = int(stats.get("dnfs", 0)) + 1
	else:
		if class_position == 1:
			stats["wins"] = int(stats.get("wins", 0)) + 1
		if class_position <= 3:
			stats["podiums"] = int(stats.get("podiums", 0)) + 1
		if class_position <= 10:
			stats["top10"] = int(stats.get("top10", 0)) + 1
		stats["best_finish"] = mini(int(stats.get("best_finish", 99)), class_position)
	if bool(player_row.get("fastest_lap_bonus", false)):
		stats["fastest_laps"] = int(stats.get("fastest_laps", 0)) + 1

	stats["rating"] = _drift_owner_rating(float(stats.get("rating", 0.0)), class_position, is_dnf)
	owner_driver_stats = stats


## Balanced owner reputation drift around a neutral 60 baseline, clamped [40, 95].
func _drift_owner_rating(current_rating: float, class_position: int, is_dnf: bool) -> float:
	var rating := current_rating if current_rating > 0.0 else 60.0
	var delta := 0.0
	if is_dnf:
		delta = -0.5
	elif class_position == 1:
		delta = 0.8
	elif class_position <= 3:
		delta = 0.4
	elif class_position <= 10:
		delta = 0.15
	else:
		delta = -0.1
	return clampf(rating + delta, 40.0, 95.0)


func _player_sponsor_tier() -> String:
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return "regional"
	var budget := _player_budget_from_world(_runtime_world as WorldStateScr)
	return str(budget.sponsor_tier) if budget != null else "regional"


const SEASON_TARGET_PCT_BY_TIER := {
	"global": 0.15,
	"international": 0.25,
	"national": 0.40,
	"regional": 0.55,
	"local": 0.70,
}


## Set the board/sponsor season target for an entered championship, scaled by the
## team's sponsor tier against the size of the field.
func _set_season_expectation(series_id: String) -> Dictionary:
	var field_size := int(active_series_detail.get("grid_size", 0))
	if field_size <= 0:
		var standings_rows: Variant = active_series_detail.get("overall_standings_rows", active_series_detail.get("standings_rows", []))
		field_size = (standings_rows as Array).size() if standings_rows is Array else 0
	if field_size <= 0:
		field_size = 12
	var tier := _player_sponsor_tier()
	var pct := float(SEASON_TARGET_PCT_BY_TIER.get(tier, 0.55))
	var target := clampi(int(round(float(field_size) * pct)), 1, field_size)
	var expectation := {
		"target_position": target,
		"field_size": field_size,
		"tier": tier,
		"label": "Finish inside P%d of a %d-car field" % [target, field_size],
	}
	season_expectations[series_id] = expectation
	return expectation


func _board_expectation_mail(series_id: String, expectation: Dictionary) -> Dictionary:
	var series_label := str(active_series_detail.get("name", active_series_detail.get("short_name", "the championship")))
	var target := int(expectation.get("target_position", 0))
	var field_size := int(expectation.get("field_size", 0))
	var blocks: Array = [
		{"type": "paragraph", "text": "Team Principal,\n\nNow that we are committed to %s, the board and our sponsors have set the season objective." % series_label},
		{"type": "heading", "text": "Season Objective"},
		{"type": "paragraph", "text": "%s.\n\nMeet it and the performance bonus clears at season end. Beat it and the bonus scales up. Fall short and expect the sponsors to claw some of it back." % str(expectation.get("label", "Finish competitively"))},
	]
	return _mail_dict(
		"mail_board_target_%s" % series_id.replace(".", "_"),
		"team",
		"Ownership Board",
		"Board & Sponsor Relations",
		_fill_mail_template("Season objective: {series}", {"series": series_label}),
		_fill_mail_template("The board has set our {series} target...", {"series": series_label}),
		"Season Objective",
		"Target: finish inside P%d of %d." % [target, field_size],
		false,
		"",
		"BD",
		"",
		"partner-partner-0008",
		true,
		false,
		"",
		blocks,
		"review_soon",
		"Objective Set",
		"navigate",
		"Open Series",
		"Series",
		"series",
		SERIES_SCENE_PATH,
		false,
		false,
		false,
		false,
		"series/%s" % series_id
	)


## Compare the player's championship finish to the board target, apply a sponsor
## performance bonus/penalty to the player budget, and nudge owner reputation.
func _evaluate_board_verdict(world: WorldStateScr, series_id: String, player_position: int) -> Dictionary:
	var expectation: Dictionary = season_expectations.get(series_id, {}) if season_expectations.get(series_id, {}) is Dictionary else {}
	if expectation.is_empty() or player_position <= 0:
		return {}
	var target := int(expectation.get("target_position", 0))
	var verdict := "met"
	if player_position < target - 1:
		verdict = "exceeded"
	elif player_position > target + 1:
		verdict = "missed"
	var per_place := 55000.0
	var bonus := clampf(float(target - player_position) * per_place, -180000.0, 260000.0)
	if absf(bonus) >= 1.0:
		var budget := _player_budget_from_world(world)
		if budget != null:
			budget.cash += bonus
	# Reputation nudge for the owner who carries the programme.
	if not owner_driver_stats.is_empty():
		var rep := float(owner_driver_stats.get("rating", 60.0))
		var rep_delta := 1.5 if verdict == "exceeded" else (-1.5 if verdict == "missed" else 0.4)
		owner_driver_stats["rating"] = clampf(rep + rep_delta, 40.0, 95.0)
	return {
		"verdict": verdict,
		"target_position": target,
		"field_size": int(expectation.get("field_size", 0)),
		"player_position": player_position,
		"bonus": bonus,
		"bonus_label": _fmt_money_compact(absf(bonus)),
	}


func _board_verdict_mail(repo: RefCounted, series_id: String, verdict_info: Dictionary) -> Dictionary:
	var series_label := _championship_display_name(repo, series_id)
	var verdict := str(verdict_info.get("verdict", "met"))
	var bonus := float(verdict_info.get("bonus", 0.0))
	var headline := ""
	match verdict:
		"exceeded":
			headline = "Above target — the sponsors are delighted."
		"missed":
			headline = "Below target — the sponsors have clawed back part of the bonus."
		_:
			headline = "Target met — the performance bonus is confirmed."
	var money_line := ""
	if bonus > 1.0:
		money_line = "Performance bonus paid: %s." % _fmt_money_compact(bonus)
	elif bonus < -1.0:
		money_line = "Performance penalty deducted: %s." % _fmt_money_compact(absf(bonus))
	else:
		money_line = "No bonus adjustment this season."
	var blocks: Array = [
		{"type": "paragraph", "text": "Team Principal,\n\n%s" % headline},
		{"type": "heading", "text": "Objective"},
		{"type": "paragraph", "text": "Target was P%d of %d. We finished P%d." % [
			int(verdict_info.get("target_position", 0)),
			int(verdict_info.get("field_size", 0)),
			int(verdict_info.get("player_position", 0)),
		]},
		{"type": "heading", "text": "Sponsor Settlement"},
		{"type": "paragraph", "text": money_line},
	]
	return _mail_dict(
		"mail_board_verdict_%s" % series_id.replace(".", "_"),
		"team",
		"Ownership Board",
		"Board & Sponsor Relations",
		_fill_mail_template("Season verdict: {series}", {"series": series_label}),
		_fill_mail_template("The board has reviewed our {series} campaign...", {"series": series_label}),
		"Season Verdict",
		headline,
		false,
		"",
		"BD",
		"",
		"partner-partner-0008",
		true,
		false,
		"",
		blocks,
		"review_soon",
		("Above Target" if verdict == "exceeded" else ("Below Target" if verdict == "missed" else "Target Met")),
		"navigate",
		"Open Standings",
		"Series",
		"series",
		SERIES_SCENE_PATH,
		false,
		true,
		verdict == "exceeded",
		false,
		"series/%s" % series_id
	)


## Pay the end-of-season championship payout once a series' rounds are all done.
func _maybe_pay_championship_finale(repo: RefCounted, world: WorldStateScr, championship_id: String) -> void:
	if championship_id.is_empty() or championship_finales_paid.has(championship_id):
		return
	if not _championship_rounds_complete(world, championship_id):
		return
	var summary: Dictionary = RaceResultProcessorScr.pay_championship_finale(repo, world, championship_id)
	if not bool(summary.get("ok", false)):
		return
	championship_finales_paid[championship_id] = true
	var verdict_info := _evaluate_board_verdict(world, championship_id, int(summary.get("player_position", 0)))
	_store_season_summary(repo, world, championship_id, summary, verdict_info)
	_append_mail_once(_championship_finale_mail(repo, world, championship_id, summary))
	if not verdict_info.is_empty():
		_append_mail_once(_board_verdict_mail(repo, championship_id, verdict_info))


func get_season_summaries() -> Array:
	return season_summaries.duplicate(true)


func get_latest_season_summary() -> Dictionary:
	if season_summaries.is_empty():
		return {}
	var last: Variant = season_summaries[season_summaries.size() - 1]
	return (last as Dictionary).duplicate(true) if last is Dictionary else {}


## Returns the most recent season summary the player has not yet reviewed, so the
## Series screen can surface the season-review screen exactly once per season.
func get_unreviewed_season_summary() -> Dictionary:
	for index in range(season_summaries.size() - 1, -1, -1):
		var record_variant: Variant = season_summaries[index]
		if record_variant is Dictionary and not bool((record_variant as Dictionary).get("reviewed", false)):
			return (record_variant as Dictionary).duplicate(true)
	return {}


func mark_season_summary_reviewed(championship_id: String) -> void:
	for index in range(season_summaries.size()):
		var record_variant: Variant = season_summaries[index]
		if record_variant is Dictionary and str((record_variant as Dictionary).get("championship_id", "")) == championship_id:
			(record_variant as Dictionary)["reviewed"] = true
	save_game()


## Championships whose current edition has finished and been paid out, so the player
## can re-sign for next year's running. Each entry is {id, name, next_year}. Drives
## the per-series re-entry prompt on the Series screen.
func get_series_awaiting_reentry() -> Array:
	var out: Array = []
	if _runtime_world == null or not _runtime_world is WorldStateScr:
		return out
	var repo: RefCounted = _content_repository()
	for series_id_variant: Variant in championship_finales_paid.keys():
		var series_id := String(series_id_variant)
		if series_id.is_empty() or not bool(championship_finales_paid.get(series_id, false)):
			continue
		var catalog: Dictionary = _series_catalog_row_by_id(series_id)
		var first_week := 0
		var tracks_variant: Variant = catalog.get("schedule_tracks", [])
		if tracks_variant is Array and not (tracks_variant as Array).is_empty():
			var first_row: Variant = (tracks_variant as Array)[0]
			if first_row is Dictionary:
				first_week = int((first_row as Dictionary).get("week", 0))
		var next_edition := int(championship_editions.get(series_id, 0)) + 1
		var next_year: int = _year_for_week(first_week + next_edition * WEEKS_PER_SEASON) if first_week > 0 else current_year + 1
		out.append({
			"id": series_id,
			"name": _championship_display_name(repo, series_id) if repo != null else series_id,
			"next_year": next_year,
		})
	return out


## Build and archive a season-review record from the finale payout summary.
func _store_season_summary(repo: RefCounted, world: WorldStateScr, championship_id: String, summary: Dictionary, verdict_info: Dictionary = {}) -> void:
	var series_label := _championship_display_name(repo, championship_id)
	var player_team_id := str(world.player_team_instance_id)

	var constructor_rows: Array = []
	for row_variant: Variant in (summary.get("standings", []) as Array):
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant
		constructor_rows.append({
			"position": int(row.get("position", 0)),
			"team": _team_display_name_from_world(world, str(row.get("team_id", ""))),
			"points": int(round(float(row.get("points", 0.0)))),
			"payout": float(row.get("payout", 0.0)),
			"payout_label": _fmt_money_compact(float(row.get("payout", 0.0))),
			"is_player": bool(row.get("is_player", false)),
		})

	var owner_name := ("%s %s" % [str(founder_first_name), str(founder_last_name)]).strip_edges()
	if owner_name.is_empty():
		owner_name = "Owner"
	var driver_rows_raw: Array = PrototypeStateAdapterScr._driver_standings_table(repo, world, championship_id, player_team_id)
	var driver_rows: Array = []
	var champion_driver := ""
	for row_variant: Variant in driver_rows_raw:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = (row_variant as Dictionary).duplicate(true)
		if str(row.get("driver", "")) == "{OWNER}":
			row["driver"] = owner_name
		if int(row.get("pos", 0)) == 1:
			champion_driver = str(row.get("driver", ""))
		driver_rows.append({
			"position": int(row.get("pos", 0)),
			"driver": str(row.get("driver", "")),
			"team": str(row.get("team", "")),
			"points": int(round(float(row.get("points_value", 0.0)))),
			"is_player": bool(row.get("is_player", false)),
		})

	var record := {
		"championship_id": championship_id,
		"series_label": series_label,
		"year": current_year,
		"champion_team_id": str(summary.get("champion_team_id", "")),
		"champion_team": _team_display_name_from_world(world, str(summary.get("champion_team_id", ""))),
		"champion_driver": champion_driver,
		"player_position": int(summary.get("player_position", 0)),
		"player_payout": float(summary.get("player_payout", 0.0)),
		"player_payout_label": _fmt_money_compact(float(summary.get("player_payout", 0.0))),
		"constructor_standings": constructor_rows,
		"driver_standings": driver_rows,
		"owner_season": owner_driver_stats.duplicate(true),
		"board_verdict": str(verdict_info.get("verdict", "")),
		"board_target_position": int(verdict_info.get("target_position", 0)),
		"board_bonus": float(verdict_info.get("bonus", 0.0)),
		"board_bonus_label": str(verdict_info.get("bonus_label", "")),
	}
	season_summaries.append(record)


func _championship_rounds_complete(world: WorldStateScr, championship_id: String) -> bool:
	var expected := _expected_rounds_for_entered_series(championship_id)
	if expected <= 0:
		return false
	var completed := 0
	for event_variant: Variant in world.race_events.values():
		if not event_variant is Object:
			continue
		if String(event_variant.championship_id) != championship_id:
			continue
		if str(event_variant.status) == "completed":
			completed += 1
	return completed >= expected


func _team_display_name_from_world(world: WorldStateScr, team_id: String) -> String:
	if team_id.is_empty() or not world.teams.has(team_id):
		return "Unknown Team"
	var team = world.teams[team_id]
	if team == null:
		return "Unknown Team"
	var startup: Dictionary = team.startup_profile if team.startup_profile is Dictionary else {}
	var name := str(startup.get("team_display_name", startup.get("team_name", ""))).strip_edges()
	if name.is_empty():
		name = str(team.display_name).strip_edges()
	return name if not name.is_empty() else "Unknown Team"


func _championship_finale_mail(repo: RefCounted, world: WorldStateScr, championship_id: String, summary: Dictionary) -> Dictionary:
	var series_label := _championship_display_name(repo, championship_id)
	var player_position := int(summary.get("player_position", 0))
	var player_payout := float(summary.get("player_payout", 0.0))
	var champion_team_id := str(summary.get("champion_team_id", ""))
	var champion_name := _team_display_name_from_world(world, champion_team_id)
	var standings: Array = summary.get("standings", []) if summary.get("standings", []) is Array else []

	var standings_lines: Array = []
	for row_variant: Variant in standings:
		if not row_variant is Dictionary:
			continue
		var row: Dictionary = row_variant
		var position := int(row.get("position", 0))
		if position > 8:
			break
		var team_name := _team_display_name_from_world(world, str(row.get("team_id", "")))
		var marker := "  ← you" if bool(row.get("is_player", false)) else ""
		standings_lines.append("P%d  %s — %d pts  (+%s)%s" % [
			position,
			team_name,
			int(round(float(row.get("points", 0.0)))),
			_fmt_money_compact(float(row.get("payout", 0.0))),
			marker,
		])

	var player_won := player_position == 1
	var headline := ""
	if player_won:
		headline = "Champions. %s title is ours." % series_label
	elif player_position > 0:
		headline = "%s wraps up — we finished P%d." % [series_label, player_position]
	else:
		headline = "%s season concluded." % series_label

	var blocks: Array = [
		{"type": "paragraph", "text": "Team Principal,\n\n%s\n\nThe championship is settled and the season payout has cleared into the account." % headline},
		{"type": "heading", "text": "Champion"},
		{"type": "paragraph", "text": "%s takes the title." % champion_name},
		{"type": "heading", "text": "Final Standings"},
		{"type": "paragraph", "text": "\n".join(PackedStringArray(standings_lines)) if not standings_lines.is_empty() else "Standings unavailable."},
		{"type": "heading", "text": "Our Payout"},
		{"type": "paragraph", "text": ("Season payout banked: %s." % _fmt_money_compact(player_payout)) if player_payout > 0.0 else "No payout recorded for our entry this season."},
	]
	return _mail_dict(
		"mail_finale_%s" % championship_id.replace(".", "_"),
		"team",
		"Series Office",
		"Championship Administration",
		_fill_mail_template("Season payout: {series}", {"series": series_label}),
		_fill_mail_template("The {series} season is settled and the title payout has cleared...", {"series": series_label}),
		"Season Payout",
		headline,
		false,
		"",
		"SO",
		"",
		"partner-partner-0008",
		true,
		false,
		"",
		blocks,
		"review_soon",
		("Champion" if player_won else "Season Over"),
		"navigate",
		"Open Standings",
		"Series",
		"series",
		SERIES_SCENE_PATH,
		false,
		true,
		player_won,
		false,
		"series/%s" % championship_id
	)


## Replace {token} placeholders in a template string with values from context.
## Keeps email copy centralised and data-driven instead of hand-built per call.
func _fill_mail_template(template: String, context: Dictionary) -> String:
	var result := template
	for key_variant: Variant in context.keys():
		result = result.replace("{%s}" % str(key_variant), str(context[key_variant]))
	return result


## Human-readable manufacturer label from a marketplace listing's car_filter id.
func _manufacturer_label_from_listing(listing: Dictionary) -> String:
	var raw := str(listing.get("car_filter", "")).strip_edges()
	if raw.is_empty():
		return ""
	if raw.to_lower() == "all":
		return ""
	return raw.replace("_", " ").capitalize()


## Multi-line season schedule summary for a series-entry confirmation email.
func _series_calendar_overview_lines(series_detail: Dictionary, limit: int = 14) -> String:
	var rounds_variant: Variant = series_detail.get("rounds_data", [])
	if not rounds_variant is Array:
		return ""
	var lines: Array = []
	var round_number := 0
	for row_variant: Variant in rounds_variant:
		if not row_variant is Dictionary:
			continue
		round_number += 1
		var row: Dictionary = row_variant
		var track := str(row.get("track", "TBD")).strip_edges()
		if track.is_empty():
			track = "TBD"
		var week := int(row.get("week_number", _parse_series_week(str(row.get("week", "")))))
		var date_label := _series_round_date_label(week, 5) if week > 0 else ""
		var line := "Round %d  •  %s" % [round_number, track]
		if not date_label.is_empty():
			line += "  •  %s" % date_label
		lines.append(line)
		if lines.size() >= limit:
			break
	return "\n".join(PackedStringArray(lines))


func _series_entry_confirmed_mail(series_detail: Dictionary, car_label: String) -> Dictionary:
	var series_name := str(series_detail.get("name", series_detail.get("title", "the championship"))).strip_edges()
	var series_id := str(series_detail.get("id", "series"))
	var round_total := _expected_rounds_for_entered_series(series_id)
	var calendar_lines := _series_calendar_overview_lines(series_detail)
	var is_multiclass := bool(series_detail.get("is_multiclass", false))
	var class_label := str(series_detail.get("player_class_label", "")).strip_edges()
	var intro := _fill_mail_template(
		"Team Principal,\n\nIt's official — {series} has accepted our entry with the {car}. The office has logged us on the grid for the full season.",
		{"series": series_name, "car": car_label}
	)
	var blocks: Array = [
		{"type": "paragraph", "text": intro},
		{"type": "heading", "text": "Season Calendar (%d rounds)" % round_total if round_total > 0 else "Season Calendar"},
		{"type": "paragraph", "text": calendar_lines if not calendar_lines.is_empty() else "The full round schedule will appear on your calendar shortly."},
		{"type": "heading", "text": "What Happens Next"},
		{"type": "paragraph", "text": "I'll send a setup brief a few days before each round. Fast forward the calendar and we'll meet the first race weekend when it lands."},
	]
	if is_multiclass and not class_label.is_empty():
		blocks.append({"type": "heading", "text": "Our Class"})
		blocks.append({"type": "paragraph", "text": "We are classified in %s. Expect a mixed grid — the pre-race brief will list every class you need to add before each weekend." % class_label})
	return _mail_dict(
		"mail_series_entry_%s" % series_id.replace(".", "_"),
		"team",
		"Series Office",
		"Championship Administration",
		_fill_mail_template("Entry confirmed: {series}", {"series": series_name}),
		_fill_mail_template("We're on the grid for {series}. Season calendar attached...", {"series": series_name}),
		"Entry Confirmed",
		_fill_mail_template("%s has accepted the %s entry for the full season." % [series_name, car_label], {}),
		false,
		"",
		"SO",
		"",
		"partner-partner-0008",
		true,
		false,
		"",
		blocks,
		"review_soon",
		"Entered",
		"navigate",
		"Open Calendar",
		"Calendar",
		"calendar",
		CALENDAR_SCENE_PATH,
		false,
		true,
		true,
		false,
		"series/%s" % series_id
	)


func _series_commercial_reaction_mail(series_detail: Dictionary) -> Dictionary:
	var series_name := str(series_detail.get("name", series_detail.get("title", "the championship"))).strip_edges()
	var series_id := str(series_detail.get("id", "series"))
	var blocks: Array = [
		{"type": "paragraph", "text": _fill_mail_template("Principal,\n\nNow that {series} is confirmed, I can finally take real numbers to partners instead of a pitch deck full of maybes.", {"series": series_name})},
		{"type": "heading", "text": "Why This Matters"},
		{"type": "paragraph", "text": "A confirmed grid slot gives sponsors something concrete: trackside exposure, results to attach their name to, and a season-long story. Expect interest to pick up once we bank a few finishes."},
		{"type": "heading", "text": "My Ask"},
		{"type": "paragraph", "text": "Keep the car on track and classified. Every clean weekend makes the commercial conversation easier and pushes the budget in the right direction."},
	]
	return _mail_dict(
		"mail_series_commercial_%s" % series_id.replace(".", "_"),
		"commercial",
		"Commercial Lead",
		"Commercial",
		_fill_mail_template("{series} opens commercial doors", {"series": series_name}),
		"A confirmed entry gives us something real to sell to partners...",
		"Commercial Outlook",
		"A confirmed championship entry strengthens every sponsor conversation.",
		false,
		"",
		"CL",
		"",
		"partner-partner-0002",
		true,
		false,
		"",
		blocks,
		"background",
		"",
		"",
		"",
		"",
		"",
		"",
		false,
		true,
		false,
		false,
		"series/%s" % series_id
	)


func _pre_race_brief_mail(event: Dictionary) -> Dictionary:
	var race_event_id := str(event.get("race_event_id", ""))
	var track := str(event.get("track_name", "the circuit")).strip_edges()
	if track.is_empty():
		track = "the circuit"
	var round_label := str(event.get("round_label", "Next round")).strip_edges()
	var date_label := str(event.get("start_label", "")).strip_edges()
	var setup: Dictionary = event.get("setup", {}) if event.get("setup", {}) is Dictionary else {}
	var weather := str(setup.get("weather", "Light Cloud"))
	var practice := str(setup.get("practice", "Length TBC"))
	var qualifying := str(setup.get("qualifying", "Length TBC"))
	var race := str(setup.get("race", "Length TBC"))
	var rules_notes := str(setup.get("rules_notes", "")).strip_edges()
	var is_multiclass := bool(event.get("is_multiclass", false))
	var class_labels_variant: Variant = event.get("required_class_labels", [])
	var class_labels: Array = class_labels_variant if class_labels_variant is Array else []

	var when_text := round_label
	if not date_label.is_empty():
		when_text += " at %s — %s" % [track, date_label]
	else:
		when_text += " at %s" % track
	var blocks: Array = [
		{"type": "paragraph", "text": _fill_mail_template(
			"Team Principal,\n\n{when} is up next. Here is the recommended weekend setup — dial this in before you load AMS2 so Practice, Qualifying, and Race all line up with the rest of the grid.",
			{"when": when_text}
		)},
		{"type": "heading", "text": "Recommended Session Setup"},
		{"type": "paragraph", "text": "Weather:  %s\nPractice:  %s\nQualifying:  %s\nRace:  %s" % [weather, practice, qualifying, race]},
	]
	if is_multiclass and not class_labels.is_empty():
		var label_strings: Array = []
		for label_variant: Variant in class_labels:
			var label := str(label_variant).strip_edges()
			if not label.is_empty():
				label_strings.append(label)
		if not label_strings.is_empty():
			blocks.append({"type": "heading", "text": "Classes To Add To The Grid"})
			blocks.append({"type": "paragraph", "text": "This is a multiclass round. Add every class before starting: %s." % ", ".join(PackedStringArray(label_strings))})
	if not rules_notes.is_empty():
		blocks.append({"type": "heading", "text": "Notes"})
		blocks.append({"type": "paragraph", "text": rules_notes})
	blocks.append({"type": "paragraph", "text": "Good luck. I'll have the debrief ready the moment the chequered flag drops."})

	return _mail_dict(
		"mail_prerace_%s" % race_event_id,
		"team",
		"Race Engineering",
		"Race Strategy",
		_fill_mail_template("Setup brief: {round} — {track}", {"round": round_label, "track": track}),
		_fill_mail_template("Weekend setup for {round}: weather, session lengths, and class requirements...", {"round": round_label}),
		"Weekend Setup Brief",
		_fill_mail_template("Recommended Practice, Qualifying, and Race setup for %s at %s." % [round_label, track], {}),
		false,
		"",
		"RE",
		"",
		"partner-partner-0005",
		true,
		false,
		"",
		blocks,
		"must_do",
		"Setup Required",
		"navigate",
		"Open Race Weekend",
		"Race Day",
		"race_day",
		RACE_DAY_SCENE_PATH,
		false,
		false,
		true,
		false,
		"race/brief/%s" % race_event_id
	)


## Deliver schedule-driven mail (currently pre-race setup briefs) for any entered
## race weekend whose date is now within the lead window. Idempotent via id.
func _deliver_scheduled_mail() -> void:
	if not championship_entered:
		return
	_ensure_world_derived_summaries()
	var current_unix := _current_unix_day()
	for event_variant: Variant in career_calendar_events:
		if not event_variant is Dictionary:
			continue
		var event: Dictionary = event_variant
		if str(event.get("kind", "")) != "race_weekend":
			continue
		if str(event.get("status", "")).to_lower() == "completed":
			continue
		var start_key := str(event.get("start_day_key", "")).strip_edges()
		if start_key.is_empty():
			continue
		var race_unix := _unix_from_day_key(start_key)
		if race_unix <= 0:
			continue
		var lead_unix := race_unix - PRE_RACE_MAIL_LEAD_DAYS * 86400
		if current_unix >= lead_unix and current_unix <= race_unix:
			_append_mail_once(_pre_race_brief_mail(event))


func _unix_from_day_key(day_key: String) -> int:
	var parts := day_key.split("-")
	if parts.size() < 3:
		return 0
	return _unix_day_from_datetime({
		"year": int(parts[0]),
		"month": int(parts[1]),
		"day": int(parts[2]),
		"hour": 12,
		"minute": 0,
		"second": 0,
	})


func _mail_dict(
	id: String,
	category_id: String,
	sender: String,
	detail_role: String,
	subject: String,
	preview: String,
	detail_title: String,
	detail_body: String,
	requires_response: bool = false,
	response_tag: String = "",
	initials: String = "TM",
	brand_name: String = "",
	portrait_id: String = "",
	unread: bool = false,
	clears_immediate_blocker: bool = false,
	next_pressure_after_acknowledge: String = "",
	detail_blocks: Array = [],
	priority: String = "background",
	status_label: String = "",
	action_type: String = "",
	action_label: String = "",
	action_target_label: String = "",
	action_target_context: String = "",
	action_scene_path: String = "",
	resolve_on_action: bool = false,
	resolved: bool = false,
	starred: bool = false,
	archived: bool = false,
	thread_id: String = ""
) -> Dictionary:
	return {
		"id": id,
		"category_id": category_id,
		"is_internal": brand_name.is_empty(),
		"brand_name": brand_name,
		"requires_response": requires_response,
		"response_tag": response_tag,
		"sender": sender,
		"subject": subject,
		"preview": preview,
		"time": _mail_sent_date_label(),
		"initials": initials,
		"stripe_color": Color("1D93C1"),
		"portrait_id": portrait_id,
		"unread": unread,
		"clears_immediate_blocker": clears_immediate_blocker,
		"next_pressure_after_acknowledge": next_pressure_after_acknowledge,
		"priority": priority,
		"status_label": status_label,
		"action_type": action_type,
		"action_label": action_label,
		"action_target_label": action_target_label,
		"action_target_context": action_target_context,
		"action_scene_path": action_scene_path,
		"resolve_on_action": resolve_on_action,
		"resolved": resolved,
		"starred": starred,
		"archived": archived,
		"thread_id": thread_id,
		"next_blocker_after_resolve": "",
		"detail_title": detail_title,
		"detail_from": sender,
		"detail_role": detail_role,
		"detail_body": detail_body,
		"detail_blocks": detail_blocks,
	}


func _next_world_entity_id(entity_map: Dictionary, prefix: String) -> String:
	var index := entity_map.size() + 1
	var candidate := "%s_%04d" % [prefix, index]
	while entity_map.has(candidate):
		index += 1
		candidate = "%s_%04d" % [prefix, index]
	return candidate


func _fmt_money_compact(v: float) -> String:
	var a := absf(v)
	if a >= 1_000_000.0:
		return "$%.1fM" % (v / 1_000_000.0)
	if a >= 1000.0:
		return "$%dK" % int(round(v / 1000.0))
	return "$%d" % int(round(v))


func _fmt_money_whole(v: float, currency_symbol: String = "$") -> String:
	var rounded: int = int(round(v))
	var sign := "-" if rounded < 0 else ""
	var digits := str(abs(rounded))
	var groups: Array = []
	while digits.length() > 3:
		groups.push_front(digits.substr(digits.length() - 3, 3))
		digits = digits.substr(0, digits.length() - 3)
	groups.push_front(digits)
	return "%s%s%s" % [sign, currency_symbol, ",".join(groups)]


func _mail_sender_profile(item: Dictionary) -> Dictionary:
	var sender_key := str(item.get("detail_from", item.get("sender", ""))).strip_edges()
	var slot: Dictionary = MAIL_SENDER_SLOTS.get(sender_key, {}) as Dictionary
	var staff_match: Dictionary = {}
	var role_id := str(slot.get("staff_role_id", "")).strip_edges()
	if not role_id.is_empty():
		staff_match = _mail_staff_profile_for_role(role_id, str(slot.get("id", sender_key)))
	var display_name := str(item.get("sender", "")).strip_edges()
	if slot.has("fallback_name") and (display_name.is_empty() or MAIL_SENDER_SLOTS.has(display_name)):
		display_name = str(staff_match.get("display_name", slot.get("fallback_name", display_name))).strip_edges()
	if display_name.is_empty():
		display_name = str(item.get("detail_from", "Team")).strip_edges()
	var detail_from := str(item.get("detail_from", "")).strip_edges()
	if detail_from.is_empty() or MAIL_SENDER_SLOTS.has(detail_from):
		detail_from = display_name
	var detail_role := str(item.get("detail_role", "")).strip_edges()
	if detail_role.is_empty():
		detail_role = str(slot.get("fallback_role", "Team"))
	var initials := str(item.get("initials", "")).strip_edges()
	if initials.is_empty():
		initials = str(slot.get("fallback_initials", _mail_sender_initials(display_name)))
	var portrait_id := str(item.get("portrait_id", "")).strip_edges()
	if portrait_id.is_empty():
		portrait_id = str(slot.get("fallback_portrait_id", ""))
	var portrait_path := str(item.get("portrait_path", "")).strip_edges()
	if portrait_path.is_empty():
		portrait_path = _mail_staff_portrait_path(str(staff_match.get("portrait_profile_id", "")))
	var sender_bio := str(item.get("sender_bio", "")).strip_edges()
	if sender_bio.is_empty():
		sender_bio = str(staff_match.get("bio", slot.get("fallback_bio", ""))).strip_edges()
	var sender_story := str(item.get("sender_story", "")).strip_edges()
	if sender_story.is_empty():
		var fallback_story := str(slot.get("fallback_story", "")).strip_edges()
		sender_story = _mail_story_blurb(sender_bio if not sender_bio.is_empty() else fallback_story)
		if sender_story.is_empty():
			sender_story = fallback_story
	return {
		"sender": display_name,
		"detail_from": detail_from,
		"detail_role": detail_role,
		"initials": initials,
		"portrait_id": portrait_id,
		"portrait_path": portrait_path,
		"sender_bio": sender_bio,
		"sender_story": sender_story,
	}


func _mail_staff_profile_for_role(role_id: String, slot_id: String) -> Dictionary:
	if role_id.is_empty():
		return {}
	var profiles_by_role := _mail_staff_profiles()
	if not profiles_by_role.has(role_id):
		return {}
	var profiles: Array = profiles_by_role[role_id] as Array
	if profiles.is_empty():
		return {}
	var index := _mail_hash_seed("%s|%s|%s" % [team_name, founder_last_name, slot_id]) % profiles.size()
	var selected: Variant = profiles[index]
	return selected as Dictionary if selected is Dictionary else {}


func _mail_staff_profiles() -> Dictionary:
	if not _mail_staff_profiles_by_role.is_empty():
		return _mail_staff_profiles_by_role
	var records := _load_generated_records(STAFF_PROFILES_PATH)
	for record_variant in records:
		if typeof(record_variant) != TYPE_DICTIONARY:
			continue
		var record: Dictionary = record_variant as Dictionary
		var role_id := str(record.get("role_id", "")).strip_edges()
		var display_name := str(record.get("display_name", "")).strip_edges()
		if role_id.is_empty() or display_name.is_empty():
			continue
		if not _mail_staff_profiles_by_role.has(role_id):
			_mail_staff_profiles_by_role[role_id] = []
		var bucket: Array = _mail_staff_profiles_by_role[role_id] as Array
		bucket.append(record)
		_mail_staff_profiles_by_role[role_id] = bucket
	return _mail_staff_profiles_by_role


func _mail_staff_portrait_path(portrait_profile_id: String) -> String:
	if portrait_profile_id.is_empty():
		return ""
	var portrait_paths := _mail_portrait_paths()
	return str(portrait_paths.get(portrait_profile_id, "")).strip_edges()


func _mail_portrait_paths() -> Dictionary:
	if not _mail_portrait_path_by_profile_id.is_empty():
		return _mail_portrait_path_by_profile_id
	var records := _load_generated_records(PORTRAIT_PROFILES_PATH)
	for record_variant in records:
		if typeof(record_variant) != TYPE_DICTIONARY:
			continue
		var record: Dictionary = record_variant as Dictionary
		var profile_id := str(record.get("id", "")).strip_edges()
		var asset_path := str(record.get("asset_path", "")).strip_edges()
		if profile_id.is_empty() or asset_path.is_empty():
			continue
		if asset_path.begins_with("portraits/"):
			asset_path = asset_path.substr("portraits/".length())
		_mail_portrait_path_by_profile_id[profile_id] = "%s/%s" % [GENERATED_PORTRAIT_ROOT, asset_path]
	return _mail_portrait_path_by_profile_id


func _load_generated_records(path: String) -> Array:
	if not FileAccess.file_exists(path):
		return []
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return []
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return []
	var records: Variant = (parsed as Dictionary).get("records", [])
	return records as Array if records is Array else []


func _mail_story_blurb(text: String, limit: int = 140) -> String:
	var cleaned := str(text).strip_edges()
	if cleaned.is_empty():
		return ""
	var sentence := cleaned
	for delimiter in [". ", "! ", "? ", "\n\n", "\n"]:
		var idx := cleaned.find(delimiter)
		if idx > 0:
			sentence = cleaned.substr(0, idx + 1)
			break
	if sentence.length() <= limit:
		return sentence
	return sentence.substr(0, max(limit - 1, 1)).rstrip(" ,;:-") + "..."


func _mail_sender_initials(name: String) -> String:
	var parts: PackedStringArray = name.strip_edges().split(" ", false)
	if parts.is_empty():
		return "TM"
	if parts.size() == 1:
		return parts[0].substr(0, min(parts[0].length(), 2)).to_upper()
	return (parts[0].substr(0, 1) + parts[parts.size() - 1].substr(0, 1)).to_upper()


func _mail_hash_seed(text: String) -> int:
	var hash_value := 0
	for idx in range(text.length()):
		hash_value = int((hash_value * 33 + text.unicode_at(idx)) % 2147483647)
	return abs(hash_value)


func _sanitize_mail_array(items: Array) -> Array:
	var sanitized: Array = []
	for item_variant in items:
		if typeof(item_variant) != TYPE_DICTIONARY:
			continue
		var item: Dictionary = item_variant
		var time_label: String = str(item.get("time", "")).strip_edges()
		if time_label.is_empty() or time_label == "Now":
			time_label = _mail_sent_date_label()
		var sender_profile := _mail_sender_profile(item)
		sanitized.append({
			"id": str(item.get("id", "")),
			"category_id": str(item.get("category_id", "other")),
			"is_internal": bool(item.get("is_internal", true)),
			"requires_response": bool(item.get("requires_response", false)),
			"response_tag": str(item.get("response_tag", "Requires Response")),
			"sender": str(sender_profile.get("sender", item.get("sender", "Team"))),
			"subject": str(item.get("subject", "")),
			"preview": str(item.get("preview", "")),
			"time": time_label,
			"initials": str(sender_profile.get("initials", item.get("initials", "TM"))),
			"stripe_color": _sanitize_mail_color(item.get("stripe_color", Color("1D93C1"))),
			"portrait_id": str(sender_profile.get("portrait_id", item.get("portrait_id", ""))),
			"portrait_path": str(sender_profile.get("portrait_path", item.get("portrait_path", ""))),
			"unread": bool(item.get("unread", false)),
			"clears_immediate_blocker": bool(item.get("clears_immediate_blocker", false)),
			"next_pressure_after_acknowledge": str(item.get("next_pressure_after_acknowledge", "")),
			"priority": str(item.get("priority", "background")),
			"status_label": str(item.get("status_label", "")),
			"action_type": str(item.get("action_type", "")),
			"action_label": str(item.get("action_label", "")),
			"action_target_label": str(item.get("action_target_label", "")),
			"action_target_context": str(item.get("action_target_context", "")),
			"action_scene_path": str(item.get("action_scene_path", "")),
			"resolve_on_action": bool(item.get("resolve_on_action", false)),
			"resolved": bool(item.get("resolved", false)),
			"starred": bool(item.get("starred", false)),
			"archived": bool(item.get("archived", false)),
			"thread_id": str(item.get("thread_id", "")),
			"next_blocker_after_resolve": str(item.get("next_blocker_after_resolve", "")),
			"detail_title": str(item.get("detail_title", item.get("subject", ""))),
			"detail_from": str(sender_profile.get("detail_from", item.get("detail_from", item.get("sender", "Team")))),
			"detail_role": str(sender_profile.get("detail_role", item.get("detail_role", "Team"))),
			"sender_bio": str(sender_profile.get("sender_bio", item.get("sender_bio", ""))),
			"sender_story": str(sender_profile.get("sender_story", item.get("sender_story", ""))),
			"detail_body": str(item.get("detail_body", item.get("preview", ""))),
			"detail_blocks": item.get("detail_blocks", []),
			"brand_name": str(item.get("brand_name", "")),
		})
	return sanitized


func _sanitize_mail_color(value: Variant, fallback: Color = Color("1D93C1")) -> Color:
	if value is Color:
		return value
	if typeof(value) == TYPE_STRING:
		var raw := str(value).strip_edges()
		if raw.begins_with("(") and raw.ends_with(")"):
			var parts: PackedStringArray = raw.substr(1, raw.length() - 2).split(",", false)
			if parts.size() == 4:
				return Color(float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]))
			if parts.size() == 3:
				return Color(float(parts[0]), float(parts[1]), float(parts[2]), 1.0)
		if raw.begins_with("#") or raw.length() == 6 or raw.length() == 8:
			return Color(raw)
	return fallback


func _sanitize_marketplace_listings(items: Array) -> Array:
	var sanitized: Array = []
	for item_variant in items:
		if typeof(item_variant) != TYPE_DICTIONARY:
			continue
		var item: Dictionary = item_variant
		sanitized.append({
			"id": str(item.get("id", "")),
			"market_type": str(item.get("market_type", "new")),
			"class_name": str(item.get("class_name", "GT")),
			"car_filter": str(item.get("car_filter", "All")),
			"manufacturer_name": str(item.get("manufacturer_name", item.get("car_filter", "Unknown"))),
			"series_filter_label": str(item.get("series_filter_label", "Open Market")),
			"eligible_series_labels": item.get("eligible_series_labels", ["Open Market"]),
			"hero_title": str(item.get("hero_title", "")),
			"card_title": str(item.get("card_title", "")),
			"livery_name": str(item.get("livery_name", item.get("card_title", ""))),
			"price_label": str(item.get("price_label", "$0")),
			"price": float(item.get("price", 0.0)),
			"pace": float(item.get("pace", (float(item.get("acc", 0.75)) + float(item.get("top_speed", 0.75))) * 0.5)),
			"driveability": float(item.get("driveability", float(item.get("handling", 0.75)))),
			"reliability_rating": float(item.get("reliability_rating", clampf(float(item.get("reliability", round((1.0 - float(item.get("braking", 0.25))) * 40.0 + 60.0))) / 100.0, 0.4, 0.95))),
			"operating_cost": float(item.get("operating_cost", clampf(float(item.get("price", 0.0)) / 2000000.0, 0.18, 0.95))),
			"acc": float(item.get("acc", 0.75)),
			"top_speed": float(item.get("top_speed", 0.75)),
			"braking": float(item.get("braking", 0.75)),
			"handling": float(item.get("handling", 0.75)),
			"condition": str(item.get("condition", "excellent")),
			"performance": int(item.get("performance", round(float(item.get("top_speed", 0.75)) * 100.0))),
			"reliability": int(item.get("reliability", round((1.0 - float(item.get("braking", 0.25))) * 40.0 + 60.0))),
			"mileage": int(item.get("mileage", 0)),
			"part_wear": item.get("part_wear", {
				"engine": 4,
				"chassis": 3,
				"gearbox": 3,
				"brakes": 5,
				"suspension": 4,
			}),
			"service_history": item.get("service_history", []),
			"installed_upgrades": item.get("installed_upgrades", []),
			"price_breakdown": item.get("price_breakdown", {}),
			"provenance": item.get("provenance", {}),
			"current_bid": float(item.get("current_bid", item.get("price", 0.0))),
			"minimum_bid": float(item.get("minimum_bid", item.get("price", 0.0) * 0.8)),
			"bid_count": int(item.get("bid_count", 0)),
			"image_path": str(item.get("image_path", DEFAULT_CAR_IMAGE_PATH)),
			"car_platform_id": str(item.get("car_platform_id", "")),
			"team_archetype_id": str(item.get("team_archetype_id", "")),
			"manufacturer_id": str(item.get("manufacturer_id", "")),
			"car_class_id": str(item.get("car_class_id", "")),
			"target_series_eligible": bool(item.get("target_series_eligible", false)),
			"listing_week": int(item.get("listing_week", 0)),
			"seller": str(item.get("seller", "")),
			"seller_car_instance_id": str(item.get("seller_car_instance_id", "")),
			"auction": _sanitize_auction_block(item.get("auction", {})),
		})
	return sanitized


func _sanitize_auction_block(raw: Variant) -> Dictionary:
	if not raw is Dictionary:
		return {}
	var block: Dictionary = raw as Dictionary
	if block.is_empty():
		return {}
	var rivals: Array = []
	if block.get("rival_bidders", []) is Array:
		for rival_variant in block.get("rival_bidders", []) as Array:
			if not rival_variant is Dictionary:
				continue
			var rival: Dictionary = rival_variant as Dictionary
			rivals.append({
				"id": str(rival.get("id", "")),
				"name": str(rival.get("name", "Rival")),
				"valuation": float(rival.get("valuation", 0.0)),
				"aggression": float(rival.get("aggression", 0.5)),
			})
	var history: Array = []
	if block.get("bid_history", []) is Array:
		for entry_variant in block.get("bid_history", []) as Array:
			if not entry_variant is Dictionary:
				continue
			var entry: Dictionary = entry_variant as Dictionary
			history.append({
				"bidder_id": str(entry.get("bidder_id", "")),
				"bidder_name": str(entry.get("bidder_name", "")),
				"amount": float(entry.get("amount", 0.0)),
				"week": int(entry.get("week", 0)),
				"day": int(entry.get("day", 0)),
			})
	return {
		"status": str(block.get("status", "open")),
		"open_week": int(block.get("open_week", 0)),
		"close_week": int(block.get("close_week", 0)),
		"close_day": int(block.get("close_day", 0)),
		"open_abs_day": int(block.get("open_abs_day", 0)),
		"close_abs_day": int(block.get("close_abs_day", 0)),
		"reserve_price": float(block.get("reserve_price", 0.0)),
		"reserve_met": bool(block.get("reserve_met", false)),
		"current_bid": float(block.get("current_bid", 0.0)),
		"min_increment": float(block.get("min_increment", 1000.0)),
		"high_bidder_id": str(block.get("high_bidder_id", "")),
		"high_bidder_name": str(block.get("high_bidder_name", "")),
		"bid_count": int(block.get("bid_count", 0)),
		"bid_history": history,
		"player_proxy_max": float(block.get("player_proxy_max", 0.0)),
		"player_escrow_held": float(block.get("player_escrow_held", 0.0)),
		"rival_bidders": rivals,
		"buyer_premium_pct": float(block.get("buyer_premium_pct", 0.05)),
		"anti_snipe_days": int(block.get("anti_snipe_days", AUCTION_ANTI_SNIPE_DAYS)),
	}


func _sanitize_project_array(projects: Array) -> Array:
	var sanitized: Array = []
	for project_variant in projects:
		if typeof(project_variant) != TYPE_DICTIONARY:
			continue
		var project: Dictionary = project_variant
		if _is_legacy_placeholder_project(project):
			continue
		sanitized.append(project.duplicate(true))
	return sanitized


func _is_legacy_placeholder_project(project: Dictionary) -> bool:
	var context: String = str(project.get("target_context", ""))
	return context in [
		"facilities/test-track",
		"rd/rear-wing",
		"rd/floor-upgrade",
		"rd/damper-package",
		"rd/brake-cooling",
	]


func _sanitize_benchmark_grid(grid: Array) -> Array:
	var sanitized: Array = []
	for team_variant in grid:
		if typeof(team_variant) != TYPE_DICTIONARY:
			continue
		var team: Dictionary = team_variant
		var metrics_variant: Variant = team.get("metrics", team.get("ratings", {}))
		if typeof(metrics_variant) != TYPE_DICTIONARY:
			continue
		var metrics: Dictionary = _sanitize_team_metrics(metrics_variant)
		if metrics.is_empty():
			continue
		sanitized.append({
			"team": str(team.get("team", "Benchmark Team")),
			"metrics": metrics
		})
	return sanitized


func _sanitize_overview_player_metrics(metrics_variant: Dictionary) -> Dictionary:
	return _sanitize_team_metrics(metrics_variant)


func _sanitize_team_metrics(metrics_variant: Dictionary) -> Dictionary:
	if metrics_variant.has("Car") or metrics_variant.has("Drivers"):
		return _legacy_metrics_from_ratings(metrics_variant)
	return {
		"drivers": _sanitize_metric_block(metrics_variant.get("drivers", {}), {
			"lead_driver_rating": 0.0,
			"support_driver_rating": 0.0,
			"wins": 0.0,
			"starts": 0.0,
			"podiums": 0.0,
			"points": 0.0,
			"top10_finishes": 0.0
		}),
		"car": _sanitize_metric_block(metrics_variant.get("car", {}), {
			"pace_rating": 0.0,
			"wins": 0.0,
			"podiums": 0.0,
			"points": 0.0,
			"top10_finishes": 0.0,
			"development_rating": 0.0
		}),
		"facilities": _sanitize_metric_block(metrics_variant.get("facilities", {}), {
			"quality": 18.0,
			"capacity": 18.0,
			"capability": 18.0
		}),
		"staff": _sanitize_metric_block(metrics_variant.get("staff", {}), {
			"headcount": 8.0,
			"target_headcount": 24.0,
			"average_rating": 28.0,
			"leadership_rating": 30.0
		}),
		"sponsors": _sanitize_metric_block(metrics_variant.get("sponsors", {}), {
			"weekly_income": 0.0,
			"portfolio_level": 0.0,
			"portfolio_quality": 18.0
		}),
		"finances": _sanitize_metric_block(metrics_variant.get("finances", {}), {
			"cash_reserve": 1800000.0,
			"weekly_burn": 48000.0,
			"runway_weeks": 10.0,
			"debt": 0.0
		}),
	}


func _sanitize_metric_block(block_variant: Variant, defaults: Dictionary) -> Dictionary:
	var sanitized: Dictionary = {}
	var block: Dictionary = block_variant if typeof(block_variant) == TYPE_DICTIONARY else {}
	for key_variant in defaults.keys():
		var key: String = str(key_variant)
		sanitized[key] = float(block.get(key, defaults[key_variant]))
	return sanitized


func _legacy_metrics_from_ratings(ratings: Dictionary) -> Dictionary:
	return {
		"drivers": {
			"lead_driver_rating": float(ratings.get("Drivers", 50.0)),
			"support_driver_rating": max(18.0, float(ratings.get("Drivers", 50.0)) - 4.0),
			"wins": 2.0,
			"starts": 12.0,
			"podiums": 4.0,
			"points": float(ratings.get("Drivers", 50.0)) * 2.0,
			"top10_finishes": 14.0
		},
		"car": {
			"pace_rating": float(ratings.get("Car", 50.0)),
			"wins": 2.0,
			"podiums": 4.0,
			"points": float(ratings.get("Car", 50.0)) * 2.0,
			"top10_finishes": 14.0,
			"development_rating": max(18.0, float(ratings.get("Car", 50.0)) - 6.0)
		},
		"facilities": {
			"quality": float(ratings.get("Facilities", 50.0)),
			"capacity": max(18.0, float(ratings.get("Facilities", 50.0)) - 2.0),
			"capability": max(18.0, float(ratings.get("Facilities", 50.0)) - 4.0)
		},
		"staff": {
			"headcount": 18.0,
			"target_headcount": 24.0,
			"average_rating": float(ratings.get("Staff", 50.0)),
			"leadership_rating": max(18.0, float(ratings.get("Staff", 50.0)) + 2.0)
		},
		"sponsors": {
			"weekly_income": float(ratings.get("Sponsors", 50.0)) * 1500.0,
			"portfolio_level": clamp(float(ratings.get("Sponsors", 50.0)) / 20.0, 0.0, 5.0),
			"portfolio_quality": float(ratings.get("Sponsors", 50.0))
		},
		"finances": {
			"cash_reserve": float(ratings.get("Finances", 50.0)) * 35000.0,
			"weekly_burn": max(12000.0, 90000.0 - float(ratings.get("Finances", 50.0)) * 900.0),
			"runway_weeks": clamp(float(ratings.get("Finances", 50.0)) / 4.0, 4.0, 22.0),
			"debt": max(0.0, 300000.0 - float(ratings.get("Finances", 50.0)) * 3000.0)
		}
	}
