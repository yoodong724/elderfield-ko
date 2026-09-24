/*:
 * @target MZ
 * @plugindesc [v1.8] Container Search Filter & Sort Mode
 * @author 
 * @orderAfter DM_ContainerUI_Cleanup
 * @orderAfter DM_InventorySortModes
 * @orderAfter DM_DragAndDropSort
 * * @param searchIcon
 * @text Search Icon ID
 * @desc The icon index to display on the search button. (Default: 84 - Magnifying Glass)
 * @type number
 * @default 84
 *
 * @help
 * ============================================================================
 * DM_InventorySearch.js
 * ============================================================================
 * * Shrinks the Category Window by 10% to make room for a "Search" button.
 * Clicking this button opens a Name Input screen (using Actor ID 2).
 * * When a term is entered:
 * 1. The Category jumps to Index 0 (The very first category).
 * 2. The Sort Mode changes to a special hidden mode: "Search".
 * 3. All items are filtered by the term AND the selected category.
 * 4. The filtered list is sorted alphabetically.
 * * To clear the search:
 * - Click the Search button again and press OK without entering text.
 * - Press the "Cancel" button (Esc/Right-Click/Gamepad B) while the text 
 * field is empty to back out of the search.
 */

(() => {
    if (typeof Scene_Container === 'undefined') return;

    const pluginName = "DM_InventorySearch";
    const parameters = PluginManager.parameters(pluginName);
    const searchIcon = Number(parameters['searchIcon']) || 84;

    // ========================================================================
    //  1. UI CREATION & RECT ADJUSTMENTS
    // ========================================================================
    
    const _Scene_Container_itemCategoryWindowRect = Scene_Container.prototype.itemCategoryWindowRect;
    Scene_Container.prototype.itemCategoryWindowRect = function() {
        const rect = _Scene_Container_itemCategoryWindowRect.call(this);
        rect.width = Math.floor(Graphics.boxWidth * 0.9);
        return rect;
    };

    Scene_Container.prototype.searchWindowRect = function() {
        const catRect = this.itemCategoryWindowRect();
        const wx = catRect.width;
        const wy = catRect.y;
        const ww = Graphics.boxWidth - wx;
        const wh = catRect.height;
        return new Rectangle(wx, wy, ww, wh);
    };

    const _Scene_Container_createCategoryWindow = Scene_Container.prototype.createCategoryWindow;
    Scene_Container.prototype.createCategoryWindow = function() {
        _Scene_Container_createCategoryWindow.call(this);
        const rect = this.searchWindowRect();
        this._searchWindow = new Window_ContainerSearchCommand(rect);
        this._searchWindow.setHandler('search', this.onSearchOk.bind(this));
        this.addWindow(this._searchWindow);
    };

    // ========================================================================
    //  2. SEARCH COMMAND WINDOW
    // ========================================================================

    function Window_ContainerSearchCommand() { this.initialize(...arguments); }
    Window_ContainerSearchCommand.prototype = Object.create(Window_Command.prototype);
    Window_ContainerSearchCommand.prototype.constructor = Window_ContainerSearchCommand;
    
    Window_ContainerSearchCommand.prototype.initialize = function(rect) {
        Window_Command.prototype.initialize.call(this, rect);
        this.deactivate(); 
        this.deselect();
    };

    Window_ContainerSearchCommand.prototype.makeCommandList = function() {
        this.addCommand("", 'search'); 
    };

    Window_ContainerSearchCommand.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        this.resetTextColor();
        this.changePaintOpacity(this.isCommandEnabled(index));
        const iconX = rect.x + (rect.width - ImageManager.iconWidth) / 2;
        this.drawIcon(searchIcon, iconX, rect.y + 2);
    };

    // ========================================================================
    //  3. SEARCH EXECUTION & SCENE TRANSITION
    // ========================================================================

    Scene_Container.prototype.onSearchOk = function() {
        SoundManager.playOk();
        $gameTemp._pendingContainerSearch = true;
        
        const searchActor = $gameActors.actor(2);
        if (searchActor) searchActor.setName("");

        SceneManager.push(Scene_Name);
        SceneManager.prepareNextScene(2, 16); 
    };

    // BYPASS: Allow empty string submissions specifically for the search prompt
    const _Window_NameInput_onNameOk = Window_NameInput.prototype.onNameOk;
    Window_NameInput.prototype.onNameOk = function() {
        if ($gameTemp._pendingContainerSearch && this._editWindow.name() === "") {
            SoundManager.playOk();
            this.callOkHandler();
        } else {
            _Window_NameInput_onNameOk.call(this);
        }
    };

    // BYPASS: If Cancel/Backspace is pressed, act normally. 
    // If it is pressed WHILE the field is empty, exit the search instead of buzzing.
    const _Window_NameInput_processBack = Window_NameInput.prototype.processBack;
    Window_NameInput.prototype.processBack = function() {
        if ($gameTemp._pendingContainerSearch && this._editWindow && this._editWindow.name() === "") {
            SoundManager.playCancel();
            this.callOkHandler(); // Act as if we submitted the empty string
        } else {
            _Window_NameInput_processBack.call(this);
        }
    };

    // ========================================================================
    //  4. THE MASTER INTERCEPTOR (Purge Evader & Input Router)
    // ========================================================================
    
    // OVERRIDE: Catch "Up" from the right-side Inventory window
    const _Scene_Container_onItemListUp = Scene_Container.prototype.onItemListUp;
    Scene_Container.prototype.onItemListUp = function(isContainer) {
        if (!isContainer && this._searchWindow && this._searchWindow.visible) {
            if (this._itemWindow) {
                this._itemWindow.deactivate(); 
                this._itemWindow.deselect();
            }
            this._searchWindow.activate();
            this._searchWindow.select(0);
            SoundManager.playCursor();
        } else {
            _Scene_Container_onItemListUp.call(this, isContainer);
        }
    };

    const _Scene_Container_update = Scene_Container.prototype.update;
    Scene_Container.prototype.update = function() {
        
        // --- A. KEYBOARD ROUTING ---
        if (this.isActive()) {
            
            // Catch "Down" from Deposit All
            if (this._depositAllWindow && this._depositAllWindow.active && Input.isRepeated('down')) {
                Input.clear();
                this._depositAllWindow.deactivate();
                this._depositAllWindow.deselect(); 
                this._searchWindow.activate();
                this._searchWindow.select(0);
                SoundManager.playCursor();
            }
            // Catch "Right" from Category
            else if (this._categoryWindow && this._categoryWindow.active && Input.isRepeated('right')) {
                if (this._categoryWindow.index() === this._categoryWindow.maxItems() - 1) {
                    Input.clear();
                    this._categoryWindow.deactivate();
                    this._searchWindow.activate();
                    this._searchWindow.select(0);
                    SoundManager.playCursor();
                }
            }
            // Catch exiting the Search Window
            else if (this._searchWindow && this._searchWindow.active) {
                if (Input.isRepeated('left')) {
                    Input.clear();
                    this._searchWindow.deactivate();
                    this._searchWindow.deselect(); // Erase ghost cursor
                    this._categoryWindow.activate();
                    SoundManager.playCursor();
                }
                else if (Input.isRepeated('up')) {
                    Input.clear();
                    this._searchWindow.deactivate();
                    this._searchWindow.deselect(); // Erase ghost cursor
                    if (this._depositAllWindow && this._depositAllWindow.visible) {
                        this._depositAllWindow.activate();
                        this._depositAllWindow.select(0);
                    } else if (this._sortModeWindow) {
                        this._sortModeWindow.activate();
                        this._sortModeWindow.select(0);
                    }
                    SoundManager.playCursor();
                }
                else if (Input.isRepeated('down')) {
                    // SMART DOWN ROUTING: Check if windows have items before moving cursor
                    const inventoryHasItems = this._itemWindow && this._itemWindow.maxItems() > 0;
                    const containerHasItems = this._containerWindow && this._containerWindow.maxItems() > 0;

                    if (inventoryHasItems || containerHasItems) {
                        Input.clear();
                        this._searchWindow.deactivate();
                        this._searchWindow.deselect(); // Erase ghost cursor

                        if (inventoryHasItems) {
                            this._itemWindow.activate();
                            this._itemWindow.select(0);
                        } else if (containerHasItems) {
                            this._containerWindow.activate();
                            this._containerWindow.select(0);
                        }
                        SoundManager.playCursor();
                    }
                }
            }
        }

        // --- B. MOUSE HOVER ROUTING (With Ghost Cursor Fix) ---
        const tx = TouchInput.x;
        const ty = TouchInput.y;

        if (this._searchWindow && this._searchWindow.visible && this._searchWindow.isOpen()) {
            const localX = this._searchWindow.canvasToLocalX(tx);
            const localY = this._searchWindow.canvasToLocalY(ty);
            const searchHovered = (localX >= 0 && localY >= 0 && localX < this._searchWindow.width && localY < this._searchWindow.height);

            if (this.isActive() && (this._lastMouseX !== tx || this._lastMouseY !== ty || TouchInput.isTriggered())) {
                if (searchHovered) {
                    // Turn off every other window
                    [this._sortModeWindow, this._depositAllWindow, this._categoryWindow, this._containerWindow, this._itemWindow].forEach(w => {
                        if (w && w.active) {
                            w.deactivate();
                            if (w !== this._categoryWindow) w.deselect();
                        }
                    });
                    if (!this._searchWindow.active) {
                        this._searchWindow.activate();
                        this._searchWindow.select(0);
                    }
                } else if (this._searchWindow.active) {
                    // We moved the mouse OFF the search window. 
                    // Make sure we are hovering another UI element before we erase the search cursor
                    let hoveringOther = false;
                    const windows = [this._sortModeWindow, this._depositAllWindow, this._categoryWindow, this._containerWindow, this._itemWindow];
                    for (let win of windows) {
                        if (win && win.visible && win.isOpen()) {
                            const lX = win.canvasToLocalX(tx), lY = win.canvasToLocalY(ty);
                            if (lX >= 0 && lY >= 0 && lX < win.width && lY < win.height) {
                                hoveringOther = true; break;
                            }
                        }
                    }
                    if (hoveringOther) {
                        this._searchWindow.deactivate();
                        this._searchWindow.deselect(); // Erase ghost cursor
                    }
                }
            }
        }

        // --- C. PURGE EVASION CLOAK ---
        let hiddenFromPurge = false;
        let originalIndex = -1;
        if (!this._ghostsPurged && this._windowLayer && this._searchWindow) {
            originalIndex = this._windowLayer.children.indexOf(this._searchWindow);
            if (originalIndex > -1) {
                this._windowLayer.children.splice(originalIndex, 1);
                hiddenFromPurge = true;
            }
        }

        // Execute core update routines
        _Scene_Container_update.call(this);

        // --- D. DE-CLOAK ---
        if (hiddenFromPurge) {
            this._windowLayer.addChild(this._searchWindow); 
        }

        // --- E. SCENE RETURN LOGIC ---
        if ($gameTemp._pendingContainerSearch && !SceneManager.isSceneChanging()) {
            $gameTemp._pendingContainerSearch = false;
            
            if (this._categoryWindow && this._categoryWindow.maxItems() > 0) {
                this._categoryWindow.select(0);
            }

            const searchActor = $gameActors.actor(2);
            let term = searchActor ? searchActor.name().trim() : "";
            
            if (term !== "") {
                $gameSystem._containerSearchTerm = term.toLowerCase();
                $gameSystem._containerSortMode = 5; 
            } else {
                $gameSystem._containerSortMode = 0; 
                $gameSystem._containerSearchTerm = "";
            }
            
            if (this._itemWindow) this._itemWindow.refresh();
            if (this._containerWindow) this._containerWindow.refresh();
            if (this._sortModeWindow) this._sortModeWindow.refresh();

            // Deselect the Search Window completely
            if (this._searchWindow) {
                this._searchWindow.deactivate();
                this._searchWindow.deselect();
            }
            
            // Jump to the first category automatically
            if (this._categoryWindow && this._categoryWindow.maxItems() > 0) {
                this._categoryWindow.activate();
                this._categoryWindow.select(0);
            }
        }
    };

    // ========================================================================
    //  5. FILTER & SORT OVERRIDES (Hard Post-Filter)
    // ========================================================================

    const listClasses = [];
    if (typeof Window_ItemList !== 'undefined') listClasses.push(Window_ItemList);
    if (typeof Window_ItemContainer !== 'undefined') listClasses.push(Window_ItemContainer);

    listClasses.forEach(cls => {
        if (!cls) return;

        const _makeItemList = cls.prototype.makeItemList;
        cls.prototype.makeItemList = function() {
            _makeItemList.call(this);
            
            if (SceneManager._scene instanceof Scene_Container && $gameSystem._containerSortMode === 5 && this._data) {
                
                if ($gameSystem._containerSearchTerm) {
                    this._data = this._data.filter(item => {
                        if (!item) return false;
                        const wteSearchTerm = $gameSystem._containerSearchTerm;
                        if (window.WTE_ItemMatchesSearch) {
                            return window.WTE_ItemMatchesSearch(item, wteSearchTerm);
                        }
                        return item.name.toLowerCase().includes(wteSearchTerm);
                    });
                }

                this._data.sort((a, b) => {
                    if (!a && !b) return 0;
                    if (!a) return 1;
                    if (!b) return -1;

                    const nameCmp = a.name.localeCompare(b.name);
                    if (nameCmp !== 0) return nameCmp;

                    const idA = a.id || a.itemId || 0;
                    const idB = b.id || b.itemId || 0;
                    return idA - idB;
                });
            }
        };
    });

// ========================================================================
    //  6. SORT MODE TOGGLE INTEGRATION (Instance Override)
    // ========================================================================

    const _Scene_Container_create = Scene_Container.prototype.create;
    Scene_Container.prototype.create = function() {
        _Scene_Container_create.call(this);

        if (this._sortModeWindow) {
            this._sortModeWindow.makeCommandList = function() {
                // BUGFIX: Restored "Alphabetical" instead of "Alpha"
                const modes = ["Manual", "Alphabetical", "Time Added", "Category", "Sell Price", "Search"];
                const currentMode = $gameSystem._containerSortMode || 0;
                
                this.addCommand("Sort: " + (modes[currentMode] || "Manual"), 'sortToggle');
            };
            
            this._sortModeWindow.refresh();
        }
    };

    const _Scene_Container_onSortModeOk = Scene_Container.prototype.onSortModeOk;
    Scene_Container.prototype.onSortModeOk = function() {
        if ($gameSystem._containerSortMode === 5) {
            $gameSystem._containerSortMode = 0;
            $gameSystem._containerSearchTerm = "";
            
            if (this._sortModeWindow) this._sortModeWindow.refresh();
            if (this._itemWindow) this._itemWindow.refresh();
            if (this._containerWindow) this._containerWindow.refresh();
            if (this._sortModeWindow) this._sortModeWindow.activate();
        } else {
            _Scene_Container_onSortModeOk.call(this);
        }
    };

})();