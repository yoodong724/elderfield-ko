/*:
 * @target MZ MV
 * @plugindesc [v1.0.0] Hendrix Localization - Engine Overrides Module
 * @author Sang Hendrix
 * @url https://sanghendrix.itch.io/
 * @orderAfter Hendrix_Localization_Core
 * 
 * @help
 * ----------------------------------------------------------------------------
 * Hendrix Localization - Engine Overrides Module
 * ----------------------------------------------------------------------------
 * This module contains all the runtime hooks necessary to replace text
 * on the screen. It intercepts drawing functions, message buffers,
 * battle logs, and picture drawing to apply translations.
 * 
 * REQUIRES: Hendrix_Localization_Core to be placed above this plugin.
 * ----------------------------------------------------------------------------
 */

var Imported = Imported || {};
Imported.Hendrix_Localization_Overrides_Module = true;

(function () {
    if (!Imported.Hendrix_Localization_Core) {
        console.error("Hendrix_Localization_Overrides_Module requires Hendrix_Localization_Core to be loaded first!");
        return;
    }

    // ========================================================================
    // PICTURE OVERRIDES & TRANSLATION
    // ========================================================================
    function translatePictureName(name) {
        return window.translateText(name);
    }

    window.refreshAllPictures = function () {
        if ($gameScreen && $gameScreen._pictures) {
            for (let i = 1; i <= $gameScreen.maxPictures(); i++) {
                const picture = $gameScreen.picture(i);
                if (picture) {
                    const originalName = picture.originalName;
                    let newName = originalName;
                    if (!newName.toLowerCase().endsWith('.png')) {
                        newName += '.png';
                    }
                    newName = translatePictureName(newName);
                    if (!originalName.toLowerCase().endsWith('.png') && newName.toLowerCase().endsWith('.png')) {
                        newName = newName.slice(0, -4);
                    }
                    picture.changeName(newName);
                }
            }
        }
    };

    Game_Picture.prototype.changeName = function (name) {
        if (this._name !== name) {
            this._name = name;
            this.initTarget();
        }
    };

    Object.defineProperty(Game_Picture.prototype, 'originalName', {
        get: function () {
            return this._originalName || this._name;
        },
        set: function (value) {
            this._originalName = value;
        }
    });

    const _Game_Screen_showPicture = Game_Screen.prototype.showPicture;
    Game_Screen.prototype.showPicture = function (pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode) {
        let translatedName = name;
        let originalHadPng = name.toLowerCase().endsWith('.png');

        if (!originalHadPng) {
            translatedName += '.png';
        }
        translatedName = translatePictureName(translatedName);
        if (!originalHadPng && translatedName.toLowerCase().endsWith('.png')) {
            translatedName = translatedName.slice(0, -4);
        }

        _Game_Screen_showPicture.call(this, pictureId, translatedName, origin, x, y, scaleX, scaleY, opacity, blendMode);

        const picture = this.picture(pictureId);
        if (picture) {
            picture._originalName = name;
        }
    };

    // ========================================================================
    // MESSAGE BUFFER & YANFLY MESSAGE CORE
    // ========================================================================
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        if (Imported['YEP_MessageCore']) {
            this.updateMessageCoreEscapeCharacters();
        }
    };

    Scene_Boot.prototype.updateMessageCoreEscapeCharacters = function () {
        Game_Message.prototype.addText = function (text) {
            if ($gameSystem.wordWrap()) text = '<WordWrap>' + window.Hendrix_Localization(text);
            this.add(text);
        };

        Window_Base.prototype.setWordWrap = function (text) {
            this._wordWrap = false;
            if (text.match(/<(?:WordWrap)>/i)) {
                this._wordWrap = true;
                text = text.replace(/<(?:WordWrap)>/gi, '');
            }
            if (this._wordWrap) {
                var replace = Yanfly.Param.MSGWrapSpace ? ' ' : '';
                text = window.Hendrix_Localization(text).replace(/[\n\r]+/g, replace);
            }
            if (this._wordWrap) {
                text = window.Hendrix_Localization(text).replace(/<(?:BR|line break)>/gi, '\n');
            } else {
                text = window.Hendrix_Localization(text).replace(/<(?:BR|line break)>/gi, '');
            }
            return text;
        };

        Window_Base.prototype.escapeIconItem = function (n, database) {
            return '\x1bI[' + database[n].iconIndex + ']' + window.Hendrix_Localization(database[n].name);
        };

        var _Window_Base_convertExtraEscapeCharacters = Window_Base.prototype.convertExtraEscapeCharacters;
        Window_Base.prototype.convertExtraEscapeCharacters = function (text) {
            text = _Window_Base_convertExtraEscapeCharacters.call(this, text);
            text = text.replace(/\x1bAC\[(\d+)\]/gi, function () { return window.Hendrix_Localization(this.actorClassName(parseInt(arguments[1]))); }.bind(this));
            text = text.replace(/\x1bAN\[(\d+)\]/gi, function () { return window.Hendrix_Localization(this.actorNickname(parseInt(arguments[1]))); }.bind(this));
            text = text.replace(/\x1bPC\[(\d+)\]/gi, function () { return window.Hendrix_Localization(this.partyClassName(parseInt(arguments[1]))); }.bind(this));
            text = text.replace(/\x1bPN\[(\d+)\]/gi, function () { return window.Hendrix_Localization(this.partyNickname(parseInt(arguments[1]))); }.bind(this));
            text = text.replace(/\x1bNC\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataClasses[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNI\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataItems[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNW\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataWeapons[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNA\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataArmors[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNE\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataEnemies[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNS\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataSkills[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bNT\[(\d+)\]/gi, function () { return window.Hendrix_Localization($dataStates[parseInt(arguments[1])].name); }.bind(this));
            text = text.replace(/\x1bII\[(\d+)\]/gi, function () { return this.escapeIconItem(arguments[1], window.Hendrix_Localization($dataItems)); }.bind(this));
            text = text.replace(/\x1bIW\[(\d+)\]/gi, function () { return this.escapeIconItem(arguments[1], window.Hendrix_Localization($dataWeapons)); }.bind(this));
            text = text.replace(/\x1bIA\[(\d+)\]/gi, function () { return this.escapeIconItem(arguments[1], window.Hendrix_Localization($dataArmors)); }.bind(this));
            text = text.replace(/\x1bIS\[(\d+)\]/gi, function () { return this.escapeIconItem(arguments[1], window.Hendrix_Localization($dataSkills)); }.bind(this));
            text = text.replace(/\x1bIT\[(\d+)\]/gi, function () { return this.escapeIconItem(arguments[1], window.Hendrix_Localization($dataStates)); }.bind(this));
            return text;
        };
    };

    Game_Message.prototype.messageBuffer = [];

    const _Game_Message_add = Game_Message.prototype.add;
    Game_Message.prototype.add = function (text) {
        if (this._scrollMode || ($gameParty.inBattle() && !$gameMessage._showFast)) {
            this._texts.push(text);
        } else {
            this.messageBuffer.push(text);
        }
    };

    Game_Message.prototype.processMessageBuffer = Game_Message.prototype.processMessageBuffer || function () {
        if (!this.messageBuffer.length) return;

        const fullMessage = this.messageBuffer.join('\n');
        let processedText = fullMessage;

        if (Imported['YEP_MessageCore'] && $gameSystem.wordWrap()) {
            processedText = '<WordWrap>' + processedText;
        }

        const translatedText = window.translateText(processedText);
        this.messageBuffer = [];

        translatedText.split('\n').forEach(line => {
            _Game_Message_add.call(this, line);
        });
    };

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        if ($gameMessage.messageBuffer) {
            $gameMessage.messageBuffer = [];
        }
        _Scene_Map_start.call(this);
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function (mapId) {
        if ($gameMessage.messageBuffer) {
            $gameMessage.messageBuffer = [];
        }
        _Game_Map_setup.call(this, mapId);
    };

    // ========================================================================
    // GAME INTERPRETER OVERRIDES
    // ========================================================================
    const _Game_Interpreter_command261 = Game_Interpreter.prototype.command261;
    Game_Interpreter.prototype.command261 = function () {
        let filename = Utils.RPGMAKER_NAME === "MV" ? this._params[0] : arguments[0][0];
        const originalHadWebm = filename.toLowerCase().endsWith('.webm');

        if (!originalHadWebm) {
            filename += '.webm';
        }

        let translatedName = window.translateText(filename);

        if (!originalHadWebm && translatedName.toLowerCase().endsWith('.webm')) {
            translatedName = translatedName.slice(0, -5);
        }

        if (Utils.RPGMAKER_NAME === "MV") {
            this._params[0] = translatedName;
            return _Game_Interpreter_command261.call(this);
        } else {
            arguments[0][0] = translatedName;
            return _Game_Interpreter_command261.call(this, arguments[0]);
        }
    };

    // ELDERFIELD_SCRIPT_AUDIO_ASSET_GUARD_V1
    const elderfieldScriptAudioAssetNames = new Set(["1","10","11","12","13","14","15","16","17","2","3","4","5","6","7","8","9","absorb1","absorb2","anvil","attack1","attack2","attack3","backrooms","bait","bait2","bath","battle","battleslowcreepy","bike1","bike2","bike3","bike4","bike5","bike6","bike7","bike8","bikebell","bikebell2","blank","blip","block","blow1","bosstrack1","box","bubbles","buff","buffshort","bugflutter1","busleave","busstop","cabin","calm","camp","cancel1","catacombs","cave","caw","chime1","chime2","chime3","chime5","church","churn","city","clock","close1","close2","close3","closet","clunk1","clunk2","clunk3","coin","coinflip","confuse","cooking","craft","creepythudd","crow","crows","crows2","curse1","curse2","cursor1","cursor2","cursor3","cursor4","curtain","damage1","damage2","damage3","damage4","damage5","darkness","darkness1","darkness2","darkness3","darkness4","darkness5","darkness6","darkness7","darkness8","death","debuff","debuffshort","deepthunk","defeat1","defeat2","dig","dizzyboss","door1","door2","door3","door4","door5","door6","door7","door8","drips","earthquake","eeriepad","elevator","elevatorbell","enginehum","enginehum2","equip1","equip2","equip3","equipx","evasion1","evasion2","faint","fanfare1","fanfare2","fanfare3","farm","fire1","fire2","fire3","fire4","fire5","fire6","fire7","fire8","fire9","firecrackle","fishcatch","fishhook","fog2","forge","gag","gallery","game over","gamemusic","gameover1","gameover2","ghost","goatadult","goatbaby","god shrine","god shrine flash","greystoneestates","grind","grinder","hallway","hammer","harvest","headshake","heal1","heal2","heal3","heal4","heal5","heal6","heal7","home","horror","hum","hurt","inn1","inn2","item","item1","item2","item3","juicer","key","lake","library","like","load1","load2","mall2","menu button","metalladder","metalthunk","milk","mining/break1","mining/break2","mining/claybreak1","mining/clayhit1","mining/clayhit2","mining/clayhit3","mining/hit1","mining/hit2","mining/hit3","mining/smelt","mining/woodbreak1","mining/woodbreak2","mining/woodhit1","mining/woodhit2","mining/woodhit3","miss","monster1","monster2","monster3","moo","moodyscream","mortar","mortarstart2","move1","move2","move3","move4","move5","move6","move7","move8","move9","muffledrain","musical1","musical2","musical3","mystery","neon","news","night","nightgong","noise","oldwoods1","oldwoodsambient","oldwoodsambientcreaking","oldwoodscreak","openingcutscene","organ","page","pendulum1","people1","people2","phone","player/1","player/10","player/11","player/12","player/13","player/14","player/15","player/16","player/17","player/2","player/3","player/4","player/5","player/6","player/7","player/8","player/9","pluck","popup1","popup2","pot","pre title","preptablecraft","preptableopen","quake1","quake2","radiotower","rain","rain1","rain2","rain3","rain4","rainslow","reel","reelbad","reelgood","refresh","river","rooftop","s1","s2","s3","s4","s5","s6","sad","saloon","save1","save2","school","schoolboss","scream","sdfdxs","sea","seasonhit1","select button","shock1","shock2","shock3","shop","shoveldig","silence","skeletonmerchant","sleep","sleephit","slither","slowtheme","sobbing","sobbing1","sobbing2","sobbing3","sobbing4","sound1","sound2","sound3","speech1","speech2","speech3","speech4","speech5","speech6","speech7","speech8","speech9","splash","splash 1","splash 2","stairs","static","static2","static3","step","step2","step2w","stepgrass1","stepgrass1w","stepgrass2","stepgrass2w","stepgravel1","stepgravel1w","stepgravel2","stepgravel2w","stepsnow1","stepsnow2","stepw","storm1","storm2","summerday","summernight","tallmanlaugh","taxhit","text1","theme1","thetaxman","thunder","title bgm test","town","town3","treefall","tv","tv_short","tvon","vcr_pause","vcr_resume","vendingclink","victory","victory1","victory2","victory3","victoryx","waterfall1","waterfall2","wave1","wave2","weirdjingle","whispers","whoareyou","wind1","wind2","wind3","wind4","wind5","windmill","winterday","winternight","witchday","witchnight","workbench","workshop","zap"]);
    const elderfieldTranslateScriptLiteral = function (scriptText, literal) {
        const isAudioScript = /\bAudioManager\s*\.\s*play(?:Bgm|Bgs|Me|Se)\s*\(/.test(scriptText);
        if (isAudioScript && elderfieldScriptAudioAssetNames.has(literal.toLowerCase())) {
            return literal;
        }
        return window.translateText(literal);
    };

    const _Game_Interpreter_command355 = Game_Interpreter.prototype.command355;
    Game_Interpreter.prototype.command355 = function (params) {
        const scriptText = Utils.RPGMAKER_NAME === 'MZ' ? params[0] : this._params[0];

        let allLines = [scriptText];
        let nextIndex = this._index + 1;
        while (this._list[nextIndex] && this._list[nextIndex].code === 655) {
            allLines.push(Utils.RPGMAKER_NAME === 'MZ' ?
                this._list[nextIndex].parameters[0] :
                this._list[nextIndex].parameters[0]);
            nextIndex++;
        }

        const scriptBlock = allLines.join('\n');
        const processedLines = allLines.map(line => {
            return line.replace(/"([^"]*)"/g, (match, p1) => {
                const translated = elderfieldTranslateScriptLiteral(scriptBlock, p1);
                return `"${translated}"`;
            });
        });

        if (Utils.RPGMAKER_NAME === 'MZ') {
            params[0] = processedLines[0];
            for (let i = 1; i < processedLines.length; i++) {
                this._list[this._index + i].parameters[0] = processedLines[i];
            }
            return _Game_Interpreter_command355.call(this, params);
        } else {
            this._params[0] = processedLines[0];
            for (let i = 1; i < processedLines.length; i++) {
                this._list[this._index + i].parameters[0] = processedLines[i];
            }
            return _Game_Interpreter_command355.call(this);
        }
    };

    const _Game_Interpreter_command655 = Game_Interpreter.prototype.command655;
    Game_Interpreter.prototype.command655 = function (params) {
        const scriptText = Utils.RPGMAKER_NAME === 'MZ' ? params[0] : this._params[0];
        const script = scriptText.replace(/"([^"]*)"/g, (match, p1) => {
            const translated = elderfieldTranslateScriptLiteral(scriptText, p1);
            return `"${translated}"`;
        });
        if (Utils.RPGMAKER_NAME === 'MZ') {
            params[0] = script;
            return _Game_Interpreter_command655.call(this, params);
        } else {
            this._params[0] = script;
            return _Game_Interpreter_command655.call(this);
        }
    };

    const _Game_Interpreter_command355_orig = Game_Interpreter.prototype.command355;
    Game_Interpreter.prototype.command355 = function () {
        const result = _Game_Interpreter_command355_orig.apply(this, arguments);
        if ($gameMessage.messageBuffer && $gameMessage.messageBuffer.length > 0) {
            $gameMessage.processMessageBuffer();
        }
        return result;
    };

    const _Game_Interpreter_command655_orig = Game_Interpreter.prototype.command655;
    Game_Interpreter.prototype.command655 = function () {
        const result = _Game_Interpreter_command655_orig.apply(this, arguments);
        if ($gameMessage.messageBuffer && $gameMessage.messageBuffer.length > 0) {
            $gameMessage.processMessageBuffer();
        }
        return result;
    };

    if (Utils.RPGMAKER_NAME === "MV") {
        if (Imported['YEP_MessageCore']) {
            Game_Interpreter.prototype.command101 = function () {
                if (!$gameMessage.isBusy()) {
                    $gameMessage.setFaceImage(this._params[0], this._params[1]);
                    $gameMessage.setBackground(this._params[2]);
                    $gameMessage.setPositionType(this._params[3]);

                    if (this._params[4]) {
                        $gameMessage.addText(this._params[4]);
                    }

                    while (this.isContinueMessageString()) {
                        this._index++;
                        if (this._list[this._index].code === 401) {
                            $gameMessage.add(this.currentCommand().parameters[0]);
                        }
                        if ($gameMessage._texts.length >= $gameSystem.messageRows()) break;
                    }

                    $gameMessage.processMessageBuffer();

                    switch (this.nextEventCode()) {
                        case 102:
                            this._index++;
                            this.setupChoices(this.currentCommand().parameters);
                            break;
                        case 103:
                            this._index++;
                            this.setupNumInput(this.currentCommand().parameters);
                            break;
                        case 104:
                            this._index++;
                            this.setupItemChoice(this.currentCommand().parameters);
                            break;
                    }
                    this._index++;
                    this.setWaitMode('message');
                }
                return false;
            };
        } else {
            const _Game_Interpreter_command101 = Game_Interpreter.prototype.command101;
            Game_Interpreter.prototype.command101 = function () {
                const result = _Game_Interpreter_command101.call(this);
                $gameMessage.processMessageBuffer();
                return result;
            };
        }
    } else if (Utils.RPGMAKER_NAME === "MZ") {
        const _Game_Interpreter_command101 = Game_Interpreter.prototype.command101;
        Game_Interpreter.prototype.command101 = function (params) {
            const result = _Game_Interpreter_command101.call(this, params);
            $gameMessage.processMessageBuffer();
            return result;
        };
    }

    // ========================================================================
    // WINDOW DRAWING & TEXT OVERRIDES
    // ========================================================================
    const _Window_ScrollText_initialize = Window_ScrollText.prototype.initialize;
    Window_ScrollText.prototype.initialize = function () {
        if (Utils.RPGMAKER_NAME === "MV") {
            _Window_ScrollText_initialize.call(this);
        } else {
            const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
            _Window_ScrollText_initialize.call(this, rect);
        }
        this._originalLines = 0;
    };

    const _Window_ScrollText_startMessage = Window_ScrollText.prototype.startMessage;
    Window_ScrollText.prototype.startMessage = function () {
        this._originalLines = $gameMessage._texts.length;
        let fullText = $gameMessage._texts.join('\n');
        let translatedText = window.translateText(fullText);
        $gameMessage._texts = translatedText.split('\n');
        _Window_ScrollText_startMessage.call(this);
    };

    const _Window_Base_drawTextEx = Window_Base.prototype.drawTextEx;
    Window_Base.prototype.drawTextEx = function (text, x, y, width) {
        if (text) {
            text = window.Hendrix_Localization(text);
            const originalHendrixLocalization = window.Hendrix_Localization;
            window.Hendrix_Localization = function (innerText) {
                return innerText;
            };
            const result = _Window_Base_drawTextEx.call(this, text, x, y, width);
            window.Hendrix_Localization = originalHendrixLocalization;
            return result;
        } else {
            return 0;
        }
    };

    if (Utils.RPGMAKER_NAME === "MZ") {
        const _Game_Message_setChoices = Game_Message.prototype.setChoices;
        Game_Message.prototype.setChoices = function (choices, defaultType, cancelType) {
            const translatedChoices = choices.map(choice => {
                const escapeCodes = choice.match(/<.*?>/g) || [];
                let textContent = choice;
                escapeCodes.forEach(code => {
                    textContent = textContent.replace(code, '');
                });
                let translatedText = window.translateText(textContent);

                escapeCodes.forEach(code => {
                    const originalIndex = choice.indexOf(code);
                    if (originalIndex === 0) {
                        translatedText = code + translatedText;
                    } else {
                        translatedText = translatedText + code;
                    }
                });
                return translatedText;
            });
            _Game_Message_setChoices.call(this, translatedChoices, defaultType, cancelType);
        };

        const _Window_NameBox_windowWidth = Window_NameBox.prototype.windowWidth;
        Window_NameBox.prototype.windowWidth = function () {
            if (this._name) {
                const cleanName = window.translateText(this._name).replace(/<[^>]*>/g, '');
                return Math.ceil(this.textWidth(cleanName) + this.padding * 2 + this.itemPadding() * 2);
            } else {
                return _Window_NameBox_windowWidth.call(this);
            }
        };
    }

    if (Utils.RPGMAKER_NAME === "MV") {
        if (Imported['YEP_MessageCore']) {
            const _Game_Message_setChoices = Game_Message.prototype.setChoices;
            Game_Message.prototype.setChoices = function (choices, defaultType, cancelType) {
                const translatedChoices = choices.map(choice => {
                    const window_msg = SceneManager._scene._messageWindow;
                    if (window_msg) {
                        choice = window_msg.convertEscapeCharacters(choice);
                    }
                    return window.Hendrix_Localization(choice);
                });
                _Game_Message_setChoices.call(this, translatedChoices, defaultType, cancelType);
            };
        }
    }

    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function () {
        if ($gameParty.inBattle()) {
            const allText = $gameMessage._texts.join('\n');
            const translatedText = window.translateText(allText);
            $gameMessage._texts = translatedText.split('\n');
        }
        _Window_Message_startMessage.call(this);
    };

    const _Game_Actor_profile = Game_Actor.prototype.profile;
    Game_Actor.prototype.profile = function () {
        return window.translateText(_Game_Actor_profile.call(this));
    };

    const _Scene_Title_drawGameTitle = Scene_Title.prototype.drawGameTitle;
    Scene_Title.prototype.drawGameTitle = function () {
        if (DataManager._originalGameTitle && $dataSystem) {
            const translatedTitle = window.translateText(DataManager._originalGameTitle);
            $dataSystem.gameTitle = translatedTitle;
        }
        _Scene_Title_drawGameTitle.call(this);
    };

    const _Scene_Title_createBackground = Scene_Title.prototype.createBackground;
    Scene_Title.prototype.createBackground = function () {
        if (!this._originalTitle1) this._originalTitle1 = $dataSystem.title1Name;
        if (!this._originalTitle2) this._originalTitle2 = $dataSystem.title2Name;

        if (this._originalTitle1) {
            const title1File = this._originalTitle1 + '.png';
            const translatedTitle1 = translatePictureName(title1File);
            if (translatedTitle1 !== title1File) {
                $dataSystem.title1Name = translatedTitle1.replace('.png', '');
            }
        }

        if (this._originalTitle2) {
            const title2File = this._originalTitle2 + '.png';
            const translatedTitle2 = translatePictureName(title2File);
            if (translatedTitle2 !== title2File) {
                $dataSystem.title2Name = translatedTitle2.replace('.png', '');
            }
        }

        _Scene_Title_createBackground.call(this);
    };

    Window_MapName.prototype.refresh = function () {
        this.contents.clear();
        if ($gameMap.displayName()) {
            const translatedName = window.translateText($gameMap.displayName());
            if (Utils.RPGMAKER_NAME === "MZ") {
                const width = this.innerWidth;
                this.drawBackground(0, 0, width, this.lineHeight());
                this.drawText(translatedName, 0, 0, width, 'center');
            } else {
                const width = this.contentsWidth();
                this.drawBackground(0, 0, width, this.lineHeight());
                this.drawText(translatedName, 0, 0, width, 'center');
            }
        }
    };

    const _Game_Map_displayName = Game_Map.prototype.displayName;
    Game_Map.prototype.displayName = function () {
        const originalName = _Game_Map_displayName.call(this);
        return window.translateText(originalName);
    };

    const _DataManager_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function () {
        const info = _DataManager_makeSavefileInfo.call(this);
        if (info.location) {
            info.location = window.translateText(info.location);
        }
        return info;
    };

    const _Scene_Menu_mapNameWindow = Scene_Menu.prototype.createMapNameWindow || function () { };
    Scene_Menu.prototype.createMapNameWindow = function () {
        _Scene_Menu_mapNameWindow.call(this);
        if (this._mapNameWindow && this._mapNameWindow.refresh) {
            this._mapNameWindow.refresh();
        }
    };

    Window_Help.prototype.refresh = function () {
        this.contents.clear();
        if (this._text) {
            const translatedText = window.translateText(this._text);
            if (this.baseTextRect) {
                const rect = this.baseTextRect();
                this.drawTextEx(translatedText, rect.x, rect.y, rect.width);
            } else {
                const rect = {
                    x: this.textPadding(),
                    y: 0,
                    width: this.contents.width - this.textPadding() * 2,
                    height: this.contents.height
                };
                this.drawTextEx(translatedText, rect.x, rect.y, rect.width);
            }
        }
    };

    if (!Window_Base.prototype.calcTextWidth) {
        Window_Base.prototype.calcTextWidth = function (text) {
            var tempText = text.split('\n');
            var maxWidth = 0;
            for (var i = 0; i < tempText.length; i++) {
                var textWidth = this.textWidth(tempText[i]);
                if (maxWidth < textWidth) {
                    maxWidth = textWidth;
                }
            }
            return maxWidth;
        };
    }

    const _Window_Base_processEscapeCharacter = Window_Base.prototype.processEscapeCharacter;
    Window_Base.prototype.processEscapeCharacter = function (code, textState) {
        if (code === 'T') {
            const endIndex = textState.text.indexOf(']', textState.index);
            const textToTranslate = textState.text.substring(textState.index, endIndex);
            const translatedText = window.translateText(textToTranslate);
            textState.text = textState.text.replace(`T[${textToTranslate}]`, translatedText);
            textState.index = endIndex + 1;
        } else {
            _Window_Base_processEscapeCharacter.call(this, code, textState);
        }
    };

    // ========================================================================
    // BATTLE LOG OVERRIDES
    // ========================================================================
    const _Window_BattleLog_displayAction = Window_BattleLog.prototype.displayAction;
    Window_BattleLog.prototype.displayAction = function (subject, item) {
        if (item && item.message1) {
            item.message1 = window.translateText(item.message1);
        }
        if (item && item.message2) {
            item.message2 = window.translateText(item.message2);
        }
        _Window_BattleLog_displayAction.call(this, subject, item);
    };

    const _Window_BattleLog_displayDamage = Window_BattleLog.prototype.displayDamage;
    Window_BattleLog.prototype.displayDamage = function (target) {
        const tempMakeHpDamageText = Game_Action.prototype.makeHpDamageText;
        Game_Action.prototype.makeHpDamageText = function (target) {
            const format = tempMakeHpDamageText.call(this, target);
            return window.translateText(format);
        };
        _Window_BattleLog_displayDamage.call(this, target);
        Game_Action.prototype.makeHpDamageText = tempMakeHpDamageText;
    };

    const _Window_BattleLog_displayAddedStates = Window_BattleLog.prototype.displayAddedStates;
    Window_BattleLog.prototype.displayAddedStates = function (target) {
        const states = target.result().addedStateObjects();
        for (const state of states) {
            if (state.message1) {
                state.message1 = window.translateText(state.message1);
            }
            if (state.message2) {
                state.message2 = window.translateText(state.message2);
            }
        }
        _Window_BattleLog_displayAddedStates.call(this, target);
    };

    const _Window_BattleLog_displayRemovedStates = Window_BattleLog.prototype.displayRemovedStates;
    Window_BattleLog.prototype.displayRemovedStates = function (target) {
        const states = target.result().removedStateObjects();
        for (const state of states) {
            if (state.message3) {
                state.message3 = window.translateText(state.message3);
            }
            if (state.message4) {
                state.message4 = window.translateText(state.message4);
            }
        }
        _Window_BattleLog_displayRemovedStates.call(this, target);
    };

    const _TextManager_getter = Object.getOwnPropertyDescriptors(TextManager);
    for (const prop in _TextManager_getter) {
        if (_TextManager_getter[prop].get) {
            const originalGetter = _TextManager_getter[prop].get;
            Object.defineProperty(TextManager, prop, {
                get: function () {
                    return window.translateText(originalGetter.call(this));
                },
                configurable: true
            });
        }
    }

    // ========================================================================
    // THIRD PARTY PLUGIN OVERRIDES
    // ========================================================================
    if (Imported['Galv_MessageStyles']) {
        Window_Message.prototype.changeWindowDimensions = function () {
            if (this.pTarget != null) {
                var w = 10;
                var h = 0;

                if (Imported.Galv_MessageBusts) {
                    if ($gameMessage.bustPos == 1) {
                        var faceoffset = 0;
                    } else {
                        var faceoffset = Galv.MB.w;
                    };
                } else {
                    var faceoffset = Window_Base._faceWidth + 25;
                };
                var xO = $gameMessage._faceName ? faceoffset : 0;
                xO += Galv.Mstyle.padding[1] + Galv.Mstyle.padding[3];

                this.resetFontSettings();
                for (var i = 0; i < $gameMessage._texts.length; i++) {
                    var lineWidth = this.testWidthEx($gameMessage._texts[i]) + this.standardPadding() * 2 + xO;
                    if (w < lineWidth) w = lineWidth;
                };
                this.resetFontSettings();
                this.width = Math.min(Graphics.boxWidth, w);

                var minFaceHeight = 0;
                if ($gameMessage._faceName) {
                    w += 15;
                    if (Imported.Galv_MessageBusts) {
                        if ($gameMessage.bustPos == 1) w += Galv.MB.w;
                        minFaceHeight = 0;
                    } else {
                        minFaceHeight = Window_Base._faceHeight + this.standardPadding() * 2;
                    };
                };

                var textState = { index: 0 };
                textState.text = this.convertEscapeCharacters($gameMessage.allText());
                var allLineHeight = this.calcTextHeight(textState, true);
                var height = allLineHeight + this.standardPadding() * 2;
                var minHeight = this.fittingHeight(0);
                this.height = Math.max(height, minHeight, minFaceHeight);
                this.yOffset = -Galv.Mstyle.yOffet - this.height;

            } else {
                this.yOffset = 0;
                this.width = this.windowWidth();
                this.height = Galv.Mstyle.Window_Message_windowHeight.call(this);
                this.x = (Graphics.boxWidth - this.width) / 2;
            };
        };
    }

    if (Imported.YEP_CommonEventMenu) {
        DataManager.processCEMNotetags1 = function (group) {
            for (var n = 1; n < group.length; n++) {
                var obj = group[n];
                var notedata = this.convertCommentsToText(obj);

                obj.iconIndex = Yanfly.Param.CEMIcon;
                obj.description = window.Hendrix_Localization(Yanfly.Param.CEMHelpDescription);
                obj.picture = '';
                obj.menuSettings = {
                    name: obj.name,
                    subtext: window.Hendrix_Localization(Yanfly.Param.CEMSubtext),
                    enabled: 'enabled = true',
                    show: 'visible = true'
                };
                var evalMode = 'none';

                for (var i = 0; i < notedata.length; i++) {
                    var line = notedata[i];
                    if (line.match(/<MENU NAME:[ ](.*)>/i)) {
                        var translatedLine = window.Hendrix_Localization(line);
                        if (translatedLine.match(/<MENU NAME:[ ](.*)>/i)) {
                            obj.menuSettings.name = String(RegExp.$1);
                        } else {
                            var menuName = String(RegExp.$1);
                            obj.menuSettings.name = window.Hendrix_Localization(menuName);
                        }
                    } else if (line.match(/<ICON:[ ](\d+)>/i)) {
                        obj.iconIndex = parseInt(RegExp.$1);
                    } else if (line.match(/<PICTURE:[ ](.*)>/i)) {
                        obj.picture = String(RegExp.$1);
                    } else if (line.match(/<HELP DESCRIPTION>/i)) {
                        evalMode = 'help description';
                        obj.description = '';
                    } else if (line.match(/<\/HELP DESCRIPTION>/i)) {
                        evalMode = 'none';
                        obj.description = window.Hendrix_Localization(obj.description);
                    } else if (evalMode === 'help description') {
                        obj.description += line + '\n';
                    } else if (line.match(/<SUBTEXT>/i)) {
                        evalMode = 'subtext';
                        obj.menuSettings.subtext = '';
                    } else if (line.match(/<\/SUBTEXT>/i)) {
                        evalMode = 'none';
                        obj.menuSettings.subtext = window.Hendrix_Localization(obj.menuSettings.subtext);
                    } else if (evalMode === 'subtext') {
                        obj.menuSettings.subtext += line + '\n';
                    } else if (line.match(/<MENU ENABLE EVAL>/i)) {
                        evalMode = 'menu enable eval';
                        obj.menuSettings.enabled = '';
                    } else if (line.match(/<\/MENU ENABLE EVAL>/i)) {
                        evalMode = 'none';
                    } else if (evalMode === 'menu enable eval') {
                        obj.menuSettings.enabled += line + '\n';
                    } else if (line.match(/<MENU VISIBLE EVAL>/i)) {
                        evalMode = 'menu visible eval';
                        obj.menuSettings.show = '';
                    } else if (line.match(/<\/MENU VISIBLE EVAL>/i)) {
                        evalMode = 'none';
                    } else if (evalMode === 'menu visible eval') {
                        obj.menuSettings.show += line + '\n';
                    }
                }
            }
        };
    }

    if (Imported.YEP_ItemCore) {
        Window_ItemInfo.prototype.drawInfoTextTop = function (dy) {
            var item = this._item;
            if (item.infoTextTop === undefined) {
                item.infoTextTop = DataManager.getBaseItem(item).infoTextTop;
            }
            if (item.infoTextTop === '') return dy;
            var fullText = window.Hendrix_Localization(item.infoTextTop);
            var info = fullText.split(/[\r\n]+/);

            for (var i = 0; i < info.length; ++i) {
                var line = "\\fs[20]" + info[i];
                this.drawTextEx(line, this.textPadding(), dy);
                dy += this.contents.fontSize + 8;
            }
            return dy;
        };

        Window_ItemInfo.prototype.drawInfoTextBottom = function (dy) {
            var item = this._item;
            if (item.infoTextBottom === undefined) {
                item.infoTextBottom = DataManager.getBaseItem(item).infoTextBottom;
            }
            if (item.infoTextBottom === '') return dy;
            var fullText = window.Hendrix_Localization(item.infoTextBottom);
            var info = fullText.split(/[\r\n]+/);

            for (var i = 0; i < info.length; ++i) {
                var line = info[i];
                this.resetFontSettings();
                this.drawTextEx(line, this.textPadding(), dy);
                dy += this.contents.fontSize + 8;
            }
            return dy;
        };
    }

    if (Imported.Tyruswoo_BigChoiceLists) {
        Game_Interpreter.prototype.command402 = function (params) {
            if (this._branch[this._indent] !== window.Hendrix_Localization(params[1])) {
                this.skipBranch();
            }
            return true;
        };
    }
})();