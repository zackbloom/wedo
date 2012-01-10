#!/bin/bash

if git branch | grep \* | grep -q master
then
  cd site/conf
  ./build.sh
fi
