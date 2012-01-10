#!/bin/sh
cd ../site

# Jade
mkdir -p ./public/html; cd ./src; ../../tools/jade.js --out ../public html

# Sass
cd ..; mkdir -p public/styles; 

sass --watch src/styles:public/styles

#cd src/styles;

#for file in *.scss
#do
#  sass --watch "$file" "../../public/styles/$file.css"
#done

#cd ../../

# CoffeeScript
mkdir -p public/scripts; coffee -c -o ./public/scripts ./src/scripts

