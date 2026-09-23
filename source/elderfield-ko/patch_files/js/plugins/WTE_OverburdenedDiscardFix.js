/*:
 * @target MZ
 * @plugindesc [v1.0] Forces discard mode when overburdened or holding shift.
 * @author 
 * @orderAfter DM_LimitedInventory
 * @orderAfter DM_LimitedInventoryAddon
 * @orderAfter DM_ItemActions
 * @orderAfter WTE_DiscardDesyncLock
 * 
 * @help
 * ============================================================================
 * WTE_OverburdenedDiscardFix.js
 * ============================================================================
 * Resolves the "flickering" conflict between DM_ItemActions and the 
 * Overburdened strict mode. 
 * 
 * If the inventory is over max capacity in strict mode, OR if the player 
 * hits Sprint (Shift), clicking any item will completely bypass its custom 
 * action menu and instantly open the discard confirmation. 
 * 
 * Includes a pre-check: if the targeted item is <undroppable>, it instantly 
 * plays a buzzer and refuses to open the discard window, protecting the 
 * player from getting trapped in the popup.
 */

(() => {
    if (typeof Scene_Item === 'undefined') return;

    // Helper: Safely check for the undroppable tag
    const isUndroppable = function(item) {
        if (!item) return false;
        if (item.meta && item.meta.undroppable !== undefined) return true;
        if (item.note && item.note.match(/<undroppable>/i)) return true;
        return false;
    };

    // Master Override for Item Selection
    const _Scene_Item_onItemOk = Scene_Item.prototype.onItemOk;
    Scene_Item.prototype.onItemOk = function() {
        const item = this._itemWindow ? this._itemWindow.item() : null;
        if (!item) {
            if (_Scene_Item_onItemOk) _Scene_Item_onItemOk.call(this);
            return;
        }

        let isRestrictive = false;
        let isOverburdened = false;

        // Safely check DM capacity states
        if (typeof $gameContainers !== 'undefined') {
            isRestrictive = $gameContainers.getInventoryMechanics() === 'Restrictive';
            isOverburdened = $gameContainers.getCurrentPartyInventoryWeight() > $gameContainers.getCurrentPartyInventoryMaxWeight();
        }

        const shiftPressed = Input.isPressed('shift');

        // If we are strictly overburdened, OR if the player is explicitly holding Shift
        if ((isRestrictive && isOverburdened) || shiftPressed) {
            
            // 1. Pre-Check for Undroppable Items
            if (isUndroppable(item)) {
                SoundManager.playBuzzer();
                if (this._helpWindow && typeof $gameContainers !== 'undefined') {
                    this._helpWindow.setWarningText(Hendrix_Localization($gameContainers._itemCannotBeDroppedText || "This item cannot be dropped."));
                }
                // Safely reactivate the item window so they aren't softlocked
                if (this._itemWindow) {
                    this._itemWindow.activate();
                }
                return; // Hard Abort
            }

            // 2. Safe to Drop -> Bypass all other plugins and force the Discard UI
            if (typeof $gameContainers !== 'undefined') {
                $gameContainers.tempItem = item;
            }
            
            this._hideActionWindows = true;
            
            // Ensure any custom action popups are forcefully suppressed
            if (this._customItemActionWindow) {
                this._customItemActionWindow.hide();
                this._customItemActionWindow.deactivate();
            }
            if (this._itemActionWindow) {
                this._itemActionWindow.hide();
                this._itemActionWindow.deactivate();
            }

            // Call native DM discard sequence
            if (typeof this.onActionDrop === 'function') {
                this.onActionDrop();
            }
            return;
        }

        // Standard Flow for normal item usage (Routes back to DM_ItemActions or Vanilla)
        if (_Scene_Item_onItemOk) _Scene_Item_onItemOk.call(this);
    };
})();