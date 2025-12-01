import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load the data
df = pd.read_csv('cascaded_cstr.csv')

# Define the PV-SP pairs
pairs = [
    ('TT_101', 'SP_TT_101', 'Temperature 101'),
    ('TT_102', 'SP_TT_102', 'Temperature 102'),
    ('LT_101', 'SP_LT_101', 'Level 101'),
    ('LT_102', 'SP_LT_102', 'Level 102')
]

# Create figure with 4 subplots
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for idx, (pv_col, sp_col, label) in enumerate(pairs):
    # Calculate residuals (PV - SP)
    residuals = df[pv_col] - df[sp_col]

    # Standardize: (x - mean) / std
    mean_res = residuals.mean()
    std_res = residuals.std()
    standardized_residuals = (residuals - mean_res) / std_res

    # Plot
    ax = axes[idx]
    ax.plot(df['timestamp'], standardized_residuals, linewidth=0.8, alpha=0.8)
    ax.axhline(y=0, color='red', linestyle='--', linewidth=1, alpha=0.7)
    ax.axhline(y=2, color='orange', linestyle=':', linewidth=1, alpha=0.5)
    ax.axhline(y=-2, color='orange', linestyle=':', linewidth=1, alpha=0.5)
    ax.axhline(y=3, color='red', linestyle=':', linewidth=1, alpha=0.5)
    ax.axhline(y=-3, color='red', linestyle=':', linewidth=1, alpha=0.5)

    ax.set_xlabel('Time')
    ax.set_ylabel('Standardized Residual')
    ax.set_title(f'{label}\n(Mean: {mean_res:.4f}, Std: {std_res:.4f})')
    ax.grid(True, alpha=0.3)
    ax.set_ylim(-4, 4)

plt.suptitle('Standardized Residuals (PV - SP) for CSTR Control Loops', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('standardized_residuals.png', dpi=150, bbox_inches='tight')
plt.show()

print("Plot saved as 'standardized_residuals.png'")

# Print summary statistics
print("\n--- Residual Statistics ---")
for pv_col, sp_col, label in pairs:
    residuals = df[pv_col] - df[sp_col]
    print(f"\n{label}:")
    print(f"  Mean residual: {residuals.mean():.4f}")
    print(f"  Std residual:  {residuals.std():.4f}")
    print(f"  Min:           {residuals.min():.4f}")
    print(f"  Max:           {residuals.max():.4f}")
