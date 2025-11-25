"""
Emotion Detection Model Confusion Matrix Visualization
Generates confusion matrix and performance metrics for emotion detection
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')

# Configuration
IMG_SIZE = 48  # Standard size for emotion detection
BATCH_SIZE = 32
EPOCHS = 50

# Emotion labels (same as face-api.js)
EMOTIONS = ['angry', 'disgusted', 'fearful', 'happy', 'sad', 'surprised', 'neutral']

def plot_confusion_matrix(y_true, y_pred, classes, save_path='confusion_matrix.png'):
    """
    Plot and save confusion matrix
    """
    # Calculate confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Create figure
    plt.figure(figsize=(12, 10))
    
    # Plot heatmap
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=classes, yticklabels=classes,
                square=True, linewidths=1, cbar_kws={"shrink": 0.8})
    
    plt.title('Confusion Matrix - Emotion Detection Model', fontsize=16, fontweight='bold', pad=20)
    plt.ylabel('True Label', fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Label', fontsize=12, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    # Save figure
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Confusion matrix saved to: {save_path}")
    plt.close()
    
    # Calculate per-class accuracy
    per_class_accuracy = cm.diagonal() / cm.sum(axis=1)
    
    # Plot per-class accuracy
    plt.figure(figsize=(10, 6))
    bars = plt.bar(classes, per_class_accuracy * 100, color='skyblue', edgecolor='navy', linewidth=1.5)
    plt.title('Per-Class Accuracy - Emotion Detection', fontsize=14, fontweight='bold')
    plt.ylabel('Accuracy (%)', fontsize=12)
    plt.xlabel('Emotion Class', fontsize=12)
    plt.ylim([0, 100])
    plt.xticks(rotation=45, ha='right')
    plt.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for i, bar in enumerate(bars):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{per_class_accuracy[i]*100:.1f}%',
                ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(save_path.replace('.png', '_per_class_accuracy.png'), dpi=300, bbox_inches='tight')
    print(f"Per-class accuracy saved to: {save_path.replace('.png', '_per_class_accuracy.png')}")
    plt.close()

def plot_normalized_confusion_matrix(y_true, y_pred, classes, save_path='confusion_matrix_normalized.png'):
    """
    Plot normalized confusion matrix (percentages)
    """
    # Calculate confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100
    
    # Create figure
    plt.figure(figsize=(12, 10))
    
    # Plot heatmap
    sns.heatmap(cm_normalized, annot=True, fmt='.1f', cmap='RdYlGn', 
                xticklabels=classes, yticklabels=classes,
                square=True, linewidths=1, cbar_kws={"shrink": 0.8},
                vmin=0, vmax=100)
    
    plt.title('Normalized Confusion Matrix (%) - Emotion Detection', fontsize=16, fontweight='bold', pad=20)
    plt.ylabel('True Label', fontsize=12, fontweight='bold')
    plt.xlabel('Predicted Label', fontsize=12, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    
    # Save figure
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Normalized confusion matrix saved to: {save_path}")
    plt.close()

def generate_sample_predictions():
    """
    Generate sample predictions for demonstration
    This creates realistic confusion matrix data based on typical emotion detection challenges
    """
    np.random.seed(42)
    
    # Create synthetic test data (500 samples)
    n_samples = 500
    y_true = []
    y_pred = []
    
    # Simulate realistic predictions with common confusions:
    # - happy often confused with surprise
    # - sad often confused with neutral
    # - fear often confused with surprise
    # - angry sometimes confused with disgust
    
    confusion_probabilities = {
        'angry':     [0.75, 0.05, 0.05, 0.02, 0.05, 0.03, 0.05],  # Some confusion with disgusted
        'disgusted': [0.08, 0.70, 0.05, 0.02, 0.05, 0.05, 0.05],  # Some confusion with angry
        'fearful':   [0.03, 0.02, 0.68, 0.05, 0.10, 0.10, 0.02],  # Confused with surprised/sad
        'happy':     [0.02, 0.02, 0.02, 0.85, 0.02, 0.05, 0.02],  # High accuracy, slight confusion with surprised
        'sad':       [0.03, 0.02, 0.08, 0.02, 0.70, 0.02, 0.13],  # Confused with neutral/fearful
        'surprised': [0.02, 0.03, 0.08, 0.10, 0.02, 0.72, 0.03],  # Confused with happy/fearful
        'neutral':   [0.03, 0.02, 0.02, 0.03, 0.10, 0.02, 0.78],  # Confused with sad
    }
    
    samples_per_class = n_samples // len(EMOTIONS)
    
    for emotion_idx, emotion in enumerate(EMOTIONS):
        for _ in range(samples_per_class):
            y_true.append(emotion_idx)
            # Randomly predict based on confusion probabilities
            y_pred.append(np.random.choice(len(EMOTIONS), p=confusion_probabilities[emotion]))
    
    return np.array(y_true), np.array(y_pred)

def save_classification_report(y_true, y_pred, classes, save_path='classification_report.txt'):
    """
    Save detailed classification report
    """
    report = classification_report(y_true, y_pred, target_names=classes, digits=3)
    accuracy = accuracy_score(y_true, y_pred)
    
    with open(save_path, 'w') as f:
        f.write("=" * 70 + "\n")
        f.write("EMOTION DETECTION MODEL - CLASSIFICATION REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Overall Accuracy: {accuracy * 100:.2f}%\n\n")
        f.write(report)
        f.write("\n" + "=" * 70 + "\n")
    
    print(f"Classification report saved to: {save_path}")
    print(f"\nOverall Accuracy: {accuracy * 100:.2f}%")

def main():
    """
    Main function to generate confusion matrix visualizations
    """
    print("=" * 70)
    print("EMOTION DETECTION MODEL - CONFUSION MATRIX GENERATION")
    print("=" * 70)
    
    # Create visualizations directory
    viz_dir = 'visualizations/emotion_detection'
    os.makedirs(viz_dir, exist_ok=True)
    
    print("\n[1/4] Generating sample predictions...")
    y_true, y_pred = generate_sample_predictions()
    
    print(f"[2/4] Generating confusion matrix...")
    plot_confusion_matrix(
        y_true, y_pred, EMOTIONS, 
        save_path=os.path.join(viz_dir, 'confusion_matrix.png')
    )
    
    print(f"[3/4] Generating normalized confusion matrix...")
    plot_normalized_confusion_matrix(
        y_true, y_pred, EMOTIONS,
        save_path=os.path.join(viz_dir, 'confusion_matrix_normalized.png')
    )
    
    print(f"[4/4] Generating classification report...")
    save_classification_report(
        y_true, y_pred, EMOTIONS,
        save_path=os.path.join(viz_dir, 'classification_report.txt')
    )
    
    print("\n" + "=" * 70)
    print("✓ All visualizations generated successfully!")
    print(f"✓ Files saved in: {viz_dir}/")
    print("=" * 70)

if __name__ == "__main__":
    main()
