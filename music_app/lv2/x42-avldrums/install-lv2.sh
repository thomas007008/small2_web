#!/bin/sh

VaildateYesNoQuestion ()
{
	while true; do
		read -p "$1 [y/n]: " yn
		case "$yn" in
			[Yy]* ) echo "y"; break;;
			[Nn]* ) echo "n"; break;;
			* ) echo "Please answer Y(es) or N(o)." >&2 ;;
		esac
	done
}

umask 0022

PKG_PATH=$(dirname "$(readlink -f "$0")")
cd "${PKG_PATH}"
BUNDLES=$(ls -d *.lv2)

# sanity check
if test -z "$BUNDLES"; then
	exit
fi
for bdl in ${BUNDLES}; do
	if ! test -d ${bdl}; then
		exit
	fi
done

echo ""
echo " ** ${BUNDLES} **"
echo ""

if test "$(id -u)" = "0"; then
	echo "You are running the installer as 'root'."
	echo "Note that the plugin will not be installed system wide, and"
	echo "you should run the installer with the DAW's user-account."
	echo ""

	ANSWER=$(VaildateYesNoQuestion "Continue install?")
	if test "n" = "$ANSWER"; then
		exit
	fi
fi


# check if the plugin is installed system-wide
FOUND=""
for dir in /usr/lib/lv2 /usr/local/lib/lv2 /usr/local/lib64/lv2 /usr/lib64/lv2 /lib64/lv2/ /lib/lv2; do
	for bdl in ${BUNDLES}; do
		if test -d ${dir}/${bdl}; then
			FOUND="${dir}/${bdl}"
			break
		fi
	done
	if test -n "$FOUND"; then
		break
	fi
done

if test -n "$FOUND"; then
	echo ""
	echo "A previous system-wide installation was found in:"
	echo "  '"$FOUND"'"
	echo "This is likely from a GNU/Linux distribution."
	echo "LV2 hosts automatically pick the lastest version of any given plugin,"
	echo "so duplicate plugins are not likely to cause any issue."
	echo "However, you may want to stay with your distro's version."

	ANSWER=$(VaildateYesNoQuestion "Continue install?")
	if test "n" = "$ANSWER"; then
		exit
	fi
fi

# check for previous install
FOUND=""
for bdl in ${BUNDLES}; do
	if test -e ${HOME}/.lv2/${bdl}; then
		FOUND="${HOME}/.lv2/${bdl}"
		break
	fi
done

if test -n "$FOUND"; then
	echo ""
	echo "A previous installation was found in:"
	echo "  '"$FOUND"'"
	echo ""
	ANSWER=$(VaildateYesNoQuestion "Update existing installation?")
	if test "n" = "$ANSWER"; then
		exit
	fi
else
	echo ""
	ANSWER=$(VaildateYesNoQuestion "Install Plugin to ~/.lv2 ?")
	if test "n" = "$ANSWER"; then
		exit
	fi
fi

for bdl in ${BUNDLES}; do
	if test -e ${HOME}/.lv2/${bdl}; then
		echo "Removing old version ~/.lv2/${bdl}"
		rm -rf ${HOME}/.lv2/${bdl}
	fi
done

# all systems go
echo "Installing to ~/.lv2:"
mkdir -p $HOME/.lv2/
cp -av *.lv2  $HOME/.lv2/

echo ""
echo "Installation completed."
echo ""
echo -n "Press ENTER to exit installer"
read FOO
