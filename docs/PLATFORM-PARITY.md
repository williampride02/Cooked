# Platform Parity Framework

## Overview

This document describes the BMAD-integrated platform parity framework for tracking and ensuring feature parity across iOS, Android, and Web platforms.

## Purpose

The platform parity framework ensures that:
- Features are implemented consistently across all applicable platforms
- Platform gaps are identified and tracked
- Platform porting efforts are planned and prioritized
- Cross-platform development is systematic and maintainable

## Supported Platforms

- **iOS**: Apple iOS devices (iPhone, iPad)
- **Android**: Google Android devices (phones, tablets)
- **Web**: Browser-based web application (Next.js)

## Platform Status Values

- **implemented**: Feature is fully implemented and tested on this platform
- **pending**: Feature is planned but not yet implemented on this platform
- **not-applicable**: Feature does not apply to this platform (e.g., native-only features on web)
- **blocked**: Feature implementation is blocked by dependencies or technical limitations

## Workflow Integration

### Platform Parity Workflow

**Command:** `/bmad:bmm:workflows:platform-parity`

**Purpose:** Analyze stories/epics for platform coverage and identify gaps

**Modes:**
- **interactive** (default): Interactive analysis with options to update sprint-status.yaml
- **report**: Generate detailed parity report
- **validate**: Validate platform tracking in sprint-status.yaml

**Usage:**
```bash
# Analyze all stories
/bmad:bmm:workflows:platform-parity

# Analyze specific story
/bmad:bmm:workflows:platform-parity --story_file=1-2-phone-number-entry-screen

# Analyze specific epic
/bmad:bmm:workflows:platform-parity --epic_key=epic-1

# Generate report
/bmad:bmm:workflows:platform-parity --mode=report
```

### Sprint Status Integration

The `sprint-status` workflow now displays platform coverage:

**Command:** `/bmad:bmm:workflows:sprint-status`

**New Features:**
- Displays platform tracking statistics
- Flags stories with platform gaps
- Recommends platform-parity workflow when gaps detected
- Option to view platform parity summary

### Story Template Integration

All new stories include a **Platform Requirements** section:

```markdown
## Platform Requirements

- [ ] iOS
- [ ] Android
- [ ] Web

**Platform-Specific Notes:**
- iOS: [any iOS-specific requirements]
- Android: [any Android-specific requirements]
- Web: [any web-specific requirements]
```

## Sprint Status Schema

Platform status is tracked in `sprint-status.yaml`:

```yaml
development_status:
  story-key: done
    platforms:
      ios: implemented
      android: implemented
      web: pending
    platform_notes:
      android: "Tested on Android 13, works correctly"
      web: "Not prioritized for MVP"
```

## Development Workflow

### When Adding a New Feature

1. **Create Story** (using `/bmad:bmm:workflows:create-story`)
   - Mark platform requirements in story template
   - Story automatically added to sprint-status.yaml

2. **Implement Story** (using `/bmad:bmm:workflows:dev-story`)
   - Implement on primary platform (usually iOS for mobile-first)
   - Update story status to `review` when done

3. **Platform Parity Check** (using `/bmad:bmm:workflows:platform-parity`)
   - Run after story completion
   - Identifies missing platforms
   - Creates follow-up stories for platform ports if needed

4. **Port to Other Platforms**
   - Create new stories for each platform port
   - Track in sprint-status.yaml
   - Use dev-story workflow for implementation

### When Porting Features

1. **Identify Platform Gap**
   - Use platform-parity workflow to identify gaps
   - Review platform-specific requirements

2. **Create Port Story**
   - Use `/bmad:bmm:workflows:create-story`
   - Reference original story
   - Mark target platform in requirements

3. **Implement Port**
   - Use `/bmad:bmm:workflows:dev-story`
   - Test on target platform
   - Update platform status in sprint-status.yaml

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

## Current Status

### Epic 8: Android Porting

**Status:** In Progress

**Stories:**
- 8-1: Android Native Project Setup - ✅ Completed
- 8-2: Android Core Features Testing - Pending
- 8-3: Android Platform-Specific Features - Pending
- 8-4: Android Build & Distribution - Pending
- 8-5: Android QA & Device Testing - Pending

### Platform Coverage Summary

**iOS:** Most features implemented (primary platform)

**Android:** In progress (Epic 8)

**Web:** Basic features implemented (auth, dashboard, settings)

## Best Practices

1. **Always mark platform requirements** when creating stories
2. **Run platform-parity check** after completing stories
3. **Update sprint-status.yaml** with platform status as you work
4. **Create port stories** for platform gaps before they accumulate
5. **Test on all platforms** before marking as implemented
6. **Document platform-specific notes** in sprint-status.yaml

## Troubleshooting

### Story Missing Platform Tracking

**Solution:** Run platform-parity workflow to identify and add platform tracking

### Platform Status Inconsistent

**Solution:** Use platform-parity validate mode to check and fix inconsistencies

### Unclear Platform Requirements

**Solution:** Review platform-standards.md for platform applicability guidelines

## References

- Platform Standards: `_bmad/bmm/workflows/4-implementation/platform-parity/data/platform-standards.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story Template: `_bmad/bmm/workflows/4-implementation/create-story/template.md`
