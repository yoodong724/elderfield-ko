/*:
 * @target MZ
 * @plugindesc [v1.1.0] Korean IME container/warehouse search input (ElderField KO patch)
 * @author ElderField KO patch
 * @orderAfter DM_InventorySearch
 * @orderAfter WTE_SearchAutoClear
 * @help
 * ----------------------------------------------------------------------------
 * WTE_KoreanSearchInput
 * ----------------------------------------------------------------------------
 * The stock DM_InventorySearch opens RPG Maker MZ's Scene_Name, which uses a
 * fixed on-screen character grid (Window_NameInput) that has no Hangul and no
 * OS IME support. This plugin replaces that input with a real OS IME text field
 * so the operating system Korean IME can be used inside the NW.js runtime.
 *
 * The input panel is drawn with the engine's own Window_Base, so it uses the
 * game windowskin, window tone, dynamic corner graphics and font exactly like
 * the rest of the UI. A transparent DOM <input> is positioned on top of that
 * window purely to receive IME composition; the text itself is drawn by the
 * engine window.
 *
 * It also exposes window.WTE_ItemMatchesSearch(item, term), which the patched
 * DM_InventorySearch calls. The hook matches both the raw database name
 * (English) and the translated display name (Korean) so players can search
 * using the name they see on screen.
 *
 * Behaviour:
 * - Confirm (Enter): set the search term and switch the container sort mode to
 *   Search. An empty term clears the search.
 * - Cancel (Esc or gamepad B): close without changing the current search.
 * - While the panel is open the container scene ignores its own input, and the
 *   raw key events are kept away from the game Input manager.
 *
 * Requires: DM_InventorySearch (Scene_Container), Hendrix_Localization_Core
 * (window.translateText) for Korean matching. If translateText is absent the
 * hook falls back to the raw English name only.
 */

(() => {
    "use strict";

    if (typeof Scene_Container === "undefined") return;

    const PLUGIN_NAME = "WTE_KoreanSearchInput";
    const PLUGIN_VERSION = "1.1.0";

    // ------------------------------------------------------------------
    // 1. Localized name matching hook (used by the patched DM_InventorySearch)
    // ------------------------------------------------------------------

    const translateName = (text) => {
        try {
            if (typeof window.translateText === "function") return window.translateText(text);
            if (typeof window.Hendrix_Localization === "function") return window.Hendrix_Localization(text);
        } catch (error) {
            // Fall back to the raw name below; never break filtering on a
            // translation failure.
        }
        return text;
    };

    window.WTE_ItemMatchesSearch = function (item, term) {
        if (!item || typeof item.name !== "string") return false;
        const needle = String(term == null ? "" : term).toLowerCase();
        if (needle === "") return true;

        const raw = item.name.toLowerCase();
        if (raw.includes(needle)) return true;

        const localized = String(translateName(item.name)).toLowerCase();
        if (localized === raw) return false;
        return localized.includes(needle);
    };

    // ------------------------------------------------------------------
    // 2. Engine-drawn search window (matches the game's window skin)
    // ------------------------------------------------------------------

    let Window_KoreanSearchInput = null;

    if (typeof Window_Base !== "undefined") {
        Window_KoreanSearchInput = function () {
            this.initialize(...arguments);
        };
        Window_KoreanSearchInput.prototype = Object.create(Window_Base.prototype);
        Window_KoreanSearchInput.prototype.constructor = Window_KoreanSearchInput;

        Window_KoreanSearchInput.prototype.initialize = function (rect) {
            Window_Base.prototype.initialize.call(this, rect);
            this._value = "";
            this._cursorVisible = true;
            this._blink = 0;
            this.refresh();
        };

        Window_KoreanSearchInput.prototype.setValue = function (value) {
            const text = String(value == null ? "" : value);
            if (this._value === text) return;
            this._value = text;
            this.refresh();
        };

        Window_KoreanSearchInput.prototype.tick = function () {
            this._blink = (this._blink + 1) % 60;
            const visible = this._blink < 30;
            if (visible !== this._cursorVisible) {
                this._cursorVisible = visible;
                this.refresh();
            }
        };

        Window_KoreanSearchInput.prototype.refresh = function () {
            if (!this.contents) return;
            this.contents.clear();
            const pad = this.textPadding();
            const width = this.contents.width - pad * 2;
            const lineH = this.lineHeight();
            const hintH = 24;
            const gap = 4;
            const blockH = lineH + gap + lineH + gap + hintH;
            let y = Math.max(pad, Math.floor((this.contents.height - blockH) / 2));

            this.changeTextColor(ColorManager.systemColor());
            this.drawText("아이템 검색", pad, y, width);
            this.resetTextColor();

            y += lineH + gap;
            this.drawText(this._value, pad, y, width);

            if (this._cursorVisible) {
                const textWidth = Math.min(this.textWidth(this._value), width - 2);
                this.contents.fillRect(pad + textWidth + 2, y + 6, 2, lineH - 12, ColorManager.normalColor());
            }

            y += lineH + gap;
            this.contents.fontSize = 20;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("한글로 입력 · Enter 확인 · Esc 취소", pad, y, width);
            this.resetFontSettings();
        };
    }

    // ------------------------------------------------------------------
    // 3. Transparent DOM input used only to receive OS IME composition
    // ------------------------------------------------------------------

    let overlay = null; // { win, input, finish }

    function styleInput(input) {
        const style = input.style;
        style.position = "fixed";
        style.margin = "0";
        style.padding = "0";
        style.border = "none";
        style.outline = "none";
        style.background = "transparent";
        style.color = "transparent";
        style.caretColor = "transparent";
        style.fontSize = "24px";
        style.zIndex = "2147483000";
    }

    function positionInput() {
        if (!overlay) return;
        const canvas = Graphics._canvas || document.querySelector("canvas");
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const win = overlay.win;
        const sx = rect.width / Graphics.width;
        const sy = rect.height / Graphics.height;
        const style = overlay.input.style;
        style.left = rect.left + (win.x + 4) * sx + "px";
        style.top = rect.top + (win.y + 4) * sy + "px";
        style.width = (win.width - 8) * sx + "px";
        style.height = (win.height - 8) * sy + "px";
    }

    function openOverlay(scene, initialValue) {
        if (typeof document === "undefined" || !Window_KoreanSearchInput) {
            return Promise.resolve(null);
        }

        const win = scene.koreanSearchWindow();
        win.setValue(initialValue || "");
        win.show();

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 32;
        input.autocomplete = "off";
        input.spellcheck = false;
        input.value = initialValue || "";
        styleInput(input);
        document.body.appendChild(input);

        return new Promise((resolve) => {
            let settled = false;

            const finish = (value) => {
                if (settled) return;
                settled = true;
                overlay = null;
                input.removeEventListener("keydown", onKeyDown);
                input.removeEventListener("keyup", swallow);
                input.removeEventListener("keypress", swallow);
                if (input.parentNode) input.parentNode.removeChild(input);
                if (win.parent) win.hide();
                resolve(value);
            };

            const swallow = (event) => event.stopPropagation();

            const onKeyDown = (event) => {
                // Keep every key away from the game Input manager. This listener
                // runs on the focused input, before the event bubbles to the
                // document listeners MZ/VisuStella install.
                event.stopPropagation();
                if (event.key === "Enter" && !event.isComposing) {
                    event.preventDefault();
                    finish(input.value);
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    finish(null);
                }
            };

            input.addEventListener("keydown", onKeyDown);
            input.addEventListener("keyup", swallow);
            input.addEventListener("keypress", swallow);

            overlay = { win, input, finish };
            positionInput();

            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch (error) {
                    // Ignore focus failures; the user can still click the field.
                }
                positionInput();
            }, 0);
        });
    }

    // ------------------------------------------------------------------
    // 4. Scene integration
    // ------------------------------------------------------------------

    // Lazily create one reusable engine window per container scene.
    Scene_Container.prototype.koreanSearchWindow = function () {
        if (!this._koreanSearchWindow && Window_KoreanSearchInput) {
            const width = 560;
            const height = 150;
            const x = Math.floor((Graphics.boxWidth - width) / 2);
            const y = Math.floor((Graphics.boxHeight - height) / 2);
            const rect = new Rectangle(x, y, width, height);
            this._koreanSearchWindow = new Window_KoreanSearchInput(rect);
            this._koreanSearchWindow.hide();
            this.addWindow(this._koreanSearchWindow);
        }
        return this._koreanSearchWindow;
    };

    // While the panel is open the container scene must not react to keys.
    const _Scene_Container_isActive = Scene_Container.prototype.isActive;
    Scene_Container.prototype.isActive = function () {
        if (overlay) return false;
        return _Scene_Container_isActive.call(this);
    };

    const _Scene_Container_update = Scene_Container.prototype.update;
    Scene_Container.prototype.update = function () {
        _Scene_Container_update.call(this);
        if (!overlay) return;
        overlay.win.setValue(overlay.input.value);
        overlay.win.tick();
        positionInput();
        if (Input.isTriggered("cancel")) {
            overlay.finish(null);
        }
    };

    function applySearchTerm(scene, value) {
        const term = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
        if (term !== "") {
            $gameSystem._containerSearchTerm = term.toLowerCase();
            $gameSystem._containerSortMode = 5;
        } else {
            $gameSystem._containerSortMode = 0;
            $gameSystem._containerSearchTerm = "";
        }
        if (scene._itemWindow) scene._itemWindow.refresh();
        if (scene._containerWindow) scene._containerWindow.refresh();
        if (scene._sortModeWindow) scene._sortModeWindow.refresh();
        if (scene._searchWindow) {
            scene._searchWindow.deactivate();
            scene._searchWindow.deselect();
        }
        if (scene._categoryWindow && scene._categoryWindow.maxItems() > 0) {
            scene._categoryWindow.activate();
            scene._categoryWindow.select(0);
        }
    }

    function restoreSearchWindow(scene) {
        if (scene._searchWindow && scene._searchWindow.visible) {
            scene._searchWindow.activate();
            scene._searchWindow.select(0);
        }
    }

    Scene_Container.prototype.onSearchOk = function () {
        const scene = this;
        SoundManager.playOk();
        if (scene._searchWindow) {
            scene._searchWindow.deactivate();
            scene._searchWindow.deselect();
        }
        const initial = $gameSystem._containerSearchTerm || "";
        Input.clear();
        openOverlay(scene, initial).then((value) => {
            if (SceneManager._scene !== scene) {
                Input.clear();
                return;
            }
            if (value === null) {
                restoreSearchWindow(scene);
            } else {
                applySearchTerm(scene, value);
            }
            Input.clear();
        });
    };

    if (typeof window.WTE_KoreanSearchInput === "undefined") {
        window.WTE_KoreanSearchInput = { pluginName: PLUGIN_NAME, version: PLUGIN_VERSION };
    }
})();
