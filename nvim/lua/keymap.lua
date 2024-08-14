-- [[Diagnostic keymaps]]
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev,         { desc = 'Go to previous diagnostic message' })
vim.keymap.set('n', ']d', vim.diagnostic.goto_next,         { desc = 'Go to next diagnostic message'     })
vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float, { desc = 'Open floating diagnostic message'  })
vim.keymap.set('n', '<leader>f', "<cmd>:Format<CR>",        { desc = 'Format code'                       })
vim.keymap.set('n', '<leader>q', vim.diagnostic.setloclist, { desc = 'Open diagnostics list'             })
-- [[Terminal]]
vim.keymap.set('n', '<M-h>', function() require("nvterm.terminal").toggle('horizontal')     end,
    { desc = "Toggle horizontal nvterm" })
vim.keymap.set('n', '<M-h>', function() require("nvterm.terminal").toggle('horizontal')     end,
    { desc = "Toggle horizontal nvterm" })
vim.keymap.set('n', '<M-v>', function() require("nvterm.terminal").toggle('vertical')       end,
    { desc = "Toggle nvertical vterm"   })
vim.keymap.set('n', '<M-i>', function() require("nvterm.terminal").toggle('float')          end,
    { desc = "Toggle floating nvterm "  })
vim.keymap.set('t', '<M-v>', function() require("nvterm.terminal").toggle('vertical')       end,
    { desc = 'Toggle vertical term'     })
vim.keymap.set('t', '<M-h>', function() require("nvterm.terminal").toggle('horizontal')     end,
    { desc = 'Toggle horizontal term'   })
vim.keymap.set('t', '<M-i>', function() require("nvterm.terminal").toggle('float')          end,
    { desc = 'Toggle float term'        })
vim.keymap.set('n', '<Esc>', '<cmd>:noh<cr>',
    { desc = 'No highlight'})
-- [[Neotree]]
vim.keymap.set('n', '<leader>nl',   '<cmd>Neotree position=current dir=%:p:h:h reveal_force_cwd left toggle<cr>',    { silent = true,   desc = 'Toggle neo tree' })
vim.keymap.set('n', '<leader>nr',    '<cmd>Neotree position=current dir=%:p:h:h reveal_force_cwd right toggle<cr>',  { silent = true,   desc = 'Toggle neo tree' })
vim.keymap.set('n', '<leader>n',    '<cmd>Neotree position=current dir=%:p:h:h reveal_force_cwd float toggle<cr>',   { silent = true,   desc = 'Toggle neo tree' })

-- [[Utils]]
vim.keymap.set('n', 'db',   'vb"_d', {desc = 'Delete backward'})
vim.keymap.set('n', 'x',    '"_x')
-- Resize window
vim.keymap.set('n', '<C-w><left>',  '<C-w><')
vim.keymap.set('n', '<C-w><right>', '<C-w>>')
vim.keymap.set('n', '<C-w><up>',    '<C-w>+')
vim.keymap.set('n', '<C-w><down>',  '<C-w>-')
-- vim tmux navigation
vim.keymap.set('n', '<C-h>', '<cmd> TmuxNavigateLeft  <CR>',    { desc = 'tmux navigate left'   })
vim.keymap.set('n', '<C-l>', '<cmd> TmuxNavigateRight <CR>',    { desc = 'tmux navigate right'  })
vim.keymap.set('n', '<C-k>', '<cmd> TmuxNavigateUp    <CR>',    { desc = 'tmux navigate up'     })
vim.keymap.set('n', '<C-j>', '<cmd> TmuxNavigateDown  <CR>',    { desc = 'tmux navigate down'   })
-- sync arch clipboard
vim.keymap.set('n', 'y', '"+y')
-- delete buffer
vim.keymap.set('n', '<leader>x', '<cmd> bdelete <CR>',          { desc = 'Delete not using buffer' })
-- change dir to current file
vim.keymap.set('n','<leader>cd', ':cd %:p:h<CR>:pwd<CR>',       { desc = "change dir to the current file" })
vim.keymap.set('n','<leader>ss', ':source %<CR>',       { desc = "change dir to the current file" })
