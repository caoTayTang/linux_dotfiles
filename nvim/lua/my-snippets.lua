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
