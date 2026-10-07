# Android release artifacts

The site resolves the Android build at request time (`src/lib/release.ts`) and reports
whatever it actually finds — the file size and SHA-256 shown in the download dialog are
measured from the artifact, not hard-coded.

## Adding a build

Drop the signed APK in this directory:

```
public/downloads/animatedprime-android-1.5.0.apk
```

The version is read from the file name. The size and checksum are streamed from the file
on first request, so a real build automatically upgrades the dialog from the "in final
review" notify-me state to a verifiable download with install steps.

APKs and AABs are git-ignored (`/public/downloads/*.apk`), so a build never lands in the
repository.

## `release.json`

Optional metadata for the release, read before the APK is hashed:

| Key          | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| `version`    | Fallback version when the file name does not carry one      |
| `channel`    | `stable` or `beta`                                          |
| `minAndroid` | Human-readable minimum OS shown in the dialog facts grid     |
| `changelog`  | Bullet list rendered in the mobile-app section               |

## Hosting the build elsewhere

If the build lives on a release CDN instead of this directory, set `ANDROID_APK_URL`
(plus `ANDROID_APK_SIZE`, `ANDROID_APK_SHA256` and `ANDROID_APK_RELEASED_AT`) — see
`.env.example`. The dialog then switches to an external release-page flow.
