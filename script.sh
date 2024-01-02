#! /bin/bash

source_files=(
	"/home/kaios/.zshrc"
	"/home/kaios/.config/alacritty/"
	"/home/kaios/.config/nvim/"
	"/home/kaios/.config/tmux/"
	"/home/kaios/.config/i3/"
	"/home/kaios/.config/eww/"
	"/home/kaios/.config/picom/"
	"/home/kaios/.config/rofi/"
	"/home/kaios/.config/neofetch/"
	"/home/kaios/.config/dunst/"
	)
des="/home/kaios/dotfiles"


function copy() {
	for dir in "${source_files[@]}"; do 
		sudo cp -rp $dir $des
	done
}

copy

read -p "Commit message: " desc
	case $desc in
		n | N | No | no | "") 
			echo "You should up git"
			;;
		*) 
			git add .
			git commit -m "$desc"
			;;
	esac


