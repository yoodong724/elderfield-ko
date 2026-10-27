/*:
 * @target MZ
 * @plugindesc Adds a Mod List scene to view installed mods with smooth scroll and word wrap.
 * @author Chris Cote
 * 
 * @param EmptyListText
 * @text Empty List Text
 * @desc Text to display in the mod list when no mods are installed.
 * @default No Mods
 * 
 * @param EmptyDetailsText
 * @text Empty Details Text
 * @desc Text to display in the info panel when no mods are installed.
 * @default There are no mods installed.
 */

(() => {
    const pluginName = "VirtualModLoader_UI";
    const parameters = PluginManager.parameters(pluginName);
    const emptyListText = parameters['EmptyListText'] || "No Mods";
    const emptyDetailsText = parameters['EmptyDetailsText'] || "There are no mods installed.";


    const modNativeDrawText = Bitmap.prototype.drawText;
    const modNativeMeasureText = Bitmap.prototype.measureTextWidth;
    const modNativeCommandDrawItem = Window_Command.prototype.drawItem;
    const modDefaultFields = new WeakMap();
    const modFixedText = text => {
        try {
            const value = typeof window.translateText === 'function'
                ? window.translateText(text) : text;
            return typeof value === 'string' && value.length ? value : text;
        } catch (_) { return text; }
    };
    const modLiteralWidth = function(text) {
        return modNativeMeasureText.call(this.contents, String(text));
    };
    const modLiteralDraw = function(text, x, y, width, align) {
        return modNativeDrawText.call(this.contents, String(text), x, y,
            width === undefined ? this.contentsWidth() - x : width,
            this.lineHeight(), align || 'left');
    };
    const modLiteralDrawEx = function(text, x, y, width) {
        let advance = 0;
        for (const line of String(text).split('\n')) {
            modLiteralDraw.call(this, line, x, y, width);
            advance = Math.max(advance, modLiteralWidth.call(this, line));
            y += this.lineHeight();
        }
        return advance;
    };
    const modValue = (mod, field) => {
        const defaults = modDefaultFields.get(mod);
        return defaults && defaults.has(field) ? modFixedText(mod[field]) : mod[field];
    };

    const fs = require('fs');
    const path = require('path');
    const baseDir = process.cwd();

    // Helper to completely prevent invisible JSON BOM crashes
    const readJsonSafe = (filePath) => {
        let raw = fs.readFileSync(filePath, 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        return JSON.parse(raw);
    };

    // ========================================================================
    // GLOBAL REGISTRY: Native Config API & JSON Data Manager
    // ========================================================================
    window.ModLoaderUI = window.ModLoaderUI || {};
    window.ModLoaderUI.configs = window.ModLoaderUI.configs || {};
    window.ModLoaderUI.modConfigs = window.ModLoaderUI.modConfigs || {};

    window.ModLoaderUI.getConfig = function(modFolder, symbol) {
        const mc = this.modConfigs[modFolder];
        if (mc && mc.values && mc.values.hasOwnProperty(symbol)) {
            return mc.values[symbol];
        }
        return null;
    };

    window.ModLoaderUI.setConfig = function(modFolder, symbol, value, requiresMapRefresh) {
        const mc = this.modConfigs[modFolder];
        if (mc) {
            mc.values[symbol] = value;
            const savePath = path.join(baseDir, 'mods', modFolder, 'user_config.json');
            fs.writeFileSync(savePath, JSON.stringify(mc.values, null, 2), 'utf8');
            
            // Trigger dynamic file swapping instantly without rebooting
            if (window.VirtualModLoader && typeof window.VirtualModLoader.refreshFileSwaps === 'function') {
                window.VirtualModLoader.refreshFileSwaps();
            }

            // Queue a seamless map refresh for when the player exits the menu!
            // Fade Type 2 = Instant transition (no black/white fade)
            if (requiresMapRefresh && typeof $gamePlayer !== 'undefined' && $gamePlayer && $gameMap && $gameMap.mapId() > 0) {
                $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 2);
            }
        }
    };

    // Load JSON configurations immediately at boot
    const modsDir = path.join(baseDir, 'mods');
    if (fs.existsSync(modsDir)) {
        const folders = fs.readdirSync(modsDir).filter(f => fs.statSync(path.join(modsDir, f)).isDirectory() && !f.startsWith('!'));
        for (const folder of folders) {
            const configPath = path.join(modsDir, folder, 'config.json');
            const userConfigPath = path.join(modsDir, folder, 'user_config.json');
            let defs = [];
            let values = {};
            
            if (fs.existsSync(configPath)) {
                try { defs = readJsonSafe(configPath); } catch(e){}
            }
            if (fs.existsSync(userConfigPath)) {
                try { values = readJsonSafe(userConfigPath); } catch(e){}
            }
            
            if (defs.length > 0) {
                // Initialize default values for missing user_configs
                for (const def of defs) {
                    if (!values.hasOwnProperty(def.symbol)) {
                        values[def.symbol] = def.default;
                    }
                }
                window.ModLoaderUI.modConfigs[folder] = { defs: defs, values: values };
            }
        }
    }

    // ========================================================================
    // SCENE: Scene_ModList
    // ========================================================================
    window.Scene_ModList = class extends Scene_MenuBase {
        create() {
            super.create();
            this.loadModData();
            this.createScrollInfoWindow();
            this.createDetailsWindow();
            this.createListWindow();
            this.createConfigWindow();
        }

        loadModData() {
            this._mods = [];
            const modsDir = path.join(baseDir, 'mods');

            if (fs.existsSync(modsDir)) {
                const folders = fs.readdirSync(modsDir).filter(f => {
                    return fs.statSync(path.join(modsDir, f)).isDirectory() && !f.startsWith('!');
                });

                for (const folder of folders) {
                    const jsonPath = path.join(modsDir, folder, 'mod.json');
                    if (fs.existsSync(jsonPath)) {
                        try {
                            const data = readJsonSafe(jsonPath);
                            this._mods.push({
                                folderName: folder,
                                name: data.name || folder,
                                author: data.author || "Unknown",
                                gameversion: data.gameversion || "Unknown",
                                modversion: data.modversion || data.version || "1.0.0",
                                languages: data.languages || "",
                                description: data.description || "No description provided.",
                                priority: data.priority || 0
                            });
                            modDefaultFields.set(this._mods[this._mods.length - 1],
                                new Set(["author", "gameversion", "description"].filter(field => !data[field])));
                        } catch (e) {
                            console.error(`[Mod UI] Failed to parse mod.json in ${folder}`);
                        }
                    }
                }

                this._mods.sort((a, b) => {
                    if (b.priority !== a.priority) {
                        return b.priority - a.priority;
                    }
                    return a.name.localeCompare(b.name);
                });
            }
        }

        createScrollInfoWindow() {
            const rect = this.scrollInfoWindowRect();
            this._scrollInfoWindow = new Window_Base(rect);
            this._scrollInfoWindow.drawText("Press Left/Right to scroll", 0, 0, rect.width - 36, 'center'); 
            this.addWindow(this._scrollInfoWindow);
        }

        createListWindow() {
            const rect = this.listWindowRect();
            this._listWindow = new window.Window_ModList(rect);
            this._listWindow.setHandler("cancel", this.popScene.bind(this));
            this._listWindow.setHandler("ok", this.onModOk.bind(this));
            this._listWindow.setMods(this._mods);
            this._listWindow.setDetailsWindow(this._detailsWindow);
            this.addWindow(this._listWindow);
        }

        createDetailsWindow() {
            const rect = this.detailsWindowRect();
            this._detailsWindow = new window.Window_ModDetails(rect);
            this.addWindow(this._detailsWindow);
        }

        createConfigWindow() {
            const rect = this.configWindowRect();
            this._configWindow = new window.Window_ModConfig(rect);
            this._configWindow.setHandler("cancel", this.onConfigCancel.bind(this));
            this._configWindow.setHandler("ok", this.onConfigOk.bind(this));
            this._configWindow.hide();
            this._configWindow.deactivate();
            this.addWindow(this._configWindow);
        }

        listWindowRect() {
            const ww = Graphics.boxWidth / 3;
            const originalY = ConfigManager.touchUI ? this.buttonAreaHeight() : 0;
            const wh = Graphics.boxHeight - originalY - this.calcWindowHeight(1, false); 
            const wx = 0;
            const wy = originalY;
            return new Rectangle(wx, wy, ww, wh);
        }

        detailsWindowRect() {
            const listRect = this.listWindowRect();
            const ww = Graphics.boxWidth - listRect.width;
            return new Rectangle(listRect.width, listRect.y, ww, listRect.height);
        }

        scrollInfoWindowRect() {
            const listRect = this.listWindowRect();
            const height = this.calcWindowHeight(1, false);
            const y = listRect.y + listRect.height;
            return new Rectangle(0, y, Graphics.boxWidth, height);
        }

        configWindowRect() {
            const ww = Math.min(600, Graphics.boxWidth - 100);
            const wh = this.calcWindowHeight(8, true); 
            const wx = (Graphics.boxWidth - ww) / 2;
            const wy = (Graphics.boxHeight - wh) / 2;
            return new Rectangle(wx, wy, ww, wh);
        }

        update() {
            this.updateWteModScroll();
            this.updateTouchConfigTrigger();
            super.update();
        }

        updateTouchConfigTrigger() {
            // Only fire if the mod list is active (meaning the config window isn't already open)
            if (!this._listWindow || !this._listWindow.active || !this._detailsWindow) return;
            
            if (TouchInput.isTriggered()) {
                const x = TouchInput.x;
                const y = TouchInput.y;
                const details = this._detailsWindow;
                
                // If the player clicks anywhere inside the large info panel on the right
                if (x >= details.x && x <= details.x + details.width &&
                    y >= details.y && y <= details.y + details.height) {
                    
                    const mod = this._listWindow._mods[this._listWindow.index()];
                    if (mod) {
                        const mc = window.ModLoaderUI.modConfigs[mod.folderName];
                        const hasJsonConfig = mc && mc.defs && mc.defs.length > 0;
                        const hasJsConfig = window.ModLoaderUI.configs[mod.folderName];
                        
                        // We ONLY open the config window if the mod actually has one, 
                        // to prevent buzzing the player if they were just trying to drag-scroll.
                        if (hasJsonConfig || hasJsConfig) {
                            TouchInput.clear(); // Consume the input
                            this.onModOk();
                        }
                    }
                }
            }
        }

        updateWteModScroll() {
            if (!this._detailsWindow || !this._listWindow || !this._listWindow.active) return;
            
            let scrollAmount = 0;
            if (Input.isPressed('right')) scrollAmount = 4;
            else if (Input.isPressed('left')) scrollAmount = -4;
            if (Input.isPressed('pagedown')) scrollAmount = 14;
            else if (Input.isPressed('pageup')) scrollAmount = -14;
    
            if (TouchInput.wheelY !== 0) {
                scrollAmount += (TouchInput.wheelY > 0) ? 20 : -20;
                TouchInput._wheelY = 0;
            }
    
            if (scrollAmount !== 0) {
                const maxScroll = Math.max(0, (this._detailsWindow._neededHeight || 0) - this._detailsWindow.innerHeight);
                this._detailsWindow.origin.y += scrollAmount;
                this._detailsWindow.origin.y = Math.max(0, Math.min(this._detailsWindow.origin.y, maxScroll));
            }
        }

        onModOk() {
            const mod = this._listWindow._mods[this._listWindow.index()];
            const mc = window.ModLoaderUI.modConfigs[mod.folderName];
            const hasJsonConfig = mc && mc.defs && mc.defs.length > 0;
            const hasJsConfig = window.ModLoaderUI.configs[mod.folderName];
            
            if (mod && (hasJsonConfig || hasJsConfig)) {
                SoundManager.playOk();
                this._configWindow.setMod(mod);
                this._configWindow.show();
                this._configWindow.activate();
                this._listWindow.deactivate();
            } else {
                SoundManager.playBuzzer();
                this._listWindow.activate();
            }
        }

        onConfigCancel() {
            SoundManager.playCancel();
            this._configWindow.hide();
            this._configWindow.deactivate();
            this._listWindow.activate();
            this._detailsWindow.refresh(); 
        }

        onConfigOk() {
            const mod = this._configWindow._mod;
            const symbol = this._configWindow.currentSymbol();
            
            const mc = window.ModLoaderUI.modConfigs[mod.folderName];
            const customHooks = window.ModLoaderUI.configs[mod.folderName];
            let handledNatively = false;

            if (mc && mc.defs) {
                const def = mc.defs.find(d => d.symbol === symbol);
                if (def) {
                    handledNatively = true;
                    
                    if (def.type === 'button') {
                        SoundManager.playOk();
                        
                        if (def.commonEvent && Number(def.commonEvent) > 0) {
                            if ($gameTemp && $gameMap && $gameMap.mapId() > 0) {
                                $gameTemp.reserveCommonEvent(Number(def.commonEvent));
                            }
                        }
                        
                        if (customHooks && typeof customHooks.onButton === 'function') {
                            customHooks.onButton(symbol);
                        }
                    } else {
                        let val = mc.values[symbol];
                        if (def.type === 'boolean') {
                            val = !val;
                        } else if (def.type === 'range') {
                            val += (def.step || 1);
                            if (val > def.max) val = def.min;
                        } else if (def.type === 'list') {
                            val++;
                            if (val >= def.options.length) val = 0;
                        }
                        
                        const requiresRefresh = def.fileSwaps && Array.isArray(def.fileSwaps) && def.fileSwaps.length > 0;
                        window.ModLoaderUI.setConfig(mod.folderName, symbol, val, requiresRefresh);
                        
                        this._configWindow.refresh();
                        SoundManager.playCursor();
                        
                        if (customHooks && typeof customHooks.onChange === 'function') {
                            customHooks.onChange(symbol, val);
                        }
                    }
                }
            }

            if (!handledNatively && customHooks && typeof customHooks.onOk === 'function') {
                customHooks.onOk(symbol, this._configWindow, this);
            } else {
                this._configWindow.activate();
            }
        }
    };

    // ========================================================================
    // WINDOW: Window_ModList 
    // ========================================================================
    window.Window_ModList = class extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this._mods = [];
            this.activate();
            this.select(0);
        }

        cursorRight() {}
        cursorLeft() {}
        cursorPagedown() {}
        cursorPageup() {}

        setMods(mods) {
            this._mods = mods;
            this.refresh();
        }

        setDetailsWindow(detailsWindow) {
            this._detailsWindow = detailsWindow;
            this.updateDetails();
        }

        maxItems() {
            return Math.max(1, this._mods.length);
        }

        drawItem(index) {
            const rect = this.itemLineRect(index);
            this.resetTextColor();
            
            if (this._mods.length === 0) {
                this.drawText(emptyListText, rect.x, rect.y, rect.width, "center");
                return;
            }

            const mod = this._mods[index];
            modLiteralDraw.call(this, mod.name, rect.x, rect.y, rect.width, "left");
        }

        select(index) {
            super.select(index);
            this.updateDetails();
        }

        updateDetails() {
            if (this._detailsWindow) {
                if (this._mods.length === 0) {
                    this._detailsWindow.setMod(null);
                } else {
                    this._detailsWindow.setMod(this._mods[this.index()]);
                }
            }
        }
    }

    // ========================================================================
    // WINDOW: Window_ModConfig (Interactive Options)
    // ========================================================================
    window.Window_ModConfig = class extends Window_Command {
        // Class-local methods bypass later Window/Bitmap translation hooks.
        drawItem(index) { return modNativeCommandDrawItem.call(this, index); }
        drawText(...args) { return modLiteralDraw.apply(this, args); }
        drawTextEx(...args) { return modLiteralDrawEx.apply(this, args); }
        textWidth(text) { return modLiteralWidth.call(this, text); }
        initialize(rect) {
            this._mod = null;
            super.initialize(rect);
        }

        setMod(mod) {
            this._mod = mod;
            this.refresh();
            this.select(0);
        }

        makeCommandList() {
            if (!this._mod) return;
            
            const isGameActive = $gameMap && $gameMap.mapId() > 0;
            
            const mc = window.ModLoaderUI.modConfigs[this._mod.folderName];
            if (mc && mc.defs) {
                for (const def of mc.defs) {
                    let text = def.name;
                    const val = mc.values[def.symbol];
                    if (def.type === 'boolean') {
                        text += (() => {
                            const suffix = val ? ": [ ON ]" : ": [ OFF ]";
                            try {
                                const translated = typeof window.translateText === 'function'
                                    ? window.translateText(suffix) : suffix;
                                return typeof translated === 'string' && translated.length > 0
                                    ? translated : suffix;
                            } catch (_) {
                                return suffix;
                            }
                        })();
                    } else if (def.type === 'range') {
                        text += ": < " + val + " >";
                    } else if (def.type === 'list') {
                        const opt = def.options[val] || "???";
                        text += ": < " + opt + " >";
                    }
                    
                    const enabled = def.requireLoadedMap ? isGameActive : true;
                    this.addCommand(text, def.symbol, enabled);
                }
            }

            if (window.ModLoaderUI.configs[this._mod.folderName]) {
                const customHooks = window.ModLoaderUI.configs[this._mod.folderName];
                if (typeof customHooks.makeCommands === 'function') {
                    customHooks.makeCommands(this);
                }
            }
        }

        cursorRight(wrap) {
            const mod = this._mod;
            const symbol = this.currentSymbol();
            
            const mc = window.ModLoaderUI.modConfigs[mod.folderName];
            const customHooks = window.ModLoaderUI.configs[mod.folderName];
            let handledNatively = false;
            
            if (this.isCurrentItemEnabled()) {
                if (mc && mc.defs) {
                    const def = mc.defs.find(d => d.symbol === symbol);
                    if (def) {
                        handledNatively = true;
                        if (def.type !== 'button') {
                            let val = mc.values[symbol];
                            if (def.type === 'boolean') {
                                val = !val;
                            } else if (def.type === 'range') {
                                val += (def.step || 1);
                                if (val > def.max) val = def.min;
                            } else if (def.type === 'list') {
                                val++;
                                if (val >= def.options.length) val = 0;
                            }
                            
                            const requiresRefresh = def.fileSwaps && Array.isArray(def.fileSwaps) && def.fileSwaps.length > 0;
                            window.ModLoaderUI.setConfig(mod.folderName, symbol, val, requiresRefresh);
                            
                            this.refresh();
                            SoundManager.playCursor();
                            
                            if (customHooks && typeof customHooks.onChange === 'function') {
                                customHooks.onChange(symbol, val);
                            }
                        }
                    }
                }

                if (!handledNatively && customHooks && typeof customHooks.onRight === 'function') {
                    customHooks.onRight(symbol, this, SceneManager._scene);
                }
            }
            
            if (!handledNatively) super.cursorRight(wrap);
        }

        cursorLeft(wrap) {
            const mod = this._mod;
            const symbol = this.currentSymbol();
            
            const mc = window.ModLoaderUI.modConfigs[mod.folderName];
            const customHooks = window.ModLoaderUI.configs[mod.folderName];
            let handledNatively = false;
            
            if (this.isCurrentItemEnabled()) {
                if (mc && mc.defs) {
                    const def = mc.defs.find(d => d.symbol === symbol);
                    if (def) {
                        handledNatively = true;
                        if (def.type !== 'button') {
                            let val = mc.values[symbol];
                            if (def.type === 'boolean') {
                                val = !val;
                            } else if (def.type === 'range') {
                                val -= (def.step || 1);
                                if (val < def.min) val = def.max;
                            } else if (def.type === 'list') {
                                val--;
                                if (val < 0) val = def.options.length - 1;
                            }
                            
                            const requiresRefresh = def.fileSwaps && Array.isArray(def.fileSwaps) && def.fileSwaps.length > 0;
                            window.ModLoaderUI.setConfig(mod.folderName, symbol, val, requiresRefresh);
                            
                            this.refresh();
                            SoundManager.playCursor();
                            
                            if (customHooks && typeof customHooks.onChange === 'function') {
                                customHooks.onChange(symbol, val);
                            }
                        }
                    }
                }
                
                if (!handledNatively && customHooks && typeof customHooks.onLeft === 'function') {
                    customHooks.onLeft(symbol, this, SceneManager._scene);
                }
            }
            
            if (!handledNatively) super.cursorLeft(wrap);
        }
    }

    // ========================================================================
    // WINDOW: Window_ModDetails
    // ========================================================================
    window.Window_ModDetails = class extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this._mod = null;
            this._neededHeight = 0;
            
            this._scrollSprite = new Sprite();
            this._scrollSprite.x = this.width - 18; 
            this.addChild(this._scrollSprite);

            this.refresh();
        }

        update() {
            super.update();
            this.updateScrollBar();
        }

        updateScrollBar() {
            if (!this._scrollSprite) return;
    
            const totalHeight = this._neededHeight || 0;
            const visibleHeight = this.innerHeight;
            
            if (totalHeight <= visibleHeight) {
                this._scrollSprite.visible = false;
                return;
            }
    
            this._scrollSprite.visible = true;
            
            const ratio = visibleHeight / totalHeight;
            const barHeight = Math.max(40, visibleHeight * ratio); 
            
            const scrollMax = totalHeight - visibleHeight;
            const scrollPos = this.origin.y; 
            const scrollRatio = scrollMax > 0 ? scrollPos / scrollMax : 0;
            
            const availableTrack = visibleHeight - barHeight;
            const barY = scrollRatio * availableTrack;
    
            if (!this._scrollSprite.bitmap || this._scrollSprite.bitmap.height !== Math.floor(barHeight)) {
                if (this._scrollSprite.bitmap) this._scrollSprite.bitmap.destroy();
                this._scrollSprite.bitmap = new Bitmap(6, Math.floor(barHeight));
                this._scrollSprite.bitmap.fillAll('rgba(255, 255, 255, 0.5)');
            }
            
            this._scrollSprite.y = barY + 12; 
        }

        setMod(mod) {
            if (this._mod !== mod) {
                this._mod = mod;
                this.origin.y = 0; 
                this.refresh();
            }
        }

        refresh() {
            if (this.contents) {
                this.contents.destroy();
            }
            
            this.contents = new Bitmap(this.contentsWidth(), 3000); 
            this.resetFontSettings();
            this.contents.clear();
            this._neededHeight = 0;
            
            if (!this._mod) {
                this.resetTextColor();
                modLiteralDrawEx.call(this, modFixedText(emptyDetailsText), 0, 0, this.contentsWidth());
                return;
            }

            const lineHeight = this.lineHeight();
            let currentY = 0;

            const drawModData = (label, value) => {
                label = modFixedText(label);
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(label, 0, currentY, this.contentsWidth(), "left");
                const labelWidth = this.textWidth(label) + 12;
                this.resetTextColor();
                modLiteralDrawEx.call(this, value, labelWidth, currentY);
                currentY += lineHeight;
            };

            drawModData("Name:", this._mod.name);
            drawModData("Author:", modValue(this._mod, "author"));
            drawModData("Game Version:", modValue(this._mod, "gameversion"));
            drawModData("Mod Version:", String(this._mod.modversion));
            
            if (this._mod.languages && this._mod.languages.trim() !== "") {
                drawModData("Supported Languages:", this._mod.languages);
            }
            
            drawModData("Priority:", String(this._mod.priority));

            const hasJsonConfig = window.ModLoaderUI.modConfigs[this._mod.folderName] && window.ModLoaderUI.modConfigs[this._mod.folderName].defs.length > 0;
            const hasJsConfig = window.ModLoaderUI.configs[this._mod.folderName];
            
            if (hasJsonConfig || hasJsConfig) {
                this.changeTextColor(ColorManager.powerUpColor());
                this.drawText("Press OK to configure", 0, currentY, this.contentsWidth(), "left");
                this.resetTextColor();
                currentY += lineHeight;
            }

            currentY += lineHeight / 2;
            this.contents.fillRect(0, currentY, this.contentsWidth(), 2, ColorManager.normalColor());
            currentY += lineHeight / 2;

            this.changeTextColor(ColorManager.systemColor());
            this.drawText("Description:", 0, currentY, this.contentsWidth(), "left");
            this.resetTextColor();
            currentY += lineHeight;
            
            currentY = this.drawWrappedText(modValue(this._mod, "description"), 0, currentY, this.contentsWidth());
            
            this._neededHeight = currentY;
        }

        drawWrappedText(text, x, y, maxWidth) {
            if (!text) return y;
            
            const words = text.split(/([ \n])/); 
            let currentLine = "";
            let currentY = y;
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                
                if (word === '\n') {
                    modLiteralDrawEx.call(this, currentLine, x, currentY);
                    currentY += this.lineHeight();
                    currentLine = "";
                    continue;
                }
                
                if (word === ' ') {
                    currentLine += word;
                    continue;
                }
                
                const testLine = currentLine + word;
                const measureLine = testLine.replace(/\x1b[a-zA-Z]+\[\d+\]/gi, "").replace(/\x1b[a-zA-Z]+/gi, "");
                
                if (modLiteralWidth.call(this, testLine) > maxWidth && currentLine !== "") {
                    modLiteralDrawEx.call(this, currentLine, x, currentY);
                    currentY += this.lineHeight();
                    currentLine = word; 
                } else {
                    currentLine = testLine;
                }
            }
            
            if (currentLine !== "") {
                modLiteralDrawEx.call(this, currentLine, x, currentY);
                currentY += this.lineHeight();
            }
            
            return currentY;
        }
    }
})();