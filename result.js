"use strict";

const inspect = require("util").inspect;

function Ok(t) {
    return new Result(true, t);
}

function Fail(f) {
    return new Result(false, f);
}

function Result(is_ok, value) {
    this.is_ok = is_ok
    this.value = value
}

Result.prototype = {
    ok(/*this,*/ errorMessage) {
        if (this.is_ok) {
            return this.value;
        } else {
            if (errorMessage) {
                throw new TypeError(errorMessage);
            } else {
                throw new TypeError("Attempted to unwrap Ok(t) but got Fail(f) instead.");
            }
        }
    },

    fail(/*this,*/ errorMessage) {
        if (this.is_ok) {
            if (errorMessage) {
                throw new TypeError(errorMessage);
            } else {
                throw new TypeError("Attempted to unwrap Fail(f) but got Ok(t) instead.");
            }
        } else {
            return this.value;
        }
    },

    isOk(/*this*/) {
        return this.is_ok;
    },

    isFail(/*this*/) {
        return !this.is_ok;
    },

    // (Result<T, F>, T -> T') -> Result<T', F>
    map(/*this,*/ f) {
        if (this.is_ok) {
            return Ok(f(this.value));
        } else {
            return this;
        }
    },

    // (Result<T, F>, F -> F') -> Result<T, F'>
    mapFail(/*this,*/ f) {
        if (this.is_ok) {
            return this;
        } else {
            return Fail(f(this.value));
        }
    },

    // TODO(havvy): When generators are in Node, add .generator(), analogous to .iter()

    // (Result<T, F>, A) -> Result<_, F> | A
    // where A should := Result<T, F>
    and(/*this,*/ rhsResult) {
        if (this.is_ok) {
            return rhsResult;
        } else {
            return this;
        }
    },

    // (Result<T, F>, A) -> Result<T | _> | A
    // where A should := Result<T, F>
    or(/*this,*/ rhsResult) {
        if (this.is_ok) {
            return this;
        } else {
            return rhsResult;
        }
    },

    // (Result<T, F>, FN) -> Result<T, F> | A
    // where FN := T -> A
    // where A should := Result<T', F>
    andThen(/*this,*/ f) {
        if (this.is_ok) {
            return f(this.value);
        } else {
            return this;
        }
    },

    // (Result<T, F>, FN -> Result<T, F> | A
    // where FN := F -> A
    // where A should := Result<T, F'>
    orElse(/*this,*/ f) {
        if (this.is_ok) {
            return this;
        } else {
            return f(this.value);
        }
    },

    // (Result<T, F>) -> TList
    // where TList := [T]
    // such that TList.length === 0 || T.List.length === 1
    toArray(/*this*/) {
        if (this.is_ok) {
            return [this.value];
        } else {
            return [];
        }
    },

    // (Result<T, F>, A) -> T | A
    // where A should := T
    unwrapOr(/*this,*/ defaultValue) {
        if (this.is_ok) {
            return this.value;
        } else {
            return defaultValue;
        }
    },

    // (Result<T, F>, F -> A) -> T | A
    // where A should := T
    unwrapOrElse(/*this,*/ defaultFn) {
        if (this.is_ok) {
            return this.value;
        } else {
            return defaultFn(this.value);
        }
    },

    // Fn(Result<T, F>, {Ok(value: T) -> void, Fail(failure: F) -> void}) -> void
    match(/*this,*/ matchBlock) {
        if (this.is_ok) {
            return matchBlock.Ok(this.value);
        } else {
            return matchBlock.Fail(this.value);
        }
    },

    /// https://nodejs.org/api/util.html#util_custom_inspect_function_on_objects
    // Fn(Result<T, F>, Number, InspectOpts) -> String
    inspect(/* this,*/ depth, opts) {
        var tag = this.is_ok ? "Ok" : "Fail";

        if (depth < 0) {
            return opts.stylize("[" + tag + "]", "boolean");
        }

        var recurseOpts = {};
        Object.keys(opts).forEach(function (key) {
            recurseOpts[key] = opts[key];
        });
        recurseOpts.depth = opts.depth === null ? null : opts.depth - 1;

        return opts.stylize(tag, "boolean") + "( " + inspect(this.value, recurseOpts) + " )";
    },

    // Fn(Result<T, F>, Fn(String) -> void, InspectOpts)
    debug(/*this,*/ logfn, inspectOpts) {
        logfn(inspect(this, inspectOpts));
    },

    // Fn(Result<T, F>, Fn(String) -> void, InspectOpts)
    debugOk(/*this,*/ logfn, inspectOpts) {
        if (this.is_ok) {
            logfn(inspect(this.value, inspectOpts));
        }

        return this;
    },

    // Fn(Result<T, F>, Fn(String) -> void, InspectOpts)
    debugFail(/*this,*/ logfn, inspectOpts) {
        if (!this.is_ok) {
            logfn(inspect(this.value, inspectOpts));
        }

        return this;
    }
}

module.exports = {
    Ok: Ok,
    Fail: Fail
};

Object.getOwnPropertyNames(Result.prototype)
.filter(function (v) { return v !== "constructor" && v !== "inspect" })
.forEach(function (key) {
    module.exports[key] = function() {
        const result = arguments[0]
        const args = Array.prototype.slice.call(arguments, 1)
        return result[key].apply(result, args)
    }
});
