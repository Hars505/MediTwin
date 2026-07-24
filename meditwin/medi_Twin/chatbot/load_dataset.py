"""
Dataset loader for the medical QA chatbot.

Downloads the lavita/medical-qa-datasets (all-processed) from HuggingFace
and inserts the Q&A pairs into the MongoDB 'medical_qa' collection.

Usage (run once, inside .venv):
    python manage.py shell -c "from chatbot.load_dataset import main; main()"

Or directly:
    python -c "
    import django; import os
    os.environ['DJANGO_SETTINGS_MODULE'] = 'medi_Twin.settings'
    django.setup()
    from chatbot.load_dataset import main
    main()
    "
"""
# pyrefly: ignore [missing-import]
from medi_Twin.mongo import get_collection


def main(batch_size=5000, max_rows=1700000):
    """
    Load the lavita/medical-qa-datasets and insert into MongoDB.

    Args:
        batch_size: number of docs per bulk insert
        max_rows: cap on total rows to insert (dataset has ~1.7M;
                  50k is plenty for a responsive TF-IDF chatbot)
    """
    # Import here so the module can be imported without datasets installed
    from datasets import load_dataset

    collection = get_collection('medical_qa')

    # Check if already loaded
    existing = collection.estimated_document_count()
    if existing >= max_rows:
        print(f"medical_qa collection already has {existing} docs. Skipping.")
        return

    print("Downloading lavita/medical-qa-datasets (all-processed)...")
    ds = load_dataset("lavita/medical-qa-datasets", "all-processed", split="train")

    print(f"Dataset loaded: {len(ds)} rows")
    print(f"Columns: {ds.column_names}")

    # Figure out which columns hold question and answer
    # The dataset uses 'input' and 'output' columns
    q_col = 'input' if 'input' in ds.column_names else 'question'
    a_col = 'output' if 'output' in ds.column_names else 'answer'

    # Drop existing data for a clean load
    if existing > 0:
        print(f"Dropping {existing} existing docs...")
        collection.drop()

    # Insert in batches
    batch = []
    inserted = 0

    for i, row in enumerate(ds):
        if inserted >= max_rows:
            break

        question = row.get(q_col, '').strip()
        answer = row.get(a_col, '').strip()

        # Skip empty or very short entries
        if len(question) < 10 or len(answer) < 10:
            continue

        batch.append({
            'question': question,
            'answer': answer,
        })

        if len(batch) >= batch_size:
            collection.insert_many(batch)
            inserted += len(batch)
            print(f"  Inserted {inserted} docs...")
            batch = []

    # Insert remaining
    if batch:
        collection.insert_many(batch)
        inserted += len(batch)

    # Create text index for fast searching
    collection.create_index([('question', 'text')])

    print(f"\n✅ Done. Inserted {inserted} medical Q&A pairs into MongoDB.")


if __name__ == '__main__':
    main()
