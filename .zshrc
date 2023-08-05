#HI
#NOTE: Set aliases
alias cd="z"
alias zz="z "
alias ll="exa -lah --icons"
alias cls="clear"
alias ls="exa"
alias vi="nvim"
alias vim="nvim"

dcmvcl() {
  current_dir=$(pwd)
  chdir "/home/kaios/dotfiles"
  sudo /home/kaios/dotfiles/script.sh
  # chdir $current_dir
}

# change dir and list file
cl() {
  local target_dir="${1:-.}"
  chdir "$target_dir" && exa -lah --icons;
}

# to run cpp file if there is any changes
run() {
  if [ -z "$1" ]; then
    echo "Usage: run <cpp_filename>"
    return 1
  fi

  ls "$1" | entr -c sh -c "g++ -o ${1:r} $1 && ./${1:r}"
}

#NOTE: ENV declaration
export ZSH="$HOME/.oh-my-zsh"
# User configuration
export MANPATH="/usr/local/man:$MANPATH"

#search for FILE NAME, wanna search file content? Use ripgrep
export FZF_DEFAULT_COMMAND="rg --files --hidden --follow"
export FZF_DEFAULT_OPTS="--border --layout=reverse --ansi --preview-window 'right:60%' --preview 'bat --color=always --style=header,grid --line-range :300 {}'"

#FZF
export FZF_BASE='/usr/bin/fzf'

#cd to what u choose from fzf
export FZF_ALT_C_OPTS="--preview 'tree -C {}'"

#CTRL T is paste what u choose from fzf
#actually i dont want to preview, but delete it all just dont work
export FZF_CTRL_T_OPTS="
  --preview 'bat -n --color=always {}' --preview-window='down:0%'
  --bind 'ctrl-/:change-preview-window(down|hidden|)'"

#Preview command
# CTRL-/ to toggle small preview window to see the full command
# CTRL-Y to copy the command into clipboard using pbcopy
export FZF_CTRL_R_OPTS="
  --preview 'echo {}' --preview-window up:3:hidden:wrap
  --bind 'ctrl-/:toggle-preview'
  --bind 'ctrl-y:execute-silent(echo -n {2..} | pbcopy)+abort'
  --color header:italic
  --header 'Press CTRL-Y to copy command into clipboard'"

#ibus bamboo vietnamese
export GTK_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
export QT_IM_MODULE=ibus

#NOTE: Configurations

CASE_SENSITIVE="true"

COMPLETION_WAITING_DOTS="true"
HIST_STAMPS="dd/mm/yyyy"

#when startship plugin, then the zsh_theme will be overwritten
plugins=(
    git
    fzf
    zsh-autosuggestions
    starship
    dirhistory
    zsh-syntax-highlighting
        )




# NOTE: Launch at start


#run ohmyzsh config
source $ZSH/oh-my-zsh.sh
eval "$(zoxide init zsh)"

#END OF CONFIG
