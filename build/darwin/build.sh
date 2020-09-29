ELECTRON_VERSION=v10.1.2
APP_NAME=Hedge

/bin/sh clean.sh

mkdir target
echo install Electron.app...
cp -R ../../client/node_modules/electron/dist/Electron.app target/$APP_NAME.app
mv target/$APP_NAME.app/Contents/MacOS/Electron target/$APP_NAME.app/Contents/MacOS/hedge-v2
cp files/Info.plist target/$APP_NAME.app/Contents/Info.plist
cp files/hedge.icns target/$APP_NAME.app/Contents/Resources/hedge.icns
rm target/$APP_NAME.app/Contents/Resources/electron.icns
rm target/$APP_NAME.app/Contents/Resources/default_app.asar

/bin/sh build-client.sh

/bin/sh build-frontend.sh

echo
echo $APP_NAME.app build success.