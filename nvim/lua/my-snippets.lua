local ls = require("luasnip")
-- some shorthands...
local snip = ls.snippet
local snip_node = ls.snippet_node
local text = ls.text_node
local insert = ls.insert_node
local func = ls.function_node
local choice = ls.choice_node
local dynamicn = ls.dynamic_node

local date = function() return { os.date('%Y-%m-%d') } end

ls.add_snippets("javascript", {
    snip({
        trig = "log",
        namr = "Console log",
        dscr = "JS Console log",
    }, {
        text({ "console.log(" }), insert(1, ""), text({ ")" }), insert(0)
    }),
})

ls.add_snippets("cpp", {
    snip({
        trig = "cp",
        namr = "Competitive shorthands",
        dscr = "include and macros",
    }, {
        text({
            "#include <bits/stdc++.h>", "#define el cout << '\\n'", "#define f0(i, n) for (int i = 0; i < n; ++i)",
            "#define f1(i, n) for (int i = 1; i <=n; ++i)", "#define fi first", "#define se second",
            "#define maxn 2e5", "using namespace std;", "typedef long long i64;", "typedef vector<int> vi;",
            "typedef pair<int, int> pii;", "",
            "void solution() {", "\t" }),
        insert(
            2,
            ""), text({ "", "}", "int main() {", "\tios_base::sync_with_stdio(0);", "\tcin.tie(0);", "",
        "\tint t;", "\tcin >> t;",
        "\twhile(t--) {", "\t\tsolution();", "\t}", "\treturn 0;" }),
        text({ "", "}" })
    }),
})
