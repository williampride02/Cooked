# Platform Standards

## Supported Platforms

- **iOS**: Apple iOS devices (iPhone, iPad)
- **Android**: Google Android devices (phones, tablets)
- **Web**: Browser-based web application (Next.js)

## Platform Status Values

- **implemented**: Feature is fully implemented and tested on this platform
- **pending**: Feature is planned but not yet implemented on this platform
- **not-applicable**: Feature does not apply to this platform (e.g., native-only features on web)
- **blocked**: Feature implementation is blocked by dependencies or technical limitations

## Platform Requirements by Feature Type

### Authentication
- **iOS**: Required (native app)
- **Android**: Required (native app)
- **Web**: Required (browser-based)

### Push Notifications
- **iOS**: Required (APNs)
- **Android**: Required (FCM)
- **Web**: Not applicable (web push is separate feature)

### Deep Linking
- **iOS**: Universal Links
- **Android**: App Links
- **Web**: URL routing (always applicable)

### Native Features
- **iOS**: Camera, Photos, Haptics, etc.
- **Android**: Camera, Photos, Haptics, etc.
- **Web**: Limited (camera via web API, no haptics)

### Real-time Updates
- **iOS**: WebSocket subscriptions
- **Android**: WebSocket subscriptions
- **Web**: WebSocket subscriptions

## Platform Parity Priorities

1. **P0 (Critical)**: Core user flows must work on all applicable platforms
2. **P1 (High)**: Important features should be available on all platforms
3. **P2 (Medium)**: Nice-to-have features can be platform-specific
4. **P3 (Low)**: Experimental features can be single-platform initially

## Platform-Specific Considerations

### iOS
- Requires Apple Developer account for distribution
- App Store review process
- Native modules via Expo
- Universal Links for deep linking

### Android
- Google Play Console for distribution
- Play Store review process
- Native modules via Expo
- App Links for deep linking
- Runtime permissions (Android 13+)

### Web
- No app store distribution
- Browser compatibility considerations
- No native push notifications (web push is separate)
- Responsive design requirements
