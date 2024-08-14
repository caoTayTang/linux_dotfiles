#!/bin/sh

player_status=$(playerctl status 2> /dev/null)
player_artist=$(playerctl metadata artist)
player_titles=$(playerctl metadata title)

max_length=40
# Combine artist and title
full_text="$player_artist - $player_titles"

if [ ${#full_text} -gt $max_length ]; then
    full_text=$(echo "$full_text" | cut -c 1-$max_length)...
fi

if [ "$player_artist" != "" ]; then
	if [ "$player_status" = "Playing" ]; then
	    echo "  %{F#FFF} $full_text"
	elif [ "$player_status" = "Paused" ]; then
	    echo "  %{F#FFF} $full_text"
	elif [ "$player_status" = "Stopped" ]; then
	    echo "  %{F#FFF} $full_text"
	else
	    echo ""
    fi
fi
