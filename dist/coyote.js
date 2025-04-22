class CoyoteComponent {
}
class AttrComponent extends CoyoteComponent {
    #attr;
    constructor(attr) {
        super();
        this.#attr = attr;
    }
    get attr() {
        return this.#attr;
    }
}
class AttrValComponent extends CoyoteComponent {
    #attr;
    #value;
    constructor(attr, val) {
        super();
        this.#attr = attr;
        this.#value = val.replaceAll('"', "&quot;").replaceAll("&", "&amp;");
    }
    get attr() {
        return this.#attr;
    }
    get value() {
        return this.#value;
    }
}
class TmplComponent extends CoyoteComponent {
    #templateStr;
    #injections;
    constructor(txt, injections) {
        super();
        this.#templateStr = txt;
        this.#injections = injections;
    }
    get templateStr() {
        return this.#templateStr;
    }
    get injections() {
        return this.#injections;
    }
}
class TaggedTmplComponent extends CoyoteComponent {
    #templateArr;
    #injections;
    constructor(txts, injections) {
        super();
        this.#templateArr = txts;
        this.#injections = injections;
    }
    get templateArr() {
        return this.#templateArr;
    }
    get injections() {
        return this.#injections;
    }
}
function tmplStr(txt, injections) {
    return new TmplComponent(txt, injections);
}
function tmpl(txts, ...injections) {
    return new TaggedTmplComponent(txts, injections);
}
function text(txt) {
    return txt
        .replaceAll("<", "&lt;")
        .replaceAll("&", "&amp;")
        .replaceAll("{", "&#123;");
}
function attr(attrStr) {
    return new AttrComponent(attrStr);
}
function attrVal(attr, val) {
    return new AttrValComponent(attr, val);
}

class TagInfo {
    namespace;
    tag;
    textFormat;
    indentCount = 0;
    voidEl;
    inlineEl;
    preservedTextPath;
    bannedPath;
    constructor(rules, tag) {
        this.namespace = !rules.tagIsNamespaceEl(tag)
            ? rules.getInitialNamespace()
            : tag;
        this.tag = tag;
        this.textFormat = "Root";
        this.indentCount = 0;
        this.voidEl = rules.tagIsVoidEl(tag);
        this.inlineEl = rules.tagIsInlineEl(tag);
        this.preservedTextPath = rules.tagIsPreservedTextEl(tag);
        this.bannedPath = rules.tagIsBannedEl(tag);
    }
}
function from(rules, prevTagInfo, tag) {
    let tagInfo = new TagInfo(rules, tag);
    tagInfo.namespace = prevTagInfo.namespace;
    tagInfo.indentCount = prevTagInfo.indentCount;
    tagInfo.textFormat = "Initial";
    if (rules.tagIsNamespaceEl(tag)) {
        tagInfo.namespace = tag;
    }
    if (rules.tagIsPreservedTextEl(prevTagInfo.tag)) {
        tagInfo.preservedTextPath = true;
    }
    if (rules.tagIsBannedEl(tag)) {
        tagInfo.bannedPath = true;
    }
    if (!rules.tagIsVoidEl(prevTagInfo.tag) && !rules.tagIsInlineEl(tag)) {
        tagInfo.indentCount += 1;
    }
    return tagInfo;
}

let glyphGraph = new Map([
    ["Attr", getKindFromAttribute],
    ["AttrMapInjection", getKindFromInjection],
    ["AttrQuote", getKindFromAttributeQuote],
    ["AttrQuoteClosed", getKindFromAttributeQuoteClosed],
    ["AttrSetter", getKindFromAttributeSetter],
    ["AttrValue", getKindFromAttributeQuote],
    ["AttrValueUnquoted", getKindFromAttributeValueUnquoted],
    ["DescendantInjection", getKindFromInjection],
    ["Element", getKindFromElement],
    ["ElementSpace", getKindFromElementSpace],
    ["EmptyElement", getKindFromEmptyElement],
    ["InjectionSpace", getKindFromInjection],
    ["Tag", getKindFromTag],
    ["TailElementSolidus", getKindFromTailElementSolidus],
    ["TailElementSpace", getKindFromTailElementSpace],
    ["TailTag", getKindFromTailTag],
]);
function route(glyph, prevKind) {
    let router = glyphGraph.get(prevKind) ?? getKindFromInitial;
    return router(glyph);
}
function isSpace(glyph) {
    return glyph.length !== glyph.trim().length;
}
function getKindFromAttribute(glyph) {
    if ("=" === glyph)
        return "AttrSetter";
    if (">" === glyph)
        return "ElementClosed";
    if ("/" === glyph)
        return "EmptyElement";
    if ("{" === glyph)
        return "AttrMapInjection";
    if (isSpace(glyph))
        return "ElementSpace";
    return "Attr";
}
function getKindFromInjection(glyph) {
    if ("}" === glyph)
        return "InjectionConfirmed";
    return "InjectionSpace";
}
function getKindFromAttributeQuote(glyph) {
    if ('"' === glyph)
        return "AttrQuoteClosed";
    return "AttrValue";
}
function getKindFromAttributeQuoteClosed(glyph) {
    if (">" === glyph)
        return "ElementClosed";
    if ("/" === glyph)
        return "EmptyElement";
    return "ElementSpace";
}
function getKindFromAttributeSetter(glyph) {
    if ('"' === glyph)
        return "AttrQuote";
    if (isSpace(glyph))
        return "AttrSetter";
    return "AttrValueUnquoted";
}
function getKindFromAttributeValueUnquoted(glyph) {
    if (">" === glyph)
        return "ElementClosed";
    if (isSpace(glyph))
        return "ElementSpace";
    return "AttrValueUnquoted";
}
function getKindFromElement(glyph) {
    if ("/" === glyph)
        return "TailElementSolidus";
    if (">" === glyph)
        return "Fragment";
    if (isSpace(glyph))
        return "Element";
    return "Tag";
}
function getKindFromElementSpace(glyph) {
    if (">" === glyph)
        return "ElementClosed";
    if ("/" === glyph)
        return "EmptyElement";
    if ("{" === glyph)
        return "AttrMapInjection";
    if (isSpace(glyph))
        return "ElementSpace";
    return "Attr";
}
function getKindFromEmptyElement(glyph) {
    if (">" === glyph)
        return "EmptyElementClosed";
    return "EmptyElement";
}
function getKindFromTag(glyph) {
    if (">" === glyph)
        return "ElementClosed";
    if ("/" === glyph)
        return "EmptyElement";
    if (isSpace(glyph))
        return "ElementSpace";
    return "Tag";
}
function getKindFromTailElementSolidus(glyph) {
    if (">" === glyph)
        return "FragmentClosed";
    if (isSpace(glyph))
        return "TailElementSolidus";
    return "TailTag";
}
function getKindFromTailElementSpace(glyph) {
    if (">" === glyph)
        return "TailElementClosed";
    return "TailElementSpace";
}
function getKindFromTailTag(glyph) {
    if (">" === glyph)
        return "TailElementClosed";
    if (isSpace(glyph))
        return "TailElementSpace";
    return "TailTag";
}
function getKindFromInitial(glyph) {
    if ("<" === glyph)
        return "Element";
    if ("{" === glyph)
        return "DescendantInjection";
    return "Text";
}

class SlidingWindow {
    #index = 1;
    #target;
    constructor(target) {
        this.#target = target;
    }
    slide(glyph) {
        if (this.#target.charAt(this.#index - 1) !== glyph) {
            this.#index = 0;
        }
        this.#index += 1;
        return this.#index > this.#target.length;
    }
}

class Step {
    kind = "Initial";
    origin = 0;
    target = 0;
    constructor(kind, origin = 0, target = 0) {
        this.kind = kind;
        this.origin = origin;
        this.target = target;
    }
}
function parseStr(sieve, templateStr, initialKind) {
    let steps = [new Step(initialKind)];
    let tag = "";
    let prevInjKind = initialKind;
    let slidingWindow;
    for (let index = 0; index < templateStr.length; index++) {
        let glyph = templateStr.charAt(index);
        if (slidingWindow) {
            if (!slidingWindow.slide(glyph))
                continue;
            if (!addAltElementText$1(sieve, steps, tag, index))
                return steps;
            slidingWindow = undefined;
            continue;
        }
        let step = steps[steps.length - 1];
        if (step === undefined)
            return steps;
        step.target = index;
        let currKind = "InjectionConfirmed" === step.kind
            ? route(glyph, prevInjKind)
            : route(glyph, step.kind);
        if (currKind === step.kind)
            continue;
        if (isInjectionKind(currKind)) {
            prevInjKind = step.kind;
        }
        if ("Tag" === step.kind) {
            tag = getTextFromStep(templateStr, step);
            if (sieve.tagIsAtributeless(tag)) {
                let closeSequence = sieve.getCloseSequenceFromAltTextTag(tag);
                if (closeSequence) {
                    let slider = new SlidingWindow(closeSequence);
                    slider.slide(glyph);
                    slidingWindow = slider;
                    currKind = "Text";
                }
            }
        }
        if ("ElementClosed" === step.kind) {
            let closeSequence = sieve.getCloseSequenceFromAltTextTag(tag);
            if (closeSequence) {
                let slider = new SlidingWindow(closeSequence);
                slider.slide(glyph);
                slidingWindow = slider;
                currKind = "Text";
            }
        }
        steps.push(new Step(currKind, index, index));
    }
    let step = steps[steps.length - 1];
    if (step) {
        step.target = templateStr.length;
    }
    return steps;
}
function getTextFromStep(templateStr, step) {
    return templateStr.slice(step.origin, step.target);
}
function isInjectionKind(stepKind) {
    return "AttrMapInjection" === stepKind || "DescendantInjection" === stepKind;
}
function addAltElementText$1(sieve, steps, tag, index) {
    let step = steps[steps.length - 1];
    if (step === undefined)
        return false;
    let closingSequence = sieve.getCloseSequenceFromAltTextTag(tag);
    if (closingSequence) {
        step.target = index - (closingSequence.length - 1);
        steps.push(new Step("TailTag", index - (closingSequence.length - 1), index - closingSequence.length));
    }
    return true;
}

const spaceCharCodes = new Set([
    0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0071, 0xfeff, 0x0160, 0x0020,
    0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
    0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000,
]);
const htmlRoutes = new Map([
    ["Tag", pushElement],
    ["ElementClosed", closeElement],
    ["EmptyElementClosed", closeEmptyElement],
    ["TailTag", popElement],
    ["Text", pushText],
    ["Attr", pushAttr],
    ["AttrValue", pushAttrValue],
    ["AttrValueUnquoted", pushAttrValueUnquoted],
]);
function composeSteps(rules, results, tagInfoStack, templateStr, steps) {
    for (const step of steps) {
        let route = htmlRoutes.get(step.kind);
        if (route) {
            route(results, tagInfoStack, rules, templateStr, step);
        }
    }
}
function pushElement(results, stack, rules, templateStr, step) {
    let prevTagInfo = stack[stack.length - 1];
    if (undefined === prevTagInfo)
        return;
    let tag = getTextFromStep(templateStr, step);
    const tagInfo = from(rules, prevTagInfo, tag);
    if (tagInfo.bannedPath) {
        stack.push(tagInfo);
        return;
    }
    if (!rules.respectIndentation() &&
        "Initial" !== prevTagInfo.textFormat &&
        "Root" !== prevTagInfo.textFormat) {
        results.push(" ");
    }
    if (rules.respectIndentation()) {
        if (!tagInfo.inlineEl) {
            if ("Root" !== prevTagInfo.textFormat) {
                results.push("\n");
                results.push("\t".repeat(prevTagInfo.indentCount));
            }
            prevTagInfo.textFormat = "Block";
        }
        if (tagInfo.inlineEl) {
            if ("Inline" === prevTagInfo.textFormat) {
                results.push(" ");
            }
            prevTagInfo.textFormat = "Inline";
        }
    }
    results.push("<");
    results.push(tag);
    stack.push(tagInfo);
}
function closeElement(results, stack) {
    let tagInfo = stack[stack.length - 1];
    if (tagInfo === undefined)
        return;
    if (!tagInfo.bannedPath) {
        results.push(">");
    }
    if (tagInfo.voidEl && "html" === tagInfo.namespace) {
        stack.pop();
    }
}
function closeEmptyElement(results, stack) {
    let tagInfo = stack.pop();
    if (undefined === tagInfo)
        return;
    if (tagInfo.bannedPath)
        return;
    if ("html" !== tagInfo.namespace) {
        results.push("/>");
    }
    else {
        if (!tagInfo.voidEl) {
            results.push("></");
            results.push(tagInfo.tag);
        }
        results.push(">");
    }
}
function popElement(results, stack, rules, templateStr, step) {
    let tagInfo = stack.pop();
    if (tagInfo === undefined)
        return;
    if (tagInfo.bannedPath)
        return;
    let tag = getTextFromStep(templateStr, step);
    let altTag = rules.getAltTextTagFromCloseSequence(tag);
    if (altTag) {
        tag = altTag;
    }
    if (tag !== tagInfo.tag)
        return;
    if (tagInfo.voidEl && "html" === tagInfo.namespace) {
        results.push(">");
        return;
    }
    let prevTagInfo = stack[stack.length - 1];
    if (undefined === prevTagInfo)
        return;
    if (rules.respectIndentation() &&
        !tagInfo.inlineEl &&
        !tagInfo.preservedTextPath &&
        "Initial" !== tagInfo.textFormat) {
        results.push("\n");
        results.push("\t".repeat(prevTagInfo.indentCount));
    }
    let closeSeq = rules.getCloseSequenceFromAltTextTag(tag);
    if (closeSeq) {
        results.push(closeSeq);
        results.push(">");
        return;
    }
    results.push("</");
    results.push(tag);
    results.push(">");
}
function pushAttr(results, stack, _rules, templateStr, step) {
    let attr = getTextFromStep(templateStr, step);
    pushAttrComponent(results, stack, attr);
}
function pushAttrComponent(results, stack, attr) {
    let tagInfo = stack[stack.length - 1];
    if (tagInfo === undefined)
        return;
    if (tagInfo.bannedPath)
        return;
    results.push(" ");
    results.push(attr.trim());
}
function pushAttrValue(results, stack, _rules, templateStr, step) {
    let val = getTextFromStep(templateStr, step);
    pushAttrValueComponent(results, stack, val);
}
function pushAttrValueComponent(results, stack, val) {
    let tagInfo = stack[stack.length - 1];
    if (tagInfo === undefined)
        return;
    if (tagInfo.bannedPath)
        return;
    results.push('="');
    results.push(val.trim());
    results.push('"');
}
function pushAttrValueUnquoted(results, stack, _rules, templateStr, step) {
    let tagInfo = stack[stack.length - 1];
    if (tagInfo === undefined)
        return;
    if (tagInfo.bannedPath)
        return;
    let val = getTextFromStep(templateStr, step);
    results.push("=");
    results.push(val);
}
function pushText(results, stack, rules, templateStr, step) {
    let text = getTextFromStep(templateStr, step);
    pushTextComponent(results, stack, rules, text);
}
function pushTextComponent(results, stack, rules, text) {
    if (allSpaces(text))
        return;
    let tagInfo = stack[stack.length - 1];
    if (tagInfo === undefined)
        return;
    if (tagInfo.bannedPath || tagInfo.voidEl)
        return;
    // preserved text
    if (tagInfo.preservedTextPath) {
        results.push(text);
        tagInfo.textFormat = "Inline";
        return;
    }
    // alt text
    let altText = rules.getCloseSequenceFromAltTextTag(tagInfo.tag);
    if (altText) {
        addAltElementText(results, text, tagInfo);
        tagInfo.textFormat = "Inline";
        return;
    }
    // if unformatted
    if (!rules.respectIndentation()) {
        addInlineText(results, text, tagInfo);
        tagInfo.textFormat = "Inline";
        return;
    }
    // formatted
    if ("Inline" === tagInfo.textFormat) {
        results.push(" ");
    }
    if (tagInfo.inlineEl || "Inline" === tagInfo.textFormat) {
        addFirstLineText(results, text, tagInfo);
    }
    else {
        addText(results, text, tagInfo);
    }
    tagInfo.textFormat = "Inline";
}
// helpers
function allSpaces(text) {
    return text.length === getIndexOfFirstChar(text);
}
function addAltElementText(results, text, tagInfo) {
    let commonIndex = getMostCommonSpaceIndex(text);
    for (let line of text.split("\n")) {
        if (allSpaces(line))
            continue;
        results.push("\n");
        results.push("\t".repeat(tagInfo.indentCount));
        results.push(line.slice(commonIndex).trimEnd());
    }
}
function addFirstLineText(results, text, tagInfo) {
    let texts = text.split("\n");
    let index = 0;
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (!allSpaces(line)) {
            results.push(line.trim());
            break;
        }
    }
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        results.push("\n");
        results.push("\t".repeat(tagInfo.indentCount));
        results.push(line.trim());
    }
}
function addInlineText(results, text, tagInfo) {
    let texts = text.split("\n");
    let index = 0;
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        if ("Root" !== tagInfo.textFormat && "Initial" !== tagInfo.textFormat) {
            results.push(" ");
        }
        results.push(line.trim());
        break;
    }
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (!allSpaces(line)) {
            results.push(" ");
            results.push(line.trim());
        }
    }
}
function addText(results, text, tagInfo) {
    let texts = text.split("\n");
    let index = 0;
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        if ("Root" !== tagInfo.textFormat) {
            results.push("\n");
        }
        results.push("\t".repeat(tagInfo.indentCount));
        results.push(line.trim());
        break;
    }
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        results.push("\n");
        results.push("\t".repeat(tagInfo.indentCount));
        results.push(line.trim());
    }
}
function getIndexOfFirstChar(text) {
    for (let index = 0; index < text.length; index++) {
        if (!spaceCharCodes.has(text.charCodeAt(index)))
            return index;
    }
    return text.length;
}
function getMostCommonSpaceIndex(text) {
    let spaceIndex = text.length;
    let prevLine = "";
    let texts = text.split("\n");
    let index = 0;
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        spaceIndex = getIndexOfFirstChar(line);
        prevLine = line;
        break;
    }
    while (index < texts.length) {
        let line = texts[index];
        index += 1;
        if (allSpaces(line))
            continue;
        let currIndex = getMostCommonIndexBetweenTwoStrings(prevLine, line);
        if (currIndex < spaceIndex) {
            spaceIndex = currIndex;
        }
        prevLine = line;
    }
    return spaceIndex;
}
function getMostCommonIndexBetweenTwoStrings(source, target) {
    let minLength = Math.min(source.length, target.length);
    for (let index = 0; index < minLength; index++) {
        let sourceChar = source.charCodeAt(index);
        let targetChar = target.charCodeAt(index);
        if (sourceChar === targetChar && spaceCharCodes.has(sourceChar)) {
            continue;
        }
        return index;
    }
    return minLength - 1;
}

class TemplateBit {
    component;
    template;
    //
    stackDepth;
    injIndex = 0;
    constructor(component, results, stackDepth) {
        this.component = component;
        this.template = results;
        this.stackDepth = stackDepth;
    }
}
function composeString(builder, rules, component) {
    let results = [];
    let tagInfoStack = [new TagInfo(rules, ":root")];
    let componentStack = [
        getStackBitFromComponent(tagInfoStack, builder, rules, component),
    ];
    while (componentStack.length) {
        const cmpntBit = componentStack.pop();
        if (typeof cmpntBit === "string") {
            pushTextComponent(results, tagInfoStack, rules, cmpntBit);
        }
        if (Array.isArray(cmpntBit)) {
            for (let index = cmpntBit.length - 1; -1 < index; index--) {
                let bit = getStackBitFromComponent(tagInfoStack, builder, rules, cmpntBit[index]);
                componentStack.push(bit);
            }
        }
        if (cmpntBit instanceof TemplateBit) {
            // increase index
            let index = cmpntBit.injIndex;
            cmpntBit.injIndex += 1;
            // add text chunk
            let chunk = cmpntBit.template.steps[index];
            if (chunk) {
                let templateStr;
                if (cmpntBit.component instanceof TmplComponent) {
                    templateStr = cmpntBit.component.templateStr;
                }
                if (cmpntBit.component instanceof TaggedTmplComponent) {
                    templateStr = cmpntBit.component.templateArr[index];
                }
                if (templateStr) {
                    composeSteps(rules, results, tagInfoStack, templateStr, chunk);
                }
            }
            else {
                // end of the template, check for balance
                if (cmpntBit.stackDepth !== tagInfoStack.length) {
                    return [
                        undefined,
                        new Error(`
Coyote Err: the following template component is imbalanced:
${chunk}`),
                    ];
                }
            }
            // handle injection
            let injKind = cmpntBit.template.injs[index];
            let injection = cmpntBit.component.injections[index];
            if (injKind && injection) {
                if ("AttrMapInjection" === injKind) {
                    addAttrInj(tagInfoStack, results, injection);
                }
                if ("DescendantInjection" === injKind) {
                    componentStack.push(cmpntBit);
                    let bit = getStackBitFromComponent(tagInfoStack, builder, rules, injection);
                    componentStack.push(bit);
                    continue;
                }
            }
            // tail case
            if (index < cmpntBit.template.steps.length) {
                componentStack.push(cmpntBit);
            }
        }
    }
    return [results.join(""), undefined];
}
function getStackBitFromComponent(stack, builder, rules, component) {
    if (typeof component === "string" || Array.isArray(component))
        return component;
    if (component instanceof TmplComponent) {
        let templateSteps = builder.build(rules, component.templateStr);
        return new TemplateBit(component, templateSteps, stack.length);
    }
    if (component instanceof TaggedTmplComponent) {
        let templateSteps = builder.buildTemplateLiteral(rules, component.templateArr);
        return new TemplateBit(component, templateSteps, stack.length);
    }
}
function addAttrInj(stack, results, component) {
    if (component instanceof AttrComponent)
        return pushAttrComponent(results, stack, component.attr);
    if (component instanceof AttrValComponent) {
        pushAttrComponent(results, stack, component.attr);
        return pushAttrValueComponent(results, stack, component.value);
    }
    if (Array.isArray(component)) {
        for (const cmpnt of component) {
            if (cmpnt instanceof AttrComponent)
                pushAttrComponent(results, stack, cmpnt.attr);
            if (cmpnt instanceof AttrValComponent) {
                pushAttrComponent(results, stack, cmpnt.attr);
                pushAttrValueComponent(results, stack, cmpnt.value);
            }
        }
    }
}

let bannedElements = new Set([
    "acronym",
    "big",
    "center",
    "content",
    "dir",
    "font",
    "frame",
    "framset",
    "image",
    "marquee",
    "menuitem",
    "nobr",
    "noembed",
    "noframes",
    "param",
    "plaintext",
    "rb",
    "rtc",
    "shadow",
    "strike",
    "tt",
    "xmp",
]);
let inlineElements = new Set([
    "abbr",
    "b",
    "bdi",
    "bdo",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "kbd",
    "mark",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
]);
let voidElements = new Set([
    "!DOCTYPE",
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);
class ServerRules {
    getInitialNamespace() {
        return "html";
    }
    tagIsAtributeless(tag) {
        return isAtributeless(tag);
    }
    getCloseSequenceFromAltTextTag(tag) {
        return getCloseSequenceFromAltTextTag(tag);
    }
    getAltTextTagFromCloseSequence(tag) {
        return getAltTextTagFromCloseSequence(tag);
    }
    respectIndentation() {
        return true;
    }
    tagIsBannedEl(tag) {
        return bannedElements.has(tag);
    }
    tagIsVoidEl(tag) {
        return voidElements.has(tag);
    }
    tagIsNamespaceEl(tag) {
        return isNameSpaceEl(tag);
    }
    tagIsPreservedTextEl(tag) {
        return isPreservedTextEl(tag);
    }
    tagIsInlineEl(tag) {
        return inlineElements.has(tag);
    }
}
class ClientRules {
    getInitialNamespace() {
        return "html";
    }
    tagIsAtributeless(tag) {
        return isAtributeless(tag);
    }
    getCloseSequenceFromAltTextTag(tag) {
        return getCloseSequenceFromAltTextTag(tag);
    }
    getAltTextTagFromCloseSequence(tag) {
        return getAltTextTagFromCloseSequence(tag);
    }
    respectIndentation() {
        return false;
    }
    tagIsBannedEl(tag) {
        return ("!--" === tag ||
            "link" === tag ||
            "script" === tag ||
            "style" === tag ||
            bannedElements.has(tag));
    }
    tagIsVoidEl(tag) {
        return voidElements.has(tag);
    }
    tagIsNamespaceEl(tag) {
        return isNameSpaceEl(tag);
    }
    tagIsPreservedTextEl(tag) {
        return isPreservedTextEl(tag);
    }
    tagIsInlineEl() {
        return true;
    }
}
class XmlRules {
    getInitialNamespace() {
        return "xml";
    }
    tagIsAtributeless(tag) {
        return isAtributeless(tag);
    }
    getCloseSequenceFromAltTextTag(tag) {
        if ("!--" === tag)
            return "--";
        if ("![CDATA[" === tag)
            return "]]";
    }
    getAltTextTagFromCloseSequence(tag) {
        if ("--" === tag)
            return "!--";
        if ("]]" === tag)
            return "![CDATA[";
    }
    respectIndentation() {
        return true;
    }
    tagIsBannedEl() {
        return false;
    }
    tagIsVoidEl() {
        return false;
    }
    tagIsNamespaceEl() {
        return false;
    }
    tagIsPreservedTextEl() {
        return false;
    }
    tagIsInlineEl() {
        return false;
    }
}
function isAtributeless(tag) {
    return "!--" === tag;
}
function getCloseSequenceFromAltTextTag(tag) {
    if ("!--" === tag)
        return "--";
    if ("script" === tag)
        return "</script";
    if ("style" === tag)
        return "</style";
}
function getAltTextTagFromCloseSequence(tag) {
    if ("--" === tag)
        return "!--";
    if ("</script" === tag)
        return "script";
    if ("</style" === tag)
        return "style";
}
function isNameSpaceEl(tag) {
    return "html" === tag || "svg" === tag || "math" === tag;
}
function isPreservedTextEl(tag) {
    return "pre" === tag;
}

class Results {
    steps = [[]];
    injs = [];
}
function isInjection(kind) {
    return "AttrMapInjection" === kind || "DescendantInjection" === kind;
}
function compose(ruleset, templateStr) {
    let results = new Results();
    for (let step of parseStr(ruleset, templateStr, "Initial")) {
        if (isInjection(step.kind)) {
            pushInjection(results, step.kind);
            continue;
        }
        pushStep(results, step);
    }
    return results;
}
function composeTemplateArr(ruleset, templateStrArr) {
    let results = new Results();
    let stepKind = "Initial";
    // every one except for the last
    for (let [index, templateStr] of templateStrArr.entries()) {
        let steps = parseStr(ruleset, templateStr, stepKind);
        for (let index = 1; index < steps.length; index++) {
            let step = steps[index];
            stepKind = step.kind;
            pushStep(results, step);
        }
        // if last template str stop
        if (index > templateStrArr.length - 1)
            continue;
        let injStepKind = route("{", stepKind);
        if (!isInjection(injStepKind)) {
            injStepKind = undefined;
        }
        pushInjection(results, injStepKind);
        if ("DescendantInjection" === injStepKind)
            stepKind = "Initial";
        if ("AttrMapInjection" === injStepKind)
            stepKind = "ElementSpace";
    }
    return results;
}
function pushStep(results, step) {
    results.steps[results.steps.length - 1]?.push(step);
}
function pushInjection(results, stepKind) {
    results.steps.push([]);
    results.injs.push(stepKind);
}

// import { compose } from "./template_steps.js";
class Builder {
    // place to add cache for:
    // - templateStr
    // - templateArr
    build(ruleset, templateStr) {
        return compose(ruleset, templateStr);
    }
    buildTemplateLiteral(ruleset, templateArray) {
        return composeTemplateArr(ruleset, templateArray);
    }
}

class Html {
    rules = new ServerRules();
    builder = new Builder();
    build(component) {
        return composeString(this.builder, this.rules, component);
    }
}
class ClientHtml {
    rules = new ClientRules();
    builder = new Builder();
    build(component) {
        return composeString(this.builder, this.rules, component);
    }
}
class Xml {
    rules = new XmlRules();
    builder = new Builder();
    build(component) {
        return composeString(this.builder, this.rules, component);
    }
}

export { ClientHtml, Html, Xml, attr, attrVal, text, tmpl, tmplStr };
