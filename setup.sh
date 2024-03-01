#!/bin/bash

echo "install smartpy cli"
bash <(curl -s https://smartpy.io/cli/install.sh)

echo "install taqueria"
curl -LO https://taqueria.io/get/linux/taq
chmod +x taq
sudo mv taq /usr/local/bin
