var mainTbl = null;
var tbody = null;
var thead = null;
var pendingTrDom = null;
var pendingTrList = null;
var factionsUl = null;
var trHeadDom = null;
var trHead2Dom = null;
var settings = null;
var dataProvider = null;

document.addEventListener("DOMContentLoaded", function (e) {

    dataProvider = new DataProvider();

    factionsUl = document.getElementById("factionsUl");
    mainTbl = document.getElementById("mainTbl");

    document.querySelectorAll("[data-toggle-all-click]").forEach(item => item.addEventListener("click", toggleInputList));
    document.getElementById("executeBtn").addEventListener("click", buildTable);

    dataBindFactions();

    loadState();

    buildTable();
});

function TableBuilder() {

    this.appendTableCell = function (value, targetTr, isNumber, rowCount, cssClass) {

        var tdDom = document.createElement("td");
        tdDom.innerHTML = value ? value : "";

        if (!targetTr) targetTr = pendingTrDom;

        targetTr.appendChild(tdDom);

        if (isNumber) {

            tdDom.setAttribute("class", "Number");

            tdDom.classList.add("Number");
        }

        if (cssClass) {
            
            tdDom.classList.add(cssClass);
        }

        if (rowCount && rowCount > 1) {

            tdDom.setAttribute("data-rowcount", rowCount);
        }

        return tdDom;
    };

    this.formatColor = function (item) {

        var temp = "";

        if (item.IsBlue) temp += "Blue";
        if (item.IsRed) temp += "Red";
        if (item.IsGreen) temp += "Green";
        if (item.IsYellow) temp += "Yellow";

        return temp;
    }

    this.formatAbility = function (item, ignoreSettings) {

        var color = this.formatColor(item);

        var temp = (color === "" ? "<h2>" : "<h2 class='" + color + "'>") + item.Title + "</h2>";

        if ((ignoreSettings || settings.renderPassiveAbility) && item.Passive) {

            temp += "<div>";
            temp += item.Passive.replace('\r\n', '<br />');
            temp += "</div>";
        }

        if ((ignoreSettings || settings.renderActionAbility) && item.Action) {

            temp += "<div>";
            temp += "<span class='Annotation'>Action:</span> " + item.Action.replaceAll('\r\n', '<br />');
            temp += "</div>";
        }

        if ((ignoreSettings || settings.renderDeployAbility) && item.Deploy) {

            temp += "<div>";
            temp += "<span class='Annotation'>Deploy:</span> " + item.Deploy.replaceAll('\r\n', '<br />');
            temp += "</div>";
        }

        if (ignoreSettings || settings.renderRequirement) {

            var reqHtml = "";

            var applyColor = function (count, color) {

                if (count) {

                    for (let i = 0; i < count; i++) {

                        reqHtml += "<span class='Requirement " + color + "'></span>";
                    }
                }
            };

            applyColor(item.GreenRequirement, "Green");
            applyColor(item.RedRequirement, "Red");
            applyColor(item.BlueRequirement, "Blue");
            applyColor(item.YellowRequirement, "Yellow");

            if (reqHtml !== "") {

                temp += "<div>";
                temp += "<span class='Annotation'>Requirement:</span> " + reqHtml;
                temp += "</div>";
            }
        }

        if (ignoreSettings || settings.renderUnitData_features) {

            var features  = [];

            if (item.IsSustainDamage) {

                features.push("<span class='Feature'>Sustain Damage</span>")
            }

            if (item.IsPlanataryShield) {

                features.push("<span class='Feature'>Planetary Shield</span>")
            }

            if (item.AntiFighterBarage) {

                var value = this.formatMultiplier(item.AntiFighterBarage, item.AntiFighterBarageDice);

                features.push("<span class='Feature'>AFB " + value +  "</span>")
            }

            if (item.Bombardment) {

                var value = this.formatMultiplier(item.Bombardment, item.BombardmentDice);

                features.push("<span class='Feature'>Bombardment " + value + "</span>")
            }

            if (item.SpaceCannon) {

                var value = this.formatMultiplier(item.SpaceCannon, item.SpaceCannonDice);

                features.push("<span class='Feature'>Space Cannon " + value + "</span>")
            }

            if (item.Production) {

                features.push("<span class='Feature'>Production " + item.Production  + "</span>")
            }

            if (features.length > 0) {

                temp += "<div>";
                temp += "<span class='Annotation'>Features:</span> ";
                temp += features.join(", ");
                temp += "</div>";
            }
        }

        if ((ignoreSettings || settings.renderUnlock) && item.Unlock) {

            temp += "<div>";
            temp += "<span class='Annotation'>Unlock:</span> " + item.Unlock;
            temp += "</div>";
        }

        return temp;
    };

    this.formatMultiplier = function (value, multi) {

        var temp = value;

        if (multi) {

            temp += "(x" + multi + ")";
        }

        return temp;
    };

    this.formatFlavorText = function (value, appendParagraph) {

        var html = "";

        if (appendParagraph) {
            
            var chunks = value.split('\n');

            for (let i = 0; i < chunks.length; i++) {

                html += "<p>" + chunks[i] + "</p>";
            }

        }
        else {

            html = value;
        }

        html = "<div class='FlavorText'>"  + html + "</div>";

        return html;
    };

    this.createCommonUnitRow_Header = function (tr, rowcount) {

        var temp = [];

        if (settings.renderUnitData_rowspan > 1) temp.push(this.appendTableCell("General", tr));
        if (settings.renderUnitData_cost) temp.push(this.appendTableCell("Cost", tr));
        if (settings.renderUnitData_combat) temp.push(this.appendTableCell("Combat", tr));
        if (settings.renderUnitData_move) temp.push(this.appendTableCell("Move", tr));
        if (settings.renderUnitData_capacity) temp.push(this.appendTableCell("Capacity", tr));
        if (settings.renderUnitData_bombardment) temp.push(this.appendTableCell("Bombardment", tr));
        if (settings.renderUnitData_afb) temp.push(this.appendTableCell("AFB", tr));
        if (settings.renderUnitData_sc) temp.push(this.appendTableCell("Space Cannon", tr));
        if (settings.renderUnitData_production) temp.push(this.appendTableCell("Production", tr));

        if (rowcount > 1) {

            for (let i = 0; i < temp.length; i++) {

                temp[i].setAttribute("data-rowcount", rowcount);
            }
        }
    };

    this.createCommonUnitRow = function (item, tr, rowcount, cssClass) {

        var general = this.formatAbility(item);
        var combat = this.formatMultiplier(item.Combat, item.CombatDice);
        var bombardment = this.formatMultiplier(item.Bombardment, item.BombardmentDice);
        var afb = this.formatMultiplier(item.AntiFighterBarage, item.AntiFighterBarageDice);
        var sc = this.formatMultiplier(item.SpaceCannon, item.SpaceCannonDice);

        var temp = [];

        temp.push(this.appendTableCell(general, tr));
        if (settings.renderUnitData_cost) temp.push(this.appendTableCell(item.Cost, tr, true));
        if (settings.renderUnitData_combat) temp.push(this.appendTableCell(combat, tr, true));
        if (settings.renderUnitData_move) temp.push(this.appendTableCell(item.MoveTEMP, tr, true));
        if (settings.renderUnitData_capacity) temp.push(this.appendTableCell(item.Capacity, tr, true));
        if (settings.renderUnitData_bombardment) temp.push(this.appendTableCell(bombardment, tr, true));
        if (settings.renderUnitData_afb) temp.push(this.appendTableCell(afb, tr, true));
        if (settings.renderUnitData_sc) temp.push(this.appendTableCell(sc, tr, true));
        if (settings.renderUnitData_production) temp.push(this.appendTableCell(item.Production, tr, true));

        if (rowcount > 1) {

            for (let i = 0; i < temp.length; i++) {

                temp[i].setAttribute("data-rowcount", rowcount);
            }
        }
        
        if (cssClass) {
            
            for (let i = 0; i < temp.length; i++) {

                temp[i].classList.add(cssClass);
            }
        }

        return temp;
    };

    this.getOrCreateRow = function (rowIndex, domWrapper) {

        if (rowIndex >= pendingTrList.length) {

            var tr = document.createElement("tr");

            pendingTrList.push(tr);

            domWrapper.appendChild(tr);
        }

        var temp = pendingTrList[rowIndex];

        return temp;
    };
}

function TableBuilder_Miscellaneous() {

    var _this = this;

    this.resetTable = function () {

        if (thead) mainTbl.removeChild(thead);
        if (tbody) mainTbl.removeChild(tbody);

        trHeadDom = document.createElement("tr");
        trHead2Dom = document.createElement("tr");

        thead = document.createElement("thead");
        thead.appendChild(trHeadDom);

        tbody = document.createElement("tbody");

        mainTbl.appendChild(thead);
        mainTbl.appendChild(tbody);
    };

    this.clean = function () {

        var temp = mainTbl.querySelectorAll("*[data-rowcount]");

        for (let i = 0; i < temp.length; i++) {

            temp[i].removeAttribute("data-rowcount");
        }
    };

    this.adjustRowspan_header = function () {

        var hasRowspan = trHeadDom.querySelectorAll("*[data-rowcount]").length > 0;

        if (hasRowspan) {

            thead.appendChild(trHead2Dom);

            _this.adjustRowspan([trHeadDom, trHead2Dom]);
        }
    };

    this.adjustRowspan = function (trList) {

        if (trList.length > 1) {

            for (var ii = 0; ii < trList.length; ii++) {

                var tdList = trList[ii].getElementsByTagName("td");

                for (var iii = 0; iii < tdList.length; iii++) {

                    var rowCount = tdList[iii].getAttribute("data-rowcount");

                    if (rowCount === null) {

                        tdList[iii].setAttribute("rowspan", trList.length);
                    }

                    else {

                        if (ii > 0 && ii === trList.length - 1) {

                            var rowspanList = trList[ii - 1].querySelectorAll("*[data-rowcount = '" + (rowCount - 1) + "']");

                            for (var j = 0; j < rowspanList.length; j++) {

                                rowspanList[j].setAttribute("rowspan", 2);
                            }
                        }
                    }
                }
            }
        }
    };

    this.insertDummyCells = function () {

        //note: this is needed only for (if at all) zebra CSS table styling

        var trList = mainTbl.querySelectorAll("tbody tr");

        for (let i = 0; i < trList.length; i++) {

            if (trList[i].hasAttribute("data-faction")) {

                var tdList = trList[i].querySelectorAll("td");

                for (var ii = 0; ii < tdList.length; ii++) {

                    if (tdList[ii].hasAttribute("rowspan")) {

                        var rowspan = parseInt(tdList[ii].getAttribute("rowspan"));
                        var colspan = parseInt(tdList[ii].getAttribute("colspan"));

                        for (var iii = 0; iii < rowspan - 1; iii++) {

                            var dummyTd = document.createElement("td");
                            //dummyTd.innerHTML = rowspan;
                            //dummyTd.innerHTML = colspan;
                            dummyTd.classList.add("Dummy");

                            if (colspan) dummyTd.setAttribute("colspan", colspan);

                            trList[i + iii + 1].insertBefore(dummyTd, trList[i + iii + 1].children[ii]);
                        }
                    }
                }
            }
        }
    };

    this.applyZebraStyle = function () {

        var tdList = trHeadDom.getElementsByTagName("td");

        var colspanRegistry = [];

        for (var i = 0; i < tdList.length; i++) {

            var colspan = tdList[i].getAttribute("colspan");
            colspan = colspan ? parseInt(colspan) : 1;

            colspanRegistry.push(colspan);
        }

        var trList = mainTbl.querySelectorAll("tbody tr");

        var counter = 0;

        var zebraClass = null;

        for (let i = 0; i < trList.length; i++) {

            //rows

            if (trList[i].hasAttribute("data-faction")) {

                zebraClass = counter++ % 2 === 0 ? "Even" : "Odd";

                trList[i].classList.add(zebraClass);
            }
            else {

                trList[i].classList.add(zebraClass);
            }

            //cols

            tdList = trList[i].getElementsByTagName("td");

            var counterTd = 0;

            for (var ii = 0; ii < tdList.length; ii++) {

                var className = counterTd++ % 2 === 0 ? "Zig" : "Zag";

                tdList[ii].classList.add(className);
                
                var colspan = colspanRegistry[counterTd - 1];

                var ii_colspan = tdList[ii].getAttribute("colspan");
                ii_colspan = ii_colspan ? parseInt(ii_colspan) : 1;

                for (var iii = 0; iii < colspan - 1 - (ii_colspan  - 1); iii++) {

                    var td = tdList[++ii];

                    if (td) td.classList.add(className);
                }
            }
        }
    };

    this.createHeader_Common = function (title, tr) {

        _this.appendTableCell(title, tr);
    };

    this.createBody_Faction = function (factionID) {

        var faction = dataProvider.getFactionById(factionID);

        var html = faction.Name;

        if (settings.renderFlavorText) {

            html += _this.formatFlavorText(faction.FlavorText, true);
        }

        _this.appendTableCell(html, null, null, null, "Faction");
    };

    this.createBody_Commodities = function (factionID) {

        var faction = dataProvider.getFactionById(factionID);

        _this.appendTableCell(faction.Commodities, null, true);
    };
}
TableBuilder_Miscellaneous.prototype = new TableBuilder();

function TableBuilder_Planet() {

    var _this = this;

    this.createHeader = function () {

        var td = _this.appendTableCell("Planets", trHeadDom, false,  2);
        td.setAttribute("colspan", 3);

        _this.appendTableCell("Name", trHead2Dom, false, 2);
        _this.appendTableCell("Resources", trHead2Dom, false, 2);
        _this.appendTableCell("Influence", trHead2Dom, false, 2);
    };

    this.createBody = function (factionID) {

        var planets = dataProvider.getPlanets(factionID);
        //console.log("planets", planets);

        for (let i = 0; i < planets.length; i++) {

            var targetTr = _this.getOrCreateRow(i, tbody);

            var html = "<h2>" + planets[i].Name + "</h2>";

            if (settings.renderFlavorText) {

                html += _this.formatFlavorText(planets[i].FlavorText);
            }

            var td1 = _this.appendTableCell(html, targetTr);
            var td2 = _this.appendTableCell(planets[i].Resources, targetTr, true);
            var td3 = _this.appendTableCell(planets[i].Influence, targetTr, true);

            if (planets.length > 1) {

                td1.setAttribute("data-rowcount", planets.length);
                td2.setAttribute("data-rowcount", planets.length);
                td3.setAttribute("data-rowcount", planets.length);
            }
        }
    };
}
TableBuilder_Planet.prototype = new TableBuilder();

function TableBuilder_Starting() {

    var _this = this;

    this.createHeader = function () {

        var td = _this.appendTableCell("Starting", trHeadDom, false, 2);
        td.setAttribute("colspan", 2);

        _this.appendTableCell("Units", trHead2Dom, false, 2);
        _this.appendTableCell("Techs", trHead2Dom, false, 2);
    };

    this.createBody = function (factionID) {

        var startingUnits = dataProvider.getStartingUnits(factionID);
        //console.log("startingUnits", startingUnits);

        var temp = "";

        for (let i = 0; i < startingUnits.length; i++) {

            var unitType = startingUnits[i].UnitType;
            var quantity = startingUnits[i].Quantity;

            var value = "<span>" + quantity + " " + unitType + "</span>";
            temp += value;
            
            if (i < startingUnits.length - 1) temp += ", ";
        }

        _this.appendTableCell(temp)

        var startingTechnologies = dataProvider.getStartingTechnologies(factionID);
        //console.log("startingTechnologies", startingTechnologies);

        var td = _this.appendTableCell(null);
        
        for (let i = 0; i < startingTechnologies.length; i++) {

            var value = _this.formatAbility(startingTechnologies[i]);

            td.innerHTML += value;
        }
    };
}
TableBuilder_Starting.prototype = new TableBuilder();

function TableBuilder_Abilities() {

    var _this = this;

    this.createHeader = function() {

        _this.appendTableCell("Abilities", trHeadDom);
    }

    this.createBody = function(factionID) {

        var abilities = dataProvider.getFactionAbilities(factionID);

        var temp = "";

        for (let i = 0; i < abilities.length; i++) {

            temp += _this.formatAbility(abilities[i]);
        }

        _this.appendTableCell(temp);
    }
}
TableBuilder_Abilities.prototype = new TableBuilder();

function TableBuilder_Technology() {

    var _this = this;

    this.createHeader = function() {

        _this.appendTableCell("Technology", trHeadDom);
    }

    this.createBody = function(factionID) {

        var techs = dataProvider.getFactionTechnologies(factionID);

        var temp = "";

        for (let i = 0; i < techs.length; i++) {

            var subject = techs[i];

            if (techs[i].UnitID) {

                var unit = dataProvider.getUnitById(techs[i].UnitID);
                unit.RedRequirement = subject.RedRequirement;
                unit.BlueRequirement = subject.BlueRequirement;
                unit.YellowRequirement = subject.YellowRequirement;
                unit.GreenRequirement = subject.GreenRequirement;

                subject = unit;
            }

            temp += _this.formatAbility(subject);
        }

        _this.appendTableCell(temp);
    }
}
TableBuilder_Technology.prototype = new TableBuilder();

function TableBuilder_Unit() {

    var _this = this;

    this.createHeader = function () {

        if (settings.renderUnitData_rowspan > 1) {

            var td = _this.appendTableCell("Units", trHeadDom, false, settings.renderUnitData_rowspan);

            if (settings.renderUnitData_colspan > 1) td.setAttribute("colspan", settings.renderUnitData_colspan);

            _this.createCommonUnitRow_Header(trHead2Dom, settings.renderUnitData_rowspan);
        }
        else {

            _this.appendTableCell("Units", trHeadDom);
        }
    };

    this.createBody = function (factionID) {

        var units = dataProvider.getFactionUnits(factionID);

        var specialUnits = units.filter(function (item) { return item.UnitTypeID !== unitTypeEnum.Flagship && item.UnitTypeID !== unitTypeEnum.Mech; });

        for (let i = 0; i < specialUnits.length; i++) {

            var targetTr = _this.getOrCreateRow(i, tbody);

            _this.createCommonUnitRow(specialUnits[i], targetTr, specialUnits.length, "Unit");
        }

        if (specialUnits.length === 0) {

            var td = _this.appendTableCell(null, null, null, null, "Unit");

            if (settings.renderUnitData_colspan > 1) td.setAttribute("colspan", settings.renderUnitData_colspan);
        }
    };
}
TableBuilder_Unit.prototype = new TableBuilder();

function TableBuilder_Flagship() {

    var _this = this;

    this.createHeader = function() {

        if (settings.renderUnitData_rowspan > 1) {

            var td = _this.appendTableCell("Flagship", trHeadDom, false, settings.renderUnitData_rowspan);

            if (settings.renderUnitData_colspan > 1) td.setAttribute("colspan", settings.renderUnitData_colspan);

            _this.createCommonUnitRow_Header(trHead2Dom, settings.renderUnitData_rowspan);
        }
        else {

            _this.appendTableCell("Flagship", trHeadDom);
        }
    }

    this.createBody = function (factionID) {

        var flagship = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Flagship; });

        for (let i = 0; i < flagship.length; i++) {

            var targetTr = _this.getOrCreateRow(i, tbody);

            _this.createCommonUnitRow(flagship[i], targetTr, flagship.length, "Flagship");
        }
    }
}
TableBuilder_Flagship.prototype = new TableBuilder();

function TableBuilder_Mech() {

    var _this = this;

    this.createHeader = function() {

        var colspan = 1
            + settings.renderUnitData_cost
            + settings.renderUnitData_combat
            + settings.renderUnitData_production
            + settings.renderUnitData_bombardment
            + settings.renderUnitData_sc;

        if (colspan > 1) {

            var td = _this.appendTableCell("Mech", trHeadDom, false, settings.renderUnitData_rowspan);
            td.setAttribute("colspan", colspan);

            _this.appendTableCell("General", trHead2Dom, false, 2);

            if (settings.renderUnitData_cost) _this.appendTableCell("Cost", trHead2Dom, false,  2);
            if (settings.renderUnitData_combat) _this.appendTableCell("Combat", trHead2Dom, false, 2);
            if (settings.renderUnitData_bombardment) _this.appendTableCell("Bombardment", trHead2Dom, false, 2);
            if (settings.renderUnitData_sc) _this.appendTableCell("Space Cannon", trHead2Dom, false, 2);
            if (settings.renderUnitData_production) _this.appendTableCell("Production", trHead2Dom, false, 2);
        }
        else {

            _this.appendTableCell("Mech", trHeadDom);
        }
    }

    this.createBody = function (factionID) {

        var mech = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Mech; });

        for (let i = 0; i < mech.length; i++) {

            var targetTr = _this.getOrCreateRow(i, tbody);

            var combat = _this.formatMultiplier(mech[i].Combat, mech[i].CombatDice);
            var bombardment = _this.formatMultiplier(mech[i].Bombardment, mech[i].BombardmentDice);
            var spaceCannon = _this.formatMultiplier(mech[i].SpaceCannon, mech[i].SpaceCannonDice);

            _this.appendTableCell(_this.formatAbility(mech[i]), targetTr, false, mech.length, "Mech");

            if (settings.renderUnitData_cost) _this.appendTableCell(mech[i].Cost, targetTr, true, mech.length, "Mech");
            if (settings.renderUnitData_combat) _this.appendTableCell(combat, targetTr, true, mech.length, "Mech");
            if (settings.renderUnitData_bombardment) _this.appendTableCell(bombardment, targetTr, true, mech.length, "Mech");
            if (settings.renderUnitData_sc) _this.appendTableCell(spaceCannon, targetTr, true, mech.length, "Mech");
            if (settings.renderUnitData_production) _this.appendTableCell(mech[i].Production, targetTr, true, mech.length, "Mech");
        }
    }
}
TableBuilder_Mech.prototype = new TableBuilder();

function TableBuilder_Leader() {

    var _this = this;

    this.createHeader = function() {

        var td = _this.appendTableCell("Leaders", trHeadDom, false, 2);
        td.setAttribute("colspan", 3);

        _this.appendTableCell("Agent", trHead2Dom, false, 2);
        _this.appendTableCell("Commander", trHead2Dom, false, 2);
        _this.appendTableCell("Hero", trHead2Dom, false, 2);
    }

    this.createBody = function(factionID) {

        var leaders = dataProvider.getLeaders(factionID);
        //console.log("leaders", leaders);

        var agent = leaders.filter(function (item) { return item.Level === 1; });
        var agentHtml = createLeaderHtml(agent);

        var commander = leaders.filter(function (item) { return item.Level === 2; });
        var commanderHtml = createLeaderHtml(commander);

        var hero = leaders.filter(function (item) { return item.Level === 3; });
        var heroHtml = createLeaderHtml(hero);

        _this.appendTableCell(agentHtml, null, null, null, "Leader");
        _this.appendTableCell(commanderHtml, null, null, null, "Leader");
        _this.appendTableCell(heroHtml, null, null, null, "Leader");
    }

    function createLeaderHtml(leader) {

        var temp = "";

        for (let i = 0; i < leader.length; i++) {

            temp += _this.formatAbility(leader[i]);

            if (settings.renderFlavorText) {

                temp += _this.formatFlavorText(leader[i].FlavorText);
            }
        }

        return temp;
    }
}
TableBuilder_Leader.prototype = new TableBuilder();

function TableBuilder_Promissory() {

    var _this = this;

    this.createHeader = function() {

        _this.appendTableCell("Promissory Notes", trHeadDom);
    }

    this.createBody = function(factionID) {

        var pns = dataProvider.getPromissoryNotes(factionID);

        var temp = "";

        for (let i = 0; i < pns.length; i++) {

            temp += _this.formatAbility(pns[i]);
        }

        _this.appendTableCell(temp);
    }
}
TableBuilder_Promissory.prototype = new TableBuilder();

function TableBuilder_Summary() {

    var _this = this;
    var popupDom = null;

    function popupDom_Moseover(e) {

        var dataFunction = e.srcElement.getAttribute("data-function");

        var item = eval("dataProvider." + dataFunction);
        var html = _this.formatAbility(item, true);

        if (!popupDom) {

            popupDom = document.createElement('div');
            popupDom.innerHTML = html;
            popupDom.classList.add("Popup");

            document.body.appendChild(popupDom);
        }

        var popupRect = popupDom.getBoundingClientRect();
        var targetRect = e.srcElement.getBoundingClientRect();

        var x = targetRect.left + window.scrollX;
        var y = targetRect.top + window.scrollY;

        x += (targetRect.width - popupRect.width) / 2;
        if (x < 0) x = 0;

        y -= popupRect.height;
        y -= 0;

        popupDom.style.left = x + "px";
        popupDom.style.top = y + "px";
    }

    function popupDom_Moseout(e) {

        //return;

        if (popupDom) {

            document.body.removeChild(popupDom);

            popupDom = null;
        }
    }

    function formatTitle(value) {

        return value.replaceAll(" &#8486;", "");
    }

    this.createBody_Summary = function (factionID) {

        var faction = dataProvider.getFactionById(factionID);
        var techs = dataProvider.getFactionTechnologies(factionID);
        var factionUnits = dataProvider.getFactionUnits(factionID);
        var flagship = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Flagship; });
        var mech = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Mech; });
        var leaders = dataProvider.getLeaders(factionID);
        var pn = dataProvider.getPromissoryNotes(factionID);

        var value = faction.Summary.replaceAll('\r\n', '<br />');
        value = value.replaceAll("[Flagship]", "<span class='Flagship' data-function='getUnitById(" + flagship[0].UnitID + ")'>Flagship</span>");
        value = value.replaceAll("[Mech]", "<span class='Mech' data-function='getUnitById(" + mech[0].UnitID + ")'>Mech</span>");

        for (var i = 0; i < techs.length; i++) {

            if (techs[i].Title) {

                var color = _this.formatColor(techs[i]);
                var html = "<span data-function='getTechnologyById(" + techs[i].TechnologyID + ")' class='" + color + "'>Faction Technology</span>";

                var finalTitle = formatTitle(techs[i].Title);

                value = value.replaceAll("[" + finalTitle + "]", html);
            }
        }

        for (var i = 0; i < factionUnits.length; i++) {

                var unitTypeStr = dataProvider.getEnumKey(unitTypeEnum, factionUnits[i].UnitTypeID);
                
                var html = "<span data-function='getUnitById(" + factionUnits[i].UnitID + ")' class='Unit'>Faction " + unitTypeStr + "</span>";

                value = value.replaceAll("[" + factionUnits[i].Title + "]", html);
        }

        for (var i = 0; i < pn.length; i++) {

            var finalTitle = formatTitle(pn[i].Title);

            value = value.replaceAll("[" + finalTitle + "]", "<span class='PromissoryNote' data-function='getPromissoryNoteById(" + pn[i].PromissoryNoteID + ")'>Promissory Note</span>");
        }

        for (var i = 0; i < leaders.length; i++) {

            var leaderLevel = "";
            if (leaders[i].Level === 1) leaderLevel = "Agent";
            if (leaders[i].Level === 2) leaderLevel = "Commander";
            if (leaders[i].Level === 3) leaderLevel = "Hero";

            value = value.replaceAll("[" + leaders[i].Title + "]", "<span class='Leader' data-function='getLeaderById(" + leaders[i].LeaderID + ")'>" + leaderLevel + "</span>");
        }

        var td = _this.appendTableCell(value, null, null, null, "Summary");

        var elements = td.querySelectorAll("span[data-id], span[data-function]");

        for (var i = 0; i < elements.length; i++) {

            elements[i].addEventListener("mouseover", popupDom_Moseover);
            elements[i].addEventListener("mouseout", popupDom_Moseout);
        }
    };
}
TableBuilder_Summary.prototype = new TableBuilder();

function DataProvider() {

    this.getFactionById = function (factionId) {

        for (let i = 0; i < factions.length; i++) {

            if (factions[i].FactionID === factionId) {

                return factions[i];
            }
        }
    }

    this.getFactionAbilities = function (factionId) {

        var temp = [];

        for (let i = 0; i < factionAbilities.length; i++) {

            if (factionAbilities[i].FactionID === factionId) {

                temp.push(factionAbilities[i]);
            }
        }

        return temp;
    }

    this.getFactionUnits = function (factionId) {

        var temp = [];

        for (let i = 0; i < units.length; i++) {

            if (units[i].FactionID === factionId) {

                temp.push(units[i]);
            }
        }

        return temp;
    }

    this.getFactionTechnologies = function (factionId) {

        var temp = [];
        var useCodex = settings.useCodex;

        for (let i = 0; i < technologies.length; i++) {

            if (technologies[i].FactionID === factionId) {

                var tech = technologies[i];

                if (useCodex) {

                    var techCodex = codex_technologies.filter(function (item) { return item.TechnologyID === tech.TechnologyID; });

                    if (techCodex.length > 0) tech = techCodex[0];
                }

                temp.push(tech);
            }
        }

        return temp;
    }

    this.getUnitById = function (unitId) {

        for (let i = 0; i < units.length; i++) {

            if (units[i].UnitID === unitId) {

                return units[i];
            }
        }
    }

    this.getLeaders = function (factionId) {

        var temp = [];

        for (let i = 0; i < leaders.length; i++) {

            if (leaders[i].FactionID === factionId) {

                temp.push(leaders[i]);
            }
        }

        return temp;
    }

    this.getLeaderById = function (leaderId) {

        var temp = null;

        for (let i = 0; i < leaders.length; i++) {

            if (leaders[i].LeaderID === leaderId) {

                temp = leaders[i];

                break;
            }
        }

        return temp;
    }

    this.getPromissoryNotes = function (factionId) {

        var temp = [];
        var useCodex = settings.useCodex;

        for (let i = 0; i < promissoryNotes.length; i++) {

            if (promissoryNotes[i].FactionID === factionId) {

                var pn = promissoryNotes[i];

                if (useCodex) {

                    var pnCodex = codex_promissoryNotes.filter(function (item) { return item.PromissoryNoteID === pn.PromissoryNoteID; });

                    if (pnCodex.length > 0) pn = pnCodex[0];
                }

                temp.push(pn);
            }
        }

        return temp;
    }

    this.getPromissoryNoteById = function (promissoryNoteId) {

        var temp = null;
        var useCodex = settings.useCodex;

        for (let i = 0; i < promissoryNotes.length; i++) {

            if (promissoryNotes[i].PromissoryNoteID === promissoryNoteId) {

                temp = promissoryNotes[i];

                if (useCodex) {

                    var pnCodex = codex_promissoryNotes.filter(function (item) { return item.PromissoryNoteID === temp.PromissoryNoteID; });

                    if (pnCodex.length > 0) temp = pnCodex[0];
                }

                break;
            }
        }

        return temp;
    }

    this.getPlanets = function (factionId) {

        var temp = [];

        for (let i = 0; i < planets.length; i++) {

            if (planets[i].FactionID === factionId) {

                temp.push(planets[i]);
            }
        }

        return temp;
    }

    this.getStartingUnits = function (factionId) {

        var temp = [];

        for (let i = 0; i < startingUnits.length; i++) {

            if (startingUnits[i].FactionID === factionId) {

                var object = { Quantity: startingUnits[i].Quantity };

                var unitType = this.getEnumKey(unitTypeEnum, startingUnits[i].UnitTypeID);
                object.UnitType = unitType;

                temp.push(object);
            }
        }

        return temp;
    }

    this.getStartingTechnologies = function (factionId, useCodex) {

        var temp = [];

        for (let i = 0; i < startingTechnologies.length; i++) {

            if (startingTechnologies[i].FactionID === factionId) {

                var tech = null;

                for (var ii = 0; ii < technologies.length; ii++) {

                    if (technologies[ii].TechnologyID === startingTechnologies[i].TechnologyID) {

                        tech = technologies[ii];

                        break;
                    }
                }

                if (useCodex) {

                    var techCodex = codex_technologies.filter(function (item) { return item.TechnologyID === tech.TechnologyID; });

                    if (techCodex.length > 0) tech = techCodex[0];
                }

                temp.push(tech);
            }
        }

        return temp;
    }

    this.getTechnologyById = function (techId) {

        var temp = null;
        var useCodex = settings.useCodex;

        for (let i = 0; i < technologies.length; i++) {

            if (technologies[i].TechnologyID === techId) {

                temp = technologies[i];

                if (useCodex) {

                    var techCodex = codex_technologies.filter(function (item) { return item.TechnologyID === techId; });

                    if (techCodex.length > 0) temp = techCodex[0];
                }

                break;
            }
        }

        return temp;
    }

    this.getEnumKey = function (tagetEnum, value) {

        var temp = null;

        for (var i_enum in tagetEnum) {

            var enumKey = i_enum;
            var enumValue = tagetEnum[enumKey];

            if (enumValue === value) {

                temp = enumKey;

                break;
            }
        }

        return temp;
    };

    function replaceOmegaString(value) {

        var temp = value.replace("Ω", "&#8486;");

        return temp;
    }

    function replaceQuotes(value) {

        //not in use;

        var temp = value.replaceAll("“", "&ldquo;");
        temp = temp.replaceAll("”", "&rdquo;");
        temp = temp.replaceAll("’", "&rsquo;");
        temp = temp.replaceAll("‘", "&lsquo;");

        return temp;
    }

    _construct = function () {

        for (let i = 0; i < codex_promissoryNotes.length; i++) {

            var value = replaceOmegaString(codex_promissoryNotes[i].Title);

            codex_promissoryNotes[i].Title = value;
        }

        for (let i = 0; i < codex_technologies.length; i++) {

            var value = replaceOmegaString(codex_technologies[i].Title);

            codex_technologies[i].Title = value;
        }
    }();
}

function dataBindFactions() {

    for (let i = 0; i < factions.length; i++) {

        var cbID = "faction" + factions[i].FactionID + "cb";

        var liDom = document.createElement("li");

        var labelDom = document.createElement("label");
        labelDom.setAttribute("for", cbID);
        labelDom.innerHTML = factions[i].Name;

        var inputDom = document.createElement("input");
        inputDom.setAttribute("type", "checkbox");
        inputDom.setAttribute("id", cbID);
        inputDom.setAttribute("data-id", factions[i].FactionID);

        liDom.appendChild(inputDom);
        liDom.appendChild(labelDom);

        factionsUl.appendChild(liDom);
    }
}

function toggleInputList(e) {

    var checkboxList = e.target.parentNode.getElementsByTagName("input");

    var checkedCount = 0;

    for (let i = 0; i < checkboxList.length; i++) {

        if (checkboxList[i].checked) checkedCount++;
    }

    var allSelected = checkedCount === checkboxList.length;

    for (let i = 0; i < checkboxList.length; i++) {

        checkboxList[i].checked = !allSelected;
    }
}

function buildTable(e) {

    createSettings();

    var tableBuilder_Miscellaneous = new TableBuilder_Miscellaneous();
    var tableBuilder_Planet = new TableBuilder_Planet();
    var tableBuilder_Starting = new TableBuilder_Starting();
    var tableBuilder_Abilities = new TableBuilder_Abilities();
    var tableBuilder_Technology = new TableBuilder_Technology();
    var tableBuilder_Unit = new TableBuilder_Unit();
    var tableBuilder_Flagship = new TableBuilder_Flagship();
    var tableBuilder_Mech = new TableBuilder_Mech();
    var tableBuilder_Leader = new TableBuilder_Leader();
    var tableBuilder_Promissory = new TableBuilder_Promissory();
    var tableBuilder_Summary = new TableBuilder_Summary();

    tableBuilder_Miscellaneous.resetTable();

    var checkedList = factionsUl.querySelectorAll('input:checked');
    var selectedFactions = [];

    if (checkedList.length > 0) {
        
        if (settings.createFaction) {

            tableBuilder_Miscellaneous.createHeader_Common("Faction", trHeadDom);
        }

        if (settings.createCommodities) {

            tableBuilder_Miscellaneous.createHeader_Common("Commodities", trHeadDom);
        }

        if (settings.createPlanets) {

            tableBuilder_Planet.createHeader();
        }

        if (settings.createStartingData) {

            tableBuilder_Starting.createHeader();
        }

        if (settings.createAbilities) {

            tableBuilder_Abilities.createHeader();
        }

        if (settings.createTechnologies) {

            tableBuilder_Technology.createHeader();
        }

        if (settings.createUnits) {

            tableBuilder_Unit.createHeader();
        }

        if (settings.createFlagship) {

            tableBuilder_Flagship.createHeader();
        }

        if (settings.createMech) {

            tableBuilder_Mech.createHeader();
        }

        if (settings.createLeader) {

            tableBuilder_Leader.createHeader();
        }

        if (settings.createPromissoryNotes) {

            tableBuilder_Promissory.createHeader();
        }

        if (settings.createSummary) {

            tableBuilder_Miscellaneous.createHeader_Common("Summary", trHeadDom);
        }

        for (let i = 0; i < checkedList.length; i++) {

            var factionID = parseInt(checkedList[i].getAttribute("data-id"));

            selectedFactions.push(factionID);

            pendingTrDom = document.createElement("tr");
            pendingTrDom.setAttribute("data-faction", factionID);

            pendingTrList = [];
            pendingTrList.push(pendingTrDom);

            tbody.appendChild(pendingTrDom);

            if (settings.createFaction) {

                tableBuilder_Miscellaneous.createBody_Faction(factionID);
            }

            if (settings.createCommodities) {

                tableBuilder_Miscellaneous.createBody_Commodities(factionID);
            }

            if (settings.createPlanets) {

                tableBuilder_Planet.createBody(factionID);
            }

            if (settings.createStartingData) {

                tableBuilder_Starting.createBody(factionID);
            }

            if (settings.createAbilities) {

                tableBuilder_Abilities.createBody(factionID);
            }

            if (settings.createTechnologies) {

                tableBuilder_Technology.createBody(factionID);
            }

            if (settings.createUnits) {

                tableBuilder_Unit.createBody(factionID);
            }

            if (settings.createFlagship) {

                tableBuilder_Flagship.createBody(factionID);
            }

            if (settings.createMech) {

                tableBuilder_Mech.createBody(factionID);
            }

            if (settings.createLeader) {

                tableBuilder_Leader.createBody(factionID);
            }

            if (settings.createPromissoryNotes) {

                tableBuilder_Promissory.createBody(factionID);
            }

            if (settings.createSummary) {

                tableBuilder_Summary.createBody_Summary(factionID);
            }

            tableBuilder_Miscellaneous.adjustRowspan(pendingTrList);
        }

        tableBuilder_Miscellaneous.insertDummyCells();
        tableBuilder_Miscellaneous.applyZebraStyle();
        tableBuilder_Miscellaneous.adjustRowspan_header();
        tableBuilder_Miscellaneous.clean();
    }

    saveState(selectedFactions);
}

function saveState(factionIDList) {

    if (localStorage) {

        localStorage.setItem('settings', JSON.stringify(settings));

        localStorage.setItem('factionIDList', JSON.stringify(factionIDList));
    }
}

function loadState() {

    if (localStorage) {

        settings = JSON.parse(localStorage.getItem('settings'));

        if (settings) {

            document.getElementById("factionCb").checked = settings.createFaction,
            document.getElementById("commoditiesCb").checked = settings.createCommodities;
            document.getElementById("planetsCb").checked = settings.createPlanets;
            document.getElementById("startingCb").checked = settings.createStartingData;
            document.getElementById("abilityCb").checked = settings.createAbilities;
            document.getElementById("techCb").checked = settings.createTechnologies;
            document.getElementById("unitsCb").checked = settings.createUnits;
            document.getElementById("flagshipCb").checked = settings.createFlagship;
            document.getElementById("mechCb").checked = settings.createMech;
            document.getElementById("leaderCb").checked = settings.createLeader;
            document.getElementById("pnCb").checked = settings.createPromissoryNotes;
            document.getElementById("summaryCb").checked = settings.createSummary;

            document.getElementById("unitData_FeaturesCb").checked = settings.renderUnitData_features;
            document.getElementById("unitData_CostCb").checked = settings.renderUnitData_cost;
            document.getElementById("unitData_CombatCb").checked = settings.renderUnitData_combat;
            document.getElementById("unitData_MoveCb").checked = settings.renderUnitData_move;
            document.getElementById("unitData_CapacityCb").checked = settings.renderUnitData_capacity;
            document.getElementById("unitData_BombardmentCb").checked = settings.renderUnitData_bombardment;
            document.getElementById("unitData_AfbCb").checked = settings.renderUnitData_afb;
            document.getElementById("unitData_ScCb").checked = settings.renderUnitData_sc;
            document.getElementById("unitData_ProductionCb").checked = settings.renderUnitData_production;

            document.getElementById("codexCb").checked = settings.useCodex;
            document.getElementById("renderPassiveCb").checked = settings.renderPassiveAbility;
            document.getElementById("renderActionCb").checked = settings.renderActionAbility;
            document.getElementById("renderDeployCb").checked = settings.renderDeployAbility;
            document.getElementById("renderUnlockCb").checked = settings.renderUnlock;
            document.getElementById("renderRequirementCb").checked = settings.renderRequirement;
            document.getElementById("renderFlavorCb").checked = settings.renderFlavorText;
        }

        var factionIDList = JSON.parse(localStorage.getItem('factionIDList'));

        if (factionIDList) {

            for (let i = 0; i < factionIDList.length; i++) {

                factionsUl.querySelectorAll("[data-id='" + factionIDList[i] + "']")[0].checked = true;
            }
        }
    }
}

function createSettings() {

    settings = {
        createFaction: document.getElementById("factionCb").checked,
        createCommodities: document.getElementById("commoditiesCb").checked,
        createPlanets: document.getElementById("planetsCb").checked,
        createStartingData: document.getElementById("startingCb").checked,
        createAbilities: document.getElementById("abilityCb").checked,
        createTechnologies: document.getElementById("techCb").checked,
        createUnits: document.getElementById("unitsCb").checked,
        createFlagship: document.getElementById("flagshipCb").checked,
        createMech: document.getElementById("mechCb").checked,
        createLeader: document.getElementById("leaderCb").checked,
        createPromissoryNotes: document.getElementById("pnCb").checked,
        createSummary: document.getElementById("summaryCb").checked,

        renderUnitData_features: document.getElementById("unitData_FeaturesCb").checked,
        renderUnitData_cost: document.getElementById("unitData_CostCb").checked,
        renderUnitData_combat: document.getElementById("unitData_CombatCb").checked,
        renderUnitData_move: document.getElementById("unitData_MoveCb").checked,
        renderUnitData_capacity: document.getElementById("unitData_CapacityCb").checked,
        renderUnitData_bombardment: document.getElementById("unitData_BombardmentCb").checked,
        renderUnitData_afb: document.getElementById("unitData_AfbCb").checked,
        renderUnitData_sc: document.getElementById("unitData_ScCb").checked,
        renderUnitData_production: document.getElementById("unitData_ProductionCb").checked,

        useCodex: document.getElementById("codexCb").checked,
        renderPassiveAbility: document.getElementById("renderPassiveCb").checked,
        renderActionAbility: document.getElementById("renderActionCb").checked,
        renderDeployAbility: document.getElementById("renderDeployCb").checked,
        renderUnlock: document.getElementById("renderUnlockCb").checked,
        renderRequirement: document.getElementById("renderRequirementCb").checked,
        renderFlavorText: document.getElementById("renderFlavorCb").checked,
    };

    settings.renderUnitData_colspan = 1 +
        settings.renderUnitData_cost +
        settings.renderUnitData_combat +
        settings.renderUnitData_move +
        settings.renderUnitData_capacity +
        settings.renderUnitData_bombardment +
        settings.renderUnitData_afb +
        settings.renderUnitData_sc +
        settings.renderUnitData_production;

    settings.renderUnitData_rowspan = settings.renderUnitData_colspan > 1 ? 2 : 1;
}

if (!String.prototype.replaceAll) {

    String.prototype.replaceAll = function replaceAll(search, replace) { return this.split(search).join(replace); }
}