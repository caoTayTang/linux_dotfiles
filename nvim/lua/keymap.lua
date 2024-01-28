--- barbar.nvim ---

local map = vim.api.nvim_set_keymap
local opts = { noremap = true, silent = true }

-- Move to previous/next
map('n', '<A-,>', '<Cmd>BufferPrevious<CR>', opts)
map('n', '<A-Tab>', '<Cmd>BufferNext<CR>', opts)
-- Re-order to previous/next
map('n', '<A-<>', '<Cmd>BufferMovePrevious<CR>', opts)
map('n', '<A->>', '<Cmd>BufferMoveNext<CR>', opts)
-- Goto buffer in position...
map('n', '<A-1>', '<Cmd>BufferGoto 1<CR>', opts)
map('n', '<A-2>', '<Cmd>BufferGoto 2<CR>', opts)
map('n', '<A-3>', '<Cmd>BufferGoto 3<CR>', opts)
map('n', '<A-4>', '<Cmd>BufferGoto 4<CR>', opts)
map('n', '<A-5>', '<Cmd>BufferGoto 5<CR>', opts)
map('n', '<A-6>', '<Cmd>BufferGoto 6<CR>', opts)
map('n', '<A-7>', '<Cmd>BufferGoto 7<CR>', opts)
map('n', '<A-8>', '<Cmd>BufferGoto 8<CR>', opts)
map('n', '<A-9>', '<Cmd>BufferGoto 9<CR>', opts)
map('n', '<A-0>', '<Cmd>BufferLast<CR>', opts)
-- Pin/unpin buffer
map('n', '<A-p>', '<Cmd>BufferPin<CR>', opts)
-- Close buffer
map('n', '<A-c>', '<Cmd>BufferClose<CR>', opts)
-- Wipeout buffer
--                 :BufferWipeout
-- Close commands
--                 :BufferCloseAllButCurrent
--                 :BufferCloseAllButPinned
--                 :BufferCloseAllButCurrentOrPinned
--                 :BufferCloseBuffersLeft
--                 :BufferCloseBuffersRight
-- Magic buffer-picking mode
map('n', '<C-p>', '<Cmd>BufferPick<CR>', opts)
-- Sort automatically by...
map('n', '<Space>bb', '<Cmd>BufferOrderByBufferNumber<CR>', opts)
map('n', '<Space>bd', '<Cmd>BufferOrderByDirectory<CR>', opts)
map('n', '<Space>bl', '<Cmd>BufferOrderByLanguage<CR>', opts)
map('n', '<Space>bw', '<Cmd>BufferOrderByWindowNumber<CR>', opts)

-- Other:
-- :BarbarEnable - enables barbar (enabled by default)
-- :BarbarDisable - very bad command, should never be used
--


-- custom mapping
-- Diagnostic keymaps
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, { desc = 'Go to previous diagnostic message' })
vim.keymap.set('n', ']d', vim.diagnostic.goto_next, { desc = 'Go to next diagnostic message' })
vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float, { desc = 'Open floating diagnostic message' })
vim.keymap.set('n', '<leader>q', vim.diagnostic.setloclist, { desc = 'Open diagnostics list' })
-- vim.keymap.set('n', '<C-d>', '<C-d>zz', { desc = "Scroll down" })
-- vim.keymap.set('n', '<C-u>', '<C-u>zz', { desc = "Scroll up" })

local my_nmap = function(keys, func, desc)
  vim.keymap.set('n', keys, func, { desc = desc })
end


-- my mapping
my_nmap('<C-c>', "<cmd> %y+ <CR> ", "Yank whole file")
my_nmap('<M-h>', function() require("nvterm.terminal").toggle('horizontal') end, "Toggle horizontal nvterm")
my_nmap('<M-v>', function() require("nvterm.terminal").toggle('vertical') end, "Toggle nvertical vterm")
my_nmap('<M-i>', function() require("nvterm.terminal").toggle('float') end, "Toggle floating nvterm ")
vim.keymap.set('t', '<leader>x', function() require("nvterm.terminal").toggle_all_terms() end,
  { desc = 'Delete terminal' })

my_nmap('<C-s>', "<cmd>:w<cr>", "Save file")
my_nmap('<leader>cd', ':cd %:p:h<CR>:pwd<CR>', "change dir to the current file")
my_nmap('<Esc>', '<cmd>:noh<cr>', 'No highlight')

-- code runner
vim.keymap.set('n', '<leader>r', ':RunCode<CR>', { noremap = true, silent = false })

-- DEPRECATED NVCHAD
-- vim.keymap.set('t', '<Esc>', '<C-\\><C-n>', { desc = 'Exit terminal' })
--
-- vim.keymap.set('t', '<Esc>', '<C-\\><C-n>', { desc = 'Exit terminal' })
-- vim.keymap.set('t', '<leader>x', function() require("nvterm.terminal").toggle_all_terms() end,
--   { desc = 'Delete terminal' })
-- vim.keymap.set('n', '<leader>rc',
--   function()
--     require('nvterm.terminal').send("clear && g++ -o out " .. vim.fn.expand "%" .. " && ./out", "vertical")
--   end,
--   { desc = 'Run CPP code' })

my_nmap('<Esc>', '<cmd>:noh<cr>', 'No highlight')
-- neo tree mapping
vim.keymap.set('n', '<leader>nl', '<cmd>Neotree left toggle %:p:h:h<cr>', { silent = true, desc = 'Toggle neo tree' })
vim.keymap.set('n', '<leader>nr', '<cmd>Neotree right toggle %:p:h:h<cr>', { silent = true, desc = 'Toggle neo tree' })
vim.keymap.set('n', '<leader>n', '<cmd>Neotree float toggle %:p:h:h<cr>', { silent = true, desc = 'Toggle neo tree' })
-- mapping
-- vim.keymap.set('n', '<tab>', '<cmd>BufferLineCycleNext<cr>', { desc = 'Buffline Next' })
-- vim.keymap.set('n', '<S-tab>', '<cmd>BufferLineCyclePrev<cr>', { desc = 'Buffline Prev' })
-- vim.keymap.set('n', '<leader>x', '<cmd>BufferLinePickClose<cr>', { desc = 'Buffline Close' })

vim.keymap.set('n', 'x', '"_x')

-- Increment/decrement
vim.keymap.set('n', '+', '<C-a>')
vim.keymap.set('n', '-', '<C-x>')

-- Delete a word backwards
vim.keymap.set('n', 'db', 'vb"_d')

-- Select all
vim.keymap.set('n', '<C-a>', 'gg<S-v>G')
-- Resize window
vim.keymap.set('n', '<C-w><left>', '<C-w><')
vim.keymap.set('n', '<C-w><right>', '<C-w>>')
vim.keymap.set('n', '<C-w><up>', '<C-w>+')
vim.keymap.set('n', '<C-w><down>', '<C-w>-')
-- vim tmux navigation
vim.keymap.set('n', '<C-h>', '<cmd> TmuxNavigateLeft<CR>', { desc = 'tmux navigate left' })
vim.keymap.set('n', '<C-l>', '<cmd> TmuxNavigateRight<CR>', { desc = 'tmux navigate right' })
vim.keymap.set('n', '<C-k>', '<cmd> TmuxNavigateUp<CR>', { desc = 'tmux navigate up' })
vim.keymap.set('n', '<C-j>', '<cmd> TmuxNavigateDown<CR>', { desc = 'tmux navigate down' })
vim.keymap.set('n', ';', ':')

-- sync arch clipboard
vim.keymap.set('n', 'y', '"+y')
--vim.keymap.set('n', 'p', '"+p')
vim.keymap.set('n', ':', '<cmd>FineCmdline<CR>', { noremap = true })

--local notify = require('nvim-notify')
--vim.keymap.set('n', 'Esc', notify.dismiss(), { desc = 'dismiss notify' })
