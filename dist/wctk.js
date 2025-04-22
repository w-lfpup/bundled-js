class Bind {
    constructor(el, callbacks) {
        // do not bind and replace anonymous functions or private methods
        for (let cb of callbacks) {
            if (cb instanceof Function) {
                let name = cb.name;
                if (name && !name.startsWith("#")) {
                    el[name] = cb.bind(el);
                }
            }
        }
    }
}

function bindCallbacks(el, callbacks) {
    let events = [];
    for (let [name, cb] of callbacks) {
        let callback = cb;
        if (cb instanceof Function) {
            callback = cb.bind(el);
        }
        events.push([name, callback]);
    }
    return events;
}
class Events {
    #connected = false;
    #callbacks = [];
    #targetEl;
    constructor(params) {
        const { host, target, callbacks, connected } = params;
        this.#targetEl = target ?? host;
        this.#callbacks = bindCallbacks(host, callbacks);
        if (connected)
            this.connect();
    }
    connect() {
        if (this.#connected)
            return;
        this.#connected = true;
        for (let [name, callback] of this.#callbacks) {
            this.#targetEl.addEventListener(name, callback);
        }
    }
    disconnect() {
        if (!this.#connected)
            return;
        this.#connected = false;
        for (let [name, callback] of this.#callbacks) {
            this.#targetEl.removeEventListener(name, callback);
        }
    }
}

class Microtask {
    #queued = false;
    #callbacks = [];
    constructor(el, callbacks) {
        for (let callback of callbacks) {
            this.#callbacks.push(callback.bind(el));
        }
    }
    queue() {
        if (this.#queued)
            return;
        this.#queued = true;
        queueMicrotask(() => {
            this.#queued = false;
            for (let callback of this.#callbacks) {
                callback();
            }
        });
    }
}

class Subscription {
    #connected = false;
    #callback;
    #affect;
    #subscribe;
    #unsubscribe;
    constructor(params) {
        let { host, callback, connected, subscribe, unsubscribe } = params;
        this.#callback = callback.bind(host);
        this.#subscribe = subscribe;
        this.#unsubscribe = unsubscribe;
        if (connected)
            this.connect();
    }
    connect() {
        if (this.#connected)
            return;
        this.#connected = true;
        this.#affect = this.#subscribe(this.#callback);
    }
    disconnect() {
        if (!this.#connected)
            return;
        this.#connected = false;
        this.#unsubscribe(this.#affect);
    }
}

const shadowRootInitFallback = {
    mode: "closed",
};
class Wc {
    #internals;
    #declarative;
    constructor(params) {
        let { host } = params;
        this.#internals = host.attachInternals();
        this.#declarative = this.#internals.shadowRoot !== null;
        if (!this.#declarative) {
            let shadowRootInit = params.shadowRootInit ?? shadowRootInitFallback;
            host.attachShadow(shadowRootInit);
            let { formValue, formState } = params;
            if (formValue)
                this.setFormValue(formValue, formState);
        }
        let { adoptedStyleSheets } = params;
        if (adoptedStyleSheets)
            this.adoptedStyleSheets = adoptedStyleSheets;
    }
    get declarative() {
        return this.#declarative;
    }
    get shadowRoot() {
        return this.#internals.shadowRoot;
    }
    get adoptedStyleSheets() {
        return this.#internals.shadowRoot.adoptedStyleSheets;
    }
    set adoptedStyleSheets(stylesheets) {
        this.#internals.shadowRoot.adoptedStyleSheets = stylesheets;
    }
    checkValidity() {
        return this.#internals.checkValidity();
    }
    reportValidity() {
        return this.#internals.reportValidity();
    }
    setFormValue(value, state) {
        this.#internals.setFormValue(value, state);
    }
    setValidity(flags, message, anchor) {
        this.#internals.setValidity(flags, message, anchor);
    }
}

export { Bind, Events, Microtask, Subscription, Wc };
