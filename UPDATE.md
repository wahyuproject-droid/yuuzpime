# YuuZPime updates

Build on changes to main; publish only a new version. Increment pubspec.yaml version/build code and the version tag in lib/utils/constants.dart together. The Android app checks the official repository release list and accepts only higher YuuZPime version tags and exact project APK URLs. The user approves installation.

Current artifacts are debug test builds. To support reliable in-place upgrades, set up a persistent Android release keystore owned by the app owner. Never commit private keys. Existing debug builds may require a one-time reinstall, so back up local data first. Production signing is not yet configured.
