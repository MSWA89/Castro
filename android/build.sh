#!/bin/bash
# Maestro APK build script — uses Debian Android SDK toolchain
set -e

export ANDROID_SDK=/usr/lib/android-sdk
export BUILD_TOOLS=$ANDROID_SDK/build-tools/debian
export PLATFORM=$ANDROID_SDK/platforms/android-23
export ANDROID_JAR=$PLATFORM/android.jar
export APP_DIR=/home/user/Maestro

cd $APP_DIR
rm -rf obj gen build
mkdir -p obj gen build

echo "[1/8] aapt — generate R.java"
$BUILD_TOOLS/aapt package -f -m \
  -J gen -M AndroidManifest.xml -S res -I $ANDROID_JAR

echo "[2/8] javac — compile sources"
javac --release 8 -classpath $ANDROID_JAR -sourcepath src -d obj \
  src/com/maestro/app/MaestroJsBridge.java \
  src/com/maestro/app/MainActivity.java \
  gen/com/maestro/app/R.java 2>&1 | grep -v "obsolete\|warning\|Xlint\|JAVA_TOOL" || true

echo "[3/8] dx — DEX conversion"
$BUILD_TOOLS/dx --dex --output=build/classes.dex obj/ 2>&1 | grep -v "JAVA_TOOL" || true

echo "[4/8] aapt — package APK with assets"
$BUILD_TOOLS/aapt package -f \
  -M AndroidManifest.xml -S res -A assets \
  -I $ANDROID_JAR -F build/maestro.unaligned.apk

echo "[5/8] add classes.dex"
cd build && zip -j maestro.unaligned.apk classes.dex >/dev/null && cd ..

echo "[6/8] zipalign"
$BUILD_TOOLS/zipalign -f 4 build/maestro.unaligned.apk build/maestro.aligned.apk

echo "[7/8] keystore"
if [ ! -f build/maestro.keystore ]; then
  keytool -genkey -v -keystore build/maestro.keystore -alias maestro \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass maestro123 -keypass maestro123 \
    -dname "CN=Maestro, OU=App, O=Maestro, L=London, ST=England, C=GB" 2>&1 | grep -v "JAVA_TOOL" || true
fi

echo "[8/8] apksigner — sign"
$BUILD_TOOLS/apksigner sign \
  --ks build/maestro.keystore --ks-key-alias maestro \
  --ks-pass pass:maestro123 --key-pass pass:maestro123 \
  --min-sdk-version 23 \
  --out build/Maestro.apk build/maestro.aligned.apk 2>&1 | grep -v "JAVA_TOOL" || true

echo ""
echo "=== BUILD COMPLETE ==="
$BUILD_TOOLS/apksigner verify --min-sdk-version 23 build/Maestro.apk 2>&1 | grep -v "JAVA_TOOL" && echo "Signature: VALID"
ls -lh build/Maestro.apk
$BUILD_TOOLS/aapt dump badging build/Maestro.apk 2>&1 | grep -E "sdkVersion|targetSdk|package:"
