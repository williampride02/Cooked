---
title: 'Platform Parity Validation Checklist'
validation-target: 'Platform parity analysis and sprint-status.yaml platform tracking'
validation-criticality: 'HIGH'
required-inputs:
  - 'Sprint status file with platform tracking data'
  - 'Platform parity analysis report'
optional-inputs:
  - 'Story files for detailed analysis'
validation-rules:
  - 'All stories must have platform status tracked (or explicitly marked not-applicable)'
  - 'Platform status values must be valid (implemented/pending/not-applicable/blocked)'
  - 'Platform gaps must be identified with effort estimates'
  - 'Recommendations must be provided for achieving parity'
---

# Platform Parity Validation Checklist

**Critical validation:** Platform parity analysis is complete and actionable only when ALL items below are satisfied

## Platform Tracking Validation

- [ ] **Sprint Status Platform Data**: All stories in scope have `platforms` section in sprint-status.yaml (or explicitly marked as not-tracked)
- [ ] **Valid Platform Status Values**: All platform statuses use valid values (implemented/pending/not-applicable/blocked)
- [ ] **Platform Applicability**: Platform status correctly reflects whether feature applies to each platform (based on platform-standards.md)
- [ ] **Consistency Check**: Stories marked "done" have all applicable platforms marked "implemented" (or explicitly not-applicable)

## Gap Analysis Validation

- [ ] **All Gaps Identified**: All missing platform implementations are identified
- [ ] **Effort Estimates**: Each gap has effort estimate (Minimal/Moderate/Significant)
- [ ] **Gap Context**: Gaps include context about why they exist (blocked, not prioritized, etc.)
- [ ] **Overall Assessment**: Overall parity effort is calculated and classified (Quick/Moderate/Substantial)

## Recommendations Validation

- [ ] **Actionable Recommendations**: Recommendations are specific and actionable
- [ ] **Priority Guidance**: Recommendations include priority guidance (P0/P1/P2/P3)
- [ ] **Story Creation Guidance**: Recommendations identify which gaps need new stories
- [ ] **Testing Guidance**: Recommendations include testing requirements for platform ports

## Report Quality

- [ ] **Complete Coverage**: Report covers all stories in scope
- [ ] **Clear Summary**: Summary clearly communicates parity status
- [ ] **Detailed Analysis**: Detailed analysis provides enough context for decision-making
- [ ] **Next Steps**: Next steps are clearly defined

## Integration Validation

- [ ] **Sprint Status Updated**: sprint-status.yaml updated with platform tracking (if user chose to update)
- [ ] **Story Files Updated**: Story files reference platform requirements (if applicable)
- [ ] **Documentation Updated**: Platform parity documentation reflects current status

## Final Validation Output

```
Platform Parity Analysis: {{PASS/FAIL}}

✅ **Parity Analysis Complete:** {{scope}}
📊 **Coverage Score:** {{coverage_percentage}}% of stories have platform parity
🔍 **Gap Count:** {{gap_count}} platform gaps identified
📋 **Effort Assessment:** {{overall_effort}} effort to achieve parity
📝 **Recommendations:** {{recommendation_count}} recommendations provided
```

**If FAIL:** List specific failures and required actions before analysis can be considered complete

**If PASS:** Platform parity analysis is ready for use in planning and implementation
