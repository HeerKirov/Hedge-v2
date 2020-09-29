APP_NAME=Hedge
APP_FOLDER=target/$APP_NAME.app/Contents/Resources/app

if [ -d "$APP_FOLDER" ]; then
    rm -rf $APP_FOLDER
fi
mkdir $APP_FOLDER

echo compile client...
cd ../../client
tsc
cp -R target node_modules ../build/darwin/$APP_FOLDER/
cp package.json ../build/darwin/$APP_FOLDER/
cd - > /dev/null
rm -rf $APP_FOLDER/node_modules/typescript
rm -rf $APP_FOLDER/node_modules/electron/dist
rm -rf $APP_FOLDER/node_modules/@types
