#!/bin/bash
ICON=$HOME/.config/i3/lock_screen/icon.png
TMPBG=/tmp/mylockscreen.png
scrot /tmp/mylockscreen.png
convert $TMPBG -scale 10% -scale 1000% $TMPBG
convert $TMPBG $ICON -gravity center -composite -matte $TMPBG
i3lock -u -i $TMPBG
rm /tmp/mylockscreen.png
