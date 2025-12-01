
# OKI POC - Embedded Test Cases Reference
# =========================================
# This document lists all anomalies and patterns embedded in the test data.
# Use this to validate Facilis.ai's detection capabilities.

## USE CASE 1: Energy Loss Reduction
1. Weekend Idle Consumption (All Equipment)
   - Pattern: Equipment in IDLE state during weekend hours 8:00-16:00
   - Expected Detection: System should flag unnecessary idle consumption on non-production days
   
2. PRESS-002 Excessive Idle (Days 60-90, Hours 10:00-14:00)
   - Pattern: Higher than normal idle power consumption (40% vs typical 35%)
   - Expected Detection: Specific equipment flagged with timestamp range

3. OVEN-001 Night Shift Waste
   - Pattern: Oven left in IDLE overnight (23:00-04:00) on ~30% of weeknights
   - Expected Detection: High-consumption equipment idle during non-production hours

## USE CASE 2: KPI Integration
1. CNC-002 Efficiency Degradation (Days 45-90)
   - Pattern: Gradual decrease in units produced, increase in cycle time
   - Expected KPI: kWh/unit should show upward trend

2. PRESS-001 Energy Inefficiency (Days 30-90)
   - Pattern: 25% higher energy consumption than baseline
   - Expected KPI: kWh/unit significantly higher than PRESS-002

## USE CASE 3: Early Anomaly Detection
1. CNC-001 Vibration Increase (Days 30-90)
   - Pattern: Gradual vibration increase (~3% per day after day 30)
   - Expected Detection: Threshold exceedance warning, trend identification

2. PRESS-002 Temperature Rise (Days 50-90)
   - Pattern: Motor temperature increasing 0.5°C per day
   - Expected Detection: Approaching thermal threshold warning

3. ROBOT-001 Pressure Spike (Day 75)
   - Pattern: Sudden 80% pressure spike
   - Expected Detection: Immediate anomaly alert with specific timestamp

4. OVEN-001 Temperature Spikes (Days 40-41, 65-66)
   - Pattern: Intermittent 15% temperature exceedance
   - Expected Detection: Threshold violation alerts

## USE CASE 4: Equipment Maintenance Optimization
1. CNC-001 Bearing Degradation
   - Pattern: Increasing vibration trend correlates with operating hours
   - Expected Prediction: Maintenance recommended based on vibration trend

2. CONVEYOR-001 Belt Tension Issue (Days 60-90)
   - Pattern: Increasing motor current draw
   - Expected Prediction: Belt/tensioner maintenance recommendation

3. PRESS-002 Motor Cooling Issue
   - Pattern: Temperature trend indicates cooling system degradation
   - Expected Prediction: Maintenance timing based on temperature trajectory
