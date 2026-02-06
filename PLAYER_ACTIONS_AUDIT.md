# Comprehensive Player Actions Audit - Career Mod Game

## 1. Garage Screen (`src/screens/Garage/index.tsx`)

### Tab: Staff & Drivers

**Actions:**
- **Click "Hire Driver" button** (on empty driver slot) - PERSONAL: Opens modal to hire a second driver. Cost: `suggestedSalary` per year + `signingFee` one-time.
- **Click "Development" button** (on hired driver card) - PERSONAL: Opens driver development modal to view/manage training programs.
- **Click "Release" button** (on hired driver card) - PERSONAL: Opens confirmation modal to release driver. May incur termination fee.
- **Click "Release" button** (on staff card) - PERSONAL: Opens confirmation modal to release staff member. May incur severance pay (`staff.salary * 2`).
- **Click empty staff slot** (navigates to `/staff-market`) - PERSONAL: Navigates to Staff Market to hire staff.
- **Click "Confirm Release"** (in Release Confirmation Modal) - PERSONAL: Confirms releasing driver/staff. Cost: Termination fee/severance.
- **Click "Keep"** (in Release Confirmation Modal) - PERSONAL: Cancels release action.

**Driver Development Modal:**
- **Click "Start" button** (on training program card) - PERSONAL: Starts a driver training program. Cost: `program.weeklyCost` per week. Duration: `program.durationWeeks` weeks.
- **Click "Cancel Training" button** (on active training) - PERSONAL: Cancels active training program.

**Hire Driver Modal:**
- **Click "Sign" button** (on driver candidate card) - PERSONAL: Signs driver to team. Cost: `suggestedSalary` per year + `signingFee` one-time.
- **Click "Close" button** - PERSONAL: Closes modal.

### Tab: Team Fleet

**Actions:**
- **Click "Service" button** (on car card) - PERSONAL: Opens service modal for specific car.
- **Click "Service All Cars" button** - PERSONAL: Opens modal to service entire fleet. Cost: `$5000 * number of cars`.
- **Click car image navigation arrows** (← →) - PERSONAL: Cycles through car livery images.
- **Click "Browse Marketplace" button** (if no cars) - PERSONAL: Navigates to marketplace to buy cars.

**Car Service Modal:**
- **Select service level** (None/Light/Standard/Rebuild) for each part - PERSONAL: Selects service level for individual parts (engine, chassis, gearbox, brakes, suspension). Cost varies by part and level. Light: -20% wear, Standard: -50% wear, Rebuild: →0% wear.
- **Click "Clear All" button** - PERSONAL: Clears all part service selections.
- **Click "Cancel" button** - PERSONAL: Closes modal without servicing.
- **Click "Confirm Service" button** - PERSONAL: Confirms granular service. Cost: `granularServiceCost` (calculated from selected parts and levels).

**Service All Cars Modal:**
- **Click "Cancel" button** - PERSONAL: Closes modal.
- **Click "Service All Cars" button** - PERSONAL: Applies standard service to all parts on all cars. Cost: `$5000 * number of cars`.

### Tab: Development (R&D)

**Actions:**
- **Click development area card** (Aerodynamics, Chassis, Powertrain, Electronics) - PERSONAL: Selects/deselects area to view upgrade tree.
- **Click "Balanced" focus button** - PERSONAL: Sets development focus to balanced (resources split evenly).
- **Click area-specific focus button** (Aero/Chas/Powr/Elec) - PERSONAL: Sets 60% focus on specific area.
- **Click "Manage Facilities" button** - PERSONAL: Navigates to Facilities screen.
- **Click "+" button** (Weekly R&D Spend) - PERSONAL: Increases weekly R&D allocation by $1000. Max: $20,000/week.
- **Click "-" button** (Weekly R&D Spend) - PERSONAL: Decreases weekly R&D allocation by $1000. Min: $1000/week.
- **Click "Initialize Development Program" button** (if not initialized) - PERSONAL: Initializes team development system.

**Upgrade Tree (when area selected):**
- **Click "Start Research" button** (on upgrade card) - PERSONAL: Starts researching an upgrade. Cost: `upgrade.researchCost`. Duration: Until `upgrade.pointsRequired` points accumulated (passive progress).
- **Click "X" button** (close upgrade tree) - PERSONAL: Closes upgrade tree view.

---

## 2. R&D Tab (`src/screens/Garage/tabs/RnDTab.tsx`)

**Note:** This file simply renders `DevelopmentDashboard` component. All actions are listed under Garage > Development tab above.

---

## 3. Facilities Screen (`src/screens/Facilities/index.tsx`)

**Actions:**
- **Click facility card** (Aero, Chassis, Engine, Sim, Factory, Office, Hospitality) - PERSONAL: Opens facility detail modal.
- **Click "Manage Staff" button** (on facility card) - PERSONAL: Opens staff assignment panel for facility.
- **Click "Upgrade" button** (on facility card) - PERSONAL: Opens facility detail modal with upgrade options.
- **Click "Start Upgrade" button** (in Facility Detail Panel) - PERSONAL: Confirms and starts facility upgrade. Duration: `summary.upgradeDuration` weeks. Cost: `summary.upgradeCost`.
- **Click "Remove" button** (in Staff Assignment Panel) - PERSONAL: Removes assigned staff from facility.
- **Click "Assign" button** (in Staff Assignment Panel) - PERSONAL: Assigns unassigned staff to facility.
- **Click "Browse Staff Market" button** (in Staff Assignment Panel) - PERSONAL: Navigates to Staff Market to hire staff.
- **Click "X" button** (close modals) - PERSONAL: Closes modal.

---

## 4. Manufacturing Screen (`src/screens/Manufacturing/index.tsx`)

**Tab Navigation:**
- **Click "Inventory" tab** - PERSONAL: Switches to inventory view.
- **Click "Manufacturing" tab** - PERSONAL: Switches to manufacturing queue view.
- **Click "Race Kits" tab** - PERSONAL: Switches to race kit allocation view.

**Inventory Tab Actions:**
- **Click "Order Parts" button** - PERSONAL: Opens modal to order parts from manufacturers.
- **Click "Manufacture Parts" button** - PERSONAL: Opens modal to manufacture parts in-house.
- **Click "Ship Parts" button** - PERSONAL: Opens modal to ship parts to warehouses/races.
- **Click "View Race Kits" button** - PERSONAL: Switches to Race Kits tab.
- **Click warehouse card** - PERSONAL: Views warehouse details.
- **Click "Add Warehouse" button** - PERSONAL: Opens modal to rent a new warehouse.
- **Click "Manage HQ" button** - PERSONAL: Shows HQ storage information.

**Order Parts Modal:**
- **Select part type** - PERSONAL: Selects part type to order.
- **Select manufacturer** - PERSONAL: Selects manufacturer.
- **Input quantity** - PERSONAL: Sets order quantity.
- **Toggle "Rush Order" checkbox** - PERSONAL: Selects rush delivery. Duration: 50% faster. Cost: 2x normal.
- **Click "Place Order" button** - PERSONAL: Confirms order. Cost: `totalCost`. Duration: Depends on `rushOrder` (normal or 50% faster).
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Manufacture Parts Modal:**
- **Select part type** - PERSONAL: Selects part type to manufacture.
- **Input quantity** - PERSONAL: Sets manufacturing quantity.
- **Click "Start Manufacturing" button** - PERSONAL: Queues manufacturing job. Cost: `totalCost`. Duration: `timeWeeks` weeks.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Ship Parts Modal:**
- **Click "Select All" button** - PERSONAL: Selects all parts for shipping.
- **Click "Clear" button** - PERSONAL: Clears selection.
- **Check/uncheck individual parts** - PERSONAL: Toggles part selection.
- **Select destination warehouse** - PERSONAL: Selects shipping destination.
- **Select shipping method** - PERSONAL: Selects shipping speed. Duration: `config.transitMultiplier`x time. Cost: `shippingCost`.
- **Click "Ship Parts" button** - PERSONAL: Confirms shipping parts.

**Manufacturing Queue:**
- **Click "Cancel Job" button** (on queued job) - PERSONAL: Cancels manufacturing job.
- **Click "Prioritize Job" button** (on queued job) - PERSONAL: Moves job to front of queue.

**Race Kits Tab:**
- **Click "Allocate Part"** (in Race Allocation Panel) - PERSONAL: Allocates spare part to race kit.
- **Click "Remove Part"** (in Race Allocation Panel) - PERSONAL: Removes part from race kit.
- **Click "Auto Allocate"** (in Race Allocation Panel) - PERSONAL: Automatically allocates parts to race kit.
- **Click "Ship Kit"** (in Race Allocation Panel) - PERSONAL: Ships fully allocated race kit. Cost: `result.cost`.

**Warehouse Rental Modal:**
- **Select location** (logistics hub) - PERSONAL: Selects hub to rent warehouse at.
- **Click "Rent Warehouse" button** - PERSONAL: Confirms renting warehouse. Cost: `hub.rentalCostPerWeek` per week (ongoing).

---

## 5. Contracts Screen (`src/screens/Contracts/index.tsx`)

**Actions:**
- **Click "Refresh Offers" button** - PERSONAL: Generates new contract offers.
- **Input search query** - PERSONAL: Filters offers by search term.
- **Toggle "Filters" button** - PERSONAL: Shows/hides filter panel.
- **Click "Seat Type" filter buttons** (All, Paid, Pay-Driver) - PERSONAL: Filters offers by seat type.
- **Click "Tier" filter buttons** (All, Elite, Pro, Semi-Pro, Amateur, Entry) - PERSONAL: Filters offers by tier.
- **Click "Budget" filter button** (Show All, Affordable) - PERSONAL: Filters offers by affordability.
- **Select "Sort By" dropdown** - PERSONAL: Sorts offers (salary, tier, etc.).
- **Click "X" button** (on individual filters) - PERSONAL: Clears specific filter.
- **Click "Clear All Filters" button** - PERSONAL: Resets all filters.
- **Click contract offer card** - PERSONAL: Opens detailed offer modal.
- **Click "Decline Offer" button** (in Offer Detail Modal) - PERSONAL: Rejects the offer.
- **Click "Accept Offer" button** (in Offer Detail Modal) - PERSONAL: Accepts the offer. Cost: `seatCost` (if pay-driver seat).
- **Toggle series checkbox** (in Offer Detail Modal for works contracts) - PERSONAL: Selects/deselects series for multi-series contract.
- **Click "Resolve Conflict" button** (in Conflict Modal) - PERSONAL: Resolves calendar conflict by choosing a series.

---

## 6. Investments Screen (`src/screens/Investments/index.tsx`)

**Note:** This file renders `InvestmentsPanel` component. Actions listed below.

**InvestmentsPanel Actions:**
- **Click "Buy Index Fund" button** - PERSONAL: Opens modal to purchase index fund.
- **Click "Buy Property" button** - PERSONAL: Opens modal to purchase real estate.
- **Click "Start Business" button** - PERSONAL: Opens modal to start side business.
- **Click "Sell Team Equity" button** - PERSONAL: Sells team equity (prompts for percentage). Disabled if ownership ≤ 51%.
- **Click tab** (All Investments, Index Funds, Real Estate, Businesses) - PERSONAL: Switches investment view.

**Buy Index Fund Modal:**
- **Click fund card** - PERSONAL: Selects fund to invest in.
- **Select investment amount** - PERSONAL: Sets investment amount.
- **Click "Invest" button** - PERSONAL: Confirms purchase. Cost: Selected amount.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Index Fund Card (in list):**
- **Select sell percentage** (25%, 50%, 75%, 100%) - PERSONAL: Sets percentage to sell.
- **Click "Sell" button** - PERSONAL: Sells selected percentage. Income: `fund.currentValue * percentage / 100`.

**Buy Property Modal:**
- **Click property type card** - PERSONAL: Selects property type.
- **Select location** - PERSONAL: Selects property location.
- **Click "Purchase Property" button** - PERSONAL: Confirms purchase. Cost: `investment.purchasePrice` (varies ±20%).
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Property Card (in list):**
- **Click "Sell Property" button** - PERSONAL: Sells property. Income: `property.currentValue`.

**Start Business Modal:**
- **Click business type card** - PERSONAL: Selects business type.
- **Select location** - PERSONAL: Selects business location.
- **Select investment level** - PERSONAL: Sets initial investment amount.
- **Click "Launch Business" button** - PERSONAL: Starts business. Cost: Selected investment amount.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Business Card (in list):**
- **Click "Upgrade" button** (if available) - PERSONAL: Upgrades business to next level. Cost: `nextUpgradeCost`.
- **Click "Sell" button** - PERSONAL: Sells business. Income: `saleValue` (initial investment + appreciation).

---

## 7. Marketplace Screen (`src/screens/Marketplace/index.tsx`)

**Actions:**
- **Click "New" tab** - PERSONAL: Shows new car listings.
- **Click "Used" tab** - PERSONAL: Shows used car listings.
- **Click "Auction" tab** - PERSONAL: Shows auction listings.
- **Click "Refresh Listings" button** - PERSONAL: Generates new marketplace listings.
- **Toggle "Filters" button** - PERSONAL: Shows/hides filter panel.
- **Select "Condition" filter** - PERSONAL: Filters by car condition.
- **Select "Car Class" filter** - PERSONAL: Filters by car class.
- **Select "Sort By" dropdown** - PERSONAL: Sorts listings.
- **Click listing card** - PERSONAL: Opens car details modal.

**Car Details Modal:**
- **Click "Purchase Car" button** (for non-auction items) - PERSONAL: Buys the car. Cost: `listing.currentPrice` + `entryFee` (if entering new series).
- **Input bid amount** (for auctions) - PERSONAL: Sets bid amount.
- **Click "Place Bid" button** (for auctions) - PERSONAL: Places bid on auction car. Cost: `bidAmount` (held until auction ends).
- **Click "Go to Garage" button** (in Car Condition Warning Modal) - PERSONAL: Navigates to garage.

---

## 8. Merchandise Screen (`src/screens/Merchandise/index.tsx`)

**Note:** This file renders `MerchandiseDashboard` component. Actions listed below.

**MerchandiseDashboard Actions:**
- **Click "New Product" button** - PERSONAL: Opens modal to create new product.
- **Click "Launch Collection" button** - PERSONAL: Opens modal to launch product collection.
- **Click "Open Store" button** - PERSONAL: Opens modal to open new store.
- **Click tab** (Products, Collections, Stores, Analytics) - PERSONAL: Switches merchandise view.

**Create Product Modal:**
- **Click product template card** - PERSONAL: Selects product type.
- **Select rarity** (Standard, Limited, Exclusive, Ultra Rare) - PERSONAL: Sets product rarity.
- **Select price** - PERSONAL: Sets product price.
- **Select initial stock** - PERSONAL: Sets initial inventory.
- **Select weekly production** - PERSONAL: Sets production rate.
- **Select reorder point** - PERSONAL: Sets low stock threshold.
- **Toggle "Post to Social Media" checkbox** - PERSONAL: Announces product on social media.
- **Click "Create Product" button** - PERSONAL: Creates product. Cost: Initial production cost.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Product Card (in list):**
- **Click "Adjust Price" button** - PERSONAL: Opens price editor.
- **Select new price** (in price editor) - PERSONAL: Sets new price.
- **Click "Save" button** (in price editor) - PERSONAL: Saves price change.
- **Click "×" button** (in price editor) - PERSONAL: Cancels price edit.
- **Click "Archive" button** - PERSONAL: Discontinues product.

**Create Collection Modal:**
- **Select theme** (Season, Victory, Anniversary, Driver, Collaboration, Holiday) - PERSONAL: Sets collection theme.
- **Click product cards** - PERSONAL: Selects/deselects products for collection.
- **Toggle "Fan Club Exclusive" checkbox** - PERSONAL: Makes collection exclusive to members.
- **Select marketing budget** - PERSONAL: Sets marketing spend.
- **Toggle "Post to Social Media" checkbox** - PERSONAL: Announces collection launch.
- **Click "Launch Collection" button** - PERSONAL: Launches collection. Cost: `marketingBudget`.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Collection Card (in list):**
- **Click "End Collection" button** - PERSONAL: Ends active collection.

**Open Store Modal:**
- **Select store type** (Online, Physical, Pop-Up, Race Weekend) - PERSONAL: Selects store type.
- **Select location** (for non-online stores) - PERSONAL: Selects store location.
- **Check/uncheck products** - PERSONAL: Selects products to stock.
- **Toggle "Post to Social Media" checkbox** - PERSONAL: Announces store opening.
- **Click "Open Store" button** - PERSONAL: Opens store. Cost: `config.setupCost`.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Store Card (in list):**
- **Click "Manage Products" button** - PERSONAL: Opens modal to manage store inventory.
- **Click "Close Store" button** - PERSONAL: Closes store.

**Manage Store Products Modal:**
- **Check/uncheck products** - PERSONAL: Selects products to sell at store.
- **Click "Select All" button** - PERSONAL: Selects all products.
- **Click "Clear" button** - PERSONAL: Clears selection.
- **Click "Save Changes" button** - PERSONAL: Updates store product list.
- **Click "Cancel" button** - PERSONAL: Closes modal without saving.

---

## 9. Staff Market Screen (`src/screens/StaffMarket/index.tsx`)

**Tab Navigation:**
- **Click "Staff Market" tab** - PERSONAL: Switches to market view.
- **Click "My Staff" tab** - PERSONAL: Switches to hired staff view.

**Market Tab Actions:**
- **Click "Refresh Market" button** - PERSONAL: Generates new staff in the market.
- **Input search query** - PERSONAL: Filters staff by search term.
- **Select "All Staff Types" dropdown** - PERSONAL: Filters by category (facility/team).
- **Select "All Roles" dropdown** - PERSONAL: Filters by specific staff role.
- **Select "All Facilities" dropdown** - PERSONAL: Filters facility staff by compatible facility.
- **Select "Sort by" dropdown** - PERSONAL: Sorts staff listings.
- **Click staff card** - PERSONAL: Opens staff detail modal.
- **Click "Negotiate" button** (on market staff card) - PERSONAL: Starts contract negotiation.

**Contract Negotiation Modal:**
- **Input "Weekly Salary"** - PERSONAL: Adjusts salary offer.
- **Click "+" button** (Weekly Salary) - PERSONAL: Increases salary offer.
- **Click "-" button** (Weekly Salary) - PERSONAL: Decreases salary offer.
- **Click "+" button** (Signing Bonus) - PERSONAL: Increases signing bonus.
- **Click "-" button** (Signing Bonus) - PERSONAL: Decreases signing bonus.
- **Click "+" button** (Contract Length) - PERSONAL: Increases contract duration.
- **Click "-" button** (Contract Length) - PERSONAL: Decreases contract duration.
- **Click "+" button** (Performance Bonus) - PERSONAL: Increases performance bonus.
- **Click "-" button** (Performance Bonus) - PERSONAL: Decreases performance bonus.
- **Click "Submit Offer" button** - PERSONAL: Submits offer to staff.
- **Click "Walk Away" button** - PERSONAL: Ends negotiation.
- **Click "Counter Offer" button** (when staff counters) - PERSONAL: Sends counter-offer.
- **Click "Accept Their Terms" button** (when staff counters) - PERSONAL: Accepts staff's counter-offer.
- **Click "Accept & Sign" button** (when offer accepted) - PERSONAL: Finalizes hiring.
- **Click "Sign Contract" button** (after acceptance) - PERSONAL: Completes hiring process.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**My Staff Tab Actions:**
- **Click "Terminate" button** (on hired staff card) - PERSONAL: Opens fire confirmation modal.
- **Click "Assign" button** (on unassigned staff card) - PERSONAL: Opens facility assignment modal.
- **Click "X" button** (on assigned staff card) - PERSONAL: Unassigns staff from facility.
- **Click "Browse Available Staff" button** (if no staff) - PERSONAL: Switches to market tab.
- **Click "Go to Media" button** (from Media Duty Reminder) - PERSONAL: Navigates to media screen.

**Fire Confirmation Modal:**
- **Click "Terminate" button** - PERSONAL: Confirms staff termination. Cost: `staff.salary * 2` (severance pay).
- **Click "Cancel" button** - PERSONAL: Cancels termination.

**Facility Assignment Panel:**
- **Click facility card** - PERSONAL: Assigns staff to selected facility.

---

## 10. Sponsor Market Screen (`src/screens/SponsorMarket/index.tsx`)

**Actions:**
- **Input "Search sponsors..."** - PERSONAL: Filters sponsors by search term.
- **Select "All Categories" dropdown** - PERSONAL: Filters sponsors by category.
- **Select "All Tiers" dropdown** - PERSONAL: Filters sponsors by tier.
- **Click "Approachable Only" toggle button** - PERSONAL: Shows only approachable sponsors.
- **Click sponsor card** - PERSONAL: Opens sponsor detail modal.
- **Click "Contact Sponsor" button** (in Sponsor Detail View) - PERSONAL: Initiates outreach/negotiation. Duration: Few days for response (passive).
- **Click "Acknowledge" button** (in Sponsor Review Modal) - PERSONAL: Closes modal after reviewing sponsor performance.

---

## 11. Loans Screen (`src/screens/Loans/index.tsx`)

**Note:** This file renders `LoansPanel` component. Actions listed below.

**LoansPanel Actions:**
- **Click "Apply for Bank Loan" button** - PERSONAL: Opens modal to apply for loan.
- **Click "Get Credit Line" button** - PERSONAL: Applies for credit line (instant). Disabled if already active.
- **Click "Seek Investor" button** - PERSONAL: Opens modal to seek private investment.

**New Loan Modal:**
- **Select loan amount** - PERSONAL: Sets loan amount.
- **Select term (weeks)** - PERSONAL: Sets repayment period.
- **Select collateral** (if required) - PERSONAL: Selects collateral type.
- **Click "Apply for Loan" button** - PERSONAL: Submits loan application. Cost: Weekly payment `weeklyPayment` for `termWeeks` weeks.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Loan Card (in list):**
- **Click "Pay Off Early" button** - PERSONAL: Pays off loan immediately. Cost: `loan.remainingBalance`.

**Credit Line Card:**
- **Input draw amount** - PERSONAL: Sets amount to draw.
- **Click "Draw Funds" button** - PERSONAL: Draws from credit line. Cost: Interest accrues on drawn amount.
- **Input repay amount** - PERSONAL: Sets repayment amount.
- **Click "Repay" button** - PERSONAL: Repays credit line. Reduces debt.

**New Investor Modal:**
- **Select investment amount sought** - PERSONAL: Sets desired investment.
- **Click "Generate Investor Offer" button** - PERSONAL: Generates investor proposal.
- **Click "Accept Investment" button** (when offer generated) - PERSONAL: Accepts investor. Cost: `equityStake`% equity.
- **Click "Decline" button** - PERSONAL: Rejects offer.
- **Click "Cancel" button** - PERSONAL: Closes modal.

**Investor Card (in list):**
- **Click "Buy Out Investor" button** - PERSONAL: Buys out investor. Cost: `investor.investmentAmount * 1.5` (50% premium).

---

## 12. Series Entry Screen (`src/screens/SeriesEntry/index.tsx`)

**Actions:**
- **Toggle "Filters" button** - PERSONAL: Shows/hides filter panel.
- **Select "Tier" filter** - PERSONAL: Filters championships by tier.
- **Select "Region" filter** - PERSONAL: Filters championships by region.
- **Select "Format" filter** - PERSONAL: Filters championships by format.
- **Click "Service" button** (on car card in Garage section) - PERSONAL: Opens service modal for car.
- **Click series card** (to enter/assign car) - PERSONAL: Opens car assignment modal or directly assigns if already entered. Cost: `entryFee` if not already entered.
- **Click "Go to Marketplace" button** (on series card if no compatible cars) - PERSONAL: Navigates to marketplace to buy a car.
- **Click "View Details" button** (on series card) - PERSONAL: Opens series details modal.

**Entry Confirmation Modal:**
- **Click "Confirm Entry" button** - PERSONAL: Confirms series entry. Cost: `entryFee`.

**Car Assignment Modal:**
- **Click car card** - PERSONAL: Selects car for assignment.
- **Click "Go to Marketplace" button** (if no compatible unassigned cars) - PERSONAL: Navigates to marketplace.
- **Click "Enter & Assign" or "Assign Car" button** - PERSONAL: Assigns selected car to series. Cost: `entryFee` if first car.

**Series Details Modal:**
- **Click "Buy Another Car" button** (if entered) - PERSONAL: Navigates to marketplace.
- **Click "Withdraw" button** (if entered) - PERSONAL: Withdraws from the series.
- **Click "Enter Series" button** (if not entered) - PERSONAL: Opens series entry confirmation modal.

---

## 13. Season End Screen (`src/screens/SeasonEnd/index.tsx`)

**Actions:**
- **Click celebration overlay** (to dismiss) - PERSONAL: Dismisses celebration animation.
- **Click "Continue to Contract Phase" button** - PERSONAL: Navigates to Contracts screen.
- **Click "Acknowledge" button** (in Sponsor Review Modal) - PERSONAL: Closes sponsor review modal.
- **Click "View Full Reviews" button** (from sponsor reviews summary) - PERSONAL: Opens sponsor review modal.

---

## 14. Race Day Screen (`src/screens/RaceDay/index.tsx`)

**Actions:**
- **Click "Connect Telemetry" button** - PERSONAL: Starts Electron telemetry listener (connects to AMS2).
- **Click "Practice" tab** - PERSONAL: Switches to practice session view.
- **Click "Qualifying" tab** - PERSONAL: Switches to qualifying session view.
- **Click "Race" tab** - PERSONAL: Switches to race session view.
- **Click "Service Car" button** (in Car Condition Warning) - PERSONAL: Navigates to garage to service car.
- **Click "Complete Duties" button** (in Media Duty Reminder) - PERSONAL: Navigates to media screen.
- **Click "×" button** (dismiss Media Duty Reminder) - PERSONAL: Dismisses reminder.
- **Click "Go to Media" button** (in Pre-Session Duty Alert) - PERSONAL: Navigates to media screen.
- **Input finish position** (manual results) - PERSONAL: Enters race finish position.
- **Input best lap time** (manual results) - PERSONAL: Enters best lap time.
- **Input qualifying position** (manual results) - PERSONAL: Enters qualifying position.
- **Click "Confirm Race Result" button** - PERSONAL: Submits manual or telemetry-fed race results.
- **Click "Regenerate AI" button** - PERSONAL: Re-generates AI driver XML with new form variance.
- **Click "View Details" button** (in Car Condition Warning Modal) - PERSONAL: Shows modal with car issue details.
- **Click "Stay on Race Day" button** (in modals) - PERSONAL: Closes modal and stays on Race Day screen.
- **Click "Go to Garage" button** (in Car Condition Warning Modal) - PERSONAL: Navigates to Garage to service car.
- **Click "Finish Weekend" button** (in Race Complete Modal) - PERSONAL: Advances career to next week and returns to home.
- **Click "Advance Week & Return Home" button** (in SessionPanel if race complete) - PERSONAL: Advances career to next week.

---

## 15. Stats Screen (`src/screens/Stats/index.tsx`)

**Actions:**
- **Click "Overview" tab** - PERSONAL: Switches to overview statistics.
- **Click "Race Results" tab** - PERSONAL: Switches to race history view.
- **Click "Track Mastery" tab** - PERSONAL: Switches to track mastery view.
- **Click "GOAT Progress" tab** - PERSONAL: Switches to GOAT progress view.
- **Click "Records" tab** - PERSONAL: Switches to records view.
- **Click "Comparison" tab** - PERSONAL: Switches to rival comparison view.
- **Click rival dropdown** (in Rival Comparison Tab) - PERSONAL: Opens dropdown to select rival.
- **Click rival name** (in dropdown) - PERSONAL: Sets rival for comparison.

---

## Summary by Action Type

### PERSONAL Actions (Owner Directly Performs):
- All hiring/firing decisions
- All contract negotiations
- All financial transactions (purchases, investments, loans)
- All facility upgrades
- All car servicing decisions
- All R&D focus and research initiation
- All merchandise product/collection/store management
- All staff assignments
- All race result submissions
- All navigation between screens

### PASSIVE/DELEGATED Actions (Team/Automated):
- Research progress (accumulates automatically based on budget allocation)
- Manufacturing completion (happens over time)
- Shipping transit (happens over time)
- Sponsor response to outreach (happens after few days)
- Facility upgrade completion (happens over `upgradeDuration` weeks)
- Training program progress (happens over `durationWeeks` weeks)
- Weekly R&D spending (automatic based on allocation)
- Weekly loan payments (automatic)
- Weekly credit line interest (automatic)
- Weekly merchandise production (automatic based on production rate)
- Weekly store operations (automatic)
- Investment returns (automatic market fluctuations)
- Property rental income (automatic monthly)
- Business revenue (automatic weekly)

### Time/Duration Costs Mentioned:
- Facility upgrades: `upgradeDuration` weeks
- Manufacturing: `timeWeeks` weeks
- Shipping: `config.transitMultiplier`x normal time
- Rush orders: 50% faster delivery
- Training programs: `program.durationWeeks` weeks
- Loan terms: `termWeeks` weeks (26-156 weeks typical)
- Sponsor response: Few days
- Research completion: Until `upgrade.pointsRequired` points accumulated (passive)
