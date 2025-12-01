# OKI POC - Test Prompts for Facilis.ai Evaluation
## Optimized Prompts for Each Use Case

---

## USE CASE 1: Energy Loss Reduction

### Prompt 1.1 - General Energy Waste Identification
```
Analyze the attached energy_consumption.csv file to identify potential energy waste patterns.

Specifically:
1. Identify equipment that consumes significant power while in IDLE or STANDBY states
2. Flag any periods where equipment is consuming power during non-production times (weekends, night shifts)
3. Calculate the total kWh wasted due to idle consumption for each equipment ID
4. Provide specific timestamps and equipment IDs for the most significant waste instances

Present your findings with specific data references (equipment ID, timestamps, kWh values) and actionable recommendations to reduce energy loss.
```

### Prompt 1.2 - Weekend Energy Analysis
```
Using the energy_consumption.csv data, analyze weekend energy consumption patterns.

Questions to answer:
1. Which equipment shows the highest idle consumption on weekends?
2. What is the total energy consumed during weekend hours (Saturday-Sunday) versus weekday non-production hours?
3. Are there specific equipment units that should be powered down on weekends but are not?

Provide specific equipment IDs, dates, and kWh values to support your recommendations.
```

### Prompt 1.3 - Overnight Energy Audit
```
Review the energy_consumption.csv for overnight energy waste (22:00 - 06:00).

Identify:
1. Equipment that remains in IDLE state overnight instead of STANDBY
2. The cost impact assuming $0.12/kWh electricity rate
3. Specific dates and equipment where overnight waste is most severe

Provide actionable steps to reduce overnight energy consumption with reference to specific data points.
```

---

## USE CASE 2: KPI Integration

### Prompt 2.1 - Production Efficiency KPIs
```
Analyze the production_data.csv file and calculate the following KPIs:

1. kWh per unit produced - by equipment and over time
2. Overall Equipment Effectiveness (OEE) components:
   - Availability: (Runtime / Planned Production Time)
   - Performance: (Actual Output / Theoretical Output)
   - Quality: (Good Units / Total Units)
3. Cycle time trends by equipment
4. Yield rate trends

Create visualizations showing:
- kWh/unit trend over the 90-day period for each equipment
- Comparative efficiency between similar equipment types (CNC-001 vs CNC-002, PRESS-001 vs PRESS-002)

Highlight any equipment showing declining efficiency and quantify the impact.
```

### Prompt 2.2 - Energy Efficiency Comparison
```
Using the production_data.csv, compare energy efficiency across equipment:

1. Calculate average kWh per unit for each equipment ID
2. Identify which equipment is most and least energy efficient
3. Calculate the potential savings if all equipment operated at the efficiency of the best performer
4. Show the trend of kWh/unit over time - is efficiency improving or degrading?

Reference specific data points and provide numerical comparisons.
```

### Prompt 2.3 - Shift-Based KPI Dashboard
```
Create a KPI summary from production_data.csv comparing Day shift vs Evening shift:

Metrics to include:
1. Average units produced per shift
2. Average kWh per unit by shift
3. Defect rates by shift
4. Runtime utilization by shift

Present this as a comparative analysis with specific numbers from the data.
```

---

## USE CASE 3: Early Anomaly Detection

### Prompt 3.1 - Threshold Exceedance Analysis
```
Analyze the equipment_sensors.csv file to identify threshold exceedances:

1. For each sensor type (vibration, temperature, pressure, motor current), identify:
   - Which equipment has exceeded its threshold
   - When the exceedance occurred (specific timestamps)
   - By how much the threshold was exceeded (percentage over)
   
2. Prioritize anomalies by severity and frequency
3. Identify any patterns (time of day, specific equipment, correlated events)

Provide specific equipment IDs, timestamps, and measured values for each detected anomaly.
```

### Prompt 3.2 - Trend-Based Anomaly Detection
```
Review equipment_sensors.csv for gradual degradation patterns that haven't yet exceeded thresholds:

1. Identify equipment where vibration, temperature, or current is trending upward
2. Calculate the rate of change and predict when thresholds will be exceeded
3. Flag any sudden fluctuations (>20% change between consecutive readings)

For each finding, provide:
- Equipment ID
- Sensor type
- Trend direction and rate
- Projected threshold breach date
- Supporting data points
```

### Prompt 3.3 - Multi-Sensor Correlation
```
Analyze equipment_sensors.csv for correlated anomalies across multiple sensors:

1. When vibration increases, does temperature or current also increase?
2. Identify equipment showing abnormal readings in multiple sensors simultaneously
3. Flag any instances where sensor behavior deviates from historical patterns

Provide specific examples with timestamps and measured values.
```

---

## USE CASE 4: Equipment Maintenance Optimization

### Prompt 4.1 - Predictive Maintenance Scheduling
```
Using both equipment_sensors.csv and maintenance_history.csv, optimize the maintenance schedule:

1. Analyze current sensor trends to identify equipment approaching failure
2. Review maintenance history to determine average time between failures for each equipment type
3. Calculate remaining useful life estimates based on:
   - Operating hours since last maintenance
   - Current sensor readings vs thresholds
   - Historical failure patterns

Provide a prioritized maintenance schedule for the next 30 days with:
- Equipment ID
- Recommended maintenance type
- Urgency level (Critical/High/Medium/Low)
- Justification citing specific sensor data and trends
```

### Prompt 4.2 - Condition-Based Maintenance Triggers
```
Analyze equipment_sensors.csv to establish condition-based maintenance triggers:

1. For each equipment type, identify which sensor provides the best early warning of failure
2. Recommend threshold levels for triggering maintenance inspections
3. Identify equipment currently meeting maintenance trigger conditions

Provide specific sensor readings and equipment IDs that require immediate attention.
```

### Prompt 4.3 - Maintenance Cost Optimization
```
Using maintenance_history.csv and equipment_sensors.csv:

1. Calculate total maintenance costs by equipment and maintenance type
2. Identify equipment with highest emergency maintenance frequency and cost
3. Recommend a preventive maintenance strategy that could reduce emergency repairs
4. Estimate potential cost savings from predictive maintenance

Support recommendations with specific cost figures and equipment IDs from the data.
```

---

## REPRODUCIBILITY TEST PROMPTS

Use these identical prompts 3-5 times each to test output consistency:

### Reproducibility Test A
```
Analyze energy_consumption.csv and list the top 3 equipment units with highest idle energy consumption. Provide equipment IDs and total idle kWh values.
```

### Reproducibility Test B
```
From equipment_sensors.csv, identify all threshold exceedances that occurred in the last 30 days of data. List equipment ID, sensor type, timestamp, and exceedance percentage.
```

### Reproducibility Test C
```
Using production_data.csv, calculate the average kWh per unit for each equipment ID. Rank them from most efficient to least efficient.
```

---

## COMBINED ANALYSIS PROMPTS

### Cross-Dataset Analysis
```
Using all four CSV files together (energy_consumption.csv, production_data.csv, equipment_sensors.csv, maintenance_history.csv):

1. Identify equipment that shows both declining efficiency (higher kWh/unit) AND increasing sensor anomalies
2. Correlate maintenance history with current equipment health status
3. Provide an integrated health score for each equipment unit
4. Recommend immediate actions with supporting data from all sources

This is a comprehensive analysis - cite specific data points from each file to support your conclusions.
```

---

## NOTES FOR TESTING

### Expected Behaviors to Validate:

**Actionability**: Response should include specific actions (e.g., "Power down PRESS-002 during lunch breaks 10:00-14:00")

**Specificity**: Response should cite actual values (e.g., "CNC-001 vibration increased from 2.5 mm/s to 3.8 mm/s")

**Reproducibility**: Same prompt should yield consistent key findings across multiple runs

**Field Applicability**: Instructions should be understandable by plant operators without AI expertise

**Rationale**: Every recommendation should reference specific data points from the uploaded CSV

### Red Flags to Watch For:
- Generic recommendations without data references
- Failure to identify embedded test cases (see TEST_CASES_REFERENCE.md)
- Inconsistent answers to identical prompts
- Technical jargon without practical action steps
- Conclusions not supported by the actual data values
