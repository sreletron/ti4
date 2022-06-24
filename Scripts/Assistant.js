var factionID = null;
var inventory = {};
var startPageDom = null;
var overlayDom = null;
var planetTemplate = null;
var planetTemplateEditor = null;
var legendaryPlanetTemplate = null;
var technologyTemplate = null;
var promissoryNoteTemplate = null;
let promissoryNoteColored = [];
var selectedRaces = [];
var removedPromissoryNotes = [];
var removedTechs = [];
var summaryItem = null;
var leaderItem = null;
var relicItem = null;
var agendaItem = null;
var unitItem = null; //template for unit page

var codexCb = null;
var pendingPlanetTemplate = null;
var unitPiceListTbl = null;
var unitPiceListTblTemplate = null;

let rollState = []; //this is combat page data wrapper
let rollModifierTemplate = null;
let combatTemplate = null;

function createDataset(factionID) {

    //agendas are removed by Pok?
    agendas = agendas.filter(x => !x.IsRemoved);

    createDataset_setExhaustable(true);
    createDataset_setPurgable();

    inventory.factionAbilities = factionAbilities.filter(x => x.FactionID === factionID);
    inventory.technologies = technologies.filter(y => startingTechnologies.filter(x => x.FactionID == factionID).map(x => x.TechnologyID).indexOf(y.TechnologyID) != -1)
    inventory.planets = planets.filter(x => x.FactionID === factionID);
    inventory.promissoryNotes = [];
    inventory.relics = [];
    inventory.agendas = [];
    inventory.leaders = leaders.filter(x => x.FactionID === factionID);
    inventory.leaders.forEach(x => { x.IsUnlocked = x.Level === 1 });
    inventory.players = [];

    let pendingTechs = [];
    let nonfactionTechs = technologies.filter(x => !x.FactionID);
    let factionTechs = technologies.filter(x => x.FactionID === factionID);
    let defaultUnits = units.filter(x => !x.FactionID);
    let factionUnits = units.filter(x => x.FactionID === factionID);

    for (let i = 0; i < units.length; i++) {

        if (units[i].FactionID) {

            let targetTech = technologies.find(x => x.UnitID == units[i].UnitID);

            if (targetTech) {

                targetTech.Title = units[i].Title;
            }
        }
    }

    let availableUnits = [];

    for (let i = 0; i < nonfactionTechs.length; i++) {

        if (inventory.technologies.indexOf(nonfactionTechs[i]) !== -1) continue;

        let isDefault = true;

        if (nonfactionTechs[i].UnitID) {

            let pendingUnit = units.find(x => x.UnitID == nonfactionTechs[i].UnitID);
            let pendingUnits = factionUnits.filter(x => x.UnitTypeID == pendingUnit.UnitTypeID)

            if (pendingUnits.length > 0) {

                isDefault = false;

                for (var ii = 0; ii < pendingUnits.length; ii++) {

                    availableUnits.push(pendingUnits[ii])

                    let targetTech = factionTechs.find(x => x.UnitID == pendingUnits[ii].UnitID);

                    if (targetTech) {

                        pendingTechs.push(targetTech);
                    }
                }
            }
        }

        if (isDefault) pendingTechs.push(nonfactionTechs[i]);
    }

    factionTechs.forEach(x => { if (!x.UnitID) pendingTechs.push(x) });

    let startingUnits = [];
    let pendingUnits = [];

    for (let i = 0; i < defaultUnits.length; i++) {

        let item = nonfactionTechs.find(x => x.UnitID == defaultUnits[i].UnitID);

        if (item) {

            pendingUnits.push(defaultUnits[i])
        }
        else {

            startingUnits.push(defaultUnits[i])
        }
    }

    startingUnits.push(factionUnits.find(x => x.UnitTypeID == unitTypeEnum.Flagship));
    startingUnits.push(factionUnits.find(x => x.UnitTypeID == unitTypeEnum.Mech));

    //give lvl1 WarSun to Muaat
    if (factionID === 4) {

        let prototypeWarSunI = units.find(x => x.UnitID === 84);
        startingUnits.push(prototypeWarSunI);
    }

    for (let i = 0; i < availableUnits.length; i++) {

        let targetTech = pendingTechs.find(x => x.UnitID == availableUnits[i].UnitID)
        let targetRegistry = targetTech ? pendingUnits : startingUnits;

        let item = targetRegistry.find(x => x.UnitTypeID == availableUnits[i].UnitTypeID)
        let index = targetRegistry.indexOf(item);

        targetRegistry[index] = availableUnits[i];
    }

    inventory.pendingTech = pendingTechs;
    inventory.units = startingUnits;
    inventory.pendingUnit = pendingUnits;
}

function createDataset_setCodex() {

    let isCodex = codexCb.checked;

    if (isCodex) {

        if (removedPromissoryNotes.length === 0) {

            for (let i = 0; i < codex_promissoryNotes.length; i++) {

                let i_obj = codex_promissoryNotes[i];
                let i_original = promissoryNotes.find(x => x.PromissoryNoteID === i_obj.PromissoryNoteID);
                let index = promissoryNotes.indexOf(i_original);

                promissoryNotes[index] = i_obj;

                removedPromissoryNotes.push({ index: index, object: i_original });
            }

            for (let i = 0; i < codex_technologies.length; i++) {

                let i_obj = codex_technologies[i];
                let i_original = technologies.find(x => x.TechnologyID === i_obj.TechnologyID);
                let index = technologies.indexOf(i_original);

                technologies[index] = i_obj;

                removedTechs.push({ index: index, object: i_original });
            }
        }
    }
    else {

        for (let i = 0; i < removedPromissoryNotes.length; i++) {

            let i_obj = removedPromissoryNotes[i];
            promissoryNotes[i_obj.index] = i_obj.object;
        }

        for (let i = 0; i < removedTechs.length.length; i++) {

            let i_obj = codex_technologies[i];
            technologies[i_obj.index] = i_obj.object;
        }

        removedPromissoryNotes = [];
        removedTechs = [];
    }
}

function createDataset_setExhaustable(reset) {

    for (let i = 0; i < planets.length; i++) {

        if (planets[i].Ability) {

            let data = planets[i].Ability.split("\r\n");
            let title = data[0];
            let text = data[1];
            
            planets[i].legendaryObject = {};
            planets[i].legendaryObject.PlanetID = planets[i].PlanetID;
            planets[i].legendaryObject.Title = title;
            planets[i].legendaryObject.Passive = text;
            planets[i].legendaryObject.IsExhaustable = true;
            planets[i].legendaryObject.PlanetName = planets[i].Name;
            planets[i].legendaryObject.Summary = text;
        }
    }

    for (let i = 0; i < technologies.length; i++) {

        let index = technologies[i].Passive ? technologies[i].Passive.match(/exhaust this/i) : -1;
        let index2 = technologies[i].Action ? technologies[i].Action.match(/exhaust this/i) : -1;
        
        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            technologies[i].IsExhaustable = true;

            if (reset) technologies[i].IsExhausted = false;
        }
    }

    for (let i = 0; i < leaders.length; i++) {

        let index = leaders[i].Passive ? leaders[i].Passive.match(/exhaust this/i) : -1;
        let index2 = leaders[i].Action ? leaders[i].Action.match(/exhaust this/i) : -1;
        
        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            leaders[i].IsExhaustable = true;

            if (reset) leaders[i].IsExhausted = false;
        }
    }

    for (let i = 0; i < promissoryNotes.length; i++) {

        let index = promissoryNotes[i].Passive ? promissoryNotes[i].Passive.match(/exhaust this/i) : -1;
        let index2 = promissoryNotes[i].Action ? promissoryNotes[i].Action.match(/exhaust this/i) : -1;

        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            promissoryNotes[i].IsExhaustable = true;

            if (reset) promissoryNotes[i].IsExhausted = false;
        }
    }

    for (let i = 0; i < relics.length; i++) {

        let index = relics[i].Passive ? relics[i].Passive.match(/exhaust this/i) : -1;
        let index2 = relics[i].Active ? relics[i].Active.match(/exhaust this/i) : -1;

        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            relics[i].IsExhaustable = true;

            if (reset) relics[i].IsExhausted = false;
        }
    }
}

function createDataset_setPurgable() {

    for (let i = 0; i < leaders.length; i++) {

        let index = leaders[i].Passive ? leaders[i].Passive.match(/purge/i) : -1;
        let index2 = leaders[i].Action ? leaders[i].Action.match(/purge/i) : -1;

        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            leaders[i].IsPurgable = true;
        }
    }

    for (let i = 0; i < relics.length; i++) {

        let index = relics[i].Passive ? relics[i].Passive.match(/purge/i) : -1;
        let index2 = relics[i].Active ? relics[i].Active.match(/purge/i) : -1;

        if ((index && index !== -1) || (index2 && index2 !== -1)) {

            relics[i].IsPurgable = true;
        }
    }
}

function createDataset_setFactionSpecial() {

    //The Yssaril Tribes
    if (factionID === 17) {

        let passive = [];
        let action = [];

        for (let i = 0; i < inventory.players.length; i++) {

            if (inventory.players[i].factionID === factionID) continue;

            let i_leader = leaders.find(x => x.FactionID === inventory.players[i].factionID && x.Level === 1);
            if (i_leader.Passive) passive.push(i_leader.Passive);
            if (i_leader.Action) action.push(i_leader.Action);
        }

        if (!window.Yssaril_AgentPassive) window.Yssaril_AgentPassive = inventory.leaders[0].Passive;

        inventory.leaders[0].Passive = window.Yssaril_AgentPassive;
        inventory.leaders[0].Action = null;

        if (passive.length > 0) inventory.leaders[0].Passive = passive.join("<hr />");
        if (action.length > 0) inventory.leaders[0].Action = action.join("<hr />");

        //is this correct?
        inventory.leaders[0].IsExhaustable = true;

        dataBindSummary();
        dataBindLeaders();
    }
    //The Mahact Gene-Sorcerers
    else if (factionID === 20) {

        inventory.leaders = inventory.leaders.filter(x => x.FactionID === factionID);

        for (let i = 0; i < inventory.players.length; i++) {

            if (inventory.players[i].factionID === factionID) continue;

            let i_leader = leaders.find(x => x.FactionID === inventory.players[i].factionID && x.Level === 2);

            inventory.leaders.push(i_leader);
        }

        dataBindSummary();
        dataBindLeaders();
    }
}

function createCommonSummary(data) {

    let summaryHTML = "";

    if (data.Passive) {

        let lineList = data.Passive.split("\r\n\r\n");

        for (let i = 0; i < lineList.length; i++) {

            summaryHTML += "<div>" + lineList[i] + "</div>";
        }
    }

    if (data.Action ?? data.Active) {

        let lineList = (data.Action ?? data.Active).split("\r\n\r\n");

        for (let i = 0; i < lineList.length; i++) {

            summaryHTML += "<div>" + (i === 0 ? "<span class='ActionLbl'>Action:</span> " : "") + lineList[i] + "</div>";
        }
    }

    if (data.Deploy) {

        let lineList = data.Deploy.split("\r\n\r\n");

        for (let i = 0; i < lineList.length; i++) {

            summaryHTML += "<div><span class='ActionLbl'>Deploy:</span> " + lineList[i] + "</div>";
        }
    }

    return summaryHTML;
}

function createCommonSummary2(data) {

    let summaryHTML = "";

    let lineList = data.split("\r\n\r\n");

    for (var i = 0; i < lineList.length; i++) {

        summaryHTML += "<div>" + lineList[i] + "</div>";
    }

    return summaryHTML;
}

function createCommonUnitWrapper(data, wrapper, renderRequirement) {

    let dataCloned = { ...data };

    let domCloned = unitItem.cloneNode(true);
    domCloned.querySelector(".UnitImage").dataset.unitType = data.UnitTypeID;
    domCloned.querySelector("h3").innerHTML = data.Title;

    let summary = createCommonSummary(dataCloned)
    dataCloned.Summary = summary;

    if (summary) {

        domCloned.querySelector(".Summary").innerHTML = summary;
    }

    dataCloned.Combat = createModifiedHitText(dataCloned.Combat, dataCloned.CombatDice);

    dataBindDom(domCloned.querySelector("table"), dataCloned);

    let requirementList = domCloned.querySelector(".RequirementList");

    if (renderRequirement) {

        let unitTech = technologies.find(x => x.UnitID === dataCloned.UnitID);

        if (unitTech) {

            for (let i = 0; i < unitTech.GreenRequirement; i++) {

                requirementList.innerHTML += "<span class='Requirement Green'></span>";
            }
            for (let i = 0; i < unitTech.BlueRequirement; i++) {

                requirementList.innerHTML += "<span class='Requirement Blue'></span>";
            }
            for (let i = 0; i < unitTech.RedRequirement; i++) {

                requirementList.innerHTML += "<span class='Requirement Red'></span>";
            }
            for (let i = 0; i < unitTech.YellowRequirement; i++) {

                requirementList.innerHTML += "<span class='Requirement Yellow'></span>";
            }
        }
        else {

            requirementList.remove();
        }
    }
    else {

        requirementList.remove();
    }

    let featuresDom = domCloned.querySelector(".Features");

    if (dataCloned.Production) {

        featuresDom.innerHTML += "<span>Production " + dataCloned.Production + "</span>"
    }

    if (dataCloned.IsSustainDamage) {

        featuresDom.innerHTML += "<span>Sustain damage</span>"
    }

    if (dataCloned.IsPlanataryShield) {

        featuresDom.innerHTML += "<span>Planatary shield</span>"
    }

    if (dataCloned.AntiFighterBarage) {

        let info = createModifiedHitText(dataCloned.AntiFighterBarage, dataCloned.AntiFighterBarageDice);

        featuresDom.innerHTML += "<span class='AFB'>Anti fighter barage " + info + "</span>"
    }

    if (dataCloned.Bombardment) {

        let info = "Bombardment " + createModifiedHitText(dataCloned.Bombardment, dataCloned.BombardmentDice);

        featuresDom.innerHTML += "<span class='Bombardment'>" + info + "</span>";
    }

    if (dataCloned.SpaceCannon) {

        let info = "Space cannon " + createModifiedHitText(dataCloned.SpaceCannon, dataCloned.SpaceCannonDice);

        featuresDom.innerHTML += "<span class='SpaceCannon'>" + info + "</span>";
    }

    wrapper.appendChild(domCloned);

    return domCloned;
}

function createCommonRollState(diceState, idPrefix) {

    let html = "";
    let hitCount = 0;

    for (let i = 0; i < diceState.length; i++) {

        let domID = idPrefix + "_" + i;

        html += "<span class='Roll' id='" + domID + "'>" + diceState[i].value + "</span>";

        if (i < diceState.length - 1) html += ", ";

        if (diceState[i].isHit) hitCount++;
    }

    html += " (<span class='HitCount'>" + hitCount + "</span> Hits)";

    return { html: html, hitCount: hitCount };
}

function createFactionIcon(factionID) {

    let factionDom = document.createElement("span");
    factionDom.classList.add("FactionIcon");
    factionDom.dataset.faction = factionID;

    return factionDom;
}

function createModifiedHitText(hitValue, numberOfDices) {

    let temp = hitValue;

    if (numberOfDices) temp += " (x" + numberOfDices + ")";

    return temp;
}


function loadState() {

    let temp = localStorage.getItem('inventory');
    let inventoryObject = temp;

    if (temp) {

        inventory = JSON.parse(temp);

        factionID = inventory.factionAbilities[0].FactionID;

        //todo: remap data objects?

        let isCodex = localStorage.getItem('isCodex');
        codexCb.checked = isCodex;
        
        createDataset_setCodex();
        createDataset_setExhaustable();
        createDataset_setPurgable();
    }

    temp = localStorage.getItem('unitState');

    if (temp) {

        let unitState = JSON.parse(temp);

        //dont like this
        setTimeout(function () {

            let inputList = document.querySelectorAll("#combatWrapper [data-unit-id]");

            for (let i = 0; i < unitState.length; i++) {

                for (let ii = 0; ii < inputList.length; ii++) {

                    let targetInput = inputList[ii];

                    if (targetInput.dataset.unitId == unitState[i].unitID) {

                        targetInput.querySelector(".UnitCount").value = unitState[i].value;

                        break;
                    }
                }
            }

            dataBindCombat.prototype.showHideActions();

        }, 200);
    }

    temp = localStorage.getItem('tokenState');

    if (temp) {

        let tokenState = JSON.parse(temp);

        document.getElementById("commandsTb").value = tokenState.commands;
        document.getElementById("fleetTb").value = tokenState.fleet;
        document.getElementById("strategyTb").value = tokenState.strategy;
        document.getElementById("comodityTb").value = tokenState.comodity;
        document.getElementById("tradegoodTb").value = tokenState.tradegood;
    }

    temp = localStorage.getItem('raceState');

    if (temp) {

        let raceState = JSON.parse(temp);

        let i = 0;

        //dont like this
        setTimeout(function () {
            document.querySelectorAll(".RaceDdl").forEach(x => {

                x.value = raceState[i];

                let event = new Event("change");
                event.preventSaveState = true;
                x.dispatchEvent(event);

                ++i;
            });
        }, 200);
    }

    return inventoryObject;
}

function saveState(inventoryOnly) {

    let combatInputList = document.querySelectorAll("#combatWrapper [data-unit-id]");

    let unitState = [];

    for (let i = 0; i < combatInputList.length; i++) {

        let unitID = combatInputList[i].dataset.unitId;
        let value = combatInputList[i].querySelector(".UnitCount").value;

        let temp = { unitID: unitID, value: value };

        unitState.push(temp);
    }

    let tokenState = {

        commands: document.getElementById("commandsTb").value,
        fleet: document.getElementById("fleetTb").value,
        strategy: document.getElementById("strategyTb").value,
        comodity: document.getElementById("comodityTb").value,
        tradegood: document.getElementById("tradegoodTb").value
    }

    let raceState = []
    document.querySelectorAll(".RaceDdl").forEach(x => raceState.push(x.value));

    localStorage.setItem('inventory', JSON.stringify(inventory));

    if (!inventoryOnly) {

        localStorage.setItem('unitState', JSON.stringify(unitState));
        localStorage.setItem('tokenState', JSON.stringify(tokenState));
        localStorage.setItem('raceState', JSON.stringify(raceState));
    }

    localStorage.setItem('isCodex', JSON.stringify(codexCb.checked));
}

function clearState() {

    localStorage.clear();
}




function initTemplates() {

    if (summaryItem == null) {

        summaryItem = document.querySelector("#summaryPage .Template");
        summaryItem.remove();
    }

    if (unitItem == null) {

        unitItem = document.querySelector("#unitPage .Template");
        unitItem.remove();
    }

    if (combatTemplate === null) {

        combatTemplate = document.querySelector("#combatPage .Template");
        combatTemplate.remove();

        rollTemplate = document.querySelector("#combatPage .RollTemplate");
        rollTemplate.remove();
    }

    if (!technologyTemplate) {

        technologyTemplate = document.querySelector("#technologyPage .Template");
        technologyTemplate.remove();
    }

    if (promissoryNoteTemplate == null) {

        promissoryNoteTemplate = document.querySelector("#promissoryPage .Template");
        promissoryNoteTemplate.remove();
    }

    if (leaderItem == null) {

        leaderItem = document.querySelector("#leaderPage .Template");
        leaderItem.remove();
    }

    if (relicItem == null) {

        relicItem = document.querySelector("#relicPage .Template");
        relicItem.remove();
    }

    if (agendaItem == null) {

        agendaItem = document.querySelector("#agendaPage .Template");
        agendaItem.remove();
    }

    if (!planetTemplate) {

        planetTemplate = document.querySelector("#planetsPage .Template");
        planetTemplate.remove();

        planetTemplateEditor = document.querySelector("#planetsPage .TemplateEditor");
        planetTemplateEditor.remove();

        legendaryPlanetTemplate = document.querySelector("#planetsPage .LegendaryPlanetTemplate");
        legendaryPlanetTemplate.remove();

        pendingPlanetTemplate = document.querySelector("#planetsPage .PendingPlanetTemplate");
        pendingPlanetTemplate.remove();

        unitPiceListTbl = document.querySelector(".UnitPiceListTbl");
        unitPiceListTblTemplate = unitPiceListTbl.querySelector(".Template")
        unitPiceListTblTemplate.remove();
    }
}

function initNavigation() {

    let currentPageDom = null;

    function navigationDdl_onChange() {

        let targetPageId = this.value;

        setActivePage(targetPageId, this.parentNode);
    }

    function navLink_click(e) {

        let targetPageId = this.dataset.page;
        navigationDdl.selectedIndex = 0;

        setActivePage(targetPageId, this);
    }

    function setActivePage(targetPageId, initatorDom) {

        let activeNavDom = document.querySelector(".TabControl .Active");
        if (activeNavDom) activeNavDom.classList.remove("Active");

        initatorDom.classList.add("Active");

        if (currentPageDom) currentPageDom.classList.remove("Active");
        currentPageDom = document.getElementById(targetPageId);

        if (currentPageDom) currentPageDom.classList.add("Active");
    }

    let navigationDdl = document.getElementById("navigationDdl");

    if (!navigationDdl.isSet) {

        navigationDdl.addEventListener("change", navigationDdl_onChange);
        //navigationDdl_onChange.bind(navigationDdl)(); //select DDL page
        navigationDdl.isSet = true;
    }

    let navLinks = document.querySelectorAll(".TabControl [data-page]");

    for (var i = 0; i < navLinks.length; i++) {

        if (navLinks[i].isSet) continue;

        navLinks[i].isSet = true;
        navLinks[i].addEventListener("click", navLink_click);

        //select first page
        if (i === 0) {
            navLink_click.bind(navLinks[i])();
        }
    }
}

function setupStartPage() {

    var contentWrapper = null;
    var unitWrapper = null;

    function factionDdl_onChange(e) {

        factionID = parseInt(this.value);

        let dataWrapper = document.querySelector("#startPage .DataWrapper");
        let summaryWrapper = document.querySelector("#startPage .SummaryWrapper");
        let flavorWrapper = document.querySelector("#startPage .FlavorWrapper");
        contentWrapper = document.querySelector("#startPage .ContentWrapper");
        unitWrapper = document.querySelector("#startPage .UnitWrapper");

        if (factionID) {

            let faction = factions.find(x => x.FactionID === factionID);

            dataBindFactionPreview(faction, summaryWrapper, contentWrapper, unitWrapper, flavorWrapper);

            dataWrapper.classList.add("Active");
        }
        else {

            dataWrapper.classList.remove("Active");
        }
    }

    function unpackBtn_click(e) {

        startPageDom.remove();

        createDataset(factionID);

        saveState(true);

        setupAll();
    }

    if (!startPageDom) {

        startPageDom = document.getElementById("startPage");

        let factionDdl = document.getElementById("factionDdl");
        factionDdl.addEventListener("change", factionDdl_onChange);

        let unpackBtn = document.getElementById("unpackBtn");
        unpackBtn.addEventListener("click", unpackBtn_click);

        for (let i = 0; i < factions.length; i++) {

            let optionDom = document.createElement("option");
            optionDom.innerHTML = factions[i].Name;
            optionDom.value = factions[i].FactionID;

            factionDdl.appendChild(optionDom);
        }
    }

    let bodyDom = document.querySelector("body");
    bodyDom.classList.add("StartMode");
    bodyDom.prepend(startPageDom);
    bodyDom.style.removeProperty("padding-top");

    document.getElementById("commandsTb").value = 3;
    document.getElementById("fleetTb").value = 3;
    document.getElementById("strategyTb").value = 2;
    document.getElementById("comodityTb").value = 0;
    document.getElementById("tradegoodTb").value = 0;

    let hitWrapper = document.querySelector(".HitWrapper");
    hitWrapper.innerHTML = "";

    factionDdl.selectedIndex = 0;
    factionDdl.dispatchEvent(new Event('change'));

    manageDisplayTogglers();
}

function setupAll() {

    document.querySelector("body").classList.remove("StartMode");

    initNavigation();

    dataBindCombat();

    dataBindTopMenu();

    dataBindPlanets();

    dataBindTechs();

    dataBindPromissory();

    dataBindLeaders();

    dataBindRelics();

    dataBindAgenda();

    dataBindUnits();

    dataBindSummary();

    dataBindGame();

    manageMinusPlus(document);

    manageConfirmationClick();

    manageDisplayTogglers();
}




function manageConfirmationClick(target) {

    if (overlayDom === null) {

        overlayDom = document.querySelector(".Overlay");
        overlayDom.remove();

        confirmationDialogDom = document.querySelector(".ConfirmationDialog");
        confirmationDialogDom.remove();
        confirmationDialogDom.querySelector(".ConfirmBtn").addEventListener("click", confirmBtn_click);
        confirmationDialogDom.querySelector(".CancelBtn").addEventListener("click", cancelBtn_click);
    }

    if (target) {

        setTriggerNode([target]);
    }
    else {

        setTriggerNode(document.querySelectorAll(".ConfirmationTrigger"));
    }

    function setTriggerNode(triggers) {

        for (let i = 0; i < triggers.length; i++) {

            if (triggers[i].isConfirmationSet) continue;

            let cloned = triggers[i].cloneNode(true);
            cloned.originalNode = triggers[i];
            cloned.addEventListener("click", raiseDialogDom_click);
            cloned.isConfirmationSet = true;

            triggers[i].replaceWith(cloned);
        }
    }

    function confirmBtn_click(e) {

        window.confirmationTarget.click();

        confirmationDialogDom.remove();

        overlayDom.remove();
    }

    function cancelBtn_click(e) {

        confirmationDialogDom.remove();

        overlayDom.remove();
    }

    function raiseDialogDom_click(e) {

        document.body.appendChild(overlayDom);
        document.body.appendChild(confirmationDialogDom);

        let message = this.originalNode.dataset.text;

        confirmationDialogDom.querySelector(".Heading").innerHTML = message;

        window.confirmationTarget = this.originalNode;
    }
}

function manageDisplayTogglers() {

    let domList = document.querySelectorAll("*[data-display-toggler]");

    for (let i = 0; i < domList.length; i++) {

        if (domList[i].isSet) continue;

        domList[i].addEventListener("click", toggler_click);
        domList[i].isSet = true;
    }

    function toggler_click(e) {

        if (this.classList.contains("Active")) {

            this.classList.remove("Active")
        }
        else {

            this.classList.add("Active")
        }
    }
}

function manageCombatTrigger(dom, e_rollState, rollIndex, finalizeDelegate) {

    function modifyRollState(callback, timeout) {

        let array = window.activeRollState.diceState;

        if (window.activeRollIndex !== -1) {

            array = [window.activeRollState.diceState[window.activeRollIndex]];
        }

        for (let i = 0; i < array.length; i++) {

            let targetSlot = array[i];

            callback(targetSlot);

            if (targetSlot.value < 1) targetSlot.value = 0;
            else if (targetSlot.value > 10) targetSlot.value = 10;

            targetSlot.isHit = targetSlot.value >= window.activeRollState.hitValue;
        }

        if (timeout) {

            if (window.activeRollIndex === -1) {

                let rollslotsDom = document.querySelectorAll("#" + window.activeRollDomID + " ~ .RollsWrapper .Roll");

                for (let i = 0; i < rollslotsDom.length; i++) {

                    rollslotsDom[i].innerHTML = "-";
                }
            }
            else {

                document.getElementById(window.activeRollDomID).innerHTML = "-";
            }

            setTimeout(function () {

                window.activeFinalizeDelegate();

                document.getElementById(window.activeRollDomID).classList.add("Selected");

            }, timeout);
        }
        else {

            window.activeFinalizeDelegate();

            document.getElementById(window.activeRollDomID).classList.add("Selected");
        }
    }

    function document_click(e) {

        let wrapper = e.target.closest(".RollModifierTemplate");

        if (!wrapper) {

            rollModifierTemplate.remove();

            //let selected = document.querySelector(".Roll.Selected");
            let selected = document.querySelector(".Selected"); //beaware
            if (selected) selected.classList.remove("Selected");

            document.removeEventListener("click", document_click);
        }
    }

    function dom_click(e) {

        if (this.classList.contains("Selected")) {

            this.classList.remove("Selected");

            rollModifierTemplate.remove();

            document.removeEventListener("click", document_click);

            return;
        }

        document.addEventListener("click", document_click);

        e.stopPropagation();

        //let selected = document.querySelector(".Roll.Selected");
        let selected = document.querySelector(".Selected"); //beaware
        if (selected) selected.classList.remove("Selected");
        
        document.body.appendChild(rollModifierTemplate);

        window.activeRollState = e_rollState;
        window.activeRollIndex = rollIndex;
        window.activeRollDomID = this.id;
        window.activeFinalizeDelegate = finalizeDelegate;

        this.classList.toggle("Selected");

        let rect = this.getBoundingClientRect();

        rollModifierTemplate.style.display = "";

        let rollModifierTemplate_box = rollModifierTemplate.getBoundingClientRect();
        let rollModifierTemplate_width = rollModifierTemplate_box.width;

        let left = rect.left - ((rollModifierTemplate_width - rect.width) / 2);
        if (left < 0) left = rect.left;

        let top = rect.bottom - 1 + window.scrollY;

        rollModifierTemplate.style.top = top + "px";
        rollModifierTemplate.style.left = left + "px";
    }

    function minusBtn_click(e) {

        modifyRollState(function (data) { data.value--; });
    }

    function plusBtn_click(e) {

        modifyRollState(function (data) { data.value++; });
    }

    function rerollBtn_click(e) {

        modifyRollState(function (data) { data.value = rollDice(); }, 300);
    }

    if (!rollModifierTemplate) {

        rollModifierTemplate = document.querySelector(".RollModifierTemplate");
        rollModifierTemplate.querySelector(".MinusBtn").addEventListener("click", minusBtn_click);
        rollModifierTemplate.querySelector(".PlusBtn").addEventListener("click", plusBtn_click);
        rollModifierTemplate.querySelector(".RerollBtn").addEventListener("click", rerollBtn_click);
    }

    dom.addEventListener("click", dom_click);
}

function manageExhaustable(dom, data, forceRemoval) {

    function exhaustBtn_click(e) {

        let dom = this.dom;

        let data = this.data;
        data.IsExhausted = !data.IsExhausted;

        let dataID = parseInt(dom.dataset.id);
        let dataType = dom.dataset.type;
        let templateList = document.querySelectorAll("[data-type='" + dataType + "'][data-id='" + dataID + "']");

        if (data.IsExhausted) {

            templateList.forEach(x => x.classList.add("Exhausted"));
        }
        else {

            templateList.forEach(x => x.classList.remove("Exhausted"));
        }

        saveState();
    }

    if (data.IsExhausted) dom.classList.add("Exhausted");

    let exhaustBtn = dom.querySelector(".ExhaustBtn");

    if (exhaustBtn && !exhaustBtn.isSet) {

        if (!data.IsExhaustable || forceRemoval) {

            exhaustBtn.remove();
        }
        else {

            exhaustBtn.isSet = true;

            exhaustBtn.addEventListener("click", function (e) {

                exhaustBtn_click.bind({ dom: dom, data: data })(e);
            })
        }
    }
}

function managePurgable(dom, data, purgedWrapper) {

    function purgeBtn_click(e) {

        let dom = this.dom;

        let data = this.data;
        data.IsPurged = true;

        let dataID = parseInt(dom.dataset.id);
        let dataType = dom.dataset.type;

        let summaryItem = document.querySelector("#summaryPage [data-type='" + dataType + "'][data-id='" + dataID + "']");
        summaryItem.remove();

        dom.remove();
        dom.querySelectorAll("input").forEach(x => x.remove());
        purgedWrapper.appendChild(dom);

        saveState();
    }

    let purgeBtn = dom.querySelector(".PurgeBtn");

    if (purgeBtn && !purgeBtn.isSet) {

        if (!data.IsPurgable) {

            purgeBtn.remove();
        }
        else {

            purgeBtn.isSet = true;
            purgeBtn.dataset.text = "Purge this card";
            purgeBtn.addEventListener("click", function (e) {

                purgeBtn_click.bind({ dom: dom, data: data })(e);
            });

            manageConfirmationClick(purgeBtn);
        }
    }
}

function manageMinusPlus(e_dom) {

    let dom = e_dom.querySelectorAll(".MinusPlusAction");

    function minusBtn_click(e) {

        let value = parseInt(this.textbox.value);
        value--;

        appendTbValue(this.textbox, value);
    }

    function plusBtn_click(e) {

        let value = parseInt(this.textbox.value);
        value++;

        appendTbValue(this.textbox, value);
    }

    function appendTbValue(textbox, value) {

        if (textbox.min) {

            let min = parseInt(textbox.min);
            if (value < min) value = min;
        }

        if (textbox.max) {

            let max = parseInt(textbox.max);
            if (value > max) value = max;
        }

        let event = new Event('change');

        textbox.value = value;
        textbox.dispatchEvent(event);
    }

    for (let i = 0; i < dom.length; i++) {

        let minusBtn = dom[i].querySelector(".MinusBtn");
        let plusBtn = dom[i].querySelector(".PlusBtn");
        let textbox = dom[i].querySelector("[type='number']");

        if (plusBtn.textbox == null) {

            textbox.addEventListener("focus", function () { this.select(); });

            plusBtn.textbox = textbox;
            minusBtn.textbox = textbox;

            minusBtn.addEventListener("click", minusBtn_click);
            plusBtn.addEventListener("click", plusBtn_click);
        }
    }
}

function getUnitTypeTitle(id) {

    for (var key in unitTypeEnum) {

        if (unitTypeEnum[key] == id) return key;
    }
}

function getColor(item) {

    var temp = "";

    if (item.IsBlue) temp += "Blue";
    if (item.IsRed) temp += "Red";
    if (item.IsGreen) temp += "Green";
    if (item.IsYellow) temp += "Yellow";

    return temp;
}

function sortUnits(array) {

    array.sort((a, b) => { return a.UnitTypeID < b.UnitTypeID ? -1 : 1 });
}

function removeFromArray(array, item) {

    const index = array.indexOf(item);

    if (index > -1) {

        array.splice(index, 1);
    }
}

function removeAllButFirst(dom) {

    while (dom.children.length > 1) {

        dom.removeChild(dom.children[1]);
    }
}

function dataBindDom(dom, object) {

    for (let key in object) {

        let target = dom.querySelector("*[data-field='" + key + "']");

        if (target) target.innerHTML = object[key];
    }
}

function generateRollState(dataArray, rollDefinitionDelegate, rollModifier, includePlasmaScoring) {

    let getPlasmaScoringValueDelegate = function (dataProvider) {

        let plasmaScoringValue = 100;
        let plasmaScoringUnitID = 0;

        for (let i = 0; i < inventory.units.length; i++) {

            let definition = dataProvider(inventory.units[i]);
            let definition_value = definition.hitValue;

            if (!definition.breakFlag && definition_value && definition_value < plasmaScoringValue) {

                plasmaScoringValue = definition_value;

                plasmaScoringUnitID = inventory.units[i].UnitID;
            }
        }

        let temp = {
            unitID: plasmaScoringUnitID,
            value: plasmaScoringValue
        };

        return temp;
    }

    let temp = [];

    let combatModifier = rollModifier;

    let plasmaScoringData = null;

    if (includePlasmaScoring) {

        let isPlasmaScoringResearched = inventory.technologies.some(x => x.TechnologyID === 13);

        if (isPlasmaScoringResearched) {

            plasmaScoringData = getPlasmaScoringValueDelegate(rollDefinitionDelegate);
        }
    }

    for (let i = 0; i < dataArray.length; i++) {

        let data = dataArray[i].data;
        let unitCount = dataArray[i].unitCount;

        let definition = rollDefinitionDelegate(data);

        if (unitCount === 0 || definition.breakFlag) continue;

        let diceCount = definition.diceCount;
        let hitValue = definition.hitValue;

        let diceState = rollForAbility(unitCount, diceCount, hitValue, combatModifier);

        if (plasmaScoringData && plasmaScoringData.unitID === data.UnitID) {

            let additionalDiceState = rollForAbility(1, 1, plasmaScoringData.value, combatModifier);

            diceState.push(additionalDiceState[0]);
        }

        temp.push({ data: data, diceState: diceState, hitValue: hitValue });
    }

    return { rollState: temp, isPlasmaScoring: plasmaScoringData !== null };
}




function rollDice() {

    let sides = 10;

    let number = Math.floor(Math.random() * sides) + 1;

    return number;
}

function rollDices(number) {

    let temp = [];

    for (let i = 0; i < number; i++) {

        temp.push(rollDice());
    }

    return temp;
}

function rollForAbility(numberOfUnits, dicePerUnit, hitValue, modifier) {

    modifier = modifier ?? 0;

    let totalDiceCount = dicePerUnit ? dicePerUnit * numberOfUnits : numberOfUnits;

    let rollState = rollDices(totalDiceCount);

    let temp = rollState.map(x => {

        let modifiedValue = x + modifier;

        if (modifiedValue > 10) modifiedValue = 10;
        else if (modifiedValue < 1) modifiedValue = 1;

        return { value: modifiedValue, isHit: modifiedValue >= hitValue };
    });

    return temp;
}




function dataBindFactionPreview(faction, summaryWrapper, contentWrapper, unitWrapper, flavorWrapper) {

    function formatTitle(value) {

        //omega is not escaped?
        return value.replaceAll(" Ω", "");

        return value.replaceAll(" &#8486;", "");
    }

    function formatDataChuncks(summary) {

        let factionID = faction.FactionID;
        
        let leaders2 = leaders.filter(x => x.FactionID === factionID);
        let factionUnits = units.filter(x => x.FactionID === factionID);
        let mech = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Mech; });
        let flagship = units.filter(function (item) { return item.FactionID === factionID && item.UnitTypeID === unitTypeEnum.Flagship; });
        let techs = technologies.filter(x => x.FactionID === factionID);
        let pn = promissoryNotes.filter(x => x.FactionID === factionID);

        let value = summary.replaceAll('\r\n', '<br />');
        value = value.replaceAll("[Flagship]", "<span class='Flagship' data-function='getUnitById(" + flagship[0].UnitID + ")'>Flagship</span>");
        value = value.replaceAll("[Mech]", "<span class='Mech' data-function='getUnitById(" + mech[0].UnitID + ")'>Mech</span>");

        for (let i = 0; i < techs.length; i++) {

            if (techs[i].Title) {

                let color = getColor(techs[i]);
                color = "Unit " + color;

                let html = "<span data-function='getTechnologyById(" + techs[i].TechnologyID + ")' class='" + color + "'>Faction Technology</span>";

                let finalTitle = formatTitle(techs[i].Title);

                value = value.replaceAll("[" + finalTitle + "]", html);
            }
        }

        for (let i = 0; i < factionUnits.length; i++) {

            let unitTypeStr = getUnitTypeTitle(factionUnits[i].UnitTypeID);

            let html = "<span data-function='getUnitById(" + factionUnits[i].UnitID + ")' class='Unit'>Faction " + unitTypeStr + "</span>";

            value = value.replaceAll("[" + factionUnits[i].Title + "]", html);
        }

        for (let i = 0; i < pn.length; i++) {

            let finalTitle = formatTitle(pn[i].Title);

            value = value.replaceAll("[" + finalTitle + "]", "<span class='PromissoryNote' data-function='getPromissoryNoteById(" + pn[i].PromissoryNoteID + ")'>Promissory Note</span>");
        }

        for (let i = 0; i < leaders2.length; i++) {

            var leaderLevel = "";
            if (leaders2[i].Level === 1) leaderLevel = "Agent";
            if (leaders2[i].Level === 2) leaderLevel = "Commander";
            if (leaders2[i].Level === 3) leaderLevel = "Hero";

            value = value.replaceAll("[" + leaders2[i].Title + "]", "<span class='Leader' data-function='getLeaderById(" + leaders2[i].LeaderID + ")'>" + leaderLevel + "</span>");
        }

        return value;
    }

    function databindRecord(dataObject, source, creationDelegate) {

        let domCloned = summaryItem.cloneNode(true);

        let inputList = domCloned.querySelectorAll("input");
        inputList.forEach(x => x.remove());

        let dataCloned = { ...dataObject };

        if (creationDelegate) {

            creationDelegate(dataCloned);
        }
        else {

            dataCloned.Summary = createCommonSummary(dataCloned);
        }

        dataCloned.Source = source;

        dataBindDom(domCloned, dataCloned);

        contentWrapper.appendChild(domCloned);
    }
    
    let summaryFormatted = formatDataChuncks(faction.Summary);
    summaryFormatted = "<div class='Complexity n" + faction.Complexity + "'></div>" + summaryFormatted;
    summaryWrapper.innerHTML = summaryFormatted;

    if (flavorWrapper) {

        let flavorText = faction.FlavorText.replaceAll('\r\n', '<br />');
        flavorWrapper.innerHTML = flavorText;
    }

    contentWrapper.innerHTML = null;
    unitWrapper.innerHTML = null;

    let abilities = factionAbilities.filter(x => x.FactionID === factionID);
    let factionTechs = technologies.filter(x => x.FactionID === factionID);
    let factionLeaders = leaders.filter(x => x.FactionID === factionID);
    let factionPns = promissoryNotes.filter(x => x.FactionID === factionID);
    let factionPlanets = planets.filter(x => x.FactionID === factionID);
    let factionUnits = units.filter(x => x.FactionID === factionID);
    let factionStartingUnits = startingUnits.filter(x => x.FactionID === factionID);
    let factionStartingTechnologies = startingTechnologies.filter(x => x.FactionID === factionID);

    let html = "";
    for (let i = 0; i < factionStartingUnits.length; i++) {

        let i_object = units.find(x => x.UnitTypeID === factionStartingUnits[i].UnitTypeID)

        if (i !== 0) html += "; ";
        html += factionStartingUnits[i].Quantity;
        html += " " + i_object.Title;

    }
    databindRecord({ Title: "Units", Passive: html }, "Starting traits");

    html = "";
    for (let i = 0; i < factionStartingTechnologies.length; i++) {

        let i_object = technologies.find(x => x.TechnologyID === factionStartingTechnologies[i].TechnologyID)

        if (i !== 0) html += "; ";
        html += i_object.Title;
    }

    databindRecord({ Title: "Techs", Passive: html }, "Starting traits");

    for (let i = 0; i < abilities.length; i++) {

        databindRecord(abilities[i], "Faction ability");
    }

    for (let i = 0; i < factionPlanets.length; i++) {

        databindRecord(factionPlanets[i], "Home Planet", function (dataCloned) {

            dataCloned.Title = dataCloned.Name
            dataCloned.Summary = "Resources: " + dataCloned.Resources;
            dataCloned.Summary += "; "
            dataCloned.Summary += "Influence: " + dataCloned.Influence;
        });
    }

    for (let i = 0; i < factionTechs.length; i++) {

        if (factionTechs[i].UnitID) continue;

        databindRecord(factionTechs[i], "Technology");
    }

    for (let i = 0; i < factionLeaders.length; i++) {

        let rank = null;

        if (factionLeaders[i].Level === 1) rank = "Agent";
        else if (factionLeaders[i].Level === 2) rank = "Commander";
        else if (factionLeaders[i].Level === 3) rank = "Hero";

        databindRecord(factionLeaders[i], rank + " - Leader");
    }

    for (let i = 0; i < factionPns.length; i++) {

        databindRecord(factionPns[i], "Promissory Note");
    }

    sortUnits(factionUnits);

    for (let i = 0; i < factionUnits.length; i++) {

        let unitData = factionUnits[i];

        let summaryDom = document.createElement("div");
        let clone = createCommonUnitWrapper(unitData, summaryDom, true);

        unitWrapper.appendChild(clone);
    }
}

function dataBindTopMenu() {

    let topMenuDom = document.querySelector(".TopMenu")
    let headingDom = document.querySelector(".TopMenu #factionTitleLbl");
    let comodityTb = document.getElementById("comodityTb");
    let comodityBtn = topMenuDom.querySelector(".ComodityBtn");

    let faction = factions.find(x => x.FactionID === factionID);

    headingDom.classList.remove("Inactive");

    document.getElementById("factionTitleLbl").innerHTML = faction.Name;

    let box = topMenuDom.getBoundingClientRect();
    document.querySelector("body").style.paddingTop = box.height + "px";
    document.querySelector("body").dataset.factionId = factionID;
    document.querySelector(".RaceComodity").innerHTML = faction.Commodities;

    if (window.isTopMenuSet) return;
    window.isTopMenuSet = true;

    function comodityTb_change(e) {

        saveState();
    }

    function comodityBtn_click(e) {

        let comodities = factions.find(x => x.FactionID === factionID).Commodities;
        comodityTb.value = comodities;

        let event = new Event('change');
        comodityTb.dispatchEvent(event);
    }

    function navigationbar_click() {

        if (this.classList.contains("Inactive")) {

            this.classList.remove("Inactive");

            topMenuDom.style.maxHeight = "100%";

            let box = topMenuDom.getBoundingClientRect();
            let headingDomBox = headingDom.getBoundingClientRect();

            document.querySelector("body").style.paddingTop = box.height + "px";
        }
        else {

            this.classList.add("Inactive");

            let box = topMenuDom.getBoundingClientRect();
            let headingDomBox = headingDom.getBoundingClientRect();

            document.querySelector("body").style.paddingTop = headingDomBox.height + 10 + "px";

            topMenuDom.style.maxHeight = headingDomBox.height + "px";
        }
    }
    
    comodityTb.addEventListener("change", comodityTb_change);

    comodityBtn.addEventListener("click", comodityBtn_click);

    headingDom.parentNode.addEventListener("click", navigationbar_click)
}

function dataBindSummary() {

    let passiveWrapper = document.querySelector("#passiveWrapper");
    passiveWrapper.innerHTML = null;

    let activeWrapper = document.querySelector("#activeWrapper")
    activeWrapper.innerHTML = null;

    let unitWrapper = document.querySelector("#unitWrapper");
    unitWrapper.innerHTML = null;

    function databindRecord(data, source) {

        let dataCloned = { ...data };

        let clone = null;

        function createDomElement(text, wrapper) {

            clone = summaryItem.cloneNode(true);
            clone.dataset.type = source;
            if (dataCloned.IsExhausted) clone.classList.add("Exhausted");

            dataCloned.Summary = createCommonSummary2(text);
            dataCloned.Source = source;

            dataBindDom(clone, dataCloned);

            if (dataCloned.FactionID && dataCloned.FactionID != factionID) {

                let factionDom = createFactionIcon(dataCloned.FactionID);

                //clone.querySelector("[data-field='Title']").append(factionDom);
                clone.append(factionDom);
            }

            wrapper.appendChild(clone);

            manageExhaustable(clone, data); //note: don't pass cloned data object!
        }

        if (dataCloned.Passive) {

            createDomElement(dataCloned.Passive, passiveWrapper);
        }

        if (dataCloned.Active || dataCloned.Action) {

            let text = dataCloned.Active ?? dataCloned.Action;
            text = "<span class='ActionLbl'>Action: </span>" + text;

            createDomElement(text, activeWrapper);
        }

        //first member of object is ID usually
        let id = dataCloned[Object.keys(dataCloned)[0]];

        clone.dataset.id = id;

        //note: if data has both active and passive it will return just one

        return clone;
    }

    function createDom() {

        for (let i = 0; i < inventory.factionAbilities.length; i++) {

            databindRecord(inventory.factionAbilities[i], "Faction ability");
        }

        for (let i = 0; i < inventory.technologies.length; i++) {

            //skip unit techs
            if (!inventory.technologies[i].UnitID) databindRecord(inventory.technologies[i], "Technology");
        }

        for (let i = 0; i < inventory.leaders.length; i++) {

            if (inventory.leaders[i].IsUnlocked && !inventory.leaders[i].IsPurged) databindRecord(inventory.leaders[i], "Leader");
        }

        for (let i = 0; i < inventory.promissoryNotes.length; i++) {

            databindRecord(inventory.promissoryNotes[i], "Promissory note");
        }

        for (let i = 0; i < inventory.relics.length; i++) {

            databindRecord(inventory.relics[i], "Relic");
        }

        for (let i = 0; i < inventory.agendas.length; i++) {

            let dataCloned = { ...inventory.agendas[i] };

            dataCloned.Passive = dataCloned.For ?? dataCloned.Effect;

            databindRecord(dataCloned, "Agenda");
        }

        for (let i = 0; i < inventory.planets.length; i++) {

            if (inventory.planets[i].IsLegendary) {

                let dataCloned = { ...inventory.planets[i] };

                let chunks = dataCloned.Ability.split("\r\n");

                dataCloned.Title = chunks[0];
                dataCloned.Passive = chunks[1];

                databindRecord(dataCloned.legendaryObject, "Legendary planet");
            }
        }

        for (let i = 0; i < inventory.units.length; i++) {

            let summary = createCommonSummary(inventory.units[i]);

            if (summary) {

                let domCloned = summaryItem.cloneNode(true);
                domCloned.querySelector(".ExhaustBtn").remove(); //units dont have Exhaust?

                let unitType = getUnitTypeTitle(inventory.units[i].UnitTypeID);

                let dataCloned = { ...inventory.units[i] };
                dataCloned.Summary = summary;
                dataCloned.Source = unitType;

                dataBindDom(domCloned, dataCloned);

                unitWrapper.appendChild(domCloned);
            }
        }
    }

    createDom();
}

function dataBindGame() {

    let raceDdlList = document.querySelectorAll("#gamePage .RaceDdl");

    function databindDdls() {

        for (let i = 0; i < raceDdlList.length; i++) {

            let optionDom = document.createElement("option");
            optionDom.innerHTML = "Unset";
            optionDom.value = -1;

            raceDdlList[i].addEventListener("change", raceDdl_change);
            raceDdlList[i].appendChild(optionDom);

            for (let ii = 0; ii < factions.length; ii++) {

                optionDom = document.createElement("option");
                optionDom.innerHTML = factions[ii].Name;
                optionDom.value = factions[ii].FactionID;

                if (factionID === factions[ii].FactionID) {

                    optionDom.classList.add("UserFaction");
                }

                raceDdlList[i].appendChild(optionDom);
            }

            raceDdlList[i].closest("[data-color]").querySelector(".SummaryBtn").addEventListener("click", summaryBtn_click);
        }
    }

    function summaryBtn_click(e) {

        let targetFactionID = this.closest("[data-color]").querySelector(".RaceDdl").value;

        if (targetFactionID && targetFactionID !== -1) {

            let targetFaction = factions.find(x => x.FactionID == targetFactionID);

            let summaryWrapper = document.querySelector("#gamePage .SummaryWrapper")
            let contentWrapper = document.querySelector("#gamePage .ContentWrapper");
            let unitWrapper = document.querySelector("#gamePage .UnitWrapper");

            dataBindFactionPreview(targetFaction, summaryWrapper, contentWrapper, unitWrapper);

            let summaryLbl = document.querySelector(".SummaryLbl");
            summaryLbl.classList.add("Set");
            summaryLbl.innerHTML = targetFaction.Name + " - Summary";
        }
    }

    function unexhaustAllBtn_click(e) {

        for (let i = 0; i < planets.length; i++) {

            planets[i].IsExhausted = false;

            if (planets[i].legendaryObject && planets[i].legendaryObject.IsExhaustable) planets[i].legendaryObject.IsExhausted = false;
        }

        for (let i = 0; i < technologies.length; i++) {

            if (technologies[i].IsExhaustable) technologies[i].IsExhausted = false;
        }

        for (let i = 0; i < inventory.leaders.length; i++) {

            if (inventory.leaders[i].IsExhaustable) inventory.leaders[i].IsExhausted = false;
        }

        for (let i = 0; i < inventory.promissoryNotes.length; i++) {

            if (inventory.promissoryNotes[i].IsExhaustable) inventory.promissoryNotes[i].IsExhausted = false;
        }

        for (let i = 0; i < relics.length; i++) {

            if (relics[i].IsExhaustable) relics[i].IsExhausted = false;
        }

        dataBindPlanets();

        dataBindTechs();

        dataBindLeaders();

        dataBindPromissory();

        dataBindRelics();

        dataBindSummary();
    }

    function leaveGameBtn_click(e) {

        inventory = {};

        clearState();

        setupStartPage();

        let summaryLbl = document.querySelector(".SummaryLbl");
        summaryLbl.classList.remove("Set");




        //should this be here?
        for (let i = 0; i < leaders.length; i++) {

            if (leaders[i].IsPurgable) leaders[i].IsPurged = false;
        }

        for (let i = 0; i < relics.length; i++) {

            if (relics[i].IsPurgable) relics[i].IsPurged = false;
        }

        document.getElementById("purgedLeaderWrapper").innerHTML = null;
        //no need to clear Exhaustable wrapper?

        //todo: is exhausted? no need for legendary planet obect
        //for (var i = 0; i < planets.length; i++) {

            //planets[i].IsExhausted = false;
        //}
    }

    function raceDdl_change(e) {

        let parentDom = this.closest("[data-color]");
        let summaryBtn = parentDom.querySelector(".SummaryBtn");
        let color = parentDom.dataset.color;

        if (this.value !== "-1") {

            let factionID = parseInt(this.value);

            let colorSlot = selectedRaces.find(x => x.color === color);

            if (colorSlot) {

                colorSlot.factionID = factionID;
            }
            else {

                selectedRaces.push({ color: color, factionID: factionID });
            }

            summaryBtn.classList.add("Active");
        }
        else {

            selectedRaces = [];

            for (let i = 0; i < raceDdlList.length; i++) {
                
                let i_color = raceDdlList[i].closest("[data-color]").dataset.color;

                if (raceDdlList[i].value !== "-1") selectedRaces.push({ color: i_color, factionID: parseInt(raceDdlList[i].value) });
            }

            summaryBtn.classList.remove("Active");
        }

        for (let i = 0; i < raceDdlList.length; i++) {

            for (let ii = 1; ii < raceDdlList[i].children.length; ii++) {

                let ii_value = raceDdlList[i].children[ii].value;
                let isSelected = (selectedRaces.some(x => x.factionID === parseInt(ii_value)));

                if (isSelected) {

                    raceDdlList[i].children[ii].style.display = "none";
                }
                else {

                    raceDdlList[i].children[ii].style.display = "";
                }
            }
        }

        inventory.players = selectedRaces;

        createDataset_setFactionSpecial();

        if (!e.preventSaveState) {

            dataBindPlanets();

            dataBindPromissory();

            dataBindTechs();

            saveState();
        }
    }

    if (raceDdlList[0].options.length === 0) {

        databindDdls();

        let unexhaustAllBtn = document.querySelector(".UnexhaustAllBtn");
        unexhaustAllBtn.addEventListener("click", unexhaustAllBtn_click);

        let leaveGameBtn = document.querySelector(".LeaveGameBtn");
        leaveGameBtn.addEventListener("click", leaveGameBtn_click);
    }
    else {

        document.querySelectorAll("#gamePage .SummaryBtn").forEach(x => x.classList.remove("Active"));

        selectedRaces = [];

        for (let i = 0; i < raceDdlList.length; i++) {

            raceDdlList[i].value = -1;

            for (let ii = 0; ii < raceDdlList[i].options.length; ii++) {

                raceDdlList[i].options[ii].style.display = "";
                raceDdlList[i].options[ii].classList.remove("UserFaction");

                if (raceDdlList[i].options[ii].value == factionID) {

                    raceDdlList[i].options[ii].classList.add("UserFaction");
                }
            }
        }
    }
}

function dataBindCombat(refresh) {

    var spaceCombatBtn = null;
    var groundCombatBtn = null;
    var fullCombatBtn = null;
    var bombardmentBtn = null;
    var afbBtn = null;
    var scBtn = null;

    function createDom() {

        let currentState = [];

        let combatWrapper = document.querySelector("#combatWrapper");
        combatWrapper.querySelectorAll(":scope>*:not(thead)").forEach(x => {

            x.remove();

            if (refresh) {

                let targetUnit = units.find(y => y.UnitID == x.dataset.unitId);

                if (targetUnit) {

                    let unitCount = x.querySelector(".UnitCount").value;

                    currentState.push({
                        unitTypeID: targetUnit.UnitTypeID,
                        unitCount: unitCount
                    });
                }
            }
        });

        spaceCombatBtn = document.querySelector("#spaceCombatBtn");
        groundCombatBtn = document.querySelector("#groundCombatBtn");
        fullCombatBtn = document.querySelector("#fullCombatBtn");
        afbBtn = document.querySelector("#afbBtn");
        scBtn = document.querySelector("#scBtn");
        bombardmentBtn = document.querySelector("#bombardmentBtn");
        
        sortUnits(inventory.units);

        for (let i = 0; i < inventory.units.length; i++) {

            let data = inventory.units[i]

            //skip space dock
            if (data.UnitTypeID === 10) continue;

            let summary = createCommonSummary(inventory.units[i]);

            let clone = combatTemplate.cloneNode(true);

            let unitType = getUnitTypeTitle(inventory.units[i].UnitTypeID);

            let unitClone = { ...inventory.units[i] };
            unitClone.Summary = summary;
            unitClone.Source = unitType;
            unitClone.SpaceCannon = createModifiedHitText(unitClone.SpaceCannon, unitClone.SpaceCannonDice);

            dataBindDom(clone, unitClone);
            
            clone.children[0].dataset.unitId = data.UnitID;
            clone.querySelector(".UnitImage").dataset.unitType = data.UnitTypeID;
            clone.querySelector("h3").innerHTML = data.Title;
            clone.querySelector(".UnitCount").addEventListener("change", unitCount_change);

            if (refresh) {

                let i_state = currentState.find(x => x.unitTypeID === data.UnitTypeID);

                if (i_state) {

                    clone.querySelector(".UnitCount").value = i_state.unitCount;
                }
            }

            if (unitClone.SpaceCannon === 0) clone.querySelector(".SpaceCannonWrapper").remove();
            
            combatWrapper.appendChild(clone.children[0]);
            combatWrapper.appendChild(clone.children[0]);
        }

        if (!spaceCombatBtn.isSet) {

            spaceCombatBtn.isSet = true;

            spaceCombatBtn.addEventListener("click", spaceCombatBtn_click);
            groundCombatBtn.addEventListener("click", groundCombatBtn_click);
            fullCombatBtn.addEventListener("click", fullCombatBtn_click);
            afbBtn.addEventListener("click", afbBtn_click);
            scBtn.addEventListener("click", scBtn_click);
            bombardmentBtn.addEventListener("click", bombardmentBtn_click);

            document.querySelector("#combatDisplayTypeDdl").addEventListener("change", combatDisplayTypeDdl_change);
            document.querySelector("#combatClearBtn").addEventListener("click", combatClearBtn_click);
        }

        combatDisplayTypeDdl_change.bind(document.querySelector("#combatDisplayTypeDdl"))();
        
        manageMinusPlus(combatWrapper);
    }

    function createRollDom(e_rollState) {

        let hitTotal = 0;

        let hitWrapper = document.querySelector(".HitWrapper");
        hitWrapper.innerHTML = "";

        let state = e_rollState.rollState;

        for (let i = 0; i < state.length; i++) {

            let diceState = state[i].diceState;
            let data = state[i].data;
            let hitValue = state[i].hitValue;

            let i_dom = rollTemplate.cloneNode(true);
            i_dom.dataset.unitId = data.UnitID;
            i_dom.dataset.hitValue = hitValue;

            let titleDom = i_dom.querySelector("[data-field='Title']");
            titleDom.id = "unit_" + (i + 1);
            manageCombatTrigger(titleDom, state[i], -1, function () { createRollDom(rollState); });

            dataBindDom(i_dom, data);

            let rollStateProccesed = createCommonRollState(diceState, "rollSlot" + i);
            let html = rollStateProccesed.html;

            hitTotal += rollStateProccesed.hitCount;

            let rollsWrapper = i_dom.querySelector(".RollsWrapper");
            rollsWrapper.innerHTML = html;

            const rollSlots = rollsWrapper.querySelectorAll(".Roll");

            for (let ii = 0; ii < rollSlots.length; ii++) {

                manageCombatTrigger(rollSlots[ii], state[i], ii, function () { createRollDom(rollState); });
            }

            hitWrapper.appendChild(i_dom);

            let addDieBtn = i_dom.querySelector(".AddDieBtn");
            addDieBtn.addEventListener("click", addDieBtn_click);
        }

        let totalDom = document.createElement("div");
        totalDom.innerHTML = "Hits total: " + hitTotal;
        hitWrapper.appendChild(totalDom);

        let plasmaScoringDisplay = e_rollState.isPlasmaScoring ? "block" : "none";
        document.getElementById("plasmaScoringNotification").style.display = plasmaScoringDisplay;
    }

    function createRollState(rollDefinitionDelegate, checkPlasmaScoring) {

        let result = [];

        for (let i = 0; i < inventory.units.length; i++) {

            let data = inventory.units[i];

            let unitCountTb = document.querySelector("#combatWrapper [data-unit-id='" + data.UnitID + "'] .UnitCount");

            if (unitCountTb) {

                let unitCount = parseInt(unitCountTb.value);

                let temp = { data: data, unitCount: unitCount };

                result.push(temp);
            }
        }

        let modifier = getCombatModifier();

        rollState = generateRollState(result, rollDefinitionDelegate, modifier, checkPlasmaScoring);

        createRollDom(rollState);
    }

    function getCombatModifier() {

        let combatModifierTb = document.querySelector("#combatModifierTb");
        let combatModifier = parseInt(combatModifierTb.value);

        return combatModifier;
    }

    function showHideActions() {

        let isSpaceCannon = false;
        let isAfb = false;
        let isBombardment = false;
        let isGroundForce = false;
        let isShip = false;

        for (let i = 0; i < inventory.units.length; i++) {

            let data = inventory.units[i];

            let unitCountTb = document.querySelector("#combatWrapper [data-unit-id='" + data.UnitID + "'] .UnitCount");

            if (unitCountTb) {

                let unitCount = parseInt(unitCountTb.value);

                if (unitCount > 0) {

                    isSpaceCannon |= data.SpaceCannon;
                    isAfb |= data.AntiFighterBarage;
                    isBombardment |= data.Bombardment;
                    isGroundForce |= data.IsGroundForce
                    isShip |= !data.IsGroundForce && !data.IsStructure;
                }
            }
        }

        //scBtn.style.display = isSpaceCannon ? "block" : "none";
        //afbBtn.style.display = isAfb ? "block" : "none";
        //bombardmentBtn.style.display = isBombardment ? "block" : "none";
        //groundCombatBtn.style.display = isGroundForce ? "block" : "none";
        //spaceCombatBtn.style.display = isShip ? "block" : "none";
        //fullCombatBtn.style.display = isShip && isGroundForce ? "block" : "none";

        (isSpaceCannon ? scBtn.classList.add : scBtn.classList.remove).call(scBtn.classList, "Active");
        (isAfb ? scBtn.classList.add : afbBtn.classList.remove).call(afbBtn.classList, "Active");
        (isBombardment ? bombardmentBtn.classList.add : bombardmentBtn.classList.remove).call(bombardmentBtn.classList, "Active");
        (isGroundForce ? groundCombatBtn.classList.add : groundCombatBtn.classList.remove).call(groundCombatBtn.classList, "Active");
        (isShip ? spaceCombatBtn.classList.add : spaceCombatBtn.classList.remove).call(spaceCombatBtn.classList, "Active");
        (isShip && isGroundForce ? fullCombatBtn.classList.add : fullCombatBtn.classList.remove).call(fullCombatBtn.classList, "Active");
    }

    function combatDisplayTypeDdl_change(e) {

        let displayType = this.value; //0 thumb, 1 list

        displayTypeName = displayType == 0 ? "Thumbs" : "List";

        let dom = document.querySelector("#combatWrapper");
        dom.classList.remove("Thumbs");
        dom.classList.remove("List");
        dom.classList.add(displayTypeName);
    }

    function unitCount_change(e) {

        showHideActions();

        saveState();
    }

    function combatClearBtn_click(e) {

        let domList = document.querySelectorAll("#combatPage .UnitCount");

        for (let i = 0; i < domList.length; i++) {

            domList[i].value = 0;
        }

        unitCount_change(null);
    }

    function addDieBtn_click(e) {

        let unitID = parseInt(this.closest("[data-unit-id]").dataset.unitId);
        let hitValue = parseInt(this.closest("[data-unit-id]").dataset.hitValue);

        let combatModifier = getCombatModifier();

        let addDiceState = rollForAbility(1, 1, hitValue, combatModifier)[0];

        let rollStateSlot = rollState.rollState.find(x => x.data.UnitID === unitID);
        rollStateSlot.diceState.push(addDiceState);

        createRollDom(rollState);
    }

    function spaceCombatBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.CombatDice ?? 1,
                hitValue: data.Combat,
                breakFlag: data.IsGroundForce || data.IsStructure
            }

            return temp;
        }

        createRollState(definitionDelegate);
    }

    function groundCombatBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.CombatDice ?? 1,
                hitValue: data.Combat,
                breakFlag: !data.IsGroundForce || data.IsStructure
            }

            return temp;
        }

        createRollState(definitionDelegate);
    }

    function fullCombatBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.CombatDice ?? 1,
                hitValue: data.Combat,
                breakFlag: data.IsStructure
            }

            return temp;
        }

        createRollState(definitionDelegate);
    }

    function afbBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.AntiFighterBarageDice ?? 1,
                hitValue: data.AntiFighterBarage,
                breakFlag: !data.AntiFighterBarage || data.AntiFighterBarage === 0
            }

            return temp;
        }

        createRollState(definitionDelegate);
    }

    function scBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.SpaceCannonDice ?? 1,
                hitValue: data.SpaceCannon,
                breakFlag: !data.SpaceCannon || data.SpaceCannon === 0
            }

            return temp;
        }

        createRollState(definitionDelegate, true);
    }

    function bombardmentBtn_click(e) {

        function definitionDelegate(data) {

            let temp = {
                diceCount: data.BombardmentDice ?? 1,
                hitValue: data.Bombardment,
                breakFlag: !data.Bombardment || data.Bombardment === 0
            }

            return temp;
        }

        createRollState(definitionDelegate, true);
    }

    createDom();

    showHideActions();

    dataBindCombat.prototype.showHideActions = showHideActions;
}

function dataBindPlanets() {

    var dom = document.querySelector("#planetsTbl");
    var selectedRow = null;
    let planetsDdl = document.getElementById("planetsDdl");

    function getPlanetByID(planetID, dataset) {

        if (!dataset) dataset = inventory.planets;

        let planet = dataset.find(x => x.PlanetID === planetID);

        return planet;
    }

    function planetsDdl_onChange(e) {

        let planetID = parseInt(this.value);

        let planet = getPlanetByID(planetID, planets);
        dataBindDom(pendingPlanetTemplate, planet);

        pendingPlanetTemplate.dataset.id = planetID;

        let traitsTd = pendingPlanetTemplate.querySelector(".PlanetTraits");
        traitsTd.innerHTML = null;

        let techTd = pendingPlanetTemplate.querySelector(".Technology");
        techTd.innerHTML = null;

        let factionDom = pendingPlanetTemplate.querySelector('[data-field="Name"]');
        delete factionDom.dataset.factionId;


        let traitName = getTraitName(planet);

        if (traitName) {

            let traitDom = document.createElement("span");
            traitDom.classList.add("PlanetTrait");
            traitDom.classList.add(traitName);

            
            traitsTd.appendChild(traitDom);
            traitsTd.innerHTML += " " + traitName;
        }

        if (planet.FactionID) {

            factionDom.dataset.factionId = planet.FactionID;
        }

        let techSpecs = getTechSpecs(planet);

        for (let ii = 0; ii < techSpecs.length; ii++) {

            let techDom = document.createElement("span");
            techDom.classList.add("Requirement");
            techDom.classList.add(techSpecs[ii]);

            
            techTd.appendChild(techDom);
        }

        if (planet.IsLegendary) {

            pendingPlanetTemplate.classList.add("Legendary");
        }
        else {

            pendingPlanetTemplate.classList.remove("Legendary");
        }


        document.querySelector(".PendingPlanet").appendChild(pendingPlanetTemplate);
    }

    function modifierControl_onChange() {

        const targetTd = dom.querySelector("tbody tr:nth-child(" + (selectedRow + 1) + ")");
        let planetEditorResourcesTb = planetTemplateEditor.querySelector("#planetEditorResourcesTb");
        let planetEditorInfluenceTb = planetTemplateEditor.querySelector("#planetEditorInfluenceTb");
        let planetEditorGreenCb = planetTemplateEditor.querySelector("#planetEditorGreenCb");
        let planetEditorBlueCb = planetTemplateEditor.querySelector("#planetEditorBlueCb");
        let planetEditorRedCb = planetTemplateEditor.querySelector("#planetEditorRedCb");
        let planetEditorYellowCb = planetTemplateEditor.querySelector("#planetEditorYellowCb");

        let planetID = parseInt(targetTd.dataset.id);

        let planet = getPlanetByID(planetID);

        let res = parseInt(planetEditorResourcesTb.value);
        let inf = parseInt(planetEditorInfluenceTb.value);
        let isGreen = planetEditorGreenCb.checked;
        let isBlue = planetEditorBlueCb.checked;
        let isRed = planetEditorRedCb.checked;
        let isYellow = planetEditorYellowCb.checked;

        if (planet.modifier) {

            //planet.modifier.IsGreen = isGreen;
            //planet.modifier.IsBlue = isBlue;
            //planet.modifier.IsRed = isRed;
            //planet.modifier.IsYellow = isYellow;

            planet.Resources -= planet.modifier.Resources;
            planet.Influence -= planet.modifier.Influence;
        }
        else {

            planet.modifier = {};
        }

        planet.modifier.Technology = []
        planet.modifier.Resources = res;
        planet.modifier.Influence = inf;

        if (isGreen) planet.modifier.Technology.push("Green");
        if (isBlue) planet.modifier.Technology.push("Blue");
        if (isRed) planet.modifier.Technology.push("Red");
        if (isYellow) planet.modifier.Technology.push("Yellow");

        planet.Resources += planet.modifier.Resources;
        planet.Influence += planet.modifier.Influence;
        //planet.IsGreen = isGreen;
        //planet.IsBlue = isBlue;
        //planet.IsRed = isRed;
        //planet.IsYellow = isYellow;

        createTable();


        let oldRow = selectedRow;
        selectedRow = -1;
        createEditorRow(oldRow);

        dataBindTechs();
    }

    function getTraitName(planet) {

        let traitName = null;

        if (planet.PlanetTraitTypeID == 1) {

            traitName = "Industrial"
        }
        else if (planet.PlanetTraitTypeID == 2) {

            traitName = "Cultural"
        }
        else if (planet.PlanetTraitTypeID == 3) {

            traitName = "Hazardous"
        }

        return traitName;
    }

    function getTechSpecs(planet) {

        let temp = [];

        if (planet.TechnologyColorID || planet.modifier) {

            let techColor = null;

            if (planet.TechnologyColorID === 1) techColor = "Red";
            else if (planet.TechnologyColorID === 2) techColor = "Blue";
            else if (planet.TechnologyColorID === 3) techColor = "Yellow";
            else if (planet.TechnologyColorID === 4) techColor = "Green";

            //let techTd = i_dom.querySelector(".Technology");

            if (techColor) {

                temp.push(techColor);

                //let techDom = document.createElement("span");
                //techDom.classList.add("Requirement");
                //techDom.classList.add(techColor);

                //techTd.appendChild(techDom);
            }

            if (planet.modifier) {

                for (var ii = 0; ii < planet.modifier.Technology.length; ii++) {

                    let modColor = planet.modifier.Technology[ii];

                    if (modColor === techColor) continue;

                    temp.push(modColor);
                }
            }
        }

        return temp;
    }

    function createDDL() {
        
        removeAllButFirst(planetsDdl);

        planets.sort((a, b) => { return a.Name.toLowerCase() < b.Name.toLowerCase() ? -1 : 1 });

        for (let i = 0; i < planets.length; i++) {

            if (planets[i].FactionID && planets[i].FactionID !== factionID) {

                let isPresent = inventory.players.some(x => x.factionID === planets[i].FactionID);

                if (!isPresent) continue;
            }

            if (inventory.planets.indexOf(planets[i]) === -1) {

                let optionDom = document.createElement("option");
                optionDom.innerHTML = planets[i].Name;
                optionDom.value = planets[i].PlanetID;

                planetsDdl.appendChild(optionDom);
            }
        }
    }
    
    function createEditorRow(rowIndex) {

        //note: this is toggle

        //let editorDom = planetTemplateEditor.cloneNode(true);
        let editorDom = planetTemplateEditor;

        if (rowIndex === selectedRow) {

            planetTemplateEditor.remove();

            selectedRow = null;

            return;
        }

        if (!planetTemplateEditor.isInit) {

            let inputDom = editorDom.querySelectorAll("input");

            for (let i = 0; i < inputDom.length; i++) {

                inputDom[i].addEventListener("change", modifierControl_onChange);
            }

            manageMinusPlus(editorDom);

            planetTemplateEditor.isInit = true;
        }

        function databindState() {

            const targetTd = dom.querySelector("tbody tr:nth-child(" + (selectedRow + 1) + ")");
            let planetEditorResourcesTb = planetTemplateEditor.querySelector("#planetEditorResourcesTb");
            let planetEditorInfluenceTb = planetTemplateEditor.querySelector("#planetEditorInfluenceTb");
            let planetEditorGreenCb = planetTemplateEditor.querySelector("#planetEditorGreenCb");
            let planetEditorBlueCb = planetTemplateEditor.querySelector("#planetEditorBlueCb");
            let planetEditorRedCb = planetTemplateEditor.querySelector("#planetEditorRedCb");
            let planetEditorYellowCb = planetTemplateEditor.querySelector("#planetEditorYellowCb");

            let planetID = parseInt(targetTd.dataset.id);

            let planet = getPlanetByID(planetID);

            if (planet.modifier) {

                planetEditorResourcesTb.value = planet.modifier.Resources;
                planetEditorInfluenceTb.value = planet.modifier.Influence;
                planetEditorGreenCb.checked = planet.modifier.Technology.indexOf("Green") !== -1;
                planetEditorBlueCb.checked = planet.modifier.Technology.indexOf("Blue") !== -1;
                planetEditorRedCb.checked = planet.modifier.Technology.indexOf("Red") !== -1;
                planetEditorYellowCb.checked = planet.modifier.Technology.indexOf("Yellow") !== -1;
            }
            else {

                planetEditorResourcesTb.value = 0;
                planetEditorInfluenceTb.value = 0;
                planetEditorGreenCb.checked = false;
                planetEditorBlueCb.checked = false;
                planetEditorRedCb.checked = false;
                planetEditorYellowCb.checked = false;
            }
        }

        const tbody = dom.querySelector("tbody");
        tbody.insertBefore(editorDom, tbody.children[rowIndex + 1]);

        selectedRow = rowIndex;

        databindState();
    }

    function createTable() {

        let tbodyDom = dom.querySelector("tbody");
        tbodyDom.innerHTML = null;

        let legendaryPlanetDom = document.querySelector(".LegendaryPlanet");
        legendaryPlanetDom.innerHTML = null;

        for (let i = 0; i < inventory.planets.length; i++) {

            let i_dom = planetTemplate.cloneNode(true);

            tbodyDom.appendChild(i_dom);






            

            //all planets are Exhaustable; should this be here?
            inventory.planets[i].IsExhaustable = true;
            manageExhaustable(i_dom, inventory.planets[i]);



            dataBindDom(i_dom, inventory.planets[i]);

            let traitName = getTraitName(inventory.planets[i]);

            if (traitName) {

                let traitsTd = i_dom.querySelector(".PlanetTraits");
                let traitDom = document.createElement("span");
                traitDom.classList.add("PlanetTrait");

                traitDom.classList.add(traitName);
                traitsTd.appendChild(traitDom);
                traitsTd.innerHTML += " " + traitName;
            }

            if (inventory.planets[i].FactionID) {

                let factionTd = i_dom.querySelector('[data-field="Name"]');
                factionTd.dataset.factionId = inventory.planets[i].FactionID;
            }

            let techSpecs = getTechSpecs(inventory.planets[i]);

            for (let ii = 0; ii < techSpecs.length; ii++) {

                let techDom = document.createElement("span");
                techDom.classList.add("Requirement");
                techDom.classList.add(techSpecs[ii]);

                let techTd = i_dom.querySelector(".Technology");
                techTd.appendChild(techDom);
            }

            if (inventory.planets[i].IsLegendary) {

                i_dom.classList.add("Legendary");
            }

            //if (inventory.planets[i].IsExhausted) {

            //    i_dom.classList.add("Exhausted");
            //}

            i_dom.dataset.id = inventory.planets[i].PlanetID;
            i_dom.querySelector(".ExhaustBtn").addEventListener("click", exhaustBtn_click);
            i_dom.querySelector(".RemoveBtn").addEventListener("click", removeBtn_click);
            i_dom.querySelector("td:last-child").addEventListener("click", function (e) { e.stopPropagation() });
            i_dom.addEventListener("click", decorateBtn_click);

            if (inventory.planets[i].IsLegendary) {

                let lpClone = legendaryPlanetTemplate.cloneNode(true);
                lpClone.dataset.id = inventory.planets[i].PlanetID;

                dataBindDom(lpClone, inventory.planets[i].legendaryObject);

                manageExhaustable(lpClone, inventory.planets[i].legendaryObject);
                
                legendaryPlanetDom.appendChild(lpClone);
            }
        }

        databindTableFooter();
    }

    function databindTableFooter() {

        let influenceTotal = 0;
        let resourcesTotal = 0;

        let influenceAvailable = 0;
        let resourcesAvailable = 0;

        for (let i = 0; i < inventory.planets.length; i++) {

            influenceTotal += inventory.planets[i].Influence;
            resourcesTotal += inventory.planets[i].Resources;

            if (!inventory.planets[i].IsExhausted) {

                influenceAvailable += inventory.planets[i].Influence;
                resourcesAvailable += inventory.planets[i].Resources;
            }
        }

        dataBindDom(dom.querySelector("tfoot *[data-section='Total']"), {
            "Resources": resourcesTotal,
            "Influence": influenceTotal
        });
        
        dataBindDom(dom.querySelector("tfoot *[data-section='Available']"), {
            "Resources": resourcesAvailable,
            "Influence": influenceAvailable
        });
    }

    function databindPriceList() {

        unitPiceListTbl.querySelector("tbody").innerHTML = null;

        for (var i = 0; i < inventory.units.length; i++) {

            if (inventory.units[i].IsStructure) continue;

            let i_dom = unitPiceListTblTemplate.cloneNode(true);

            unitPiceListTbl.querySelector("tbody").appendChild(i_dom);

            dataBindDom(i_dom, inventory.units[i]);
        }
        
        let isSarweenToolsResearched = inventory.technologies.some(x => x.TechnologyID === 9);

        let stDisplay = isSarweenToolsResearched ? "block" : "none";
        document.getElementById("sarweenToolsNotification").style.display = stDisplay;
    }

    function decorateBtn_click(e) {

        planetTemplateEditor.remove();

        let rowIndex = Array.from(this.parentNode.children).indexOf(this);

        createEditorRow(rowIndex);
    }

    function addBtn_click() {

        let parentDom = this.closest("[data-id]");
        let dataID = parseInt(parentDom.dataset.id)

        let targetPlanet = planets.find(x => x.PlanetID === dataID);
        targetPlanet.IsExhausted = true;

        inventory.planets.push(targetPlanet);

        planetsDdl.remove(planetsDdl.selectedIndex);
        planetsDdl.selectedIndex = 0;

        pendingPlanetTemplate.remove();

        createTable();

        dataBindSummary();

        dataBindTechs();

        saveState();
    }

    function removeBtn_click(e) {

        e.stopPropagation();

        let trDom = this.closest("[data-id]");


        let dataID = parseInt(trDom.dataset.id)

        inventory.planets = inventory.planets.filter(function (obj) { return obj.PlanetID !== dataID; });

        let rowIndex = Array.from(trDom.parentNode.children).indexOf(trDom);

        trDom.remove();

        if (rowIndex === selectedRow) {

            selectedRow = null;

            planetTemplateEditor.remove();
        }

        let legendaryPlanetDom = document.querySelector(".LegendaryPlanet [data-id='" + dataID + "']");
        if (legendaryPlanetDom) legendaryPlanetDom.remove();

        createDDL();

        databindTableFooter();

        dataBindSummary();

        dataBindTechs();

        saveState();
    }

    function exhaustBtn_click(e) {

        e.stopPropagation();

        databindTableFooter();
    }

    createDDL();

    createTable();

    databindPriceList();

    if (!planetsDdl.isSet) {
        
        planetsDdl.addEventListener("change", planetsDdl_onChange);
        planetsDdl.isSet = true;
    }

    if (!pendingPlanetTemplate.isSet) {

        pendingPlanetTemplate.querySelector(".AddBtn").addEventListener("click", addBtn_click);
        pendingPlanetTemplate.isSet = true;
    }
}

function dataBindTechs() {

    var dom = document.querySelector("#technologyPage");

    function sortTechs(array) {

        let priceCounter = function (x, y) {

            let temp = x.GreenRequirement + x.RedRequirement + x.BlueRequirement + x.YellowRequirement >
                y.GreenRequirement + y.RedRequirement + y.BlueRequirement + y.YellowRequirement
                ? 1 : -1

            return temp;
        }

        array
            .sort((x, y) => y.IsYellow - x.IsYellow)
            .sort((x, y) => y.IsRed - x.IsRed)
            .sort((x, y) => y.IsBlue - x.IsBlue)
            .sort((x, y) => y.IsGreen - x.IsGreen);

        array.sort((a, b) => {
            let aIsColorless = !a.IsRed && !a.IsBlue && !a.IsGreen && !a.IsYellow;
            let bIsColorless = !b.IsRed && !b.IsBlue && !b.IsGreen && !b.IsYellow;

            let priceCheck =
                (aIsColorless && bIsColorless) ||
                (a.IsGreen && b.IsGreen) ||
                (a.IsBlue && b.IsBlue) ||
                (a.IsRed && b.IsRed) ||
                (a.IsYellow && b.IsYellow)

            if (priceCheck) return priceCounter(a, b);
        });
    }

    function databind(dataList, dom, isAvailable) {

        for (let i = 0; i < dataList.length; i++) {

            let data = { ...dataList[i] };
            let i_dom = technologyTemplate.cloneNode(true);
            let headingDom = i_dom.querySelector("h3");
            let colorDom = headingDom.querySelector(".Requirement");
            let requirementListDom = headingDom.querySelector(".RequirementList");
            let summaryDom = i_dom.querySelector(".Summary");
            let summaryContentDom = i_dom.querySelector(".Summary .Content");
            let summaryHTML = createCommonSummary(data);

            if (data.UnitID) {

                let unitData = units.find(x => x.UnitID === data.UnitID);

                createCommonUnitWrapper(unitData, summaryContentDom, false);

                summaryHTML = summaryContentDom.outerHTML;
            }

            var appendRequirement = function (colorCount, colorTitle) {

                for (let ii = 0; ii < colorCount; ii++) {

                    let ii_dom = document.createElement("Span");
                    ii_dom.classList.add("Requirement");
                    ii_dom.classList.add(colorTitle);

                    requirementListDom.appendChild(ii_dom);
                }
            }

            appendRequirement(data.GreenRequirement, "Green");
            appendRequirement(data.BlueRequirement, "Blue");
            appendRequirement(data.YellowRequirement, "Yellow");
            appendRequirement(data.RedRequirement, "Red");

            let enemyFactionIconDom = null;

            if (data.FactionID) {

                if (data.FactionID === factionID) {

                    i_dom.classList.add("Faction");
                    i_dom.dataset.factionId = data.FactionID;
                }
                //enemy tech
                else {

                    enemyFactionIconDom = createFactionIcon(data.FactionID);
                }
            }

            summaryContentDom.innerHTML = summaryHTML;

            let isColorless = (!data.IsRed && !data.IsBlue && !data.IsGreen && !data.IsYellow);

            if (data.IsRed) colorDom.classList.add("Red");
            if (data.IsBlue) colorDom.classList.add("Blue");
            if (data.IsGreen) colorDom.classList.add("Green");
            if (data.IsYellow) colorDom.classList.add("Yellow");

            headingDom.addEventListener("click", headingDom_click);
            headingDom.innerHTML = data.Title
            if (!isColorless) headingDom.prepend(colorDom);
            headingDom.appendChild(requirementListDom);
            //if (enemyFactionIconDom) headingDom.appendChild(enemyFactionIconDom);
            if (enemyFactionIconDom) summaryDom.appendChild(enemyFactionIconDom);

            i_dom.dataset.id = data.TechnologyID;
            i_dom.querySelector(".RemoveBtn").addEventListener("click", removeBtn_click);
            i_dom.querySelector(".AddBtn").addEventListener("click", addBtn_click);


            manageExhaustable(i_dom, dataList[i], !isAvailable); //dont use cloned data object

            dom.appendChild(i_dom);
        }
    }

    function createDom() {

        let redCount = 0;
        let greenCount = 0;
        let yellowCount = 0;
        let blueCount = 0;

        let isPlanetIncluded = false;

        for (let i = 0; i < inventory.technologies.length; i++) {

            if (inventory.technologies[i].IsRed) redCount++
            if (inventory.technologies[i].IsGreen) greenCount++
            if (inventory.technologies[i].IsYellow) yellowCount++;
            if (inventory.technologies[i].IsBlue) blueCount++;
        }

        for (let i = 0; i < inventory.planets.length; i++) {

            if (inventory.planets[i].TechnologyColorID === 1 || (inventory.planets[i].modifier && inventory.planets[i].modifier.Technology.indexOf("Red") !== -1))//red
            {
                redCount++;

                isPlanetIncluded = true;
            }
            if (inventory.planets[i].TechnologyColorID === 2 || (inventory.planets[i].modifier && inventory.planets[i].modifier.Technology.indexOf("Blue") !== -1))//blue
            {
                blueCount++;

                isPlanetIncluded = true;
            }
            if (inventory.planets[i].TechnologyColorID === 3 || (inventory.planets[i].modifier && inventory.planets[i].modifier.Technology.indexOf("Yellow") !== -1))//yellow
            {
                yellowCount++;

                isPlanetIncluded = true;
            }
            if (inventory.planets[i].TechnologyColorID === 4 || (inventory.planets[i].modifier && inventory.planets[i].modifier.Technology.indexOf("Green") !== -1))//green
            {
                greenCount++;

                isPlanetIncluded = true;
            }
        }

        let availableToResearch = inventory.pendingTech.filter(x =>
            x.GreenRequirement <= greenCount &&
            x.RedRequirement <= redCount &&
            x.BlueRequirement <= blueCount &&
            x.YellowRequirement <= yellowCount
        );

        //availableToResearch = availableToResearch.filter(function (x) { return inventory.technologies.indexOf(x) === -1 });

        sortTechs(inventory.technologies);
        sortTechs(availableToResearch);
        sortTechs(inventory.pendingTech);

        let ownTechWrapper = dom.querySelector("#ownTechWrapper");
        let availableTechWrapper = dom.querySelector("#availableTechWrapper");
        let allTechWrapper = dom.querySelector("#allTechWrapper");
        let enemyTechWrapper = dom.querySelector("#enemyTechWrapper");
        let availableLbl = document.getElementById("availableLbl");

        ownTechWrapper.innerHTML = null;
        availableTechWrapper.innerHTML = null;
        allTechWrapper.innerHTML = null;
        enemyTechWrapper.innerHTML = null;


        let otherTech = inventory.pendingTech.filter(x => availableToResearch.indexOf(x) === -1);
        let enemyTechs = technologies.filter(x => inventory.players.some(y => y.factionID == x.FactionID && y.factionID !== factionID ));
        enemyTechs = enemyTechs.filter(x => !inventory.technologies.some(y => y.TechnologyID == x.TechnologyID));

        databind(inventory.technologies, ownTechWrapper, true);
        databind(availableToResearch, availableTechWrapper);
        databind(otherTech, allTechWrapper);
        databind(enemyTechs, enemyTechWrapper);

        ownTechWrapper.querySelectorAll(".AddBtn").forEach(e => e.remove());
        availableTechWrapper.querySelectorAll(".RemoveBtn").forEach(e => e.remove());
        allTechWrapper.querySelectorAll(".RemoveBtn").forEach(e => e.remove());
        enemyTechWrapper.querySelectorAll(".RemoveBtn").forEach(e => e.remove());

        if (isPlanetIncluded) {

            availableLbl.classList.add("PlanetsIncluded");
        }
        else {

            availableLbl.classList.remove("PlanetsIncluded");
        }
    }

    function headingDom_click(e) {

        let parent = this.parentNode;

        parent.classList.toggle("Active");
    }

    function addBtn_click(e) {

        let parentDom = this.closest("[data-id]");
        let dataID = parseInt(parentDom.dataset.id)

        let target = inventory.pendingTech.find(x => x.TechnologyID === dataID);

        //enemy tech selected
        if (!target) {

            target = technologies.find(x => x.TechnologyID === dataID);
        }

        inventory.technologies.push(target);

        if (target.UnitID) {

            let pending = inventory.pendingUnit.find(x => x.UnitID === target.UnitID);

            if (target.FactionID && target.FactionID !== factionID) {

                pending = units.find(x => x.UnitID === target.UnitID);

                //note: could remove (todo?) from pending aswell this unit type (so Clan of Saar Space Dock removes Spade Dock II)
            }
            
            let current = inventory.units.find(x => x.UnitTypeID === pending.UnitTypeID);

            if (pending) removeFromArray(inventory.pendingUnit, pending);
            if (current) removeFromArray(inventory.units, current);

            inventory.units.push(pending);

            if (!inventory.oldUnits) inventory.oldUnits = [];
            if (current) inventory.oldUnits.push(current);

            dataBindUnits();
        }

        removeFromArray(inventory.pendingTech, target);

        createDom();

        dataBindSummary();
        dataBindPlanets();

        //note: unit state is lost!
        dataBindCombat(true);

        saveState();
    }

    function removeBtn_click(e) {

        e.stopPropagation();

        let parentDom = this.closest("[data-id]");
        
        let dataID = parseInt(parentDom.dataset.id);

        let targetData = inventory.technologies.find(function (obj) { return obj.TechnologyID === dataID; });

        inventory.technologies = inventory.technologies.filter(function (obj) { return obj.TechnologyID !== dataID; });

        let isOtherFaction = targetData.FactionID && targetData.FactionID !== factionID;

        if (!isOtherFaction) inventory.pendingTech.push(targetData);

        if (targetData.UnitID) {

            let current = inventory.units.find(x => x.UnitID === targetData.UnitID);
            let old = inventory.oldUnits.find(x => x.UnitTypeID === current.UnitTypeID);

            removeFromArray(inventory.units, current);
            removeFromArray(inventory.oldUnits, old);

            if (old) inventory.units.push(old);

            if (!isOtherFaction) {
                
                inventory.pendingUnit.push(current);
            }

            dataBindUnits();
        }

        createDom();

        dataBindSummary();
        dataBindPlanets();
        dataBindCombat();

        saveState();
    }

    createDom();
}

function dataBindPromissory() {

    function createDatasource() {

        promissoryNoteColored = [];

        for (var i = 0; i < inventory.players.length; i++) {

            if (inventory.players[i].factionID == factionID) continue;

            let color = inventory.players[i].color;

            for (var ii = 0; ii < promissoryNotes.length; ii++) {

                if (!promissoryNotes[ii].FactionID) {

                    const cloned = { ...promissoryNotes[ii] };
                    cloned.Title = color + " - " + cloned.Title
                    cloned.Passive = cloned.Passive.replaceAll("(color)", color);
                    cloned.Color = color;

                    if (cloned.Action) cloned.Action = cloned.Action.replace("(color)", color);

                    promissoryNoteColored.push(cloned)
                }
                else if (promissoryNotes[ii].FactionID === inventory.players[i].factionID) {

                    const cloned = { ...promissoryNotes[ii] };

                    cloned.OriginalTitle = cloned.Title;
                    cloned.Title = color + " - " + cloned.Title;

                    promissoryNoteColored.push(cloned);
                }
            }
        }
    }

    function createSummary(targetSource, wrapper, append) {

        let summaryHTML = createCommonSummary(targetSource);
    
        let finalSource = { ...targetSource };
        finalSource.Title = finalSource.OriginalTitle ?? finalSource.Title;
        finalSource.Summary = summaryHTML;

        let clone = promissoryNoteTemplate.cloneNode(true);
        clone.dataset.id = targetSource.PromissoryNoteID;
        if (targetSource.Color) clone.dataset.color = targetSource.Color;
        clone.querySelector(".RemoveBtn").addEventListener("click", removeBtn_click);
        clone.querySelector(".AddBtn").addEventListener("click", addBtn_click);

        dataBindDom(clone, finalSource);
        
        //dont display faction icon
        //if (finalSource.FactionID && finalSource.FactionID != factionID) {

        //    let factionDom = createFactionIcon(finalSource.FactionID);
        //    clone.querySelector("[data-field='Title']").append(factionDom);
        //}


        if (!append) wrapper.innerHTML = null;

        wrapper.appendChild(clone);

        return clone;
    }

    function databindDdl() {

        removeAllButFirst(promissoryDdl);

        promissoryDdl.selectedIndex = 0;

        if (promissoryNoteColored.length === 0) {

            let optionDom = document.createElement("option");
            optionDom.innerHTML = "No enemies selected";
            optionDom.disabled = "disabled";

            promissoryDdl.appendChild(optionDom);
        }

        for (let i = 0; i < promissoryNoteColored.length; i++) {

            let isAvailable = inventory.promissoryNotes.indexOf(promissoryNoteColored[i]) == -1;

            if (isAvailable) {

                let optionDom = document.createElement("option");
                optionDom.innerHTML = promissoryNoteColored[i].Title;
                optionDom.value = promissoryNoteColored[i].PromissoryNoteID;

                if (promissoryNoteColored[i].Color) optionDom.dataset.color = promissoryNoteColored[i].Color;

                promissoryDdl.appendChild(optionDom);
            }
        }
    }

    function databindInventory() {

        let dom = document.querySelector(".ownWrapper");
        dom.innerHTML = null;

        for (let i = 0; i < inventory.promissoryNotes.length; i++) {

            let i_dom = createSummary(inventory.promissoryNotes[i], dom, true);
            i_dom.querySelector(".AddBtn").remove();
        }

        //todo: ability to give mine PN to another color/player?
        let mineDom = document.getElementById("minePnWrapper");
        mineDom.innerHTML = null;

        let mineNotes = promissoryNotes.filter(x => x.FactionID === factionID);

        for (let i = 0; i < mineNotes.length; i++) {

            let i_dom = createSummary(mineNotes[i], mineDom, true);

            i_dom.querySelectorAll("input").forEach(x => x.remove());
        }
    }

    function getSelectedPromissoryNote() {

        let optionIndex = promissoryDdl.selectedIndex;
        let targetColor = promissoryDdl.children[optionIndex].dataset.color;
        let targetValue = parseInt(promissoryDdl.value);

        let targetData = null;

        if (targetColor) {

            targetData = promissoryNoteColored.find(x => x.Color === targetColor && x.PromissoryNoteID === targetValue);
        }
        else {

            targetData = promissoryNoteColored.find(x => x.PromissoryNoteID === targetValue);
        }

        return targetData;
    }

    function promissoryDdl_onChange() {

        let targetData = getSelectedPromissoryNote();

        let selectedPnWrapper = document.getElementById("selectedPnGenericWrapper");

        let summaryDom = createSummary(targetData, selectedPnWrapper);
        summaryDom.querySelector(".RemoveBtn").remove();
    }

    function addBtn_click(e) {

        let target = getSelectedPromissoryNote();

        inventory.promissoryNotes.push(target);

        databindInventory();
        databindDdl();

        let selectedPnWrapper = document.getElementById("selectedPnGenericWrapper");
        selectedPnWrapper.innerHTML = null;

        //alliance
        if (target.PromissoryNoteID === 5) {

            let targetPlayer = inventory.players.find(x => x.color === target.Color);

            let allianceCommander = leaders.find(x => x.FactionID === targetPlayer.factionID && x.Level === 2);

            inventory.leaders.push(allianceCommander);

            dataBindLeaders();
        }

        dataBindSummary();

        saveState();
    }

    function removeBtn_click(e) {

        let parentDom = this.closest("[data-id]");
        let targetID = parseInt(parentDom.dataset.id);
        let targetColor = parentDom.dataset.color;

        inventory.promissoryNotes = inventory.promissoryNotes.filter(function (obj) {

            let flag = obj.PromissoryNoteID !== targetID;

            if (targetColor && obj.PromissoryNoteID === targetID && obj.Color !== targetColor) {

                flag = true;
            }

            return flag;
        });

        //alliance
        if (targetID === 5) {

            let targetPlayer = inventory.players.find(x => x.color === targetColor)
            let allianceCommander = leaders.find(x => x.FactionID === targetPlayer.factionID && x.Level === 2);

            inventory.leaders = inventory.leaders.filter(x => x.LeaderID !== allianceCommander.LeaderID);

            dataBindLeaders();
            dataBindSummary();
        }

        databindInventory();
        databindDdl();

        saveState();
    }

    createDatasource();

    databindDdl();
    databindInventory();

    promissoryDdl = document.getElementById("promissoryDdl");
    promissoryDdl.removeEventListener("change", promissoryDdl_onChange);
    promissoryDdl.addEventListener("change", promissoryDdl_onChange);
}

function dataBindLeaders() {

    var owmLeaderWrapper = document.querySelector("#owmLeaderWrapper");
    var lockedLeaderWrapper = document.querySelector("#lockedLeaderWrapper");
    var purgedLeaderWrapper = document.querySelector("#purgedLeaderWrapper");

    function databindRecord(data, source) {

        let dataCloned = { ...data };

        let summary = createCommonSummary(dataCloned)
        dataCloned.Summary = summary;
        dataCloned.Type = source;

        let domCloned = leaderItem.cloneNode(true);
        domCloned.dataset.id = dataCloned.LeaderID;
        dataBindDom(domCloned, dataCloned);

        let unlockWrapper = domCloned.querySelector(".UnlockWrapper");
        if (!data.Unlock) unlockWrapper.style.display = "none";

        let unlockBtn = domCloned.querySelector(".UnlockBtn");

        if (dataCloned.Level === 1) unlockBtn.style.display = "none";

        unlockBtn.addEventListener("click", unlockBtn_click);

        if (dataCloned.FactionID != factionID) {

            let factionDom = createFactionIcon(dataCloned.FactionID);
            domCloned.querySelector("[data-field='Title']").append(factionDom);
        }

        manageExhaustable(domCloned, data);

        managePurgable(domCloned, data, purgedLeaderWrapper);

        //note: this needs to be called after managePurgable
        let purgeBtn = domCloned.querySelector(".PurgeBtn");

        if (data.IsPurged) {

            purgedLeaderWrapper.appendChild(domCloned);

            domCloned.querySelector(".UnlockWrapper").remove();

            unlockBtn.remove();
            if (purgeBtn) purgeBtn.remove();
        }
        else if (dataCloned.IsUnlocked) {

            owmLeaderWrapper.appendChild(domCloned);

            domCloned.querySelector(".UnlockWrapper").remove();
        }
        else {

            lockedLeaderWrapper.appendChild(domCloned);

            if (purgeBtn) purgeBtn.remove();
        }

        return domCloned;
    }

    function unlockBtn_click(e) {

        //note: toggle

        let parentDom = this.closest("[data-id]");
        let dataID = parseInt(parentDom.dataset.id)

        let target = inventory.leaders.find(x => x.LeaderID === dataID);
        target.IsUnlocked = !target.IsUnlocked;

        createDom();

        dataBindSummary();

        saveState();
    }

    function createDom() {

        owmLeaderWrapper.innerHTML = null;
        lockedLeaderWrapper.innerHTML = null;

        for (let i = 0; i < inventory.leaders.length; i++) {

            let type = null;
            if (inventory.leaders[i].Level === 1) type = "Agent";
            else if (inventory.leaders[i].Level === 2) type = "Commander";
            else if (inventory.leaders[i].Level === 3) type = "Hero";

            databindRecord(inventory.leaders[i], type);
        }
    }

    createDom();
}

function dataBindRelics() {

    let dataWrapper = null;
    let purgedWrapper = null;
    let selectList = null;

    function databindRecord(data, isOwned) {

        let dataCloned = { ...data };

        let summary = createCommonSummary(dataCloned)
        dataCloned.Summary = summary;

        let domCloned = relicItem.cloneNode(true);
        domCloned.dataset.id = dataCloned.RelicID;

        dataBindDom(domCloned, dataCloned);

        let addBtn = domCloned.querySelector(".AddBtn");
        addBtn.addEventListener("click", addBtn_click)

        let removeBtn = domCloned.querySelector(".RemoveBtn");
        removeBtn.addEventListener("click", removeBtn_click)
        
        manageExhaustable(domCloned, data);
        managePurgable(domCloned, data, purgedWrapper);

        let targetWrapper = dataWrapper;
        let purgeBtn = domCloned.querySelector(".PurgeBtn");
        let exhaustBtn = domCloned.querySelector(".ExhaustBtn");

        if (dataCloned.IsPurged) {

            targetWrapper = purgedWrapper;

            domCloned.querySelectorAll("input").forEach(x => x.remove());
        }
        else if (isOwned) {

            addBtn.remove();
        }
        else {

            removeBtn.remove();
            
            if (exhaustBtn) exhaustBtn.remove();
            
            if (purgeBtn) purgeBtn.remove();
        }

        targetWrapper.appendChild(domCloned);

        return domCloned;
    }

    function createDom() {

        selectList = document.querySelector("#relicPage .SelectList");
        selectList.selectedIndex = 0;
        removeAllButFirst(selectList);

        if (!selectList.isSet) {

            selectList.addEventListener("change", selectList_onChange);
            selectList.isSet = true;
        }

        for (let i = 0; i < relics.length; i++) {

            if (relics[i].IsPurged) continue;
            if (inventory.relics.some(x => x.RelicID === relics[i].RelicID)) continue;

            let optionDom = document.createElement("option");
            optionDom.innerHTML = relics[i].Title;
            optionDom.value = relics[i].RelicID;

            selectList.appendChild(optionDom);
        }

        dataWrapper = document.querySelector("#relicPage .DataWrapper");
        dataWrapper.innerHTML = "";

        purgedWrapper = document.querySelector("#relicPage .PurgedWrapper");
        purgedWrapper.innerHTML = "";

        for (let i = 0; i < inventory.relics.length; i++) {

            databindRecord(inventory.relics[i], true);
        }
    }

    function selectList_onChange() {

        let targetRelic = relics.find(x => x.RelicID == this.value);

        let dom = databindRecord(targetRelic, false);

        let peekWrapper = document.querySelector("#relicPage .PeekWrapper");
        peekWrapper.innerHTML = null;
        peekWrapper.appendChild(dom);
    }

    function addBtn_click() {

        let parentDom = this.closest("[data-id]");
        let relicID = parseInt(parentDom.dataset.id);

        let targetRelic = relics.find(x => x.RelicID == relicID);

        inventory.relics.push(targetRelic);

        databindRecord(targetRelic, true);

        selectList.remove(selectList.selectedIndex);
        selectList.selectedIndex = 0;

        let peekWrapper = document.querySelector("#relicPage .PeekWrapper");
        peekWrapper.innerHTML = null;

        dataBindSummary();

        saveState();
    }

    function removeBtn_click() {

        let parentDom = this.closest("[data-id]");
        let relicID = parseInt(parentDom.dataset.id);

        inventory.relics = inventory.relics.filter(function (obj) { return obj.RelicID !== relicID; });

        parentDom.remove();

        dataBindSummary();

        createDom();

        saveState();
    }

    createDom();
}

function dataBindAgenda() {

    var selectList = null;
    var dataWrapper = null;

    function databindRecord(data, isOwned) {

        let dataCloned = { ...data };
        dataCloned.Passive = data.Effect ?? data.For;

        let summary = createCommonSummary(dataCloned)
        dataCloned.Summary = summary;

        let domCloned = agendaItem.cloneNode(true);
        domCloned.dataset.id = data.AgendaID;

        dataBindDom(domCloned, dataCloned);

        let addBtn = domCloned.querySelector(".AddBtn");
        addBtn.addEventListener("click", addBtn_click)

        let removeBtn = domCloned.querySelector(".RemoveBtn");
        removeBtn.addEventListener("click", removeBtn_click)

        if (isOwned) {

            addBtn.remove();
        }
        else {

            removeBtn.remove();
        }

        dataWrapper.appendChild(domCloned);

        return domCloned;
    }

    function createDom() {

        selectList = document.querySelector("#agendaPage .SelectList");
        selectList.selectedIndex = 0;
        removeAllButFirst(selectList);

        if (!selectList.isSet) {

            selectList.addEventListener("change", selectList_onChange);
            selectList.isSet = true;
        }

        //todo: why sort here?
        agendas.sort((a, b) => { return a.Title.toLowerCase() < b.Title.toLowerCase() ? -1 : 1 });

        for (let i = 0; i < agendas.length; i++) {

            if (agendas[i].Type == "LAW" && (agendas[i].Elect == "Player" || agendas[i].Elect == null)) {

                let optionDom = document.createElement("option");
                optionDom.innerHTML = agendas[i].Title;
                optionDom.value = agendas[i].AgendaID;

                selectList.appendChild(optionDom);
            }
        }

        dataWrapper = document.querySelector("#agendaPage .DataWrapper");
        dataWrapper.innerHTML = "";

        for (let i = 0; i < inventory.agendas.length; i++) {

            databindRecord(inventory.agendas[i], true);
        }
    }

    function selectList_onChange() {

        //return;

        let target = agendas.find(x => x.AgendaID == this.value);

        let dom = databindRecord(target, false);

        let peekWrapper = document.querySelector("#agendaPage .PeekWrapper");
        peekWrapper.innerHTML = null;
        peekWrapper.appendChild(dom);
    }

    function addBtn_click() {

        let parentDom = this.closest("[data-id]");
        let relicID = parseInt(parentDom.dataset.id)

        let targetRelic = agendas.find(x => x.AgendaID == relicID);

        inventory.agendas.push(targetRelic);

        databindRecord(targetRelic, true);

        selectList.remove(selectList.selectedIndex);
        selectList.selectedIndex = 0;

        let peekWrapper = document.querySelector("#agendaPage .PeekWrapper");
        peekWrapper.innerHTML = null;

        dataBindSummary();

        saveState();
    }

    function removeBtn_click() {

        let parentDom = this.closest("[data-id]");
        let relicID = parseInt(parentDom.dataset.id)

        inventory.agendas = inventory.agendas.filter(function (obj) {
            return obj.AgendaID !== relicID;
        });

        parentDom.remove();

        dataBindSummary();

        createDom();

        saveState();
    }

    createDom();
}

function dataBindUnits() {

    let rollStateRegistry = {};

    function createDom() {

        let dataWrapper = document.querySelector("#ownWrapper");
        dataWrapper.innerHTML = null;

        sortUnits(inventory.units);

        for (let i = 0; i < inventory.units.length; i++) {

            let dom = createCommonUnitWrapper(inventory.units[i], dataWrapper);
            dom.dataset.unitId = inventory.units[i].UnitID;

            let combatDom = dom.querySelector(".Combat");
            let afbDom = dom.querySelector(".AFB");
            let spaceCannonDom = dom.querySelector(".SpaceCannon");
            let bombardmentDom = dom.querySelector(".Bombardment");

            if (inventory.units[i].Combat && combatDom) combatDom.addEventListener("click", combatDom_click);
            if (inventory.units[i].AntiFighterBarage && afbDom) afbDom.addEventListener("click", afbDom_click);
            if (inventory.units[i].SpaceCannon && spaceCannonDom) spaceCannonDom.addEventListener("click", spaceCannonDom_click);
            if (inventory.units[i].Bombardment && bombardmentDom) bombardmentDom.addEventListener("click", bombardmentDom_click);
        }

        let upgradesWrapper = document.querySelector("#upgradesWrapper");
        upgradesWrapper.innerHTML = null;

        sortUnits(inventory.pendingUnit);

        for (let i = 0; i < inventory.pendingUnit.length; i++) {

            createCommonUnitWrapper(inventory.pendingUnit[i], upgradesWrapper, true);
        }
    }

    function invokeRolling(definitionDelegate, e_rollState) {

        let unitID = parseInt(this.closest("[data-unit-id]").dataset.unitId);
        let unitData = inventory.units.find(x => x.UnitID === unitID);

        let data = [{ data: unitData, unitCount: 1 }];

        let rollState = e_rollState;

        if (!rollState) {

            rollState = generateRollState(data, definitionDelegate, 0, false).rollState;

            rollStateRegistry[unitID] = rollState;
        }

        let rollStateHTML = createCommonRollState(rollState[0].diceState, "unit_" + unitID); //todo: new id

        let rollStateDom = this.closest("[data-unit-id]").querySelector(".RollState");
        rollStateDom.innerHTML = rollStateHTML.html;

        

        let _this = this;

        let rollSlotDom = rollStateDom.querySelectorAll(".Roll");

        for (let i = 0; i < rollSlotDom.length; i++) {

            manageCombatTrigger(rollSlotDom[i], rollState[0], i, function () {

                let targetDiceState = rollStateRegistry[unitID];

                invokeRolling.bind(_this)(definitionDelegate, targetDiceState);
            });
        }
    }

    function combatDom_click() {

        function definitionDelegate(data) {

            let temp = { diceCount: data.CombatDice ?? 1, hitValue: data.Combat };

            return temp;
        }

        invokeRolling.bind(this)(definitionDelegate);
    }

    function afbDom_click() {

        function definitionDelegate(data) {

            let temp = { diceCount: data.AntiFighterBarageDice ?? 1, hitValue: data.AntiFighterBarage };

            return temp;
        }

        invokeRolling.bind(this)(definitionDelegate);
    }

    function spaceCannonDom_click() {

        function definitionDelegate(data) {

            let temp = { diceCount: data.SpaceCannonDice ?? 1, hitValue: data.SpaceCannon };

            return temp;
        }

        invokeRolling.bind(this)(definitionDelegate);
    }

    function bombardmentDom_click() {

        function definitionDelegate(data) {

            let temp = { diceCount: data.BombardmentDice ?? 1, hitValue: data.Bombardment };

            return temp;
        }

        invokeRolling.bind(this)(definitionDelegate);
    }

    createDom();
}

document.addEventListener("DOMContentLoaded", function (event) {

    codexCb = document.getElementById("codexCb")
    codexCb.addEventListener("change", function () { createDataset_setCodex(); });

    createDataset_setCodex();

    initTemplates();

    let state = loadState();

    if (state) {

        setupAll();
    }
    else {

        setupStartPage();
    }
});