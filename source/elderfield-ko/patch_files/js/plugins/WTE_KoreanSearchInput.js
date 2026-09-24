/*:
 * @target MZ
 * @plugindesc [v1.0.0] Korean IME container/warehouse search input (ElderField KO patch)
 * @author ElderField KO patch
 * @orderAfter DM_InventorySearch
 * @orderAfter WTE_SearchAutoClear
 * @help
 * ----------------------------------------------------------------------------
 * WTE_KoreanSearchInput
 * ----------------------------------------------------------------------------
 * The stock DM_InventorySearch opens RPG Maker MZ's Scene_Name, which uses a
 * fixed on-screen character grid (Window_NameInput) that has no Hangul and no
 * OS IME support. This plugin replaces that input with a DOM text field so the
 * operating system Korean IME can be used inside the NW.js runtime.
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
 * - While the overlay is open the container scene ignores its own input, and
 *   the raw key events are kept away from the game Input manager.
 *
 * Requires: DM_InventorySearch (Scene_Container), Hendrix_Localization_Core
 * (window.translateText) for Korean matching. If translateText is absent the
 * hook falls back to the raw English name only.
 */

(() => {
    "use strict";

    if (typeof Scene_Container === "undefined") return;

    const PLUGIN_NAME = "WTE_KoreanSearchInput";

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
    // 2. DOM overlay with OS IME support
    // ------------------------------------------------------------------

    let overlay = null; // { root, input, finish }

    function ensureStyles() {
        if (typeof document === "undefined") return;
        if (document.getElementById("wte-ksearch-style")) return;
        const style = document.createElement("style");
        style.id = "wte-ksearch-style";
        style.textContent = [
            "#wte-ksearch{position:fixed;inset:0;z-index:2147483000;",
            "background:rgba(0,0,0,0.55);display:flex;align-items:center;",
            "justify-content:center;}",
            "#wte-ksearch .box{background:rgba(14,16,22,0.97);",
            "border:2px solid #9fb4c7;border-radius:10px;padding:18px 20px;",
            "width:480px;max-width:80%;color:#fff;",
            "font-family:'NotoSansCJKkr','Malgun Gothic',sans-serif;}",
            "#wte-ksearch .title{font-size:18px;margin-bottom:10px;}",
            "#wte-ksearch input{width:100%;box-sizing:border-box;font-size:22px;",
            "padding:8px 10px;border-radius:6px;border:1px solid #9fb4c7;",
            "background:#0d1117;color:#fff;outline:none;}",
            "#wte-ksearch .hint{font-size:13px;opacity:0.8;margin-top:8px;}",
        ].join("");
        document.head.appendChild(style);
    }

    function openOverlay(initialValue) {
        if (typeof document === "undefined") return Promise.resolve(null);
        ensureStyles();

        const root = document.createElement("div");
        root.id = "wte-ksearch";

        const box = document.createElement("div");
        box.className = "box";

        const title = document.createElement("div");
        title.className = "title";
        title.textContent = "아이템 검색";

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 32;
        input.autocomplete = "off";
        input.value = initialValue || "";

        const hint = document.createElement("div");
        hint.className = "hint";
        hint.textContent = "한글로 입력한 뒤 Enter, 취소는 Esc";

        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(hint);
        root.appendChild(box);
        document.body.appendChild(root);

        return new Promise((resolve) => {
            let settled = false;

            const finish = (value) => {
                if (settled) return;
                settled = true;
                overlay = null;
                input.removeEventListener("keydown", onKeyDown);
                input.removeEventListener("keyup", swallow);
                input.removeEventListener("keypress", swallow);
                if (root.parentNode) root.parentNode.removeChild(root);
                resolve(value);
            };

            const swallow = (event) => {
                event.stopPropagation();
            };

            const onKeyDown = (event) => {
                // Keep every key away from the game Input manager. Because this
                // listener runs during the target phase on the focused input it
                // stops the event before it bubbles to the document listeners
                // MZ/VisuStella install.
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

            overlay = { root, input, finish };

            // Focusing after the current frame avoids the engine stealing focus.
            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch (error) {
                    // Ignore focus failures; the user can still click the field.
                }
            }, 0);
        });
    }

    // ------------------------------------------------------------------
    // 3. Scene integration
    // ------------------------------------------------------------------

    // While the overlay is open the container scene must not react to keys.
    const _Scene_Container_isActive = Scene_Container.prototype.isActive;
    Scene_Container.prototype.isActive = function () {
        if (overlay) return false;
        return _Scene_Container_isActive.call(this);
    };

    // Allow gamepad "cancel" to close the overlay (keyboard Esc is handled by
    // the DOM listener above).
    const _Scene_Container_update = Scene_Container.prototype.update;
    Scene_Container.prototype.update = function () {
        _Scene_Container_update.call(this);
        if (overlay && Input.isTriggered("cancel")) {
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
        openOverlay(initial).then((value) => {
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
        window.WTE_KoreanSearchInput = { pluginName: PLUGIN_NAME, version: "1.0.0" };
    }
})();
