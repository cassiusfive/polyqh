#!/usr/bin/env python
"""
Complete pipeline runner: scrape → label → train

Usage:
    python run_pipeline.py --all              # Run full pipeline
    python run_pipeline.py --scrape           # Only scrape data
    python run_pipeline.py --label            # Only label data
    python run_pipeline.py --train            # Only train models
"""

import argparse
from pathlib import Path


def run_scraper():
    """Run the data scraper."""
    print("\n" + "="*60)
    print("STEP 1: Scraping market data")
    print("="*60 + "\n")

    from scraper.scrape import scrape_all_markets
    scrape_all_markets()


def run_labeling():
    """Run the data labeling pipeline."""
    print("\n" + "="*60)
    print("STEP 2: Labeling data with spread prices")
    print("="*60 + "\n")

    from labeling.label_data import label_all_data
    label_all_data()


def run_training():
    """Run the model training."""
    print("\n" + "="*60)
    print("STEP 3: Training ML models")
    print("="*60 + "\n")

    from models.train import train_model

    # Train multiple models for comparison
    for model_type in ["random_forest", "gradient_boosting"]:
        print(f"\nTraining {model_type}...")
        try:
            train_model(model_type=model_type)
        except Exception as e:
            print(f"Error training {model_type}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Run the ML pipeline")
    parser.add_argument("--all", action="store_true", help="Run full pipeline")
    parser.add_argument("--scrape", action="store_true", help="Run scraper only")
    parser.add_argument("--label", action="store_true", help="Run labeling only")
    parser.add_argument("--train", action="store_true", help="Run training only")

    args = parser.parse_args()

    # If no args specified, show help
    if not any([args.all, args.scrape, args.label, args.train]):
        parser.print_help()
        return

    # Run requested steps
    if args.all or args.scrape:
        run_scraper()

    if args.all or args.label:
        run_labeling()

    if args.all or args.train:
        run_training()

    print("\n" + "="*60)
    print("Pipeline complete!")
    print("="*60)


if __name__ == "__main__":
    main()
