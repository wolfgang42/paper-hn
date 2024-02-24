#!/bin/sh

set -eux

USER=$1
rm $0 # Remove self

# TODO: Needed?
# Ensure strict ownership and perms.
# mkdir -p /home/$USER/.ssh
# chown -R root:root /home/$USER/.ssh
# chmod -R 0444 /home/$USER/.ssh

# Improve strength of diffie-hellman-group-exchange-sha256 (Custom DH with SHA2).
# See https://stribika.github.io/2015/01/04/secure-secure-shell.html
#
# Columns in the moduli file are:
# Time Type Tests Tries Size Generator Modulus
#
# This file is provided by the openssh package on Fedora.
moduli=/etc/ssh/moduli
if [[ -f ${moduli} ]]; then
  cp ${moduli} ${moduli}.orig
  awk '$5 >= 2000' ${moduli}.orig > ${moduli}
  rm -f ${moduli}.orig
fi

# Remove existing crontabs, if any.
rm -fr /var/spool/cron
rm -fr /etc/crontabs
rm -fr /etc/periodic

# Remove all but a handful of admin commands.
find /usr/sbin ! -type d \
  -a ! -name unix_chkpwd \
  -a ! -name nologin \
  -a ! -name nginx \
  -a ! -name setup-proxy \
  -a ! -name sshd \
  -a ! -name start.sh \
  -delete

# Remove world-writable permissions.
# This breaks apps that need to write to /tmp,
# such as ssh-agent.
find / -xdev -type d -perm /0002 -exec chmod o-w {} +
find / -xdev -type f -perm /0002 -exec chmod o-w {} +

# Remove unnecessary user accounts.
sed -i -r '/^('$USER'|root|sshd)/!d' /etc/group
sed -i -r '/^('$USER'|root|sshd)/!d' /etc/passwd

# Remove interactive login shell for everybody but user.
sed -i -r '/^'$USER':/! s#^(.*):[^:]*$#\1:/sbin/nologin#' /etc/passwd

sysdirs="
  /bin
  /etc
  /lib
  /sbin
  /usr
"

# Remove apk configs.
find $sysdirs -xdev -regex '.*apk.*' -exec rm -fr {} +

# Ensure system dirs are owned by root and not writable by anybody else.
find $sysdirs -xdev -type d \
  -exec chown root:root {} \; \
  -exec chmod 0755 {} \;

# Remove all suid files.
find $sysdirs -xdev -type f -a -perm /4000 -delete

# Remove all guid files.
find $sysdirs -xdev -type f -a -perm /2000 -delete

# Remove other programs that could be dangerous.
find $sysdirs -xdev \( \
  -name hexdump -o \
  -name chgrp -o \
  -name chmod -o \
  -name chown -o \
  -name ln -o \
  -name od -o \
  -name strings -o \
  -name su \
  \) -delete

  # Remove init scripts since we do not use them.
rm -fr /etc/init.d
rm -fr /lib/rc
rm -fr /etc/conf.d
rm -fr /etc/inittab
rm -fr /etc/runlevels
rm -fr /etc/rc.conf

# # Remove kernel tunables since we do not need them.
rm -fr /etc/sysctl*
rm -fr /etc/modprobe.d
rm -fr /etc/modules
rm -fr /etc/mdev.conf
rm -fr /etc/acpi

# # Remove root homedir since we do not need it.
rm -fr /root

# # Remove fstab since we do not need it.
rm -f /etc/fstab

# Remove broken symlinks (because we removed the targets above).
find $sysdirs -xdev -type l -exec test ! -e {} \; -delete

# Remove almost all commands, all other users

command_paths="
  /bin
  /sbin
  /usr/bin
  /usr/local/bin
  /usr/sbin
"

# sh necessary for Healthchecks
# rm /bin/sh
# cp /bin/bash /bin/sh

find $command_paths -xdev \( \
  -name apt -o \
  -name cat -o \
  -name date -o \
  -name id -o \
  -name ldd -o \
  -name ls -o \
  -name pgrep -o \
  -name ps -o \
  -name stty -o \
  -name unix_chkpwd -o \
  -name which \
  \) -delete
