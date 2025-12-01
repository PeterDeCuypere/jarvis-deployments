# OKI Japan POC - Facilis.ai Testing Plan

## Overview

This document outlines the comprehensive testing plan for validating Facilis.ai against OKI's four use cases and five evaluation criteria.

---

## Use Cases Under Evaluation

| Use Case | Description |
|----------|-------------|
| UC1: Energy Loss Reduction | Identification of usage patterns to detect potential wasted energy (idle power consumption, etc.) |
| UC2: KPI Integration | Visualization of key performance indicators from uploaded CSV data (production efficiency, kWh per unit, etc.) |
| UC3: Early Anomaly Detection | Identification of threshold exceedances and sudden fluctuation patterns |
| UC4: Equipment Maintenance Optimization | Prediction of equipment maintenance timing and schedules based on various factors |

---

## Evaluation Criteria

| Criterion | Description | Key Question |
|-----------|-------------|--------------|
| **Actionability** | Degree to which output is clear, practical, and immediately translatable into operational action | Is the content practically applicable in the plant? |
| **Specificity** | Level of detail and specificity provided relative to the original prompt and use case context | Is the response generic? |
| **Reproducibility** | Consistency of output when the same prompt is input multiple times | Can consistent results be obtained with identical prompts? |
| **Field Applicability** | Realism of suggestions within a real-world industrial setting | Can factory workers understand and put it into action? |
| **Rationale** | Whether output explicitly cites or refers to uploaded CSV data points to substantiate recommendations | Is there an explainable rationale behind the logic? |

---

## Test Deliverables

### 1. Synthetic Test CSVs

Four datasets with realistic industrial patterns and embedded test cases for validation:

| File | Records | Description |
|------|---------|-------------|
| `energy_consumption.csv` | 17,280 | 90 days × 24 hours × 8 equipment units |
| `production_data.csv` | 520 | Batch production records with efficiency metrics |
| `equipment_sensors.csv` | 4,320 | Sensor readings (vibration, temperature, pressure, current) |
| `maintenance_history.csv` | 92 | Historical maintenance records |

**Equipment covered:** CNC-001, CNC-002, PRESS-001, PRESS-002, ROBOT-001, ROBOT-002, CONVEYOR-001, OVEN-001

### 2. Test Prompts

15 structured prompts organized by use case in `TEST_PROMPTS.md`:

- 3 prompts for Energy Loss Reduction (1.1, 1.2, 1.3)
- 3 prompts for KPI Integration (2.1, 2.2, 2.3)
- 3 prompts for Anomaly Detection (3.1, 3.2, 3.3)
- 3 prompts for Maintenance Optimization (4.1, 4.2, 4.3)
- 1 cross-dataset analysis prompt (5.1)
- 3 reproducibility test prompts (R.A, R.B, R.C)

### 3. Scoring Rubric

Excel workbook `OKI_POC_Scoring_Rubric.xlsx` with 4 sheets:

1. **Scoring Matrix** - Score each prompt on all 5 criteria (1-5 scale), auto-calculates totals
2. **Scoring Guide** - Detailed descriptions for each score level
3. **Test Case Validation** - Checklist to track which embedded anomalies are detected
4. **Summary Dashboard** - Executive summary with pass/fail threshold (70/100)

---

## Embedded Test Cases (Answer Key)

These anomalies are deliberately embedded in the test data. Use this to validate detection capabilities.

### UC1: Energy Loss Reduction

| Test ID | Pattern | Equipment | Details |
|---------|---------|-----------|---------|
| TC-E1 | Weekend idle consumption | All Equipment | IDLE state during Sat-Sun 8:00-16:00 |
| TC-E2 | Excessive idle power | PRESS-002 | Higher idle consumption (40%) on days 60-90, hours 10:00-14:00 |
| TC-E3 | Overnight waste | OVEN-001 | Left in IDLE overnight (23:00-04:00) on ~30% of weeknights |

### UC2: KPI Integration

| Test ID | Pattern | Equipment | Details |
|---------|---------|-----------|---------|
| TC-K1 | Efficiency degradation trend | CNC-002 | Gradual decrease in units produced, increase in cycle time after day 45 |
| TC-K2 | Energy inefficiency | PRESS-001 | 25% higher energy consumption than baseline after day 30 |

### UC3: Early Anomaly Detection

| Test ID | Pattern | Equipment | Details |
|---------|---------|-----------|---------|
| TC-A1 | Vibration increase trend | CNC-001 | Gradual vibration increase (~3% per day) from days 30-90 |
| TC-A2 | Temperature rise trend | PRESS-002 | Motor temperature increasing +0.5°C per day after day 50 |
| TC-A3 | Sudden pressure spike | ROBOT-001 | 80% pressure spike on day 75 |
| TC-A4 | Intermittent temperature spikes | OVEN-001 | 15% temperature exceedance on days 40-41 and 65-66 |

### UC4: Equipment Maintenance Optimization

| Test ID | Pattern | Equipment | Details |
|---------|---------|-----------|---------|
| TC-M1 | Bearing degradation | CNC-001 | Vibration trend correlates with operating hours |
| TC-M2 | Belt tension issue | CONVEYOR-001 | Increasing motor current draw from days 60-90 |
| TC-M3 | Motor cooling issue | PRESS-002 | Temperature trajectory indicates cooling system degradation |

---

## Testing Workflow

### Step 1: Data Upload
Upload all four CSV files to Facilis.ai:
- `energy_consumption.csv`
- `production_data.csv`
- `equipment_sensors.csv`
- `maintenance_history.csv`

### Step 2: Execute Test Prompts
Run each prompt from `TEST_PROMPTS.md` and capture the responses.

**Order of execution:**
1. UC1 prompts (1.1 → 1.2 → 1.3)
2. UC2 prompts (2.1 → 2.2 → 2.3)
3. UC3 prompts (3.1 → 3.2 → 3.3)
4. UC4 prompts (4.1 → 4.2 → 4.3)
5. Cross-dataset prompt (5.1)

### Step 3: Reproducibility Testing
Run each reproducibility prompt (R.A, R.B, R.C) **three times** with identical input:
- Compare outputs for consistency
- Note any variations in key findings

### Step 4: Score Responses
For each response, score on all 5 criteria using the rubric:

| Score | Meaning |
|-------|---------|
| 1 | Poor - Does not meet criterion |
| 2 | Below Average - Partially meets with significant gaps |
| 3 | Average - Meets basic expectations |
| 4 | Good - Exceeds expectations |
| 5 | Excellent - Fully meets criterion with exceptional quality |

### Step 5: Validate Test Case Detection
Use `TEST_CASES_REFERENCE.md` to check which embedded anomalies were detected:
- Mark each test case as "Detected" or "Not Detected" in the rubric
- Calculate detection rate

### Step 6: Generate Summary
Review the Summary Dashboard in the Excel rubric:
- Overall score (target: ≥70/100)
- Scores by criterion
- Scores by use case
- Test case detection rate

---

## Pass/Fail Criteria

| Metric | Pass Threshold |
|--------|----------------|
| Overall Score | ≥ 70/100 |
| Any Single Criterion Average | ≥ 2.5/5 |
| Test Case Detection Rate | ≥ 75% (9/12) |
| Reproducibility Score | ≥ 4/5 |

---

## Red Flags to Watch For

During testing, flag responses that exhibit:

- ❌ Generic recommendations without specific data references
- ❌ Failure to identify embedded test cases
- ❌ Inconsistent answers to identical prompts
- ❌ Technical jargon without practical action steps
- ❌ Conclusions not supported by actual data values
- ❌ Missing equipment IDs, timestamps, or numerical values
- ❌ Recommendations that would be impractical on a factory floor

---

## Expected Outcomes by Use Case

### UC1: Energy Loss Reduction
**Good response should include:**
- Specific equipment IDs with idle consumption values
- Timestamps of waste periods (weekend hours, overnight)
- Calculated kWh wasted and cost impact
- Actionable recommendations (power down schedules, standby procedures)

### UC2: KPI Integration
**Good response should include:**
- Calculated kWh/unit values by equipment
- OEE component calculations with formulas
- Trend visualizations or descriptions
- Comparative analysis between similar equipment
- Identification of efficiency degradation

### UC3: Early Anomaly Detection
**Good response should include:**
- Specific threshold exceedances with timestamps
- Trend analysis with rate of change calculations
- Predicted threshold breach dates
- Severity prioritization
- Multi-sensor correlation insights

### UC4: Equipment Maintenance Optimization
**Good response should include:**
- Prioritized maintenance schedule with dates
- Urgency levels justified by sensor data
- Remaining useful life estimates
- Cost analysis and potential savings
- Condition-based triggers with specific thresholds

---

## Files Checklist

| File | Purpose |
|------|---------|
| ☐ `energy_consumption.csv` | Test data for UC1, UC2 |
| ☐ `production_data.csv` | Test data for UC2 |
| ☐ `equipment_sensors.csv` | Test data for UC3, UC4 |
| ☐ `maintenance_history.csv` | Test data for UC4 |
| ☐ `TEST_PROMPTS.md` | Prompts to execute |
| ☐ `TEST_CASES_REFERENCE.md` | Answer key for validation |
| ☐ `OKI_POC_Scoring_Rubric.xlsx` | Scoring and summary |
| ☐ `OKI_POC_Testing_Plan.md` | This document |

---

## Contact

**Facilis.ai** - Yousef (CEO/Tech Lead)

---

*Document generated for OKI Japan POC evaluation*
