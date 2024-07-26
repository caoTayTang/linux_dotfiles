-- default

vim.g.mapleader = ' '
vim.g.maplocalleader = ' '
vim.opt.termguicolors = true
-- staline setting
vim.opt.laststatus = 2
vim.opt.showtabline = 0
-- nvim  tree setting
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1
-- hardtime
-- vim.g.hardtime_default_on = 1
-- vim.g.hardtime_maxcount = 2
-- vim.g.hardtime_motion_with_count_resets = 1
-- vim.g.hardtime_showmsg = 1
--nvim tree
vim.g.nvim_tree_respect_buf_cwd = 1

-- nvim tree
-- Unless you are still migrating, remove the deprecated commands from v1.x
vim.g.neo_tree_remove_legacy_commands = 1

vim.g.scrolloff = 999
vim.g.spell = true
vim.g.spelllang = { 'en_us', 'vn' }
vim.o.relativenumber = false
vim.o.cursorline = true

vim.opt.jumpoptions = "stack,view"


vim.o.relativenumber = true
-- vim.g.user_emmet_leader_key = '<tab>'
vim.g.GIT_LENS_ENABLED = true

vim.o.expandtab = true
vim.o.tabstop = 8
vim.o.softtabstop = 4
vim.o.shiftwidth = 4
vim.o.encoding = 'utf-8'
