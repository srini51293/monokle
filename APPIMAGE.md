# `AppImage`

> AppImages are standalone bundles, and do not need to be installed. However, some users may want their AppImages to be available like distribution provided applications. This primarily involves being able to launch desktop applications from their desktop environments’ launchers. This concept is called desktop integration.

## Download and create [`Desktop Entry`](https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html) file

```sh
cd /tmp
curl -O -Lf https://github.com/kubeshop/monokle/releases/download/downloads/Monokle-linux-x86_64.AppImage
chmod a+x ./Monokle-linux-x86_64.AppImage
./Monokle-linux-x86_64.AppImage --appimage-extract
mkdir -pv ~/.bin/kubeshop || true
mkdir -pv ~/.local/share/applications || true
mv ./squashfs-root ~/.bin/kubeshop/Monokle-linux-x86_64
cp -v ~/.bin/kubeshop/Monokle-linux-x86_64/Monokle.desktop ~/.local/share/applications/io.kubeshop.Monokle.desktop
cd ~/.bin/kubeshop/Monokle-linux-x86_64
sed -i "s|Exec=AppRun --no-sandbox|Exec=$(pwd)/AppRun|" ~/.local/share/applications/io.kubeshop.Monokle.desktop
sed -i "s|Icon=Monokle|Icon=$(pwd)/Monokle.png|" ~/.local/share/applications/io.kubeshop.Monokle.desktop
```

## Run

`Monokle` should appear in the list of applications available when you click `Show Applications`.

## Misc

Tested on:

```sh
$ lsb_release -a
LSB Version:	:core-4.1-amd64:core-4.1-noarch
Distributor ID:	Fedora
Description:	Fedora release 35 (Thirty Five)
Release:	35
Codename:	ThirtyFive
$ cat /etc/os-release      
NAME="Fedora Linux"
VERSION="35 (Workstation Edition)"
ID=fedora
VERSION_ID=35
VERSION_CODENAME=""
PLATFORM_ID="platform:f35"
PRETTY_NAME="Fedora Linux 35 (Workstation Edition)"
ANSI_COLOR="0;38;2;60;110;180"
LOGO=fedora-logo-icon
CPE_NAME="cpe:/o:fedoraproject:fedora:35"
HOME_URL="https://fedoraproject.org/"
DOCUMENTATION_URL="https://docs.fedoraproject.org/en-US/fedora/f35/system-administrators-guide/"
SUPPORT_URL="https://ask.fedoraproject.org/"
BUG_REPORT_URL="https://bugzilla.redhat.com/"
REDHAT_BUGZILLA_PRODUCT="Fedora"
REDHAT_BUGZILLA_PRODUCT_VERSION=35
REDHAT_SUPPORT_PRODUCT="Fedora"
REDHAT_SUPPORT_PRODUCT_VERSION=35
PRIVACY_POLICY_URL="https://fedoraproject.org/wiki/Legal:PrivacyPolicy"
VARIANT="Workstation Edition"
VARIANT_ID=workstation
```

## References

* [`Integrating AppImages into the desktop`](https://docs.appimage.org/user-guide/run-appimages.html#integrating-appimages-into-the-desktop).
