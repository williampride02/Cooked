# Capabilities Removed for Free Developer Account

When you get a paid Apple Developer account ($99/year), restore these:

## 1. Bundle Identifier
Change back to: `com.cooked.app`

## 2. Associated Domains
Add capability, then add these domains:
- `applinks:cooked.app`
- `applinks:www.cooked.app`

## 3. Push Notifications
Add the "Push Notifications" capability

## How to Add Capabilities
1. Open Xcode → Cooked.xcworkspace
2. Select Cooked target → Signing & Capabilities tab
3. Click "+ Capability" button
4. Search and add the capability
