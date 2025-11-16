"""
Train ML models to predict spread prices.
"""

import json
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


class SpreadPriceModel:
    """Wrapper for spread price prediction models"""

    def __init__(self, model_type: str = "random_forest"):
        """Initialize model"""
        self.model_type = model_type
        self.model = self._create_model(model_type)
        self.scaler = StandardScaler()
        self.feature_names = None

    def _create_model(self, model_type: str):
        """Create the underlying ML model."""
        models = {
            "linear": LinearRegression(),
            "ridge": Ridge(alpha=1.0),
            "random_forest": RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1,
            ),
            "gradient_boosting": GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
            ),
        }

        if model_type not in models:
            raise ValueError(f"Unknown model type: {model_type}. Choose from {list(models.keys())}")

        return models[model_type]

    def train(
        self, X: pd.DataFrame, y: pd.Series, validation_split: float = 0.2
    ) -> Tuple[dict, dict]:
        """Train the model"""
        # Store feature names
        self.feature_names = list(X.columns)

        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)

        # Train model
        print(f"\nTraining {self.model_type} model...")
        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        train_metrics = self._evaluate(X_train_scaled, y_train, "train")
        val_metrics = self._evaluate(X_val_scaled, y_val, "validation")

        return train_metrics, val_metrics

    def _evaluate(self, X, y, split_name: str) -> dict:
        """Evaluate model and return metrics"""
        y_pred = self.model.predict(X)

        metrics = {
            "mae": mean_absolute_error(y, y_pred),
            "rmse": np.sqrt(mean_squared_error(y, y_pred)),
            "r2": r2_score(y, y_pred),
        }

        print(f"{split_name.upper()} Metrics:")
        print(f"  MAE:  {metrics['mae']:.6f}")
        print(f"  RMSE: {metrics['rmse']:.6f}")
        print(f"  R²:   {metrics['r2']:.4f}\n")

        return metrics

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions on new data."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def save(self, path: Path):
        """Save model to disk."""
        model_data = {
            "model": self.model,
            "scaler": self.scaler,
            "model_type": self.model_type,
            "feature_names": self.feature_names,
        }
        joblib.dump(model_data, path)
        print(f"Model saved to {path}")

    @classmethod
    def load(cls, path: Path):
        """Load model from disk."""
        model_data = joblib.load(path)

        instance = cls(model_type=model_data["model_type"])
        instance.model = model_data["model"]
        instance.scaler = model_data["scaler"]
        instance.feature_names = model_data["feature_names"]

        print(f"Model loaded from {path}")
        return instance

    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance (for tree-based models)."""
        if not hasattr(self.model, "feature_importances_"):
            print(f"Model type {self.model_type} does not support feature importance")
            return None

        importance_df = pd.DataFrame(
            {"feature": self.feature_names, "importance": self.model.feature_importances_}
        ).sort_values("importance", ascending=False)

        return importance_df


def prepare_features(
    df: pd.DataFrame, target_col: str = "optimal_spread_width"
) -> Tuple[pd.DataFrame, pd.Series]:
    """Prepare features and target from labeled dataset."""
    # Drop non-feature columns
    drop_cols = [
        "market_id",
        "question",
        "timestamp",
        target_col,
        # Drop other metric columns to avoid leakage
        "metric_mid_price",
        "metric_volume_weighted_mid",
        "metric_micro_price",
    ]

    feature_cols = [col for col in df.columns if col not in drop_cols]

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    # Drop any rows with NaN
    mask = ~(X.isna().any(axis=1) | y.isna())
    X = X[mask]
    y = y[mask]

    print(f"Samples: {len(X)} rows")
    print(f"Features: {len(feature_cols)} columns")

    return X, y


def train_model(
    data_file: Path = Path("data/labeled_dataset.csv"),
    model_type: str = "random_forest",
    output_dir: Path = Path("models/saved"),
):
    """Train a spread price prediction model"""
    # Load data
    df = pd.read_csv(data_file)

    # Prepare features
    X, y = prepare_features(df)

    # Train model
    model = SpreadPriceModel(model_type=model_type)
    train_metrics, val_metrics = model.train(X, y)

    # Save model
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / f"{model_type}_spread_model.joblib"
    model.save(model_path)

    # Save metrics
    metrics_path = output_dir / f"{model_type}_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(
            {
                "model_type": model_type,
                "train": train_metrics,
                "validation": val_metrics,
            },
            f,
            indent=2,
        )
    print(f"Metrics saved to {metrics_path}")

    return model


if __name__ == "__main__":
    for model_type in ["random_forest"]:
        try:
            train_model(model_type=model_type)
        except Exception as e:
            print(f"Error training {model_type}: {e}")
