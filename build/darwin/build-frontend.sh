APP_NAME=Hedge
APP_FOLDER=target/$APP_NAME.app/Contents/Resources/app

if [ -d "$APP_FOLDER/frontend" ]; then
    rm -rf $APP_FOLDER/frontend
fi

echo compile frontend...
cd ../../frontend
yarn build > /dev/null
cp -R dist ../build/darwin/$APP_FOLDER/frontend
cd - > /dev/null