const fs = require("fs");
const path = require("path");

const LOCALIZATION_DIR = path.join(__dirname, "..", "static", "assets", "localization");
const SCENARIOS_DIR = path.join(LOCALIZATION_DIR, "scenarios", "chapter_1");
const LANGUAGES = ["en", "ru", "uz", "tg", "es", "bxr"];

let passed = 0;
let failed = 0;
let total = 0;

function runTest(name, fn) {
    total++;
    try {
        fn();
        console.log("[OK] " + name);
        passed++;
    } catch (e) {
        console.log("[FAIL] " + name + ": " + e.message);
        failed++;
    }
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

console.log("========================================");
console.log("   Localization Tests - LOFA");
console.log("========================================\n");

// Test 1: Valid main JSON
console.log("[1] Main JSON validity");
LANGUAGES.forEach(function(lang) {
    var filePath = path.join(LOCALIZATION_DIR, lang + ".json");
    runTest(lang + ".json", function() {
        readJson(filePath);
    });
});

// Test 2: Valid scenario JSON  
console.log("\n[2] Scenario JSON validity");
LANGUAGES.forEach(function(lang) {
    var filePath = path.join(SCENARIOS_DIR, "chapter_1_" + lang + ".json");
    runTest("chapter_1_" + lang + ".json", function() {
        readJson(filePath);
    });
});

// Test 3: Same UI keys count
console.log("\n[3] UI keys count");
runTest("All languages have same UI keys count", function() {
    var minCount = Infinity;
    LANGUAGES.forEach(function(lang) {
        var data = readJson(path.join(LOCALIZATION_DIR, lang + ".json"));
        var count = Object.keys(data).length;
        if (count < minCount) minCount = count;
    });
    LANGUAGES.forEach(function(lang) {
        var data = readJson(path.join(LOCALIZATION_DIR, lang + ".json"));
        var count = Object.keys(data).length;
        if (count < minCount) {
            throw new Error(lang + " has fewer keys than minimum");
        }
    });
});

// Test 4: All keys from en exist in others
console.log("\n[4] Translation completeness");
runTest("All en.json keys exist in other languages", function() {
    var en = readJson(path.join(LOCALIZATION_DIR, "en.json"));
    var enKeys = Object.keys(en);
    
    LANGUAGES.forEach(function(lang) {
        if (lang === "en") return;
        var data = readJson(path.join(LOCALIZATION_DIR, lang + ".json"));
        var missing = enKeys.filter(function(k) { return !data.hasOwnProperty(k); });
        if (missing.length > 0) {
            throw new Error(lang + " missing " + missing.length + " keys");
        }
    });
});

// Test 5: Uzbek check
console.log("\n[5] Uzbek check");
runTest("Uzbek UI has no Cyrillic", function() {
    var uz = readJson(path.join(LOCALIZATION_DIR, "uz.json"));
    var cyrillic = /[\u0430-\u044F\u0410-\u042F]/;
    for (var key in uz.ui) {
        var val = uz.ui[key];
        if (typeof val === "string" && cyrillic.test(val)) {
            throw new Error("UZ has Cyrillic in " + key);
        }
    }
});

// Test 6: Tajik check
console.log("\n[6] Tajik check");
runTest("Tajik has no Russian words", function() {
    var tg = readJson(path.join(LOCALIZATION_DIR, "tg.json"));
    var badWords = ["\u041E\u0447\u043A\u0438", "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441"];
    for (var key in tg.ui) {
        var val = tg.ui[key];
        if (typeof val === "string") {
            badWords.forEach(function(w) {
                if (val.indexOf(w) !== -1) {
                    throw new Error("TG has Russian in " + key);
                }
            });
        }
    }
});

// Test 7: Required keys
console.log("\n[7] Required keys");
runTest("All languages have required translation keys", function() {
    var required = ["language", "up", "down", "left", "right", "jump", "turn", "collect", "drop",
        "chapter", "level", "start", "retry", "runCode", "resetCode", "score", "points"];
    LANGUAGES.forEach(function(lang) {
        var data = readJson(path.join(LOCALIZATION_DIR, lang + ".json"));
        required.forEach(function(key) {
            if (!data[key]) {
                throw new Error(lang + " missing required key \"" + key + "\"");
            }
        });
    });
});

// Test 8: Scenario structure
console.log("\n[8] Scenario structure");
runTest("All scenarios have 2 chapters", function() {
    LANGUAGES.forEach(function(lang) {
        var data = readJson(path.join(SCENARIOS_DIR, "chapter_1_" + lang + ".json"));
        if (!data.chapters || data.chapters.length !== 2) {
            throw new Error(lang + " needs 2 chapters");
        }
    });
});

// Test 9: Levels count
console.log("\n[9] Levels count");
runTest("All scenarios have 10 levels per chapter", function() {
    LANGUAGES.forEach(function(lang) {
        var data = readJson(path.join(SCENARIOS_DIR, "chapter_1_" + lang + ".json"));
        data.chapters.forEach(function(ch) {
            if (!ch.levels || ch.levels.length !== 10) {
                throw new Error(lang + " " + ch.gender + " needs 10 levels");
            }
        });
    });
});

// Summary
console.log("\n========================================");
console.log("   Result: " + passed + "/" + total + " passed, " + failed + " failed");
console.log("========================================\n");

process.exit(failed > 0 ? 1 : 0);