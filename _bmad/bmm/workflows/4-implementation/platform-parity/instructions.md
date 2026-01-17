# Platform Parity - Multi-Mode Service

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/_bmad/bmm/workflows/4-implementation/platform-parity/workflow.yaml</critical>
<critical>Modes: interactive (default), report, validate</critical>
<critical>⚠️ ABSOLUTELY NO TIME ESTIMATES. Do NOT mention hours, days, weeks, or timelines.</critical>

<workflow>

<step n="0" goal="Determine execution mode">
  <action>Set mode = {{mode}} if provided by caller; otherwise mode = "interactive"</action>

  <check if="mode == report">
    <action>Jump to Step 20</action>
  </check>

  <check if="mode == validate">
    <action>Jump to Step 30</action>
  </check>

  <check if="mode == interactive">
    <action>Continue to Step 1</action>
  </check>
</step>

<step n="1" goal="Load sprint status and determine scope">
  <action>Read the FULL file: {sprint_status_file}</action>
  <action>Parse development_status section</action>
  
  <check if="story_file is provided">
    <action>Load story file: {story_file}</action>
    <action>Set scope = "story"</action>
    <action>Set target = {story_file}</action>
  </check>
  
  <check if="epic_key is provided">
    <action>Find all stories for epic: {epic_key}</action>
    <action>Set scope = "epic"</action>
    <action>Set target = {epic_key}</action>
  </check>
  
  <check if="neither story_file nor epic_key provided">
    <action>Set scope = "all"</action>
    <action>Set target = "all stories"</action>
  </check>
  
  <action>Continue to Step 2</action>
</step>

<step n="2" goal="Analyze platform coverage">
  <action>For each story in scope, check platform status:</action>
  
  <action>Extract platform information from sprint-status.yaml:</action>
  - Check if story has `platforms` section
  - If missing, mark as "not-tracked"
  - If present, check status for iOS, Android, Web
  
  <action>For each platform (iOS, Android, Web), determine:</action>
  - Current status (implemented/pending/not-applicable/blocked/not-tracked)
  - Whether feature is applicable to platform (based on platform-standards.md)
  - Gap analysis (what's missing)
  
  <action>Count platform gaps:</action>
  - Stories missing iOS implementation
  - Stories missing Android implementation
  - Stories missing Web implementation
  - Stories with no platform tracking
  
  <action>Continue to Step 3</action>
</step>

<step n="3" goal="Estimate parity effort">
  <action>For each platform gap identified:</action>
  
  <action>Estimate effort level:</action>
  - **Minimal**: Shared code, just needs testing
  - **Moderate**: Some platform-specific code needed
  - **Significant**: Major platform-specific implementation required
  
  <action>Consider:</action>
  - Is code already shared? (React Native code works for both iOS/Android)
  - Are native modules needed?
  - Are platform-specific APIs required?
  - Is testing sufficient or is implementation needed?
  
  <action>Calculate total parity effort:</action>
  - Sum individual gap efforts
  - Classify overall: Quick / Moderate / Substantial
  
  <action>Continue to Step 4</action>
</step>

<step n="4" goal="Generate parity report">
  <action>Create parity analysis report:</action>
  
```markdown
## Platform Parity Analysis

### Scope: {{scope}} ({{target}})

### Platform Coverage Summary

**iOS:**
- Implemented: {{ios_implemented_count}}
- Pending: {{ios_pending_count}}
- Not Applicable: {{ios_na_count}}
- Not Tracked: {{ios_not_tracked_count}}

**Android:**
- Implemented: {{android_implemented_count}}
- Pending: {{android_pending_count}}
- Not Applicable: {{android_na_count}}
- Not Tracked: {{android_not_tracked_count}}

**Web:**
- Implemented: {{web_implemented_count}}
- Pending: {{web_pending_count}}
- Not Applicable: {{web_na_count}}
- Not Tracked: {{web_not_tracked_count}}

### Gap Analysis

{{#each gaps}}
**{{story_key}} - {{story_name}}:**
- iOS: {{ios_status}} {{#if ios_gap}}({{ios_gap}}){{/if}}
- Android: {{android_status}} {{#if android_gap}}({{android_gap}}){{/if}}
- Web: {{web_status}} {{#if web_gap}}({{web_gap}}){{/if}}
- Effort to Complete: {{effort_level}}
{{/each}}

### Overall Parity Assessment

**Overall Effort to Reach Parity:** {{overall_effort}}
**Recommendation:** {{recommendation}}
```

  <action>Continue to Step 5</action>
</step>

<step n="5" goal="Update sprint-status.yaml with platform status">
  <check if="user wants to update sprint-status.yaml">
    <action>For each story with missing platform tracking:</action>
    - Add `platforms` section to sprint-status.yaml
    - Set initial status based on analysis
    - Add platform_notes if applicable
    
    <action>Save updated sprint-status.yaml</action>
  </check>
  
  <action>Continue to Step 6</action>
</step>

<step n="6" goal="Present parity analysis and recommendations">
  <output>
**Platform Parity Analysis Complete**

Analyzed {{story_count}} stories. Found {{gap_count}} platform gaps.

**Quick Summary:**
{{summary}}

**Recommendation:**
{{recommendation}}

**How would you like to proceed?**
  </output>
  
  <ask>
1) Update sprint-status.yaml with platform tracking
2) Create stories for platform ports
3) Generate detailed report
4) Exit

Choice:
  </ask>
  
  <check if="choice == 1">
    <action>Update sprint-status.yaml (Step 5)</action>
  </check>
  
  <check if="choice == 2">
    <output>Use `/bmad:bmm:workflows:create-story` to create platform port stories.</output>
  </check>
  
  <check if="choice == 3">
    <action>Jump to Step 20 (report mode)</action>
  </check>
  
  <check if="choice == 4">
    <action>Exit workflow</action>
  </check>
</step>

<!-- ========================= -->
<!-- Report mode -->
<!-- ========================= -->

<step n="20" goal="Generate detailed parity report">
  <action>Load sprint-status.yaml and analyze (same as Steps 1-3)</action>
  
  <action>Generate comprehensive report:</action>
  - Platform coverage by epic
  - Platform coverage by story
  - Gap analysis with effort estimates
  - Recommendations for achieving parity
  
  <output>
## Platform Parity Report

{{detailed_report}}

**Generated:** {{date}}
**Scope:** {{scope}}
  </output>
  
  <action>Return to caller or exit</action>
</step>

<!-- ========================= -->
<!-- Validate mode -->
<!-- ========================= -->

<step n="30" goal="Validate platform tracking">
  <action>Read sprint-status.yaml</action>
  
  <action>Validate platform tracking:</action>
  - Check that all stories have `platforms` section (or mark as not-tracked)
  - Validate platform status values (implemented/pending/not-applicable/blocked)
  - Check for inconsistencies (e.g., story marked done but platforms not all implemented)
  
  <check if="validation fails">
    <template-output>is_valid = false</template-output>
    <template-output>error = "{{validation_error}}"</template-output>
    <template-output>suggestion = "{{fix_suggestion}}"</template-output>
    <action>Return</action>
  </check>
  
  <template-output>is_valid = true</template-output>
  <template-output>message = "Platform tracking valid: {{valid_count}} stories tracked, {{gap_count}} gaps identified"</template-output>
</step>

</workflow>
